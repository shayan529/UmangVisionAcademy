import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure output directory exists
const outputDir = path.join(__dirname, "../uploads/course_banners");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to construct SVG banner overlay
function createSvgOverlay({ title, subtext, badge, stream, lang, featureList }) {
  const isHindi = lang === "Hindi";
  const titleColor = stream === "biology" ? "#38bdf8" : stream === "commerce" ? "#f59e0b" : stream === "agriculture" ? "#4ade80" : "#06b6d4";
  
  return `
    <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Gradients -->
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#030712" stop-opacity="0.92" />
          <stop offset="40%" stop-color="#0b1329" stop-opacity="0.82" />
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0.3" />
        </linearGradient>

        <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="${titleColor}" />
        </linearGradient>

        <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>

        <!-- Neon Glow Filter -->
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Overlay Tint & Vignette -->
      <rect width="1280" height="720" fill="url(#bgGrad)" />

      <!-- Decorative Neon Grid/Circuits on Top Left -->
      <circle cx="450" cy="120" r="160" fill="none" stroke="${titleColor}" stroke-width="1.5" opacity="0.25" stroke-dasharray="8 6" />
      <circle cx="450" cy="120" r="220" fill="none" stroke="#60a5fa" stroke-width="1" opacity="0.15" />
      
      <!-- Chemistry / Science Atomic Graphic -->
      <g transform="translate(450, 120)" opacity="0.35">
        <ellipse cx="0" cy="0" rx="60" ry="20" fill="none" stroke="${titleColor}" stroke-width="2" transform="rotate(0)" />
        <ellipse cx="0" cy="0" rx="60" ry="20" fill="none" stroke="${titleColor}" stroke-width="2" transform="rotate(60)" />
        <ellipse cx="0" cy="0" rx="60" ry="20" fill="none" stroke="${titleColor}" stroke-width="2" transform="rotate(120)" />
        <circle cx="0" cy="0" r="8" fill="${titleColor}" />
      </g>

      <!-- Main Course Title -->
      <text x="70" y="190" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="74" fill="url(#titleGrad)" filter="url(#glow)">
        ${title}
      </text>

      <!-- Subtitle / Tagline -->
      <text x="75" y="255" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="30" fill="#94a3b8" letter-spacing="0.5">
        ${subtext}
      </text>

      <!-- Pill Badge -->
      <rect x="75" y="295" width="340" height="54" rx="27" fill="url(#badgeGrad)" stroke="${titleColor}" stroke-width="2" opacity="0.9" />
      <text x="105" y="331" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="22" fill="#e2e8f0">
        🎓 ${badge}
      </text>

      <!-- Bottom Feature Badges / Highlights -->
      <g transform="translate(75, 630)">
        <!-- Line Separator -->
        <line x1="0" y1="-30" x2="1130" y2="-30" stroke="#334155" stroke-width="1.5" opacity="0.6" />

        <g transform="translate(0, 0)">
          <circle cx="20" cy="0" r="14" fill="#1e293b" stroke="${titleColor}" stroke-width="1.5" />
          <text x="45" y="6" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="19" fill="#cbd5e1">🎯 ${isHindi ? "वैज्ञानिक सोच & तैयारी" : "Scientific Approach"}</text>
        </g>

        <g transform="translate(300, 0)">
          <circle cx="20" cy="0" r="14" fill="#1e293b" stroke="${titleColor}" stroke-width="1.5" />
          <text x="45" y="6" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="19" fill="#cbd5e1">🔬 ${isHindi ? "प्रयोग एवं डिजिटल नोट्स" : "Practical & Smart Notes"}</text>
        </g>

        <g transform="translate(630, 0)">
          <circle cx="20" cy="0" r="14" fill="#1e293b" stroke="${titleColor}" stroke-width="1.5" />
          <text x="45" y="6" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="19" fill="#cbd5e1">📖 ${isHindi ? "100% बोर्ड आधारित पाठ्यक्रम" : "100% Board Aligned"}</text>
        </g>
      </g>
    </svg>
  `;
}

console.log("Helper script ready.");
