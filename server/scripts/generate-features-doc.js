import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
} from "docx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Document styling constants
const COLOR_PRIMARY = "1E3A8A"; // Deep Blue
const COLOR_SECONDARY = "4F46E5"; // Indigo
const COLOR_ACCENT = "0D9488"; // Teal
const COLOR_TEXT = "1F2937"; // Dark Gray
const COLOR_MUTED = "4B5563"; // Medium Gray
const COLOR_BG_LIGHT = "F3F4F6"; // Soft Gray
const COLOR_BORDER = "D1D5DB";

const createHeading1 = (text) =>
  new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    run: {
      bold: true,
      size: 28,
      color: COLOR_PRIMARY,
      font: "Calibri",
    },
  });

const createHeading2 = (text) =>
  new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    run: {
      bold: true,
      size: 24,
      color: COLOR_SECONDARY,
      font: "Calibri",
    },
  });

const createHeading3 = (text) =>
  new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    run: {
      bold: true,
      size: 21,
      color: COLOR_ACCENT,
      font: "Calibri",
    },
  });

const createBullet = (title, description) =>
  new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({
        text: title + (description ? ": " : ""),
        bold: true,
        size: 21,
        color: COLOR_TEXT,
        font: "Calibri",
      }),
      new TextRun({
        text: description || "",
        size: 21,
        color: COLOR_MUTED,
        font: "Calibri",
      }),
    ],
  });

const createParagraph = (text, options = {}) =>
  new Paragraph({
    spacing: { before: 80, after: 100, ...options.spacing },
    alignment: options.alignment || AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        size: options.size || 21,
        color: options.color || COLOR_TEXT,
        bold: options.bold || false,
        italic: options.italic || false,
        font: "Calibri",
      }),
    ],
  });

const createInfoBox = (title, text) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: "EEF2FF" },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_SECONDARY },
              right: { style: BorderStyle.NONE },
            },
            margins: { top: 140, bottom: 140, left: 200, right: 140 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 22,
                    color: COLOR_SECONDARY,
                    font: "Calibri",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text,
                    size: 20,
                    color: COLOR_MUTED,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

const createFeatureTable = (rows) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, rIdx) =>
      new TableRow({
        children: row.map(
          (cellText, cIdx) =>
            new TableCell({
              shading: {
                type: ShadingType.CLEAR,
                fill: rIdx === 0 ? "1E3A8A" : rIdx % 2 === 1 ? "F9FAFB" : "FFFFFF",
              },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({
                  alignment: cIdx === 0 ? AlignmentType.LEFT : AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: cellText,
                      bold: rIdx === 0 || cIdx === 0,
                      size: rIdx === 0 ? 20 : 19,
                      color: rIdx === 0 ? "FFFFFF" : COLOR_TEXT,
                      font: "Calibri",
                    }),
                  ],
                }),
              ],
            }),
        ),
      }),
    ),
  });

