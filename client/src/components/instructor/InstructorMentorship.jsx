import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Compass,
  Video,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Send,
  Globe,
  Award,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

const INITIAL_ASSIGNED_SESSIONS = [
  {
    id: "sess-101",
    studentName: "Aarav Sharma",
    studentEmail: "aarav.sharma@gmail.com",
    className: "Class 11",
    type: "Career Counselling",
    topic: "Class 11 Science Stream Strategy & JEE Target Score",
    scheduledAt: "Today, 5:00 PM IST",
    status: "Upcoming",
    planTier: "Premium",
    studentNotes: "Struggling with balancing Physics mechanics and school tests.",
  },
  {
    id: "sess-102",
    studentName: "Riya Patel",
    studentEmail: "riya.patel@outlook.com",
    className: "Class 12",
    type: "International Study Advisory",
    topic: "US Top 30 University Shortlisting & SAT Strategy",
    scheduledAt: "Tomorrow, 6:30 PM IST",
    status: "Upcoming",
    planTier: "Elite",
    studentNotes: "Scored 1420 on Digital SAT, aiming for CMU & Georgia Tech Computer Science.",
  },
  {
    id: "sess-103",
    studentName: "Karan Johar",
    studentEmail: "karan.j@gmail.com",
    className: "Class 10",
    type: "Career Counselling",
    topic: "Commerce vs Science Stream Selection",
    scheduledAt: "Yesterday",
    status: "Completed",
    planTier: "Basic",
    feedback: "Recommended PCM with CS based on diagnostic score 91%. Focus on algebra practice.",
  },
];

const INITIAL_SOP_REVIEWS = [
  {
    id: "sop-rev-1",
    studentName: "Riya Patel",
    degree: "BS in Computer Science",
    country: "United States",
    submittedAt: "2026-08-08",
    status: "Pending Review",
    draftText:
      "Since building my first Python algorithm in 9th grade to optimize local bus scheduling, I became fascinated by how computational thinking can solve physical world inefficiencies. At Georgia Tech's College of Computing, I aspire to work under Dr. Isbell on distributed robotics systems...",
  },
];

