import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import sharp from "sharp";
import axios from "axios";

import Course from "../models/courses.model.js";
import { invalidateCache, deleteKeys } from "../utils/redisClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

// Path to User's Uploaded Reference Background Image
const USER_UPLOADED_REF_BG = "C:\\Users\\polit\\.gemini\\antigravity-ide\\brain\\4e029c80-e34d-4ef0-aaf9-7cf7fe09847a\\.user_uploaded\\media_1787294327053.png";

// Course-Specific High Quality Base Background Images
const BASE_BACKGROUNDS = {
  chemistry: USER_UPLOADED_REF_BG,
  class9: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1280&h=720&q=80",
  class10: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1280&h=720&q=80",
  maths: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1280&h=720&q=80",
  biology: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1280&h=720&q=80",
  commerce: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1280&h=720&q=80",
  agriculture: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1280&h=720&q=80",
  arts: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1280&h=720&q=80",
};

// Target Directory
const outputDir = path.join(__dirname, "../uploads/course_banners");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Download or read base background buffer into memory with fallback
async function getBaseImageBuffer(source) {
  if (fs.existsSync(source)) {
    return fs.readFileSync(source);
  }
  try {
    const res = await axios.get(source, { responseType: "arraybuffer", timeout: 4000 });
    return Buffer.from(res.data);
  } catch (err) {
    console.warn(`[getBuffer] Using dark fallback for ${source}`);
    return sharp({
      create: {
        width: 1280,
        height: 720,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 },
      },
    }).png().toBuffer();
  }
}

