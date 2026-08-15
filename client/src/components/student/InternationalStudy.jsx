import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Globe,
  Crown,
  GraduationCap,
  FileText,
  Calendar,
  Video,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Download,
  BookOpen,
  Send,
  Plane,
  Award,
  Search,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

const DEFAULT_COUNTRIES = [];
const DEFAULT_ADVISORS = [];

export default function InternationalStudy() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { subscription } = useSelector((s) => s.billing);

  const planId = (
    subscription?.plan ||
    user?.subscription?.plan ||
    "free"
  ).toLowerCase();
  const isElite = planId === "elite";

  const [activeTab, setActiveTab] = useState("explorer"); // 'explorer' | 'tests' | 'sop_studio' | 'advisors'
  const [countries, setCountries] = useState(DEFAULT_COUNTRIES);
  const [advisors, setAdvisors] = useState(DEFAULT_ADVISORS);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [sopDraft, setSopDraft] = useState("");
  const [sopTargetCountry, setSopTargetCountry] = useState("United States");
  const [sopTargetDegree, setSopTargetDegree] = useState(
    "BS in Computer Science",
  );
  const [submittingSop, setSubmittingSop] = useState(false);
  const [submittedSops, setSubmittedSops] = useState([]);
  const [loadingHub, setLoadingHub] = useState(true);
  const activeCountry = selectedCountry || countries[0] || null;

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    fetch(`${API_BASE_URL}/student-hub/internationalStudy`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load study data");
        const payload = await res.json();
        const data = payload?.data || {};
        const nextCountries = Array.isArray(data.countries)
          ? data.countries
          : DEFAULT_COUNTRIES;
        const nextAdvisors = Array.isArray(data.advisors)
          ? data.advisors
          : DEFAULT_ADVISORS;
        setCountries(nextCountries);
        setAdvisors(nextAdvisors);
        setSelectedCountry(nextCountries[0] || null);
      })
      .catch(() => {
        setCountries(DEFAULT_COUNTRIES);
        setAdvisors(DEFAULT_ADVISORS);
        setSelectedCountry(null);
      })
      .finally(() => setLoadingHub(false));
  }, []);

  // Advisor Booking
  const [bookingAdvisor, setBookingAdvisor] = useState(null);
  const [advisorSlot, setAdvisorSlot] = useState("");
  const [advisorNotes, setAdvisorNotes] = useState("");

  const handleSubmitSOP = async (e) => {
    e.preventDefault();
    if (!sopDraft.trim() || sopDraft.length < 50) {
      toast.error("Please provide a draft of at least 50 words.");
      return;
    }
    setSubmittingSop(true);
    const nextSop = {
      id: `sop-${Date.now()}`,
      degree: sopTargetDegree,
      country: sopTargetCountry,
      draft: sopDraft,
      status: "Under Review",
      submittedAt: new Date().toLocaleDateString(),
      feedback:
        "Our admissions advisor is reviewing your statement structure, grammar, and alignment with target university criteria.",
    };
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(
        `${API_BASE_URL}/student-hub/internationalStudy`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            data: { countries, advisors, sops: [nextSop, ...submittedSops] },
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to save SOP");
      setSubmittedSops((prev) => [nextSop, ...prev]);
      setSopDraft("");
      toast.success("SOP Submitted for Expert Review!");
    } catch {
      toast.error(
        "Your SOP could not be saved to the backend. Please try again.",
      );
    } finally {
      setSubmittingSop(false);
    }
  };

  const handleBookAdvisor = (e) => {
    e.preventDefault();
    if (!advisorSlot) {
      toast.error("Please choose an advisory slot.");
      return;
    }
    toast.success(
      `1-on-1 Consultation booked with ${bookingAdvisor.name}! Meeting link sent to email.`,
    );
    setBookingAdvisor(null);
    setAdvisorSlot("");
    setAdvisorNotes("");
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 p-4 md:p-8">
      {/* ── Top Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border border-amber-500/30 p-6 md:p-10 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Crown size={14} className="text-amber-400" />
              {t(
                "internationalStudy.eliteExclusiveBadge",
                "ELITE PLAN EXCLUSIVE",
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Globe className="text-amber-400" size={32} />
              {t(
                "internationalStudy.title",
                "International Study Guidance Hub",
              )}
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-2 max-w-2xl">
              {t(
                "internationalStudy.subtitle",
                "Your gateway to premier global universities across USA, UK, Canada, Europe, Australia, and Singapore.",
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isElite ? (
              <div className="px-5 py-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2">
                <Crown size={18} className="text-amber-400" />
                Elite Membership Unlocked
              </div>
            ) : (
              <Link
                to="/plans"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2"
              >
                <Crown size={16} />{" "}
                {t(
                  "internationalStudy.upgradeBtn",
                  "Upgrade to Elite Plan (₹1,000)",
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 overflow-x-auto border-b border-white/10 pb-2">
          {[
            {
              id: "explorer",
              label: "University & Country Finder",
              icon: Globe,
            },
            { id: "tests", label: "IELTS / SAT / Test Hub", icon: BookOpen },
            {
              id: "sop_studio",
              label: "SOP & LOR Review Studio",
              icon: FileText,
            },
            {
              id: "advisors",
              label: "1-on-1 Global Advisor Booking",
              icon: Video,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shrink-0 cursor-pointer ${
                  active
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Lock Screen / Teaser if not Elite ── */}
      {!isElite && (
        <div className="mb-8 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Lock size={28} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Full Access is Exclusive to Elite Plan Members
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You are currently previewing this section. Upgrade to the Elite
                Plan (₹1,000/yr) to unlock unlimited SOP reviews, university
                shortlisting, and 1-on-1 sessions with former Ivy League &
                Russell Group admissions mentors.
              </p>
            </div>
          </div>
          <Link
            to="/student-dashboard/billing"
            state={{
              plan: {
                id: "elite",
                title: "Elite Plan",
                price: "₹1,000",
                amount: 100000,
              },
            }}
            className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 shadow-lg transition-all"
          >
            Unlock Elite Now 👑
          </Link>
        </div>
      )}

      {/* ── TAB 1: Country & University Finder ── */}
      {activeTab === "explorer" && (
        <div className="space-y-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {countries.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCountry(c)}
                className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 border transition-all shrink-0 cursor-pointer ${
                  activeCountry?.id === c.id
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-lg"
                    : "bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800"
                }`}
              >
                <span className="text-xl">{c.flag}</span>
                {c.name}
              </button>
            ))}
          </div>

          {/* Country Detail Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl">
            {!activeCountry ? (
              <div className="flex min-h-[280px] items-center justify-center text-center">
                <p className="text-sm text-slate-400">
                  {loadingHub
                    ? "Loading country guidance from the admin hub..."
                    : "No country guidance is available yet."}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-6 mb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">{activeCountry.flag}</span>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-white">
                        {activeCountry.name}
                      </h2>
                      <p className="text-xs text-amber-400 font-semibold mt-1">
                        Visa: {activeCountry.visaType} • Work Permit:{" "}
                        {activeCountry.postStudyWork}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!isElite) {
                        toast.error(
                          "Please upgrade to Elite to download comprehensive admission guides.",
                        );
                        return;
                      }
                      toast.success(
                        `Downloading ${activeCountry.name} Comprehensive Admissions Dossier (PDF)...`,
                      );
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700"
                  >
                    <Download size={14} /> Download {activeCountry.name} Guide
                    (PDF)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Premier Institutions
                    </span>
                    <p className="text-sm font-semibold text-white">
                      {activeCountry.topUnis}
                    </p>
                  </div>

                  <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Average Annual Tuition
                    </span>
                    <p className="text-sm font-bold text-emerald-400">
                      {activeCountry.avgTuition}
                    </p>
                  </div>

                  <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Cost of Living (Est.)
                    </span>
                    <p className="text-sm font-semibold text-slate-200">
                      {activeCountry.livingCost}
                    </p>
                  </div>

                  <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Key Application Intakes
                    </span>
                    <p className="text-sm font-semibold text-slate-200">
                      {activeCountry.intakes}
                    </p>
                  </div>

                  <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 md:col-span-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Standardized Test Requirements
                    </span>
                    <p className="text-sm font-semibold text-indigo-300">
                      {activeCountry.tests}
                    </p>
                  </div>
                </div>

                {/* Admission Timeline Steps */}
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <h3 className="text-base font-bold text-white mb-4">
                    Admissions Journey Roadmap
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        step: "1. Profile & Shortlist",
                        desc: "GPA, extracurriculars, university tiers (Dream, Target, Safe)",
                      },
                      {
                        step: "2. Exam Readiness",
                        desc: "Take IELTS (6.5 - 7.5+) / SAT (1350 - 1550+) 10 months prior",
                      },
                      {
                        step: "3. SOP & LOR Polish",
                        desc: "Craft compelling personal statement & secure teacher recommendations",
                      },
                      {
                        step: "4. Visa & Financials",
                        desc: "I-20 / CAS issuance, block account, and visa interview preparation",
                      },
                    ].map((s, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/40 p-4 rounded-xl border border-slate-800"
                      >
                        <span className="text-xs font-bold text-amber-400 block mb-1">
                          {s.step}
                        </span>
                        <p className="text-xs text-slate-400">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Standardized Test Hub ── */}
      {activeTab === "tests" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "IELTS Academic (English Proficiency)",
              scoreTarget: "Band 7.0 - 8.5",
              sections:
                "Listening (30m), Reading (60m), Writing (60m), Speaking (14m)",
              validity: "2 Years",
              tips: "Practice Task 2 essay structure and high-band lexical cohesion daily.",
              color: "#38bdf8",
            },
            {
              title: "Digital SAT (Undergraduate Admissions)",
              scoreTarget: "1400 - 1560 / 1600",
              sections: "Reading & Writing (64m, 54 Qs), Math (70m, 44 Qs)",
              validity: "5 Years",
              tips: "Master Desmos graphing calculator tricks and grammar rules for Module 2.",
              color: "#818cf8",
            },
            {
              title: "TOEFL iBT (English Language Test)",
              scoreTarget: "100 - 112 / 120",
              sections: "Reading, Listening, Speaking, Writing",
              validity: "2 Years",
              tips: "Focus on note-taking during integrated listening/speaking modules.",
              color: "#34d399",
            },
            {
              title: "GRE General Test (Graduate Programs)",
              scoreTarget: "320 - 335 / 340",
              sections:
                "Verbal Reasoning (130-170), Quantitative (130-170), AWA (0-6)",
              validity: "5 Years",
              tips: "Memorize 1000 essential high-frequency vocabulary roots and algebra shortcuts.",
              color: "#fbbf24",
            },
          ].map((tItem, idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: `${tItem.color}20`,
                    color: tItem.color,
                    border: `1px solid ${tItem.color}40`,
                  }}
                >
                  Target: {tItem.scoreTarget}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Validity: {tItem.validity}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {tItem.title}
              </h3>
              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50 text-xs text-slate-300 space-y-1 mb-4">
                <p>
                  <strong>Format:</strong> {tItem.sections}
                </p>
                <p>
                  <strong>Elite Prep Tip:</strong> {tItem.tips}
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isElite) {
                    toast.error(
                      "Upgrade to Elite to unlock exclusive test practice sets.",
                    );
                    return;
                  }
                  toast.success(
                    `Accessing ${tItem.title} practice papers & diagnostic guide!`,
                  );
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
              >
                Access Diagnostic Practice Papers →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: SOP & LOR Studio ── */}
      {activeTab === "sop_studio" && (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <FileText className="text-amber-400" size={20} />
              Statement of Purpose (SOP) & Essay Review Studio
            </h2>
            <p className="text-slate-400 text-xs mb-6">
              Submit your college application essay, Statement of Purpose, or
              Letter of Recommendation draft. Senior admissions editors will
              analyze your structure, hook, academic achievements, and tone.
            </p>

            <form onSubmit={handleSubmitSOP} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Target Destination
                  </label>
                  <select
                    value={sopTargetCountry}
                    onChange={(e) => setSopTargetCountry(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="United States">
                      United States (Common App / Grad SOP)
                    </option>
                    <option value="United Kingdom">
                      United Kingdom (UCAS Personal Statement)
                    </option>
                    <option value="Canada">Canada (Letter of Intent)</option>
                    <option value="Germany">Germany (Motivation Letter)</option>
                    <option value="Australia">Australia (GTE / SOP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Target Major / Degree
                  </label>
                  <input
                    type="text"
                    value={sopTargetDegree}
                    onChange={(e) => setSopTargetDegree(e.target.value)}
                    placeholder="e.g. BS in Computer Science, BBA, Mechanical Engg"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Paste Your Essay / Statement of Purpose Draft
                </label>
                <textarea
                  rows={8}
                  value={sopDraft}
                  onChange={(e) => setSopDraft(e.target.value)}
                  placeholder="Paste your introduction hook, academic background, project experience, why this university, and career aspirations..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs md:text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submittingSop || !isElite}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send size={16} />
                {submittingSop
                  ? "Submitting for Expert Evaluation..."
                  : "Submit Draft for Elite Review (48h Turnaround)"}
              </button>
            </form>
          </div>

          {/* Submissions Tracker */}
          {submittedSops.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-3">
                Submitted Drafts
              </h3>
              <div className="space-y-3">
                {submittedSops.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">
                        {sub.degree} ({sub.country})
                      </p>
                      <p className="text-xs text-amber-300 font-semibold mt-0.5">
                        Status: {sub.status}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Submitted on {sub.submittedAt} • Feedback ETA:{" "}
                        {sub.feedbackEta}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg">
                      Pending Editor Review
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: 1-on-1 Global Advisor Booking ── */}
      {activeTab === "advisors" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {advisors.map((adv) => (
              <div
                key={adv.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-amber-500/40 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={adv.avatar}
                    alt={adv.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-500/40"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {adv.name}
                    </h3>
                    <p className="text-xs text-amber-300 font-semibold">
                      {adv.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ⭐ {adv.rating} • {adv.experience}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/50 text-xs text-slate-300 mb-5">
                  <strong className="text-slate-200 block mb-1">
                    Focus Areas:
                  </strong>
                  {adv.specialty}
                </div>

                <button
                  onClick={() => {
                    if (!isElite) {
                      toast.error(
                        "1-on-1 International Advisor Booking is exclusive to Elite plan members.",
                      );
                      return;
                    }
                    setBookingAdvisor(adv);
                  }}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Video size={14} /> Schedule 1-on-1 Video Consultation
                </button>
              </div>
            ))}
          </div>

          {/* Booking Modal */}
          {bookingAdvisor && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-1">
                  Book Session with {bookingAdvisor.name}
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  {bookingAdvisor.title}
                </p>

                <form onSubmit={handleBookAdvisor} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Select Time Slot
                    </label>
                    <select
                      value={advisorSlot}
                      onChange={(e) => setAdvisorSlot(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="" disabled>
                        Choose an available slot
                      </option>
                      <option value="This Friday, 6:00 PM IST">
                        This Friday, 6:00 PM IST
                      </option>
                      <option value="This Saturday, 4:30 PM IST">
                        This Saturday, 4:30 PM IST
                      </option>
                      <option value="This Sunday, 11:00 AM IST">
                        This Sunday, 11:00 AM IST
                      </option>
                      <option value="Next Tuesday, 7:00 PM IST">
                        Next Tuesday, 7:00 PM IST
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Key Discussion Points
                    </label>
                    <textarea
                      rows={3}
                      value={advisorNotes}
                      onChange={(e) => setAdvisorNotes(e.target.value)}
                      placeholder="e.g. University list review, financial aid for USA Fall intake..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setBookingAdvisor(null)}
                      className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
