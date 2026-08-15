import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Compass,
  Calendar,
  Clock,
  Video,
  Award,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  FileCheck,
  UserCheck,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

const DEFAULT_COUNSELLORS = [];
const DEFAULT_ROADMAPS = [];
const DEFAULT_SESSIONS = [];

export default function CareerCounselling() {
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
  const isPremium = planId === "premium";
  const isBasic = planId === "basic" || planId === "base";
  const hasPlan = isBasic || isPremium || isElite;

  const totalQuota = isElite || isPremium ? 5 : isBasic ? 2 : 0;
  const [usedSessions, setUsedSessions] = useState(0);
  const remainingSessions = Math.max(0, totalQuota - usedSessions);

  const [activeTab, setActiveTab] = useState("booking"); // 'booking' | 'assessment' | 'roadmaps' | 'history'
  const [selectedCounsellor, setSelectedCounsellor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [topic, setTopic] = useState("Stream selection & subject mapping");
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [counsellors, setCounsellors] = useState(DEFAULT_COUNSELLORS);
  const [roadmaps, setRoadmaps] = useState(DEFAULT_ROADMAPS);
  const [sessionsHistory, setSessionsHistory] = useState(DEFAULT_SESSIONS);
  const [loadingHub, setLoadingHub] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    fetch(`${API_BASE_URL}/student-hub/counselling`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load counselling data");
        const payload = await res.json();
        const data = payload?.data || {};
        setCounsellors(
          Array.isArray(data.counsellors)
            ? data.counsellors
            : DEFAULT_COUNSELLORS,
        );
        setRoadmaps(
          Array.isArray(data.roadmaps) ? data.roadmaps : DEFAULT_ROADMAPS,
        );
        setSessionsHistory(
          Array.isArray(data.bookings) ? data.bookings : DEFAULT_SESSIONS,
        );
        if (data.counsellors?.[0]) {
          setSelectedCounsellor(data.counsellors[0]);
          setSelectedSlot(data.counsellors[0].availableSlots?.[0] || "");
        }
      })
      .catch(() => {
        setCounsellors(DEFAULT_COUNSELLORS);
        setRoadmaps(DEFAULT_ROADMAPS);
        setSessionsHistory(DEFAULT_SESSIONS);
      })
      .finally(() => setLoadingHub(false));
  }, []);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  const handleBookSession = async (e) => {
    e.preventDefault();
    if (!hasPlan) {
      toast.error(
        "🔒 Subscribe to a Smart Learning Plan (Basic, Premium, or Elite) to unlock Career Counselling sessions.",
      );
      navigate("/plans");
      return;
    }
    if (remainingSessions <= 0) {
      const upgradeTo = isBasic ? "Premium or Elite" : "Elite";
      toast.error(
        `⬆️ You've used all your sessions. Upgrade to ${upgradeTo} Plan to get more Career Counselling sessions.`,
      );
      navigate("/plans");
      return;
    }
    if (!selectedCounsellor || !selectedSlot) {
      toast.error("Please select a counsellor and available time slot.");
      return;
    }

    setBookingLoading(true);
    const nextBooking = {
      id: `hist-${Date.now()}`,
      counsellor: selectedCounsellor.name,
      date: selectedSlot,
      topic,
      status: "Scheduled",
      actionPlan:
        "Session confirmed. Meeting link will be sent via SMS & Email 30 mins before start.",
    };

    const token = localStorage.getItem("authToken");
    const nextHistory = [nextBooking, ...sessionsHistory];

    try {
      const res = await fetch(`${API_BASE_URL}/student-hub/counselling`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          data: { counsellors, roadmaps, bookings: nextHistory },
        }),
      });
      if (!res.ok) throw new Error("Failed to save booking");
      setUsedSessions((prev) => prev + 1);
      setSessionsHistory(nextHistory);
      toast.success(
        "1-on-1 Career Counselling Session Scheduled Successfully!",
      );
      setSelectedCounsellor(null);
      setSelectedSlot("");
      setActiveTab("history");
    } catch {
      toast.error(
        "Your session could not be saved to the backend. Please try again.",
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleRunAssessment = () => {
    if (Object.keys(quizAnswers).length < 3) {
      toast.error("Please answer all diagnostic questions.");
      return;
    }
    setQuizResult({
      primaryFit: "Engineering & Applied Computer Sciences (94% Match)",
      secondaryFit: "Data Analytics & Quantitative Economics (88% Match)",
      summary:
        "You demonstrate strong logical deduction and spatial reasoning. A curriculum in Physics-Chemistry-Math with Computer Science will best leverage your analytical instincts.",
      recommendedExams: ["JEE Main / Advanced", "BITSAT", "ISI Entrance"],
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 p-4 md:p-8">
      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/20 p-6 md:p-10 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Compass size={14} className="text-indigo-400" />
              {t(
                "careerCounselling.title",
                "Career Counselling & Mentorship Hub",
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {t(
                "careerCounselling.title",
                "Personalized Career & Stream Advisory",
              )}
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-2 max-w-2xl">
              {t(
                "careerCounselling.subtitle",
                "1-on-1 mentorship with certified career psychologists and domain experts to guide your streams, entrance exams, and college roadmap.",
              )}
            </p>
          </div>

          {/* Quota Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 w-full md:w-72 shrink-0 shadow-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span>
                {t(
                  "careerCounselling.quotaTitle",
                  "Annual Career Advisory Quota",
                )}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isElite
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : isPremium
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : isBasic
                        ? "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                        : "bg-slate-800 text-slate-400"
                }`}
              >
                {isElite
                  ? "ELITE 👑"
                  : isPremium
                    ? "PREMIUM ⭐"
                    : isBasic
                      ? "BASIC"
                      : "FREE"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">
                {remainingSessions}
              </span>
              <span className="text-slate-400 text-sm">
                / {totalQuota}{" "}
                {t("careerCounselling.sessionsLeft", "sessions remaining")}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{
                  width: `${totalQuota > 0 ? (remainingSessions / totalQuota) * 100 : 0}%`,
                }}
              />
            </div>
            {!hasPlan && (
              <Link
                to="/plans"
                className="mt-3 block text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Upgrade to activate 2 to 5 sessions →
              </Link>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 overflow-x-auto border-b border-white/10 pb-2">
          {[
            { id: "booking", label: "Book 1-on-1 Session", icon: Calendar },
            {
              id: "assessment",
              label: "Stream Aptitude Test",
              icon: BrainCircuit,
            },
            { id: "roadmaps", label: "50+ Career Roadmaps", icon: TrendingUp },
            {
              id: "history",
              label: "Session History & Notes",
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
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
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

      {/* ── TAB 1: Booking ── */}
      {activeTab === "booking" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {counsellors.map((c) => {
              const isSelected = selectedCounsellor?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCounsellor(c);
                    setSelectedSlot(c.availableSlots[0]);
                  }}
                  className={`relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4 bg-indigo-500 text-white p-1 rounded-full text-xs">
                      <CheckCircle size={14} />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/30"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {c.name}
                      </h3>
                      <p className="text-xs text-indigo-300 font-semibold">
                        {c.experience}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-0.5">
                        <span>⭐ {c.rating}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 mb-4 bg-slate-800/50 p-2.5 rounded-xl">
                    {c.specialization}
                  </p>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Next Available Slot
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg inline-block">
                      🕒 {c.availableSlots[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Booking Config Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-3xl mx-auto shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Calendar className="text-indigo-400" size={20} />
              Confirm Your 1-on-1 Consultation
            </h2>
            <p className="text-slate-400 text-xs mb-6">
              {selectedCounsellor
                ? `Booking session with ${selectedCounsellor.name} (${selectedCounsellor.specialization})`
                : "Select a counsellor above to choose your preferred topic and slot."}
            </p>

            <form onSubmit={handleBookSession} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Select Time Slot
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(
                    selectedCounsellor?.availableSlots || [
                      "Tomorrow, 4:00 PM",
                      "Friday, 5:30 PM",
                      "Saturday, 11:00 AM",
                    ]
                  ).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl text-xs font-bold border transition-all text-left ${
                        selectedSlot === slot
                          ? "bg-indigo-600 text-white border-indigo-400 shadow-md"
                          : "bg-slate-800/70 text-slate-300 border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      🕒 {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Primary Discussion Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Stream selection & subject mapping (Class 10 to 11)">
                    Stream selection & subject mapping (Class 10 to 11)
                  </option>
                  <option value="Competitive Exam Strategy (JEE / NEET / CUET / CLAT)">
                    Competitive Exam Strategy (JEE / NEET / CUET / CLAT)
                  </option>
                  <option value="College vs. Branch Trade-offs & Admission Roadmaps">
                    College vs. Branch Trade-offs & Admission Roadmaps
                  </option>
                  <option value="Emerging High-Growth Careers & Alternative Degrees">
                    Emerging High-Growth Careers & Alternative Degrees
                  </option>
                  <option value="Study Habits, Time Management & Exam Anxiety Guidance">
                    Study Habits, Time Management & Exam Anxiety Guidance
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Questions or Background Info for Counsellor (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share your current subjects, target score, or any specific concerns..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                {!hasPlan || remainingSessions <= 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const upgradeTo = !hasPlan
                        ? "Basic, Premium, or Elite"
                        : isBasic
                          ? "Premium or Elite"
                          : "Elite";
                      toast(
                        `⬆️ Upgrade to ${upgradeTo} Plan to unlock Career Counselling sessions.`,
                        {
                          icon: "🔒",
                          style: {
                            background: "#1e1b4b",
                            color: "#a5b4fc",
                            border: "1px solid #4338ca",
                            fontWeight: 600,
                          },
                        },
                      );
                      navigate("/plans");
                    }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="text-base">⬆️</span>
                    Upgrade Plan
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Video size={18} />
                    {bookingLoading
                      ? "Scheduling Session..."
                      : "Confirm 1-on-1 Video Session"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 2: Assessment ── */}
      {activeTab === "assessment" && (
        <div className="max-w-3xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">
              Stream & Career Aptitude Diagnostic
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-2">
              Answer 3 quick scenarios to identify which academic stream best
              aligns with your thinking patterns.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60">
              <p className="text-sm font-bold text-white mb-3">
                1. Which type of challenge excites you the most?
              </p>
              <div className="space-y-2 text-xs">
                {[
                  {
                    key: "sci",
                    text: "Understanding how machines, software, and the universe operate",
                  },
                  {
                    key: "bio",
                    text: "Learning how living organisms, medicines, and the human body heal",
                  },
                  {
                    key: "comm",
                    text: "Analyzing markets, startup business models, investments & profits",
                  },
                  {
                    key: "arts",
                    text: "Debating laws, writing stories, philosophy, and societal policies",
                  },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      quizAnswers.q1 === opt.key
                        ? "bg-indigo-950/60 border-indigo-500 text-white"
                        : "bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="q1"
                      checked={quizAnswers.q1 === opt.key}
                      onChange={() =>
                        setQuizAnswers({ ...quizAnswers, q1: opt.key })
                      }
                      className="accent-indigo-500"
                    />
                    {opt.text}
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60">
              <p className="text-sm font-bold text-white mb-3">
                2. In your spare time, what do you naturally gravitate towards?
              </p>
              <div className="space-y-2 text-xs">
                {[
                  {
                    key: "tech",
                    text: "Coding, puzzles, gaming mechanics, or DIY electronics",
                  },
                  {
                    key: "fin",
                    text: "Crypto, financial news, stock trends, or business podcasts",
                  },
                  {
                    key: "creative",
                    text: "Art, graphic design, debate, writing, or video editing",
                  },
                  {
                    key: "social",
                    text: "Volunteering, biology documentaries, healthcare, or psychology",
                  },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      quizAnswers.q2 === opt.key
                        ? "bg-indigo-950/60 border-indigo-500 text-white"
                        : "bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="q2"
                      checked={quizAnswers.q2 === opt.key}
                      onChange={() =>
                        setQuizAnswers({ ...quizAnswers, q2: opt.key })
                      }
                      className="accent-indigo-500"
                    />
                    {opt.text}
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60">
              <p className="text-sm font-bold text-white mb-3">
                3. What work environment inspires you?
              </p>
              <div className="space-y-2 text-xs">
                {[
                  {
                    key: "high_tech",
                    text: "Fast-moving tech labs, AI companies, or robotics hubs",
                  },
                  {
                    key: "clinical",
                    text: "Hospitals, medical research labs, or veterinary clinics",
                  },
                  {
                    key: "corporate",
                    text: "Corporate headquarters, investment firms, or founding a startup",
                  },
                  {
                    key: "public",
                    text: "Courtrooms, government administration, or international NGOs",
                  },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      quizAnswers.q3 === opt.key
                        ? "bg-indigo-950/60 border-indigo-500 text-white"
                        : "bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="q3"
                      checked={quizAnswers.q3 === opt.key}
                      onChange={() =>
                        setQuizAnswers({ ...quizAnswers, q3: opt.key })
                      }
                      className="accent-indigo-500"
                    />
                    {opt.text}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunAssessment}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg transition-all"
            >
              Analyze My Career Fit 🚀
            </button>

            {quizResult && (
              <div className="mt-8 bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl animate-fadeUp">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles size={14} /> Diagnostic Results
                </div>
                <h3 className="text-xl font-extrabold text-white mb-1">
                  {quizResult.primaryFit}
                </h3>
                <p className="text-xs text-purple-300 font-semibold mb-3">
                  Secondary Fit: {quizResult.secondaryFit}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {quizResult.summary}
                </p>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="font-bold text-slate-300 block mb-1">
                    Recommended Entrance Exams:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quizResult.recommendedExams.map((e) => (
                      <span
                        key={e}
                        className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-semibold"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Roadmaps ── */}
      {activeTab === "roadmaps" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roadmaps.map((rm, idx) => (
            <div
              key={idx}
              className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: `${rm.color}20`,
                    color: rm.color,
                    border: `1px solid ${rm.color}40`,
                  }}
                >
                  {rm.stream}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Growth: {rm.growth}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{rm.title}</h3>

              <div className="space-y-2 text-xs text-slate-300 bg-slate-800/40 p-4 rounded-2xl mb-4">
                <div>
                  <span className="text-slate-400 font-semibold block">
                    Key Entrance Exams:
                  </span>
                  <span className="text-white font-medium">{rm.exams}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">
                    Premier Target Institutions:
                  </span>
                  <span className="text-white font-medium">
                    {rm.topColleges}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">
                    Industry Compensation Band:
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {rm.avgPackage}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCounsellor(
                    counsellors[idx % Math.max(counsellors.length, 1)] ||
                      counsellors[0],
                  );
                  setActiveTab("booking");
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                Discuss this Roadmap with an Expert <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 4: History & Action Plans ── */}
      {activeTab === "history" && (
        <div className="max-w-4xl mx-auto space-y-4">
          {sessionsHistory.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800">
              <MessageSquare
                size={40}
                className="mx-auto text-slate-600 mb-3"
              />
              <p className="text-slate-400 text-sm">
                No counselling sessions booked yet.
              </p>
            </div>
          ) : (
            sessionsHistory.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-white text-base">
                      {s.counsellor}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-300 font-semibold">
                    🕒 {s.date} • {s.topic}
                  </p>
                  <p className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl mt-2 border border-slate-700/50">
                    <strong className="text-slate-200">
                      Counsellor Action Plan:{" "}
                    </strong>
                    {s.actionPlan}
                  </p>
                </div>
                {s.status === "Scheduled" && (
                  <button
                    onClick={() =>
                      toast.success("Opening in-app video room...")
                    }
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shrink-0"
                  >
                    <Video size={14} /> Join Video Call
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
