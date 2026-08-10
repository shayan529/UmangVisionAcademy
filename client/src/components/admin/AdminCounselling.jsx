import React, { useState } from "react";
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

const INITIAL_BOOKINGS = [
  {
    id: "b-1",
    studentName: "Aarav Sharma",
    studentEmail: "aarav.sharma@gmail.com",
    selectedClass: "Class 11",
    planTier: "Premium",
    type: "Career Counselling",
    topic: "Class 11 Science Stream Strategy & JEE Target Score",
    assignedTo: "Dr. Alok Verma",
    scheduledAt: "2026-08-11 17:00",
    status: "Confirmed",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
  },
  {
    id: "b-2",
    studentName: "Riya Patel",
    studentEmail: "riya.patel@outlook.com",
    selectedClass: "Class 12",
    planTier: "Elite",
    type: "International Study Advisory",
    topic: "US Top 30 University Shortlisting & SAT Strategy",
    assignedTo: "Sarah Montgomery",
    scheduledAt: "2026-08-12 18:30",
    status: "Confirmed",
    meetingUrl: "https://meet.google.com/xyz-uvwx-rst",
  },
  {
    id: "b-3",
    studentName: "Sneha Kapoor",
    studentEmail: "sneha.k@gmail.com",
    selectedClass: "Class 10",
    planTier: "Basic",
    type: "Career Counselling",
    topic: "Stream Selection (Class 10 to 11)",
    assignedTo: "Unassigned",
    scheduledAt: "2026-08-13 16:00",
    status: "Pending Assignment",
    meetingUrl: "",
  },
];

const AVAILABLE_COUNSELLORS = [
  "Dr. Alok Verma (Engineering / JEE)",
  "Dr. Meenakshi Sundaram (Medical / NEET)",
  "Prof. Rajesh Sengupta (Commerce / CA / IIM)",
  "Adv. Sunita Rao (Law / UPSC)",
  "Sarah Montgomery (US / Ivy League Advisory)",
  "David Sterling (UK / Europe Advisory)",
];

export default function AdminCounselling() {
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");

  // Assignment Modal
  const [activeBookingForAssign, setActiveBookingForAssign] = useState(null);
  const [assignedCounsellor, setAssignedCounsellor] = useState(AVAILABLE_COUNSELLORS[0]);
  const [meetingUrlInput, setMeetingUrlInput] = useState("");

  const handleAssignCounsellor = (e) => {
    e.preventDefault();
    setBookings((prev) =>
      prev.map((b) =>
        b.id === activeBookingForAssign.id
          ? {
              ...b,
              assignedTo: assignedCounsellor.split(" (")[0],
              status: "Confirmed",
              meetingUrl: meetingUrlInput || `https://meet.google.com/uva-${Date.now().toString(36)}`,
            }
          : b
      )
    );
    toast.success("Counsellor assigned and meeting link generated!");
    setActiveBookingForAssign(null);
    setMeetingUrlInput("");
  };

  const handleMarkComplete = (id) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "Completed" } : b))
    );
    toast.success("Booking marked as Completed!");
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || b.type === typeFilter;
    const matchesTier = tierFilter === "All" || b.planTier === tierFilter;
    return matchesSearch && matchesType && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Compass size={22} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Counselling & Advisory Desk Management
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Schedule, assign mentors, manage video meeting URLs, and oversee all 1-on-1 student career & international study consultations.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 block font-semibold">Total Bookings</span>
            <span className="text-2xl font-black text-white">{bookings.length}</span>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-amber-400 block font-semibold">Pending Assignment</span>
            <span className="text-2xl font-black text-amber-400">
              {bookings.filter((b) => b.status === "Pending Assignment").length}
            </span>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-indigo-400 block font-semibold">Confirmed & Upcoming</span>
            <span className="text-2xl font-black text-indigo-400">
              {bookings.filter((b) => b.status === "Confirmed").length}
            </span>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-emerald-400 block font-semibold">Completed Sessions</span>
            <span className="text-2xl font-black text-emerald-400">
              {bookings.filter((b) => b.status === "Completed").length}
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student, email, topic..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="All">All Advisory Types</option>
            <option value="Career Counselling">Career Counselling</option>
            <option value="International Study Advisory">International Study Advisory</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="All">All Tiers</option>
            <option value="Basic">Basic (2/yr)</option>
            <option value="Premium">Premium (5/yr)</option>
            <option value="Elite">Elite (5/yr + Global)</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
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
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white text-sm">{b.studentName}</div>
                    <div className="text-[11px] text-slate-400">{b.studentEmail} • {b.selectedClass}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        b.planTier === "Elite"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : b.planTier === "Premium"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                      }`}
                    >
                      {b.planTier}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-indigo-300">{b.type}</div>
                    <div className="text-[11px] text-slate-400 max-w-xs truncate">{b.topic}</div>
                  </td>
                  <td className="p-4 font-mono text-slate-300">{b.scheduledAt}</td>
                  <td className="p-4">
                    {b.assignedTo === "Unassigned" ? (
                      <span className="text-amber-400 font-bold">⚠️ Unassigned</span>
                    ) : (
                      <span className="text-white font-medium">👨‍🏫 {b.assignedTo}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        b.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : b.status === "Confirmed"
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {b.status === "Pending Assignment" && (
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
                      {b.status === "Confirmed" && (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {activeBookingForAssign && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">Assign Expert Counsellor</h3>
            <p className="text-xs text-slate-400 mb-6">
              Student: {activeBookingForAssign.studentName} ({activeBookingForAssign.type})
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
                    <option key={c} value={c}>{c}</option>
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