export default function InstructorMentorship() {
  const { user } = useSelector((s) => s.auth);
  const [sessions, setSessions] = useState(INITIAL_ASSIGNED_SESSIONS);
  const [sops, setSops] = useState(INITIAL_SOP_REVIEWS);
  const [activeTab, setActiveTab] = useState("sessions"); // 'sessions' | 'sop_reviews' | 'priority_sla'

  // Action plan modal state
  const [activeSessionForNotes, setActiveSessionForNotes] = useState(null);
  const [actionPlanInput, setActionPlanInput] = useState("");

  // SOP review feedback modal state
  const [activeSopReview, setActiveSopReview] = useState(null);
  const [sopFeedbackText, setSopFeedbackText] = useState("");

  const handleSaveActionPlan = (e) => {
    e.preventDefault();
    if (!actionPlanInput.trim()) {
      toast.error("Please enter action plan notes.");
      return;
    }
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionForNotes.id
          ? { ...s, status: "Completed", feedback: actionPlanInput }
          : s
      )
    );
    toast.success("Counselling session completed and action plan sent to student!");
    setActiveSessionForNotes(null);
    setActionPlanInput("");
  };

  const handleSendSopFeedback = (e) => {
    e.preventDefault();
    if (!sopFeedbackText.trim()) {
      toast.error("Please enter editorial review feedback.");
      return;
    }
    setSops((prev) =>
      prev.map((s) =>
        s.id === activeSopReview.id
          ? { ...s, status: "Feedback Sent", editorialNotes: sopFeedbackText }
          : s
      )
    );
    toast.success("SOP Editorial review dispatched to student!");
    setActiveSopReview(null);
    setSopFeedbackText("");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/20 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Compass size={14} className="text-indigo-400" />
              Mentorship & Advisory Desk
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Counselling, Advisory & SOP Review Hub
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Manage your assigned 1-on-1 Career Counselling, International Study Advisory sessions, and Elite SOP draft evaluations.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("sessions")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "sessions"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              1-on-1 Sessions ({sessions.filter((s) => s.status === "Upcoming").length})
            </button>
            <button
              onClick={() => setActiveTab("sop_reviews")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "sop_reviews"
                  ? "bg-amber-500 text-slate-950 font-black shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              SOP Reviews ({sops.filter((s) => s.status === "Pending Review").length})
            </button>
          </div>
        </div>
      </div>

      {/* ── TAB 1: Sessions ── */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-white text-base">{sess.studentName}</h3>
                    <span className="text-xs text-slate-400 font-medium">({sess.className})</span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        sess.planTier === "Elite"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : sess.planTier === "Premium"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                      }`}
                    >
                      {sess.planTier} Tier
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sess.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      {sess.status}
                    </span>
                  </div>

                  <p className="text-xs text-indigo-300 font-semibold flex items-center gap-2">
                    <span>🕒 {sess.scheduledAt}</span> • <span>📌 {sess.type}</span>
                  </p>

                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/40 text-xs text-slate-300 space-y-1">
                    <p><strong>Discussion Topic:</strong> {sess.topic}</p>
                    {sess.studentNotes && (
                      <p><strong>Student Context:</strong> {sess.studentNotes}</p>
                    )}
                    {sess.feedback && (
                      <p className="text-emerald-400"><strong>Post-Session Action Plan:</strong> {sess.feedback}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  {sess.status === "Upcoming" && (
                    <>
                      <button
                        onClick={() => toast.success(`Launching in-app video room for ${sess.studentName}...`)}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2"
                      >
                        <Video size={14} /> Start Video Call
                      </button>
                      <button
                        onClick={() => setActiveSessionForNotes(sess)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700"
                      >
                        <FileText size={14} /> Submit Action Plan
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Plan Modal */}
          {activeSessionForNotes && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-1">
                  Complete Session & Submit Action Plan
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Student: {activeSessionForNotes.studentName} ({activeSessionForNotes.topic})
                </p>

                <form onSubmit={handleSaveActionPlan} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Guidance Summary & Action Steps for Student
                    </label>
                    <textarea
                      rows={5}
                      value={actionPlanInput}
                      onChange={(e) => setActionPlanInput(e.target.value)}
                      placeholder="e.g. Recommended subjects, revision schedule, key test targets to aim for next month..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveSessionForNotes(null)}
                      className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Mark Complete & Send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: SOP Reviews ── */}
      {activeTab === "sop_reviews" && (
        <div className="space-y-4">
          {sops.map((sop) => (
            <div
              key={sop.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Crown size={16} className="text-amber-400" />
                    {sop.studentName} — {sop.degree} ({sop.country})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Submitted on {sop.submittedAt}</p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    sop.status === "Pending Review"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {sop.status}
                </span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed max-h-48 overflow-y-auto">
                {sop.draftText}
              </div>

              {sop.editorialNotes && (
                <div className="bg-emerald-950/30 border border-emerald-800/40 p-4 rounded-xl text-xs text-emerald-300">
                  <strong>Editor Feedback Dispatched:</strong> {sop.editorialNotes}
                </div>
              )}

              {sop.status === "Pending Review" && (
                <button
                  onClick={() => setActiveSopReview(sop)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileText size={14} /> Review & Provide Editorial Feedback
                </button>
              )}
            </div>
          ))}

          {/* SOP Feedback Modal */}
          {activeSopReview && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-1">
                  SOP Review Feedback for {activeSopReview.studentName}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Target: {activeSopReview.degree} ({activeSopReview.country})
                </p>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono mb-4 max-h-36 overflow-y-auto">
                  {activeSopReview.draftText}
                </div>

                <form onSubmit={handleSendSopFeedback} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Editorial Review & Structural Feedback
                    </label>
                    <textarea
                      rows={6}
                      value={sopFeedbackText}
                      onChange={(e) => setSopFeedbackText(e.target.value)}
                      placeholder="Highlight strengths, hook recommendations, paragraph transitions, and academic alignment..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveSopReview(null)}
                      className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
                    >
                      Dispatch Feedback to Student
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
