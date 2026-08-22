import React, { useEffect, useState } from "react";
import {
  Compass,
  Calendar,
  Clock,
  User,
  Video,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  UserCheck,
  Link as LinkIcon,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

const DEFAULT_BOOKINGS = [];

const AVAILABLE_COUNSELLORS = [
  "Dr. Alok Verma (Engineering / JEE)",
  "Dr. Meenakshi Sundaram (Medical / NEET)",
  "Prof. Rajesh Sengupta (Commerce / CA / IIM)",
  "Adv. Sunita Rao (Law / UPSC)",
  "Sarah Montgomery (US / Ivy League Advisory)",
  "David Sterling (UK / Europe Advisory)",
];

export default function AdminCounselling() {
  const [bookings, setBookings] = useState(DEFAULT_BOOKINGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [loading, setLoading] = useState(true);

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
        setBookings(
          Array.isArray(payload?.data?.bookings) ? payload.data.bookings : [],
        );
      })
      .catch(() => {
        setBookings([]);
        toast.error("Could not load counselling bookings from backend.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Assignment Modal
  const [activeBookingForAssign, setActiveBookingForAssign] = useState(null);
  const [assignedCounsellor, setAssignedCounsellor] = useState(
    AVAILABLE_COUNSELLORS[0],
  );
  const [meetingUrlInput, setMeetingUrlInput] = useState("");

  const handleAssignCounsellor = async (e) => {
    e.preventDefault();
    if (!activeBookingForAssign) return;

    const assignedMentorName = assignedCounsellor.split(" (")[0];
    const generatedMeetingUrl =
      meetingUrlInput ||
      `https://meet.google.com/uva-${Date.now().toString(36)}`;

    const nextBookings = bookings.map((b) =>
      b.id === activeBookingForAssign.id
        ? {
            ...b,
            assignedTo: assignedMentorName,
            counsellor: assignedMentorName,
            status: "Confirmed",
            meetingUrl: generatedMeetingUrl,
          }
        : b,
    );

    setBookings(nextBookings);
    const token = localStorage.getItem("authToken");
    try {
      let existingSectionData = {};
      try {
        const getRes = await fetch(`${API_BASE_URL}/student-hub/counselling`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (getRes.ok) {
          const payload = await getRes.json();
          existingSectionData = payload?.data || {};
        }
      } catch {}

      const res = await fetch(`${API_BASE_URL}/student-hub/counselling`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          data: {
            ...existingSectionData,
            bookings: nextBookings,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save counselling updates");
      toast.success("Counsellor assigned and meeting link generated!");
    } catch {
      toast.error("Booking updated locally, but backend sync failed.");
    }
    setActiveBookingForAssign(null);
    setMeetingUrlInput("");
  };

  const handleMarkComplete = async (id) => {
    const nextBookings = bookings.map((b) =>
      b.id === id ? { ...b, status: "Completed" } : b,
    );
    setBookings(nextBookings);
    const token = localStorage.getItem("authToken");
    try {
      let existingSectionData = {};
      try {
        const getRes = await fetch(`${API_BASE_URL}/student-hub/counselling`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (getRes.ok) {
          const payload = await getRes.json();
          existingSectionData = payload?.data || {};
        }
      } catch {}

      const res = await fetch(`${API_BASE_URL}/student-hub/counselling`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          data: {
            ...existingSectionData,
            bookings: nextBookings,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to sync");
      toast.success("Booking marked as Completed!");
    } catch {
      toast.error("Sync to backend failed. Please try again.");
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (!b) return false;
    const sName = String(b.studentName || b.name || "Student").toLowerCase();
    const sEmail = String(b.studentEmail || b.email || "").toLowerCase();
    const sTopic = String(b.topic || b.subject || "").toLowerCase();
    const sCounsellor = String(
      b.assignedTo || b.counsellor || "",
    ).toLowerCase();
    const sQuery = (searchTerm || "").trim().toLowerCase();

    const matchesSearch =
      !sQuery ||
      sName.includes(sQuery) ||
      sEmail.includes(sQuery) ||
      sTopic.includes(sQuery) ||
      sCounsellor.includes(sQuery);

    const bookingType = b.type || (b.topic ? "Career Counselling" : "General");
    const matchesType = typeFilter === "All" || bookingType === typeFilter;

    const bookingTier = b.planTier || "Basic";
    const matchesTier = tierFilter === "All" || bookingTier === tierFilter;

    return matchesSearch && matchesType && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-900/40 p-5 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit text-xs font-extrabold uppercase tracking-wider">
            <Compass size={14} />
            <span>Advisory Desk</span>
          </div>

          <h1 className="text-xl md:text-3xl font-black text-white tracking-tight leading-tight mt-0.5">
            Counselling & Advisory Management
          </h1>

          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            Schedule, assign mentors, manage meeting URLs, and oversee 1-on-1 student consultations.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-6">
          <div className="bg-slate-900/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs text-slate-400 font-extrabold truncate">
              Total Bookings
            </span>
            <span className="text-xl sm:text-2xl font-black text-white mt-1">
              {bookings.length}
            </span>
          </div>

          <div className="bg-slate-900/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs text-amber-400 font-extrabold truncate">
              Pending
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
              {
                bookings.filter(
                  (b) =>
                    !b?.status ||
                    b.status === "Pending Assignment" ||
                    b.status === "Scheduled",
                ).length
              }
            </span>
          </div>

          <div className="bg-slate-900/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs text-indigo-400 font-extrabold truncate">
              Confirmed & Upcoming
            </span>
            <span className="text-xl sm:text-2xl font-black text-indigo-400 mt-1">
              {bookings.filter((b) => b?.status === "Confirmed").length}
            </span>
          </div>

          <div className="bg-slate-900/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs text-emerald-400 font-extrabold truncate">
              Completed
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              {bookings.filter((b) => b?.status === "Completed").length}
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={16}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student, email, topic..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none truncate cursor-pointer"
          >
            <option value="All">All Advisory Types</option>
            <option value="Career Counselling">Career Counselling</option>
            <option value="International Study Advisory">
              International Study Advisory
            </option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none truncate cursor-pointer"
          >
            <option value="All">All Tiers</option>
            <option value="Basic">Basic (2/yr)</option>
            <option value="Standard">Standard (5/yr)</option>
            <option value="Premium">Premium (5/yr + Global)</option>
          </select>
        </div>
      </div>

      {/* Bookings Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Compass size={32} className="mx-auto mb-2 opacity-40" />
            No counselling bookings found.
          </div>
        ) : (
          <>
            {/* Mobile Card List View (sm:hidden) */}
            <div className="block sm:hidden divide-y divide-slate-800/60 p-3 space-y-3">
              {filteredBookings.map((b, idx) => {
                const studentName =
                  b.studentName || b.name || b.student || "Student";
                const studentEmail = b.studentEmail || b.email || "—";
                const selectedClass =
                  b.selectedClass || b.class || "Class 9-12";
                const planTier = b.planTier || "Basic";
                const type =
                  b.type || (b.topic ? "Career Counselling" : "General");
                const topic = b.topic || b.subject || "1-on-1 Consultation";
                const scheduledSlot =
                  b.scheduledAt || b.date || b.time || "Scheduled";
                const assignedMentor =
                  b.assignedTo || b.counsellor || "Unassigned";
                const status =
                  b.status ||
                  (assignedMentor !== "Unassigned"
                    ? "Confirmed"
                    : "Pending Assignment");

                return (
                  <div
                    key={b.id || idx}
                    className="p-3.5 bg-slate-900/90 border border-slate-800/80 rounded-2xl flex flex-col gap-2.5"
                  >
                    {/* Top Row: Student & Tier */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-extrabold text-white truncate">
                          {studentName}
                        </h4>
                        <div className="text-[11px] text-slate-400 truncate">
                          {studentEmail} • {selectedClass}
                        </div>
                      </div>

                      {/* Tier Badge */}
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${
                          planTier === "Premium" || planTier === "Elite"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : planTier === "Standard"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                        }`}
                      >
                        {planTier === "Elite" ? "Premium 👑" : planTier === "Standard" ? "Standard ⭐" : planTier}
                      </span>
                    </div>

                    {/* Consultation Type & Topic */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="font-extrabold text-indigo-300 text-xs truncate">
                        {type}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {topic}
                      </div>
                    </div>

                    {/* Slot & Counsellor Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 pt-1 border-t border-slate-800/50">
                      <div className="font-mono text-slate-300 text-[11px]">
                        🕒 {scheduledSlot}
                      </div>

                      <div>
                        {assignedMentor === "Unassigned" ? (
                          <span className="text-amber-400 font-extrabold text-[11px]">
                            ⚠️ Unassigned
                          </span>
                        ) : (
                          <span className="text-slate-200 font-semibold text-[11px]">
                            👨‍🏫 {assignedMentor}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60 mt-1">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          status === "Completed"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : status === "Confirmed"
                              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {status}
                      </span>

                      <div className="flex items-center gap-2">
                        {(status === "Pending Assignment" ||
                          status === "Scheduled") && (
                          <button
                            onClick={() => {
                              setActiveBookingForAssign(b);
                              setMeetingUrlInput(b.meetingUrl || "");
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md cursor-pointer whitespace-nowrap"
                          >
                            Assign Mentor
                          </button>
                        )}
                        {status === "Confirmed" && (
                          <>
                            <button
                              onClick={() => handleMarkComplete(b.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-600/40 hover:bg-emerald-600/30 font-extrabold text-xs shadow-md cursor-pointer whitespace-nowrap"
                            >
                              Mark Done
                            </button>
                            {b.meetingUrl && (
                              <a
                                href={b.meetingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                                title="Join Video Link"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Student</th>
                    <th className="p-4">Plan Tier</th>
                    <th className="p-4">Consultation Type & Topic</th>
                    <th className="p-4">Scheduled Slot</th>
                    <th className="p-4">Assigned Counsellor</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredBookings.map((b, idx) => {
                    const studentName =
                      b.studentName || b.name || b.student || "Student";
                    const studentEmail = b.studentEmail || b.email || "—";
                    const selectedClass =
                      b.selectedClass || b.class || "Class 9-12";
                    const planTier = b.planTier || "Basic";
                    const type =
                      b.type || (b.topic ? "Career Counselling" : "General");
                    const topic = b.topic || b.subject || "1-on-1 Consultation";
                    const scheduledSlot =
                      b.scheduledAt || b.date || b.time || "Scheduled";
                    const assignedMentor =
                      b.assignedTo || b.counsellor || "Unassigned";
                    const status =
                      b.status ||
                      (assignedMentor !== "Unassigned"
                        ? "Confirmed"
                        : "Pending Assignment");

                    return (
                      <tr
                        key={b.id || idx}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">
                            {studentName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {studentEmail} • {selectedClass}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              planTier === "Premium" || planTier === "Elite"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : planTier === "Standard"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                            }`}
                          >
                            {planTier === "Elite" ? "Premium 👑" : planTier === "Standard" ? "Standard ⭐" : planTier}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-indigo-300">
                            {type}
                          </div>
                          <div className="text-[11px] text-slate-400 max-w-xs truncate">
                            {topic}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-300">
                          {scheduledSlot}
                        </td>
                        <td className="p-4">
                          {assignedMentor === "Unassigned" ? (
                            <span className="text-amber-400 font-bold">
                              ⚠️ Unassigned
                            </span>
                          ) : (
                            <span className="text-white font-medium">
                              👨‍🏫 {assignedMentor}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              status === "Completed"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : status === "Confirmed"
                                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(status === "Pending Assignment" ||
                              status === "Scheduled") && (
                              <button
                                onClick={() => {
                                  setActiveBookingForAssign(b);
                                  setMeetingUrlInput(b.meetingUrl || "");
                                }}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                              >
                                Assign Mentor
                              </button>
                            )}
                            {status === "Confirmed" && (
                              <>
                                <button
                                  onClick={() => handleMarkComplete(b.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-600/40 hover:bg-emerald-600/30 font-bold text-xs"
                                >
                                  Mark Done
                                </button>
                                {b.meetingUrl && (
                                  <a
                                    href={b.meetingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                    title="Join Video Link"
                                  >
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Assignment Modal */}
      {activeBookingForAssign && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">
              Assign Expert Counsellor
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Student: {activeBookingForAssign.studentName} (
              {activeBookingForAssign.type})
            </p>

            <form onSubmit={handleAssignCounsellor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Certified Advisor / Faculty
                </label>
                <select
                  value={assignedCounsellor}
                  onChange={(e) => setAssignedCounsellor(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {AVAILABLE_COUNSELLORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Video Meeting URL (Google Meet / Zoom)
                </label>
                <input
                  type="url"
                  value={meetingUrlInput}
                  onChange={(e) => setMeetingUrlInput(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveBookingForAssign(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Confirm & Notify Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