// Subject specific feature configurations
const SUBJECT_CONFIGS = {
  biology: {
    colorTheme: "#10b981", // Emerald Green
    bgKey: "biology",
    bgFormulas: `DNA: A-T C-G  |  RNA  |  ATP  |  C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O`,
    icons: {
      Hindi: ["कोशिका", "सूक्ष्मदर्शी", "जीनोम", "मानव शरीर"],
      English: ["Cell Biology", "Microscope", "Genetics", "Human Anatomy"],
    },
    footer: {
      Hindi: ["🎯 जैविक चिंतन", "🧬 आनुवंशिकी ज्ञान", "📖 स्वास्थ्य विज्ञान", "🧪 चिकित्सा शोध"],
      English: ["🎯 Biological Thinking", "🧬 Genetic Science", "📖 Health Sciences", "🧪 Medical Research"],
    },
  },
  commerce: {
    colorTheme: "#f59e0b", // Amber / Gold
    bgKey: "commerce",
    bgFormulas: `ROI = Net Income / Investment   |   Assets = Liabilities + Equity   |   ₹  $  €  %`,
    icons: {
      Hindi: ["लेखांकन", "अर्थशास्त्र", "व्यवसाय", "वित्तीय प्रबंधन"],
      English: ["Accounting", "Economics", "Business", "Finance"],
    },
    footer: {
      Hindi: ["🎯 व्यापारिक सोच", "📊 वित्तीय विश्लेषण", "📖 बाजार सिद्धांत", "💼 व्यावसायिक रणनीति"],
      English: ["🎯 Financial Thinking", "📊 Market Analytics", "📖 Economic Theory", "💼 Business Strategy"],
    },
  },
  agriculture: {
    colorTheme: "#22c55e", // Light Green
    bgKey: "agriculture",
    bgFormulas: `N-P-K 20:20:20   |   pH: 6.5   |   Soil BioTech   |   Chlorophyll`,
    icons: {
      Hindi: ["फसल विज्ञान", "मृदा तकनीक", "कृषि मशीनरी", "सिंचाई"],
      English: ["Crop Science", "Soil Tech", "Machinery", "Irrigation"],
    },
    footer: {
      Hindi: ["🎯 हरित क्रांति", "🌱 जैविक खेती", "📖 कृषि तकनीक", "🌾 सतत विकास"],
      English: ["🎯 Green Tech", "🌱 Organic Farming", "📖 Agronomy", "🌾 Sustainability"],
    },
  },
  arts: {
    colorTheme: "#a855f7", // Purple
    bgKey: "arts",
    bgFormulas: `History  |  Civics  |  Geography  |  1947  |  Democracy  |  Philosophy`,
    icons: {
      Hindi: ["इतिहास", "भूगोल", "राजनीति", "संस्कृति"],
      English: ["History", "Geography", "Civics", "Culture"],
    },
    footer: {
      Hindi: ["🎯 मानवीय चिंतन", "🏛️ ऐतिहासिक साक्ष्य", "📖 नागरिक शास्त्र", "🌍 सामाजिक विकास"],
      English: ["🎯 Humanistic Thought", "🏛️ Historical Proof", "📖 Civics & Law", "🌍 Social Development"],
    },
  },
  maths: {
    colorTheme: "#6366f1", // Indigo
    bgKey: "maths",
    bgFormulas: `∫ f(x)dx   |   sin²θ + cos²θ = 1   |   E = mc²   |   a² + b² = c²   |   ∑ x_i`,
    icons: {
      Hindi: ["ज्यामिति", "बीजगणित", "कलन", "भौतिकी"],
      English: ["Geometry", "Algebra", "Calculus", "Physics"],
    },
    footer: {
      Hindi: ["🎯 तार्किक सोच", "📐 गणितीय प्रमेय", "📖 सैद्धांतिक ज्ञान", "⚡ समस्या समाधान"],
      English: ["🎯 Logical Thinking", "📐 Math Theorems", "📖 Core Principles", "⚡ Problem Solving"],
    },
  },
  chemistry: {
    colorTheme: "#06b6d4", // Cyan
    bgKey: "chemistry",
    bgFormulas: `2H₂ + O₂ → 2H₂O   |   NaCl   |   Na⁺ Cl⁻   |   CO₂   |   O=C=O   |   H-C-H`,
    icons: {
      Hindi: ["प्रयोगशाला", "परमाणु", "अणु", "अभिक्रियाएं"],
      English: ["Laboratory", "Atoms", "Molecules", "Reactions"],
    },
    footer: {
      Hindi: ["🎯 वैज्ञानिक सोच", "🔬 प्रयोग एवं अवलोकन", "📖 सिद्धांत और व्यवहार", "🧪 अनुसंधान"],
      English: ["🎯 Scientific Thinking", "🔬 Experiment & Observation", "📖 Theory & Practice", "🧪 Research"],
    },
  },
  class9: {
    colorTheme: "#0284c7", // Sky Blue
    bgKey: "class9",
    bgFormulas: `Class 9 Foundation   |   Maths   |   Science   |   English   |   Social Studies`,
    icons: {
      Hindi: ["गणित", "विज्ञान", "अंग्रेजी", "सामाजिक विज्ञान"],
      English: ["Mathematics", "Science", "English", "Social Studies"],
    },
    footer: {
      Hindi: ["🎯 सर्वांगीण विकास", "🔬 व्यावहारिक ज्ञान", "📖 बोर्ड टॉपर गाइडेंस", "⭐ परीक्षा रणनीति"],
      English: ["🎯 Holistic Growth", "🔬 Practical Learning", "📖 Topper Guidance", "⭐ Exam Strategy"],
    },
  },
  class10: {
    colorTheme: "#f59e0b", // Amber
    bgKey: "class10",
    bgFormulas: `Class 10 Board Special   |   Maths   |   Science   |   English   |   Social Studies`,
    icons: {
      Hindi: ["गणित", "विज्ञान", "अंग्रेजी", "सामाजिक विज्ञान"],
      English: ["Mathematics", "Science", "English", "Social Studies"],
    },
    footer: {
      Hindi: ["🎯 100% बोर्ड तैयारी", "🔬 मॉडल पेपर हल", "📖 टॉपर नोट्स", "⭐ परीक्षा रणनीति"],
      English: ["🎯 100% Board Prep", "🔬 Model Papers", "📖 Topper Notes", "⭐ Exam Strategy"],
    },
  },
};

