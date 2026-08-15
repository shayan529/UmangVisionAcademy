import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Award,
  Crown,
  CheckCircle2,
  Lock,
  Sparkles,
  Search,
  ExternalLink,
  FileCheck,
  Percent,
  Calendar,
  AlertCircle,
  Download,
  Building,
  HelpCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

const DEFAULT_DIRECTORY = [];

export default function ScholarshipsPortal() {
  const { t } = useTranslation();
  const { user } = useSelector((s) => s.auth);
  const { subscription } = useSelector((s) => s.billing);

  const planId = (
    subscription?.plan ||
    user?.subscription?.plan ||
    "free"
  ).toLowerCase();
  const isElite = planId === "elite";

  const [activeTab, setActiveTab] = useState("eligibility"); // 'eligibility' | 'nomination' | 'directory' | 'checklist'
  const [directory, setDirectory] = useState(DEFAULT_DIRECTORY);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loadingHub, setLoadingHub] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    fetch(`${API_BASE_URL}/student-hub/scholarships`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load scholarships");
        const payload = await res.json();
        setDirectory(
          Array.isArray(payload?.data?.directory)
            ? payload.data.directory
            : DEFAULT_DIRECTORY,
        );
      })
      .catch(() => {
        setDirectory(DEFAULT_DIRECTORY);
      })
      .finally(() => setLoadingHub(false));
  }, []);

  // Eligibility Calculator State
  const [calcClass, setCalcClass] = useState("Class 12");
  const [calcScore, setCalcScore] = useState("90%+");
  const [calcStream, setCalcStream] = useState("Engineering & Tech (JEE)");
  const [calcIncome, setCalcIncome] = useState("< ₹6 Lakhs/year");
  const [evalResult, setEvalResult] = useState(null);

  // Nomination Form State
  const [nomName, setNomName] = useState(user?.name || "");
  const [nomEmail, setNomEmail] = useState(user?.email || "");
  const [nomCollegeTarget, setNomCollegeTarget] = useState("");
  const [nomMarks, setNomMarks] = useState("");
  const [nomSop, setNomSop] = useState("");
  const [nomLoading, setNomLoading] = useState(false);
  const [submittedNominations, setSubmittedNominations] = useState([]);

  const handleEvaluate = (e) => {
    e.preventDefault();
    let percentage = 50;
    if (calcScore === "95%+") percentage += 35;
    else if (calcScore === "90%+") percentage += 25;
    else if (calcScore === "85%+") percentage += 15;

    if (calcIncome === "< ₹3 Lakhs/year" || calcIncome === "< ₹6 Lakhs/year") {
      percentage += 15;
    }
    const finalPct = Math.min(100, percentage);

    setEvalResult({
      grantPercentage: finalPct,
      tierStatus:
        finalPct === 100
          ? "Full 100% Scholarship Match"
          : `${finalPct}% Tuition Grant Eligibility`,
      annualAwardEst: `₹${((finalPct / 100) * 250000).toLocaleString("en-IN")}/year`,
      recommendedSchemes: [
        "Umang Vision National Higher-Study Merit Grant",
        "Reliance Foundation Undergraduate Scheme",
        "State Merit-cum-Means Higher Education Grant",
      ],
    });
  };

  const handleSubmitNomination = async (e) => {
    e.preventDefault();
    if (!isElite) {
      toast.error(
        "Direct scholarship nomination is exclusive to Elite plan members.",
      );
      return;
    }
    if (!nomCollegeTarget || !nomMarks || !nomSop) {
      toast.error(
        "Please fill in target college, scores, and statement of purpose.",
      );
      return;
    }
    setNomLoading(true);
    const nextNomination = {
      id: `nom-${Date.now()}`,
      name: nomName,
      targetCollege: nomCollegeTarget,
      marks: nomMarks,
      status: "Nomination Received - Under Faculty Review",
      date: new Date().toLocaleDateString(),
    };
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`${API_BASE_URL}/student-hub/scholarships`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          data: {
            directory,
            nominations: [nextNomination, ...submittedNominations],
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save nomination");
      setSubmittedNominations((prev) => [nextNomination, ...prev]);
      setNomCollegeTarget("");
      setNomMarks("");
      setNomSop("");
      toast.success("Scholarship nomination submitted successfully!");
      setActiveTab("nomination");
    } catch {
      toast.error(
        "Nomination could not be saved to the backend. Please try again.",
      );
    } finally {
      setNomLoading(false);
    }
  };

  const filteredDirectory = directory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.eligibility.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || item.category.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 p-4 md:p-8">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-emerald-950/60 border border-amber-500/30 p-6 md:p-10 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
              <Crown size={14} className="text-amber-400" />
              Elite Exclusive Portal
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              {t(
                "scholarshipsPortal.title",
                "Higher-Study Scholarships & Grants Hub",
              )}
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-2 max-w-2xl">
              {t(
                "scholarshipsPortal.subtitle",
                "Elite student scholarship nominations for up to 100% college tuition grants and searchable global scholarship directory.",
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isElite ? (
              <div className="px-5 py-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2">
                <Crown size={18} className="text-amber-400" />
                Elite Member Eligible
              </div>
            ) : (
              <Link
                to="/plans"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2"
              >
                <Crown size={16} /> Upgrade to Elite (₹1,000)
              </Link>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 overflow-x-auto border-b border-white/10 pb-2">
          {[
            { id: "eligibility", label: "Eligibility Checker", icon: Percent },
            {
              id: "nomination",
              label: "Apply for 100% Nomination",
              icon: Award,
            },
            {
              id: "directory",
              label: "National & Global Directory",
              icon: Search,
            },
            {
              id: "checklist",
              label: "Document & Filing Checklist",
              icon: FileCheck,
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

      {/* ── TAB 1: Eligibility Calculator ── */}
      {activeTab === "eligibility" && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="text-amber-400" size={20} />
              Instant Higher-Study Scholarship Eligibility Calculator
            </h2>
            <p className="text-slate-400 text-xs mb-8">
              Simulate your grant probability across academic scores, target
              entrance examinations, and family income parameters.
            </p>

            <form
              onSubmit={handleEvaluate}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Current Grade / Class
                </label>
                <select
                  value={calcClass}
                  onChange={(e) => setCalcClass(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Class 10">Class 10 (High School Board)</option>
                  <option value="Class 11">
                    Class 11 (Intermediate 1st Year)
                  </option>
                  <option value="Class 12">
                    Class 12 (Board / Pre-University)
                  </option>
                  <option value="Dropper / Gap Year">
                    Competitive Exam Target Year (Dropper)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Academic Performance / Mock Percentile
                </label>
                <select
                  value={calcScore}
                  onChange={(e) => setCalcScore(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="95%+">95%+ in Boards / 99+ Percentile</option>
                  <option value="90%+">
                    90% to 94% in Boards / 95-98 Percentile
                  </option>
                  <option value="85%+">
                    85% to 89% in Boards / 90-94 Percentile
                  </option>
                  <option value="75%+">
                    75% to 84% in Boards / 80-89 Percentile
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Target Degree & Higher Study Stream
                </label>
                <select
                  value={calcStream}
                  onChange={(e) => setCalcStream(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Engineering & Tech (JEE)">
                    B.Tech / B.E (IITs, NITs, BITS)
                  </option>
                  <option value="Medical & Healthcare (NEET)">
                    MBBS / BDS / Healthcare (AIIMS, Govt)
                  </option>
                  <option value="Commerce, CA & Management">
                    B.Com (Hons), IPMAT (IIMs), CA
                  </option>
                  <option value="Corporate Law & Humanities">
                    BA LLB (NLUs / CLAT), Civil Services
                  </option>
                  <option value="Study Abroad (USA / UK / Canada)">
                    International Undergraduate Degree
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Annual Household Income Bracket
                </label>
                <select
                  value={calcIncome}
                  onChange={(e) => setCalcIncome(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="< ₹3 Lakhs/year">
                    &lt; ₹3,00,000 / year (EWS Category)
                  </option>
                  <option value="< ₹6 Lakhs/year">
                    ₹3,00,000 - ₹6,00,000 / year
                  </option>
                  <option value="< ₹12 Lakhs/year">
                    ₹6,00,000 - ₹12,00,000 / year
                  </option>
                  <option value="> ₹12 Lakhs/year">
                    &gt; ₹12,00,000 / year
                  </option>
                </select>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Calculate My Higher-Study Grant Potential →
                </button>
              </div>
            </form>

            {evalResult && (
              <div className="mt-8 bg-gradient-to-br from-amber-950/60 to-emerald-950/60 border border-amber-500/40 rounded-3xl p-6 md:p-8 animate-fadeUp">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                      Calculated Eligibility Standing
                    </span>
                    <h3 className="text-2xl font-black text-white">
                      {evalResult.tierStatus}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">
                      Est. Annual Grant
                    </span>
                    <span className="text-3xl font-black text-emerald-400">
                      {evalResult.annualAwardEst}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 mb-4">
                  <span className="font-bold text-slate-300 block">
                    Primary Recommended Schemes:
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {evalResult.recommendedSchemes.map((s, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setActiveTab("nomination")}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2"
                >
                  Submit Official 100% Scholarship Nomination Form →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Direct Nomination Form ── */}
      {activeTab === "nomination" && (
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Award className="text-amber-400" size={20} />
              Umang Vision Higher-Study Scholarship Nomination
            </h2>
            <p className="text-slate-400 text-xs mb-6">
              Elite plan members are directly nominated for up to 100% college
              tuition assistance. Fill in your academic milestones and target
              college credentials below.
            </p>

            <form onSubmit={handleSubmitNomination} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    value={nomName}
                    onChange={(e) => setNomName(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={nomEmail}
                    onChange={(e) => setNomEmail(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Latest Board / Test Marks (% or Score)
                  </label>
                  <input
                    type="text"
                    value={nomMarks}
                    onChange={(e) => setNomMarks(e.target.value)}
                    placeholder="e.g. 94.6% in Class 10/12, JEE 99.2%ile"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Target Higher Study Institutions
                  </label>
                  <input
                    type="text"
                    value={nomCollegeTarget}
                    onChange={(e) => setNomCollegeTarget(e.target.value)}
                    placeholder="e.g. IIT Bombay, AIIMS, SRCC, Oxford"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Academic Ambition & Financial Justification (Short Statement)
                </label>
                <textarea
                  rows={4}
                  value={nomSop}
                  onChange={(e) => setNomSop(e.target.value)}
                  placeholder="Tell the committee about your career vision and why this scholarship will accelerate your higher education..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={nomLoading || !isElite}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Award size={18} />
                {nomLoading
                  ? "Submitting Nomination..."
                  : "Submit Official Scholarship Nomination (Elite)"}
              </button>
            </form>
          </div>

          {/* Submissions List */}
          {submittedNominations.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-3">
                Submitted Nominations
              </h3>
              <div className="space-y-3">
                {submittedNominations.map((nom) => (
                  <div
                    key={nom.id}
                    className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">
                        {nom.name} • {nom.targetCollege}
                      </p>
                      <p className="text-xs text-amber-300 font-semibold mt-0.5">
                        Marks: {nom.marks}
                      </p>
                      <p className="text-[11px] text-emerald-400 mt-1">
                        {nom.status} (Submitted on {nom.submittedAt})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: National & Global Directory ── */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={16}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search scholarship, provider, exam..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {["All", "Merit", "Need-based", "STEM", "Excellence"].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      categoryFilter === cat
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDirectory.map((sch) => (
              <div
                key={sch.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{
                        background: `${sch.color}20`,
                        color: sch.color,
                        border: `1px solid ${sch.color}40`,
                      }}
                    >
                      {sch.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      🕒 Deadline: {sch.deadline}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">
                    {sch.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">{sch.provider}</p>

                  <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/50 text-xs space-y-1.5 mb-5">
                    <div>
                      <span className="text-slate-400 block font-semibold">
                        Award Grant:
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {sch.award}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">
                        Eligibility Requirements:
                      </span>
                      <span className="text-slate-300">{sch.eligibility}</span>
                    </div>
                  </div>
                </div>

                {sch.isInternal ? (
                  <button
                    onClick={() => setActiveTab("nomination")}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Award size={14} /> Apply via Elite Nomination →
                  </button>
                ) : (
                  <a
                    href={sch.link}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    View Official Portal & Guidelines <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: Filing Checklist ── */}
      {activeTab === "checklist" && (
        <div className="max-w-3xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Scholarship Application Dossier Checklist
            </h2>
            <p className="text-xs text-slate-400">
              Ensure you have scanned PDF copies of all mandatory certifications
              prior to submitting government or private trust applications.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Class 10 & 12 Consolidated Marksheets",
                desc: "Attested copies or Digilocker verified digital marksheets",
              },
              {
                title: "Income Certificate (Tehsildar / SDO / ITR)",
                desc: "Must be issued in the current financial year (FY 2026-27)",
              },
              {
                title: "Bonafide Student Certificate / Admission Letter",
                desc: "Signed and stamped by School Principal or College Dean",
              },
              {
                title: "Aadhaar Card & Active Bank Account Linked to Aadhaar",
                desc: "Mandatory for Direct Benefit Transfer (DBT) funds",
              },
              {
                title: "Statement of Purpose / Need Justification Letter",
                desc: "Drafted using Umang Vision SOP studio guidelines",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