async function generateDoc() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 21,
            color: COLOR_TEXT,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Umang Vision Academy — Platform Overview & Feature Specification",
                    size: 16,
                    color: "9CA3AF",
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.SPACE_BETWEEN,
                children: [
                  new TextRun({
                    text: "https://umang-vision-academy.vercel.app",
                    size: 16,
                    color: COLOR_SECONDARY,
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: "    |    Page ",
                    size: 16,
                    color: "9CA3AF",
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: "9CA3AF",
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ── Title & Header Banner ──
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 60 },
            children: [
              new TextRun({
                text: "UMANG VISION ACADEMY",
                bold: true,
                size: 38,
                color: COLOR_PRIMARY,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: "Comprehensive AI-Powered Coaching & Digital Learning Ecosystem",
                size: 24,
                color: COLOR_SECONDARY,
                bold: true,
                font: "Calibri",
              }),
            ],
          }),

          // ── Live Website Banner (First Page Top Prominence) ──
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: "1E1B4B" }, // Deep Indigo
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    margins: { top: 180, bottom: 180, left: 240, right: 240 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 60 },
                        children: [
                          new TextRun({
                            text: "🌐 OFFICIAL LIVE PLATFORM URL",
                            bold: true,
                            size: 20,
                            color: "A5B4FC",
                            font: "Calibri",
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: "https://umang-vision-academy.vercel.app",
                            bold: true,
                            size: 28,
                            color: "38BDF8", // Cyan Link
                            font: "Calibri",
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 60 },
                        children: [
                          new TextRun({
                            text: "PWA Enabled · Multi-Lingual · Cloud Streaming · Multi-Role Workspaces",
                            size: 18,
                            color: "E0E7FF",
                            font: "Calibri",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 180 } }),

          // ── Executive Summary ──
          createHeading1("1. Executive Summary"),
          createParagraph(
            "Umang Vision Academy is a next-generation AI-powered coaching and e-learning platform engineered to provide comprehensive, affordable, and high-quality education to students across school grades (Classes 6 to 12) and competitive examination aspirants. The platform seamlessly bridges the gap between students, educators, academic mentors, and platform administrators through dedicated workspaces, intelligent AI tutoring, live video classrooms, and advanced testing infrastructure.",
          ),

          createInfoBox(
            "Key Platform Highlights",
            "• Live Production URL: https://umang-vision-academy.vercel.app\n• 4 Distinct User Workspaces: Learner, Instructor, Staff, and Master Administrator\n• 24/7 AI-Powered Tutor with formula breakdown, dynamic concept simplification, and instant doubt clearance\n• Native Multilingual Localization in 7 Indian Languages (English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati)\n• Progressive Web App (PWA) capabilities for offline installation on Android, Windows, and macOS",
          ),

          new Paragraph({ spacing: { before: 200 } }),

          // ── Architecture & Workspaces Matrix ──
          createHeading1("2. Multi-Tier Workspace Architecture"),
          createParagraph(
            "Umang Vision Academy is designed around four specialized user roles with fine-grained access control and role-specific dashboards:",
          ),

          createFeatureTable([
            ["Role", "Dashboard Route", "Target Audience", "Core Capabilities"],
            [
              "Student / Learner",
              "/student-dashboard",
              "Enrolled students (Classes 6–12, Competitive)",
              "Course streaming, AI Tutor, Mock tests, PYQs, Notes, Leaderboard, Wallet",
            ],
            [
              "Instructor",
              "/instructor-dashboard",
              "Subject Matter Experts & Teachers",
              "Curriculum builder, Live session hosting, Q&A inbox, Reels studio, Analytics",
            ],
            [
              "Staff Member",
              "/staff-dashboard",
              "Support, Moderators & Academic Staff",
              "Dynamic role-based modules, Notes approval, KYC verification, Device audits",
            ],
            [
              "Administrator",
              "/admin-dashboard",
              "Platform Owners & Master Admins",
              "Role creation, Granular permissions, Revenue audits, Chat logs, User management",
            ],
          ]),

          new Paragraph({ spacing: { before: 240 } }),

          // ── Student & Learner Ecosystem ──
          createHeading1("3. Student & Learner Experience"),

          createHeading2("3.1 Interactive Course Catalog & Video Streaming"),
          createBullet(
            "Adaptive Video Player",
            "HLS (.m3u8) adaptive streaming, YouTube integration, Google Drive streaming, quality selector (1080p, 720p, 480p, 360p), playback rate (0.5x to 2x), and chapter timestamps.",
          ),
          createBullet(
            "Floating In-Video AI Assistant",
            "Students can ask doubts in real-time while watching video lectures without leaving the player.",
          ),
          createBullet(
            "Course Demo Previews",
            "Free demo video chapters and downloadable sample materials before course enrollment.",
          ),
          createBullet(
            "Curriculum Progress & Resume",
            "Automatic timestamp saving, completed lesson tracking, and instant one-click lecture resume.",
          ),

          createHeading2("3.2 24/7 AI Tutor & Academic Support"),
          createBullet(
            "Personalized AI Doubt Solver",
            "Powered by advanced generative models to explain complex physics, chemistry, mathematics, and humanities concepts with step-by-step reasoning.",
          ),
          createBullet(
            "Ask-Instructor Direct 1-on-1 Q&A",
            "Direct messaging channel between students and course instructors with voice notes, file attachments, and status tracking (Pending / Answered).",
          ),

          createHeading2("3.3 Comprehensive Exam Prep & Academic Tools"),
          createBullet(
            "Previous Years' Question Bank (PYQs)",
            "Organized question bank spanning Classes 9 to 12 across CBSE, ICSE, and MP Board with official answer keys.",
          ),
          createBullet(
            "Interactive Timed Mock Tests",
            "Full-screen simulated exam environment with question palette, countdown timers, negative marking, instant score calculation, and rank generation.",
          ),
          createBullet(
            "Study Notes & In-Browser PDF Reader",
            "High-speed PDF viewer with page jump, zoom, bookmarking, and search for topic-wise revision notes.",
          ),
          createBullet(
            "Educational Reels Hub",
            "Vertical micro-learning video feed delivering 60-second bite-sized concepts, experiments, and memory tricks.",
          ),

          createHeading2("3.4 Student Engagement, Rewards & Career Roadmap"),
          createBullet(
            "Gamified Leaderboard & Streaks",
            "Weekly, monthly, and all-time student rankings based on test scores, course completions, and daily streaks.",
          ),
          createBullet(
            "Automated Digital Certificates",
            "Course completion certificates equipped with unique verifiable Certificate IDs and PDF download.",
          ),
          createBullet(
            "Student Wallet & Coins Reward System",
            "Daily login coin incentives (1 coin/day), referral reward program (50 coins/successful referral), and checkout discounts.",
          ),
          createBullet(
            "Career Counselling & Guidance",
            "1-on-1 counseling session bookings with certified academic mentors for career roadmaps.",
          ),
          createBullet(
            "International Study Portal",
            "Guidance roadmap for foreign university admissions, scholarships, IELTS/TOEFL preparation, and documentation.",
          ),
          createBullet(
            "Scholarships Information Hub",
            "Centralized database of Central & State Government scholarships, eligibility criteria, and application links.",
          ),

          new Paragraph({ spacing: { before: 240 } }),

          // ── Instructor Workspace ──
          createHeading1("4. Instructor Workspace & Studio"),
          createParagraph(
            "Instructors are equipped with comprehensive tools to publish, manage, and monetize their academic content:",
          ),
          createBullet(
            "Course Creation & Curriculum Studio",
            "Multi-chapter curriculum builder, lecture video uploader, pricing & discount controls, and free demo tagging.",
          ),
          createBullet(
            "Live Interactive Class Scheduler",
            "Schedule 1-on-1 and batch live video sessions with WebRTC/video integration, meeting link generation, and attendance management.",
          ),
          createBullet(
            "Mock Test Builder",
            "Create multiple-choice questions, set difficulty levels, define marks and negative scoring, and provide detailed explanations.",
          ),
          createBullet(
            "Study Notes Management",
            "Upload and organize downloadable PDF notes, formula sheets, and chapter summaries.",
          ),
          createBullet(
            "Shorts / Reels Creator Studio",
            "Upload vertical educational shorts with video preview, view counts, and engagement metrics.",
          ),
          createBullet(
            "Student Query Resolution Inbox",
            "Dedicated communication center to reply to student doubts with rich text and file uploads.",
          ),
          createBullet(
            "Instructor Payout & Revenue Analytics",
            "Real-time revenue breakdowns, student enrollment charts, average course ratings, and bank payout settings.",
          ),

          new Paragraph({ spacing: { before: 240 } }),

          // ── Support Staff Workspace ──
          createHeading1("5. Support Staff Workspace & Moderation"),
          createParagraph(
            "Staff members operate under custom role profiles configured by administrators, ensuring strict least-privilege security:",
          ),
          createBullet(
            "Dynamic Permission-Based Navigation",
            "Sidebar navigation automatically filters to display only modules assigned to the staff member's specific role (e.g. Moderator, Support, Academic Counselor).",
          ),
          createBullet(
            "Notes & Content Moderation Queue",
            "Review, approve, or reject instructor-submitted notes and PDF materials before public distribution.",
          ),
          createBullet(
            "Instructor Application Verification",
            "Review incoming instructor applications, inspect submitted KYC documents, evaluate demo lecture links, and approve/reject credentials.",
          ),
          createBullet(
            "Logged-in Device Audits",
            "Monitor active device sessions and identify suspicious login patterns.",
          ),

          new Paragraph({ spacing: { before: 240 } }),

          // ── Master Admin Dashboard ──
          createHeading1("6. Master Administrator Workspace"),
          createParagraph(
            "The Admin Dashboard provides full visibility and governance over platform operations, users, and finances:",
          ),
          createBullet(
            "Real-Time Business & Operational KPIs",
            "Live statistics for gross platform revenue, total enrollments, active students, certified instructors, and course performance metrics.",
          ),
          createBullet(
            "Granular Roles & Permissions Management",
            "Create and edit custom system roles (e.g., Senior Editor, Test Coordinator, Finance Staff) with checkbox-level permissions across 17 distinct functional modules.",
          ),
          createBullet(
            "Course Approval & Audit Workflow",
            "Approve newly created courses, reject incomplete drafts with feedback, and edit course details.",
          ),
          createBullet(
            "User Management & Security Controls",
            "Search, filter, edit, suspend, or reactivate student and instructor accounts; manage roles and reset passwords.",
          ),
          createBullet(
            "Admin Chat Reports & Safety Monitoring",
            "Complete audit trail of all student-instructor chat conversations with search, flag, and archive capabilities.",
          ),
          createBullet(
            "Bulk Excel / CSV Import & Export",
            "Batch onboard hundreds of students or instructors simultaneously with automated error reporting.",
          ),
          createBullet(
            "Financial Audit & Refund Center",
            "View transaction logs, process refunds, and export payment audit summaries.",
          ),
          createBullet(
            "Device Security & Force Logout",
            "View real-time IP addresses, user agents, and revoke active sessions across the platform.",
          ),

          new Paragraph({ spacing: { before: 240 } }),

          // ── Technology & Infrastructure ──
          createHeading1("7. Technical Architecture & Security Standards"),
          createFeatureTable([
            ["Component", "Technology / Provider", "Purpose & Highlights"],
            ["Frontend Framework", "React 19 + Vite + TailwindCSS", "Blazing-fast SPA with instant routing"],
            ["State Management", "Redux Toolkit + Persisted Cache", "Instant UI hydration without latency"],
            ["Backend Engine", "Node.js + Express.js", "Modular RESTful API with middleware gates"],
            ["Primary Database", "MongoDB Atlas (Mongoose ODM)", "Scalable document store with indexed models"],
            ["In-Memory Cache", "Redis (Upstash) + In-Process LRU", "Sub-millisecond token and role verification"],
            ["Video Streaming", "HLS.js + Cloud CDN", "Adaptive bitrate streaming for low bandwidths"],
            ["Internationalization", "i18next", "7 Indian languages dynamically loaded"],
            ["Payment Gateway", "Razorpay / PhonePe Integration", "Secure multi-mode checkout with webhook sync"],
            ["Application Hosting", "Vercel (Client) + Render (Server)", "Auto-scaling cloud deployment with SSL"],
          ]),

          new Paragraph({ spacing: { before: 240 } }),

          // ── Closing / Contact ──
          createInfoBox(
            "Official Access Information",
            "Website: https://umang-vision-academy.vercel.app\nHeadquarters: Umang Vision Academy, India\nSupport Email: support@umangvisionacademy.com\nPrepared For: Google Drive Sharing & Stakeholder Review",
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.resolve(__dirname, "../../Umang_Vision_Academy_Platform_Features.docx");
  fs.writeFileSync(outPath, buffer);
  console.log(`Document generated successfully at: ${outPath}`);
}

generateDoc().catch(console.error);
