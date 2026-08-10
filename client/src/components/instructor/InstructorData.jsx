// ─── Static data ─────────────────────────────────────────────────────────────

export const courseData = [
  {
    icon: "💻",
    bg: "#EEEDFE",
    title: "Full Stack Web Development",
    students: 1240,
    earn: "$12,400",
    prog: 78,
    status: "published",
  },
  {
    icon: "🤖",
    bg: "#E1F5EE",
    title: "AI & Machine Learning",
    students: 840,
    earn: "$8,920",
    prog: 62,
    status: "published",
  },
  {
    icon: "🎨",
    bg: "#FBEAF0",
    title: "UI/UX Design Masterclass",
    students: 560,
    earn: "$5,640",
    prog: 91,
    status: "published",
  },
  {
    icon: "⚡",
    bg: "#FAEEDA",
    title: "Node.js Advanced Patterns",
    students: 320,
    earn: "$3,200",
    prog: 55,
    status: "draft",
  },
];

export const studentData = [
  {
    init: "MJ",
    bg: "#EEEDFE",
    ic: "#534AB7",
    name: "Mia Johnson",
    course: "AI & Machine Learning",
    prog: 92,
  },
  {
    init: "LC",
    bg: "#E1F5EE",
    ic: "#0F6E56",
    name: "Leo Chen",
    course: "Full Stack Web Dev",
    prog: 88,
  },
  {
    init: "AP",
    bg: "#FBEAF0",
    ic: "#993556",
    name: "Ava Patel",
    course: "UI/UX Design",
    prog: 85,
  },
  {
    init: "RS",
    bg: "#FAEEDA",
    ic: "#854F0B",
    name: "Raj Singh",
    course: "Full Stack Web Dev",
    prog: 71,
  },
];

export const initialSessions = [
  {
    title: "React Live Workshop",
    date: "Today",
    time: "6:00 PM",
    status: "live",
  },
  {
    title: "AI Career Mentorship",
    date: "Tomorrow",
    time: "8:30 PM",
    status: "upcoming",
  },
  {
    title: "Design Systems Q&A",
    date: "Friday",
    time: "5:00 PM",
    status: "upcoming",
  },
];

export const initialNotifs = [
  {
    icon: "⭐",
    bg: "#EEEDFE",
    text: 'New 5-star review on "UI/UX Design Masterclass"',
    time: "5 min ago",
    read: false,
  },
  {
    icon: "👤",
    bg: "#E1F5EE",
    text: "Raj Singh enrolled in Full Stack Web Dev",
    time: "22 min ago",
    read: false,
  },
  {
    icon: "💬",
    bg: "#FAEEDA",
    text: "Mia Johnson posted a question in community",
    time: "1 hr ago",
    read: false,
  },
  {
    icon: "📅",
    bg: "#EEEDFE",
    text: "Live session reminder: React Workshop in 2 hours",
    time: "2 hr ago",
    read: true,
  },
  {
    icon: "🏅",
    bg: "#E1F5EE",
    text: "Leo Chen earned a certificate for Web Dev",
    time: "Yesterday",
    read: true,
  },
];

export const initialSettings = [
  {
    label: "Email notifications",
    desc: "Get notified of enrollments and reviews",
    on: true,
  },
  {
    label: "Live session alerts",
    desc: "Reminder 1 hour before each session",
    on: true,
  },
];

export const aiReplies = [
  "Based on your course analytics, I recommend adding more hands-on projects to boost completion rates. Your top students prefer practical exercises.",
  "Looking at your engagement data, students tend to drop off at Module 6. Consider breaking it into smaller 5-minute segments.",
  "Your 'UI/UX Design Masterclass' has a 91% completion rate — the highest on your account. More visual courses like this could boost your overall metrics.",
  "I noticed your live sessions have 84% attendance. Sending reminder emails 2 hours before could push that above 90%.",
];

// staticData.js
export const navItems = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "courses", icon: "📚", label: "My Courses" },
  { id: "students", icon: "👥", label: "Students" },
  { id: "sessions",        icon: "🎥", label: "Live Sessions" },
  { id: "mentorship",      icon: "🧭", label: "Mentorship & Advisory" },
  { id: "notes",           icon: "📝", label: "Notes" },
  { id: "reels",           icon: "🎬", label: "Reels" },
  { id: "analytics",       icon: "📈", label: "Analytics" },
  { id: "ai",              icon: "🤖", label: "AI Assistant" },
  { id: "student_queries", icon: "💬", label: "Student Queries" },
  { id: "settings",        icon: "⚙️", label: "Settings" },
];

export const sectionTitles = {
  dashboard:      "Dashboard",
  courses:        "My Courses",
  sessions:       "Live Sessions",
  mentorship:     "Mentorship & Advisory",
  notes:          "Notes",
  reels:          "Reels",
  analytics:      "Analytics",
  ai:             "AI Assistant",
  student_queries: "Student Queries",
  settings:       "Settings",
};