// Generate SVG Overlay tailored dynamically to each Subject, Class & Language!
function createSvgOverlay({ title, subtitle, badgeText, configKey, lang }) {
  const safeTitle = (title || "").replace(/&/g, "&amp;");
  const safeSubtitle = (subtitle || "").replace(/&/g, "&amp;");
  const safeBadge = (badgeText || "").replace(/&/g, "&amp;");
  const isHindi = lang === "Hindi";
  const langKey = isHindi ? "Hindi" : "English";

  const cfg = SUBJECT_CONFIGS[configKey] || SUBJECT_CONFIGS.class10;
  const glowColor = cfg.colorTheme;
  const iconsList = cfg.icons[langKey] || cfg.icons.English;
  const footerList = cfg.footer[langKey] || cfg.footer.English;

  return `
    <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Dark Gradient Overlay -->
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#020617" stop-opacity="0.95" />
          <stop offset="45%" stop-color="#0b1329" stop-opacity="0.85" />
          <stop offset="85%" stop-color="#0f172a" stop-opacity="0.25" />
        </linearGradient>

        <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="${glowColor}" />
        </linearGradient>

        <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>

        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Gradient Vignette -->
      <rect width="1280" height="720" fill="url(#bgGrad)" />

      <!-- Subject Specific Floating Formulas & Art Overlay -->
      <g opacity="0.32" transform="translate(460, 70)">
        <text x="0" y="0" font-family="monospace" font-size="20" font-weight="700" fill="${glowColor}">${cfg.bgFormulas.replace(/&/g, "&amp;")}</text>
        <circle cx="360" cy="180" r="140" fill="none" stroke="${glowColor}" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.4" />
      </g>

      <!-- Main Course Title (Bold Typography) -->
      <text x="75" y="185" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="74" fill="url(#titleGrad)" filter="url(#neonGlow)">
        ${safeTitle}
      </text>

      <!-- Subtitle / Chapter Topic Detail -->
      <text x="80" y="250" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="27" fill="#cbd5e1">
        ${safeSubtitle}
      </text>

      <!-- Feature Icons Bar (Subject-tailored!) -->
      <g transform="translate(80, 310)">
        <g transform="translate(0,0)">
          <circle cx="20" cy="0" r="16" fill="#1e293b" stroke="${glowColor}" stroke-width="1.5" />
          <text x="0" y="32" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#94a3b8">${iconsList[0]}</text>
        </g>
        <g transform="translate(105,0)">
          <circle cx="20" cy="0" r="16" fill="#1e293b" stroke="${glowColor}" stroke-width="1.5" />
          <text x="5" y="32" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#94a3b8">${iconsList[1]}</text>
        </g>
        <g transform="translate(210,0)">
          <circle cx="20" cy="0" r="16" fill="#1e293b" stroke="${glowColor}" stroke-width="1.5" />
          <text x="10" y="32" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#94a3b8">${iconsList[2]}</text>
        </g>
        <g transform="translate(315,0)">
          <circle cx="20" cy="0" r="16" fill="#1e293b" stroke="${glowColor}" stroke-width="1.5" />
          <text x="-5" y="32" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#94a3b8">${iconsList[3]}</text>
        </g>
      </g>

      <!-- Pill Badge -->
      <g transform="translate(80, 395)">
        <rect x="0" y="0" width="380" height="52" rx="26" fill="url(#badgeGrad)" stroke="${glowColor}" stroke-width="2" />
        <text x="30" y="34" font-family="system-ui, sans-serif" font-weight="800" font-size="22" fill="#ffffff">
          🎓 ${safeBadge}
        </text>
      </g>

      <!-- Bottom Reference Bar (Subject-tailored!) -->
      <g transform="translate(80, 640)">
        <line x1="0" y1="-30" x2="1120" y2="-30" stroke="#334155" stroke-width="1.5" opacity="0.6" />

        <g transform="translate(0, 0)">
          <text x="0" y="6" font-family="system-ui, sans-serif" font-weight="700" font-size="19" fill="#e2e8f0">${footerList[0].replace(/&/g, "&amp;")}</text>
        </g>

        <g transform="translate(280, 0)">
          <text x="0" y="6" font-family="system-ui, sans-serif" font-weight="700" font-size="19" fill="#e2e8f0">${footerList[1].replace(/&/g, "&amp;")}</text>
        </g>

        <g transform="translate(600, 0)">
          <text x="0" y="6" font-family="system-ui, sans-serif" font-weight="700" font-size="19" fill="#e2e8f0">${footerList[2].replace(/&/g, "&amp;")}</text>
        </g>

        <g transform="translate(880, 0)">
          <text x="0" y="6" font-family="system-ui, sans-serif" font-weight="700" font-size="19" fill="#e2e8f0">${footerList[3].replace(/&/g, "&amp;")}</text>
        </g>
      </g>
    </svg>
  `;
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("🚀 Generating distinct Class 11 vs Class 12 course-specific banners for all courses...");

  const courses = await Course.find({});
  console.log(`Found ${courses.length} courses to update with class-differentiated banners.`);

  // Cache base images buffers
  const bgBuffers = {
    chemistry: await getBaseImageBuffer(BASE_BACKGROUNDS.chemistry),
    class9: await getBaseImageBuffer(BASE_BACKGROUNDS.class9),
    class10: await getBaseImageBuffer(BASE_BACKGROUNDS.class10),
    biology: await getBaseImageBuffer(BASE_BACKGROUNDS.biology),
    maths: await getBaseImageBuffer(BASE_BACKGROUNDS.maths),
    commerce: await getBaseImageBuffer(BASE_BACKGROUNDS.commerce),
    agriculture: await getBaseImageBuffer(BASE_BACKGROUNDS.agriculture),
    arts: await getBaseImageBuffer(BASE_BACKGROUNDS.arts),
  };

  let count = 0;

  for (const course of courses) {
    const isHindi = (course.language || "").toLowerCase().includes("hindi");
    const lang = isHindi ? "Hindi" : "English";
    const board = course.board || "MP BOARD";
    const subjectStr = `${course.subject || ""} ${course.title || ""}`.toLowerCase();
    const category = course.category || "Class 10";
    const clsNum = category.replace("Class ", "");

    let configKey = "class10";
    let title = "";
    let subtitle = "";
    let badgeText = "";

    if (category === "Class 9") {
      configKey = "class9";
      course.subject = "Foundation";
      title = isHindi ? "कक्षा 9 फाउंडेशन" : "CLASS 9 FOUNDATION";
      subtitle = isHindi ? "गणित, विज्ञान, अंग्रेजी एवं सामाजिक विज्ञान" : "Complete Foundation & Board Preparation";
      badgeText = isHindi ? `${board} | कक्षा 9` : `${board} | Class 9`;
    } else if (category === "Class 10") {
      configKey = "class10";
      course.subject = "Foundation";
      title = isHindi ? "कक्षा 10 बोर्ड स्पेशल" : "CLASS 10 BOARD SPECIAL";
      subtitle = isHindi ? "गणित, विज्ञान, अंग्रेजी एवं सामाजिक विज्ञान" : "Complete Board Exam Special Batch";
      badgeText = isHindi ? `${board} | कक्षा 10` : `${board} | Class 10`;
    } else if (subjectStr.includes("biology")) {
      configKey = "biology";
      course.subject = "Biology";
      title = isHindi ? `कक्षा ${clsNum} जीव विज्ञान` : `CLASS ${clsNum} BIOLOGY`;
      subtitle = isHindi ? `${clsNum}वीं बोर्ड परीक्षा & नींव पाठ्यक्रम` : `Class ${clsNum} Board & Foundation Course`;
      badgeText = isHindi ? `जीव विज्ञान | कक्षा ${clsNum}` : `Biology | Class ${clsNum}`;
    } else if (subjectStr.includes("commerce")) {
      configKey = "commerce";
      course.subject = "Commerce";
      title = isHindi ? `कक्षा ${clsNum} वाणिज्य संकाय` : `CLASS ${clsNum} COMMERCE`;
      subtitle = isHindi ? `${clsNum}वीं लेखाशास्त्र, अर्थशास्त्र एवं व्यवसाय` : `Class ${clsNum} Accounting, Economics & Finance`;
      badgeText = isHindi ? `वाणिज्य | कक्षा ${clsNum}` : `Commerce | Class ${clsNum}`;
    } else if (subjectStr.includes("agriculture")) {
      configKey = "agriculture";
      course.subject = "Agriculture";
      title = isHindi ? `कक्षा ${clsNum} कृषि विज्ञान` : `CLASS ${clsNum} AGRICULTURE`;
      subtitle = isHindi ? `${clsNum}वीं फसल उत्पादन एवं मृदा तकनीक` : `Class ${clsNum} Agronomy & Soil Science`;
      badgeText = isHindi ? `कृषि | कक्षा ${clsNum}` : `Agriculture | Class ${clsNum}`;
    } else if (subjectStr.includes("arts")) {
      configKey = "arts";
      course.subject = "Arts";
      title = isHindi ? `कक्षा ${clsNum} कला संकाय` : `CLASS ${clsNum} ARTS`;
      subtitle = isHindi ? `${clsNum}वीं इतिहास, भूगोल एवं राजनीति` : `Class ${clsNum} History, Geography & Civics`;
      badgeText = isHindi ? `कला संकाय | कक्षा ${clsNum}` : `Humanities | Class ${clsNum}`;
    } else if (subjectStr.includes("maths") || subjectStr.includes("science")) {
      configKey = "maths";
      course.subject = "Mathematics & Science";
      title = isHindi ? `कक्षा ${clsNum} गणित एवं विज्ञान` : `CLASS ${clsNum} MATHS & SCIENCE`;
      subtitle = isHindi ? `${clsNum}वीं भौतिकी, रसायन एवं गणित` : `Class ${clsNum} Physics, Chemistry & Calculus`;
      badgeText = isHindi ? `विज्ञान संकाय | कक्षा ${clsNum}` : `Science | Class ${clsNum}`;
    } else {
      configKey = "chemistry";
      course.subject = "Science";
      title = isHindi ? `कक्षा ${clsNum} रसायन विज्ञान` : `CLASS ${clsNum} CHEMISTRY`;
      subtitle = isHindi ? `${clsNum}वीं प्रयोगशाला एवं रासायनिक अभिक्रियाएं` : `Class ${clsNum} Laboratory & Chemistry`;
      badgeText = isHindi ? `विज्ञान | कक्षा ${clsNum}` : `Science | Class ${clsNum}`;
    }

    const cfg = SUBJECT_CONFIGS[configKey];
    const bgBuffer = bgBuffers[cfg.bgKey] || bgBuffers.class10;

    const svg = createSvgOverlay({ title, subtitle, badgeText, configKey, lang });
    const filename = `course_banner_${course._id}.jpg`;
    const outputPath = path.join(outputDir, filename);

    // Composite SVG overlay onto background image using sharp
    const jpegBuffer = await sharp(bgBuffer)
      .resize(1280, 720, { fit: "cover" })
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .jpeg({ quality: 85 })
      .toBuffer();

    // Write to disk for static serving
    fs.writeFileSync(outputPath, jpegBuffer);

    // Save as inline base64 Data URI for instant rendering
    const dataUri = `data:image/jpeg;base64,${jpegBuffer.toString("base64")}`;
    course.thumbnailUrl = dataUri;
    await course.save();
    count++;
  }

  console.log(`✅ Successfully generated and assigned class-differentiated banners for all ${count} courses!`);

  // Flush Redis Cache
  await invalidateCache("courses:published*");
  await invalidateCache("course:public:*");
  await deleteKeys(["courses:published"]);
  console.log("✅ Flushed Upstash Redis course cache.");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error generating course banners:", err);
  process.exit(1);
});
