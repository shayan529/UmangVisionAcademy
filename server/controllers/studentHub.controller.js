import StudentHub from "../models/studentHub.model.js";

const DEFAULT_SEED = {
  counselling: {
    counsellors: [
      {
        id: "c1",
        name: "Dr. Alok Verma",
        specialization: "Engineering & Tech Careers (IIT/NIT/BITS)",
        experience: "14+ Years",
        rating: 4.9,
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        availableSlots: [
          "Tomorrow, 4:00 PM",
          "Tomorrow, 6:30 PM",
          "Friday, 5:00 PM",
        ],
      },
      {
        id: "c2",
        name: "Dr. Meenakshi Sundaram",
        specialization: "Medical, NEET & Healthcare Sciences",
        experience: "12+ Years",
        rating: 4.95,
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        availableSlots: [
          "Tomorrow, 5:00 PM",
          "Saturday, 11:00 AM",
          "Saturday, 3:00 PM",
        ],
      },
      {
        id: "c3",
        name: "Prof. Rajesh Sengupta",
        specialization: "Commerce, CA, Economics & Management (IIMs)",
        experience: "16+ Years",
        rating: 4.88,
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        availableSlots: [
          "Friday, 6:00 PM",
          "Sunday, 10:00 AM",
          "Sunday, 4:00 PM",
        ],
      },
      {
        id: "c4",
        name: "Adv. Sunita Rao",
        specialization: "Law (CLAT), Humanities & Civil Services (UPSC)",
        experience: "11+ Years",
        rating: 4.92,
        avatar:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
        availableSlots: [
          "Saturday, 4:00 PM",
          "Sunday, 2:00 PM",
          "Monday, 6:00 PM",
        ],
      },
    ],
    roadmaps: [
      {
        title: "AI & Computer Science Engineering",
        stream: "Science (PCM)",
        exams: "JEE Main, JEE Advanced, BITSAT, State CETs",
        topColleges: "IIT Bombay, IIT Delhi, BITS Pilani, IIIT Hyderabad",
        growth: "Very High (+34% YoY)",
        avgPackage: "₹18 - 45 LPA",
        color: "#6366f1",
      },
      {
        title: "MBBS & Clinical Medicine",
        stream: "Science (PCB)",
        exams: "NEET UG, INI-CET",
        topColleges: "AIIMS New Delhi, CMC Vellore, JIPMER",
        growth: "Constant Demand",
        avgPackage: "₹12 - 35 LPA",
        color: "#10b981",
      },
      {
        title: "Chartered Accountancy & Investment Banking",
        stream: "Commerce / Math",
        exams: "CA Foundation, IPMAT, CUET UG",
        topColleges: "SRCC Delhi, IIM Indore (IPM), St. Xavier's",
        growth: "High (+22% YoY)",
        avgPackage: "₹14 - 38 LPA",
        color: "#f59e0b",
      },
      {
        title: "Corporate Law & Judicial Services",
        stream: "Any Stream (Hum/Comm/Sci)",
        exams: "CLAT, AILET, LSAT India",
        topColleges: "NLSIU Bengaluru, NALSAR Hyderabad, WBNUJS",
        growth: "High (+20% YoY)",
        avgPackage: "₹15 - 32 LPA",
        color: "#ec4899",
      },
    ],
    bookings: [
      {
        id: "hist-1",
        counsellor: "Dr. Alok Verma",
        date: "2026-07-28",
        topic: "Class 11 Science Stream Strategy & JEE Target Score",
        status: "Completed",
        actionPlan:
          "Focus on Physics mechanics foundations and maintain daily 45-min math problem sets.",
      },
    ],
  },
  internationalStudy: {
    countries: [
      {
        id: "usa",
        name: "United States",
        flag: "🇺🇸",
        topUnis: "MIT, Stanford, Harvard, UC Berkeley, CMU",
        avgTuition: "$28,000 - $65,000 / yr",
        livingCost: "$12,000 - $18,000 / yr",
        visaType: "F-1 Student Visa",
        postStudyWork: "Up to 3 Years (STEM OPT)",
        intakes: "Fall (Aug/Sep), Spring (Jan)",
        tests:
          "SAT / ACT (Undergrad), GRE / GMAT (Grad), TOEFL / IELTS / Duolingo",
      },
      {
        id: "uk",
        name: "United Kingdom",
        flag: "🇬🇧",
        topUnis: "Oxford, Cambridge, Imperial, UCL, Edinburgh",
        avgTuition: "£16,000 - £38,000 / yr",
        livingCost: "£10,000 - £15,000 / yr",
        visaType: "Student Route Visa",
        postStudyWork: "2 Years Graduate Route",
        intakes: "September / October, January",
        tests: "IELTS / PTE / TOEFL, UCAS Application",
      },
      {
        id: "canada",
        name: "Canada",
        flag: "🇨🇦",
        topUnis: "Univ of Toronto, UBC, McGill, Waterloo",
        avgTuition: "CAD $20,000 - $45,000 / yr",
        livingCost: "CAD $14,000 - $18,000 / yr",
        visaType: "Study Permit (SDS Track)",
        postStudyWork: "Up to 3 Years PGWP",
        intakes: "Fall (Sep), Winter (Jan), Summer (May)",
        tests: "IELTS / Duolingo / TOEFL",
      },
      {
        id: "germany",
        name: "Germany",
        flag: "🇩🇪",
        topUnis: "TUM, LMU Munich, Heidelberg, RWTH Aachen",
        avgTuition: "€0 - €3,000 / yr (Free in Public Unis)",
        livingCost: "€11,208 / yr (Blocked Account)",
        visaType: "National Student Visa",
        postStudyWork: "18 Months Job Seeking Permit",
        intakes: "Winter (Oct), Summer (Apr)",
        tests: "IELTS, TestAS, APS Certificate",
      },
      {
        id: "australia",
        name: "Australia",
        flag: "🇦🇺",
        topUnis: "Univ of Melbourne, Univ of Sydney, UNSW, ANU",
        avgTuition: "AUD $28,000 - $50,000 / yr",
        livingCost: "AUD $21,000 - $26,000 / yr",
        visaType: "Subclass 500 Visa",
        postStudyWork: "2 - 4 Years Post-Study Work",
        intakes: "Semester 1 (Feb), Semester 2 (Jul)",
        tests: "IELTS / PTE Academic / TOEFL",
      },
    ],
    advisors: [
      {
        id: "adv1",
        name: "Sarah Montgomery",
        title: "Former Ivy League Admissions Officer & US Education Advisor",
        experience: "15+ Years",
        rating: 4.98,
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        specialty: "US Top 30 Universities, STEM Programs & Financial Aid",
      },
      {
        id: "adv2",
        name: "David Sterling",
        title: "Senior UK & European University Counsellor (Oxford Alum)",
        experience: "12+ Years",
        rating: 4.94,
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        specialty: "Russell Group, UCAS Personal Statements, DAAD Germany",
      },
    ],
    sops: [],
  },
  scholarships: {
    directory: [
      {
        id: "sch-1",
        name: "Umang Vision National Higher-Study Merit Grant",
        provider: "Umang Vision Academy Foundation",
        award: "Up to 100% College Tuition (₹2,50,000/yr)",
        category: "Merit & Academic Excellence",
        eligibility:
          "Class 12 / JEE / NEET aspirants with 85%+ score on Premium Plan",
        deadline: "30 September 2026",
        isInternal: true,
        tag: "Exclusive for Premium Members",
        color: "#f59e0b",
      },
      {
        id: "sch-2",
        name: "Reliance Foundation Undergraduate Scholarship",
        provider: "Reliance Foundation",
        award: "Up to ₹2,00,000 over degree duration",
        category: "Merit-cum-Means",
        eligibility: "Class 12 pass with min 60%, household income < ₹15 Lakhs",
        deadline: "15 October 2026",
        link: "https://www.scholarships.reliancefoundation.org",
        color: "#38bdf8",
      },
      {
        id: "sch-3",
        name: "INSPIRE Scholarship for Higher Education (SHE)",
        provider: "Department of Science & Technology (Govt. of India)",
        award: "₹80,000 per year (₹60k cash + ₹20k research)",
        category: "Government STEM Fellowship",
        eligibility: "Top 1% in Class 12 Board exams pursuing B.Sc / BS-MS",
        deadline: "30 November 2026",
        link: "https://online-inspire.gov.in",
        color: "#4ade80",
      },
      {
        id: "sch-4",
        name: "HDFC Bank Parivartan's ECSS Programme",
        provider: "HDFC Bank",
        award: "Up to ₹75,000 per year",
        category: "Need-based & Higher Secondary",
        eligibility:
          "Classes 11, 12, Diploma & Undergraduate students facing financial crisis",
        deadline: "31 August 2026",
        link: "https://www.hdfcbank.com",
        color: "#a855f7",
      },
      {
        id: "sch-5",
        name: "Aditya Birla Group Scholarship",
        provider: "Aditya Birla Group",
        award: "Up to ₹3,00,000 per year",
        category: "Premier Engineering & Law Institutes",
        eligibility:
          "Students admitted to top 10 IITs, BITS Pilani, top National Law Universities",
        deadline: "15 September 2026",
        link: "https://www.adityabirlascholars.net",
        color: "#ec4899",
      },
    ],
    nominations: [],
  },
};

