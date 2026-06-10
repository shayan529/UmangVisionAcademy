import React, { useState } from "react";
import { Search, FileText, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

// ─────────────────────────────────────────────────────────────────────────────
// All papers years
// ─────────────────────────────────────────────────────────────────────────────
const PAPERS = [2025, 2024, 2023, 2022, 2021];

// ─────────────────────────────────────────────────────────────────────────────
// Subject lists per board + class
// ─────────────────────────────────────────────────────────────────────────────
const SUBJECTS = {
  // ── CBSE ──────────────────────────────────────────────────────────────────
  "CBSE-9": [
    "Mathematics", "Science", "Social Science", "English",
    "Hindi A", "Hindi B", "Sanskrit", "Information Technology",
  ],
  "CBSE-10": [
    "Mathematics", "Science", "Social Science", "English",
    "Hindi A", "Hindi B", "Sanskrit", "Information Technology", "Computer Applications",
  ],
  "CBSE-11": [
    "Physics", "Chemistry", "Mathematics", "Biology",
    "English Core", "Accountancy", "Economics", "Business Studies",
    "History", "Political Science", "Geography", "Computer Science",
  ],
  "CBSE-12": [
    "Physics", "Chemistry", "Mathematics", "Biology",
    "English Core", "Accountancy", "Economics", "Business Studies",
    "History", "Political Science", "Geography", "Computer Science",
  ],

  // ── MP Board ───────────────────────────────────────────────────────────────
  "MP Board-9": [
    "Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit",
  ],
  "MP Board-10": [
    "Mathematics", "Science", "Social Science", "Hindi", "English",
    "Sanskrit", "Computer Science",
  ],
  "MP Board-11": [
    "Physics", "Chemistry", "Mathematics", "Biology", "Hindi", "English",
    "Accountancy", "Economics", "History", "Political Science",
    "Geography", "Business Studies", "Computer Science",
  ],
  "MP Board-12": [
    "Physics", "Chemistry", "Mathematics", "Biology", "Hindi", "English",
    "Accountancy", "Economics", "History", "Political Science",
    "Geography", "Business Studies", "Computer Science", "Sociology",
  ],

  // ── ICSE ───────────────────────────────────────────────────────────────────
  "ICSE-9": [
    "Mathematics", "Physics", "Chemistry", "Biology",
    "English", "History & Civics", "Geography", "Computer Applications", "Economics",
  ],
  "ICSE-10": [
    "Mathematics", "Physics", "Chemistry", "Biology",
    "English", "History & Civics", "Geography", "Computer Applications",
    "Economics", "Hindi", "Commercial Studies",
  ],
  "ICSE-11": [
    "Physics", "Chemistry", "Mathematics", "Biology",
    "English", "Computer Science", "Economics", "Accounts",
    "Geography", "History",
  ],
  "ICSE-12": [
    "Physics", "Chemistry", "Mathematics", "Biology",
    "English", "Computer Science", "Economics", "Accounts",
    "Geography", "History", "Business Studies",
  ],
};

// Build mockData from the above
const CLASSES = ["9", "10", "11", "12"];
const BOARDS  = ["CBSE", "MP Board", "ICSE"];

const mockData = BOARDS.flatMap((board) =>
  CLASSES.map((cls) => ({
    board,
    class: `Class ${cls}`,
    subjects: (SUBJECTS[`${board}-${cls}`] || []).map((name) => ({
      name,
      papers: PAPERS,
    })),
  }))
);

// ─────────────────────────────────────────────────────────────────────────────
// Verified URL resolver
//
// Sources (all verified live June 2026):
//   CBSE      → educart.co  (class 9/10/11/12 PYQ pages)
//   MP Board  → mpboardonline.com  (per-class pages with all subjects & years)
//   ICSE      → shaalaa.com  (per-class CISCE question paper pages)
// ─────────────────────────────────────────────────────────────────────────────

// educart.co verified PYQ slug map — subject-specific pages where they exist,
// falls back to the class-level hub page for subjects without a dedicated page.
const EDUCART_SLUGS = {
  9: {
    // educart.co/previous-year-question-paper/cbse-class-9
    // Subject-specific sub-pages confirmed:
    Mathematics:            "class-9-maths-with-solutions",
    Science:                "class-9-science-with-solutions",
    "Social Science":       "class-9-social-science-with-solutions",
    English:                "class-9-english-with-solutions",
    "Hindi A":              "class-9-hindi-with-solutions",
    "Hindi B":              "class-9-hindi-b-with-solutions",
    Sanskrit:               "class-9-sanskrit-with-solutions",
    "Information Technology": "class-9-information-technology-with-solutions",
  },
  10: {
    Mathematics:            "cbse-class-10-maths-previous-year-papers",
    Science:                "cbse-class-10-science-previous-year-papers",
    "Social Science":       "cbse-class-10-social-science-previous-year-papers",
    English:                "cbse-class-10-english-previous-year-papers",
    "Hindi A":              "cbse-class-10-hindi-a-previous-year-papers",
    "Hindi B":              "cbse-class-10-hindi-b-previous-year-papers",
    Sanskrit:               "cbse-class-10-sanskrit-previous-year-papers",
    "Information Technology": "cbse-class-10-information-technology-previous-year-papers",
    "Computer Applications": "cbse-class-10-computer-applications-previous-year-papers",
  },
  11: {
    // educart.co/previous-year-question-paper/cbse-class-11  (hub page confirmed)
    // No subject-specific PYQ sub-pages for class 11; all go to the hub
  },
  12: {
    // educart.co/previous-year-question-paper/cbse-previous-year-question-papers-class-12
  },
};

// mpboardonline.com confirmed class pages
const MP_CLASS_PAGES = {
  9:  "https://www.mpboardonline.com/mp-board-class-9.html",
  10: "https://www.mpboardonline.com/mp-board-class-10.html",
  11: "https://www.mpboardonline.com/mp-board-class-11.html",
  12: "https://www.mpboardonline.com/mp-board-class-12.html",
};

// shaalaa.com confirmed ICSE/ISC class-level question paper pages
// For ICSE class 9 & 10, cisce board ID = _1440 and _661 respectively
// For ISC class 11 = _1431, class 12 = _622
const SHAALAA_CLASS_PAGES = {
  9:  "https://www.shaalaa.com/search-question-papers/cisce-icse-class-9-indian-certificate-of-secondary-education_1440",
  10: "https://www.shaalaa.com/search-question-papers/cisce-icse-class-10-indian-certificate-of-secondary-education_661",
  11: "https://www.shaalaa.com/search-question-papers/cisce-isc-class-11_1431",
  12: "https://www.shaalaa.com/search-question-papers/cisce-isc-class-12-science_622",
};

const getPaperUrl = (board, className, subjectName, _year) => {
  const classNum = parseInt(className.replace("Class ", ""), 10);

  // ── CBSE ──────────────────────────────────────────────────────────────────
  if (board === "CBSE") {
    const slugMap = EDUCART_SLUGS[classNum] || {};
    const slug = slugMap[subjectName];
    if (slug) {
      return `https://www.educart.co/previous-year-question-paper/${slug}`;
    }
    // Hub fallback per class
    if (classNum === 9)  return "https://www.educart.co/previous-year-question-paper/cbse-class-9";
    if (classNum === 10) return "https://www.educart.co/previous-year-question-paper/cbse-previous-year-question-papers-class-10";
    if (classNum === 11) return "https://www.educart.co/previous-year-question-paper/cbse-class-11";
    if (classNum === 12) return "https://www.educart.co/previous-year-question-paper/cbse-previous-year-question-papers-class-12";
  }

  // ── MP Board ───────────────────────────────────────────────────────────────
  if (board === "MP Board") {
    return MP_CLASS_PAGES[classNum] || "https://www.mpboardonline.com/";
  }

  // ── ICSE ───────────────────────────────────────────────────────────────────
  if (board === "ICSE") {
    return SHAALAA_CLASS_PAGES[classNum] || "https://www.shaalaa.com/";
  }

  // Generic fallback
  const q = encodeURIComponent(`${board} Class ${classNum} ${subjectName} question paper PDF`);
  return `https://www.google.com/search?q=${q}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Source label per board
// ─────────────────────────────────────────────────────────────────────────────
const SOURCE_LABEL = {
  "CBSE":     "educart.co — free PDF download",
  "MP Board": "mpboardonline.com — all subjects & years",
  "ICSE":     "shaalaa.com — CISCE solved papers",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const QuestionBank = () => {
  const { t } = useTranslation();
  const [selectedBoard, setSelectedBoard] = useState("All");
  const [selectedClass, setSelectedClass] = useState("All");
  const [searchTerm, setSearchTerm]       = useState("");

  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const filteredData = mockData.filter((item) => {
    if (item.subjects.length === 0) return false;
    const boardMatch = selectedBoard === "All" || item.board === selectedBoard;
    const classMatch = selectedClass === "All" || item.class === selectedClass;
    const subjectMatch = item.subjects.some((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return boardMatch && classMatch && (searchTerm ? subjectMatch : true);
  });

  const handlePaperAccess = (year, subject, board, className) => {
    if (!user) {
      navigate("/login", { state: { from: "/question-bank" } });
      return;
    }
    const url = getPaperUrl(board, className, subject, year);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const boardOptions = [
    { value: "All",      label: t("questionBank.boardOptions.all") },
    { value: "MP Board", label: t("questionBank.boardOptions.mpBoard") },
    { value: "CBSE",     label: t("questionBank.boardOptions.cbse") },
    { value: "ICSE",     label: t("questionBank.boardOptions.icse") },
  ];

  const classOptions = [
    { value: "All",      label: t("questionBank.classOptions.all") },
    { value: "Class 9",  label: t("questionBank.classOptions.class9") },
    { value: "Class 10", label: t("questionBank.classOptions.class10") },
    { value: "Class 11", label: t("questionBank.classOptions.class11") },
    { value: "Class 12", label: t("questionBank.classOptions.class12") },
  ];

  const boardBadgeStyle = {
    "MP Board": "bg-orange-600/15 text-orange-200",
    CBSE:       "bg-cyan-600/15   text-cyan-200",
    ICSE:       "bg-purple-600/15 text-purple-200",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 md:px-12 py-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">{t("questionBank.title")}</h1>
          <p className="text-slate-400">{t("questionBank.description")}</p>
        </div>

        {/* Filters */}
        <div className="grid gap-4 mb-10 md:grid-cols-[minmax(0,1fr)_230px_230px]">
          <div className="flex flex-col">
            <label className="mb-2 text-sm text-slate-400">
              {t("questionBank.subjectLabel")}
            </label>
            <div className="relative w-full">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t("questionBank.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm text-slate-400">
              {t("questionBank.boardLabel")}
            </label>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3"
            >
              {boardOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm text-slate-400">
              {t("questionBank.classLabel")}
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3"
            >
              {classOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-10">
          {/* ── Global empty state ── */}
          {filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-5">
                <Search size={28} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">
                No subjects found
              </h3>
              <p className="text-slate-400 max-w-sm">
                No results for{" "}
                <span className="text-cyan-400 font-medium">"{searchTerm}"</span>.
                Try a different subject name or clear the search.
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-6 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors"
              >
                Clear search
              </button>
            </div>
          )}

          {filteredData.map((classData) => {
            const visibleSubjects = classData.subjects.filter((s) =>
              s.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return (
            <div key={`${classData.board}-${classData.class}`}>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold">{classData.class}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    boardBadgeStyle[classData.board] ?? "bg-slate-700 text-slate-200"
                  }`}
                >
                  {classData.board}
                </span>
              </div>

              {/* ── Per-group empty state ── */}
              {visibleSubjects.length === 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-5 text-slate-400">
                  <FileText size={20} className="text-slate-600 shrink-0" />
                  <p className="text-sm">
                    No subject matching{" "}
                    <span className="text-cyan-400 font-medium">"{searchTerm}"</span>{" "}
                    found in {classData.board} {classData.class}.
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleSubjects.map((subject) => (
                    <div
                      key={subject.name}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <FileText className="text-cyan-400 shrink-0" size={22} />
                        <h3 className="font-semibold text-lg">{subject.name}</h3>
                      </div>

                      <div className="space-y-2.5">
                        {subject.papers.map((year) => (
                          <div
                            key={year}
                            className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 rounded-xl px-4 py-3 transition-colors"
                          >
                            <span className="text-sm text-slate-300">
                              {year} {t("questionBank.questionPaper")}
                            </span>
                            <button
                              onClick={() =>
                                handlePaperAccess(
                                  year,
                                  subject.name,
                                  classData.board,
                                  classData.class
                                )
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all"
                              title={`View ${classData.board} ${classData.class} ${subject.name} ${year} Question Paper`}
                            >
                              {t("questionBank.view")}
                              <ExternalLink size={12} className="opacity-80" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <p className="mt-4 text-xs text-slate-600 flex items-center gap-1">
                        <ExternalLink size={10} />
                        {SOURCE_LABEL[classData.board] ?? "External source"}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default QuestionBank;