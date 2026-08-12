# UMANG VISION ACADEMY
## Comprehensive AI-Powered Coaching & Digital Learning Ecosystem

---

> ### 🌐 **OFFICIAL LIVE PLATFORM URL**
> **[https://umang-vision-academy.vercel.app](https://umang-vision-academy.vercel.app)**
> 
> *PWA Enabled · 7 Indian Languages · Cloud Video Streaming · 4 Role-Based Workspaces*

---

## 1. Executive Summary

**Umang Vision Academy** is a modern, enterprise-grade AI-powered coaching and e-learning ecosystem built to deliver affordable, high-impact education to school students (Classes 6 to 12) and competitive exam aspirants across India. The platform seamlessly unifies learners, educators, academic counselors, support staff, and platform administrators within dedicated, role-tailored workspaces.

### Key Platform Highlights
- **Live Production URL**: [https://umang-vision-academy.vercel.app](https://umang-vision-academy.vercel.app)
- **4 Distinct User Workspaces**: Learner, Instructor, Staff, and Master Administrator.
- **24/7 AI Tutor**: Powered by generative AI for formula breakdowns, concept simplification, and instant doubt solving.
- **7 Indian Languages Localization**: English, Hindi (हिंदी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), and Gujarati (ગુજરાતી).
- **Progressive Web App (PWA)**: Installable as an app on Android, Windows, iOS, and macOS with offline caching.

---

## 2. Multi-Tier Workspace Architecture

| Role | Dashboard Route | Target Users | Core Capabilities |
| :--- | :--- | :--- | :--- |
| **Student / Learner** | `/student-dashboard` | Enrolled students (Classes 6–12, Competitive) | Video streaming, In-video AI doubt solver, Mock tests, PYQs, Notes, Leaderboard, Wallet, Career guidance |
| **Instructor** | `/instructor-dashboard` | Subject Matter Experts & Teachers | Curriculum builder, Live session scheduler, Q&A inbox, Shorts/Reels studio, Earnings & student analytics |
| **Staff Member** | `/staff-dashboard` | Support, Content Reviewers, Moderators | Dynamic permission-based tabs, Notes approval, Instructor application verification, Device audits |
| **Administrator** | `/admin-dashboard` | Platform Owners & Master Admins | Granular role creator, Module permissions, Financial audits, Course catalog moderation, Chat inspection, Bulk imports |

---

## 3. Student & Learner Experience

### 3.1 Course Discovery & Cloud Video Streaming
- **Adaptive Bitrate Streaming**: Smooth playback with HLS (`.m3u8`), YouTube, and Google Drive streaming with multi-resolution switching (1080p, 720p, 480p, 360p).
- **In-Video Floating AI Assistant**: Real-time floating AI widget to resolve doubts right on the video player without interrupting the lecture.
- **Speed & Playback Controls**: Variable playback speed (0.5x to 2x), volume booster, theater mode, and chapter navigation.
- **Free Demo Previews**: Access sample video lessons and downloadable course handouts before purchase.
- **Smart Learning Plans**: Tiered subscription packages with side-by-side feature comparison.

### 3.2 24/7 AI Tutor & Academic Doubt Clearance
- **Generative AI Tutor**: Step-by-step concept explanations, equation derivation, and custom quiz generation across Physics, Chemistry, Math, Biology, and Humanities.
- **Ask-Instructor Direct 1-on-1 Q&A**: Real-time socket-based messaging queue between students and their course instructors with voice notes and attachment support.

### 3.3 Exam Preparation & Academic Resources
- **Previous Years' Question Bank (PYQs)**: Organized repository for Classes 9, 10, 11, and 12 covering CBSE, ICSE, and MP Board with official answer keys.
- **Timed Interactive Mock Tests**: Exam simulation engine with question palette, countdown timer, auto-submission, instant scorecards, and ranking analytics.
- **In-Browser Study Notes PDF Reader**: High-speed document viewer with search, page bookmarks, and zoom capabilities.
- **Educational Reels (Micro-Learning)**: 60-second bite-sized video feed for quick concept revision, experimental demonstrations, and memory tips.

### 3.4 Gamification, Rewards & Career Roadmap
- **Gamified Leaderboard**: Real-time weekly, monthly, and all-time ranking calculated from test performance, quiz accuracy, and daily learning streaks.
- **Verifiable Digital Certificates**: Instant certificate generation upon course completion with unique QR/Certificate IDs and PDF download.
- **Student Wallet & Daily Coins**:
  - 1 Coin earned for daily login streaks.
  - 50 Coins earned per successful friend referral.
  - Wallet balance redeemable for instant checkout discounts.
- **1-on-1 Career Counselling**: Schedule video consultations with certified academic and career experts.
- **International Study Guidance**: University discovery, IELTS/TOEFL preparation resources, and visa roadmap.
- **Scholarships Portal**: Curated portal of active Central and State Government scholarships with eligibility checklists.

---

## 4. Instructor Workspace & Studio

- **Course Builder & Curriculum Studio**: Create multi-chapter courses, upload video lectures, attach downloadable notes, and configure promotional pricing.
- **Live Class Host & Scheduler**: Schedule batch webinars and 1-on-1 video sessions with integrated WebRTC video and attendance logging.
- **Mock Test Creator**: Compose custom multi-question exams with marking schemes, time limits, and explanation keys.
- **Notes & Material Publisher**: Upload revision PDF notes and formula sheets for student access.
- **Educational Shorts / Reels Studio**: Publish vertical micro-learning videos and track viewership metrics.
- **Doubt Resolution Hub**: Dedicated inbox to answer student questions with rich text, code snippets, and attachments.
- **Earnings & Payout Analytics**: Transparent financial dashboards tracking gross sales, net educator payouts, and bank transfer settings.

---

## 5. Support Staff Workspace

- **Dynamic Role-Based Access Control (RBAC)**: Sidebar automatically configures itself to display only the tabs and actions granted to the staff member's custom role.
- **Notes Moderation Queue**: Quality check, approve, or reject instructor-submitted study materials before platform publishing.
- **Instructor Application Verification**: Review applicant credentials, inspect KYC documents, assess demo lectures, and approve onboarding.
- **Security & Device Session Monitoring**: Audit active student and staff sessions to prevent unauthorized multi-device sharing.

---

## 6. Master Administrator Workspace

- **Real-Time Operational KPIs**: Live tracking of gross platform revenue, total enrollments, active students, instructor count, and top-performing courses.
- **Granular Roles & Permissions Manager**: Create custom roles (e.g. *Senior Moderator*, *Finance Officer*, *Academic Counselor*) with checkbox-level permissions across 17 distinct platform modules.
- **Course Catalog Audit & Approval**: Approve new course submissions or request revisions from instructors.
- **Comprehensive User Governance**: Search, filter, edit, suspend, or reactivate student and instructor accounts.
- **Admin Chat Reports & Safety Monitoring**: Full audit trail of student-instructor chat conversations with search, flag, and archive capabilities.
- **Bulk Excel / CSV Onboarding**: Bulk import hundreds of students or instructors with automatic validation and error logging.
- **Financial Audit & Refund Center**: Comprehensive payment audit logs, transaction tracking, and one-click refund handling.
- **Security & Force Logout**: Real-time IP address and browser tracking with single-click remote session revocation.

---

## 7. Technical Architecture & Security Standards

| Layer | Technology / Service | Highlights |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite + TailwindCSS | High-speed Single Page Application with optimized bundle splitting |
| **State Management** | Redux Toolkit + LocalStorage Sync | Instant client hydration and zero-latency role transitions |
| **Backend API** | Node.js + Express.js | Secure REST API with rate-limiting, CORS, and permission middleware |
| **Primary Database** | MongoDB Atlas (Mongoose ODM) | Scalable cloud database with optimized indexes |
| **High-Speed Cache** | Redis (Upstash) + In-Process LRU | Sub-millisecond user session and role authorization cache |
| **Media Streaming** | HLS.js + Cloud CDN | Adaptive bitrate streaming optimized for low-bandwidth connections |
| **Internationalization** | i18next | Multi-language localization across 7 languages |
| **Payment Gateways** | Razorpay / PhonePe | Secure multi-method checkout (Cards, UPI, Netbanking, Wallets) |
| **Hosting & Deployment** | Vercel (Frontend) + Render (Backend) | 99.9% uptime cloud infrastructure with automated SSL certificates |

---

## 8. Official Contact & Platform Details

- **Website**: [https://umang-vision-academy.vercel.app](https://umang-vision-academy.vercel.app)
- **Platform Name**: Umang Vision Academy
- **Support Email**: support@umangvisionacademy.com
- **Prepared For**: Google Drive Sharing, Stakeholder Review, and Student Onboarding Documentation