const ensureSectionSeed = async (section) => {
  const existing = await StudentHub.findOne({ section }).lean();
  if (existing) return existing.data;

  const defaultData = DEFAULT_SEED[section] || {};
  await StudentHub.create({ section, data: defaultData });
  return defaultData;
};

export const getStudentHubData = async (req, res) => {
  try {
    const sections = await Promise.all(
      Object.keys(DEFAULT_SEED).map(async (section) => {
        const doc = await StudentHub.findOne({ section }).lean();
        if (!doc) {
          const created = await StudentHub.create({
            section,
            data: DEFAULT_SEED[section],
          });
          return { section, data: created.data };
        }
        return { section, data: doc.data };
      }),
    );

    const payload = {};
    sections.forEach(({ section, data }) => {
      payload[section] = data;
    });

    res.json({ success: true, data: payload });
  } catch (error) {
    console.error("[studentHub] getStudentHubData failed:", error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Failed to load student hub data",
      });
  }
};

export const getStudentHubSection = async (req, res) => {
  try {
    const { section } = req.params;
    const data = await ensureSectionSeed(section);

    res.json({ success: true, data });
  } catch (error) {
    console.error("[studentHub] getStudentHubSection failed:", error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Failed to load section data",
      });
  }
};

export const saveStudentHubSection = async (req, res) => {
  try {
    const { section } = req.params;
    const { data } = req.body;

    if (!section || !DEFAULT_SEED[section]) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid student hub section" });
    }

    const updated = await StudentHub.findOneAndUpdate(
      { section },
      { section, data: data || DEFAULT_SEED[section] },
      { upsert: true, new: true, runValidators: true },
    );

    res.json({ success: true, data: updated.data });
  } catch (error) {
    console.error("[studentHub] saveStudentHubSection failed:", error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Failed to save student hub section",
      });
  }
};
