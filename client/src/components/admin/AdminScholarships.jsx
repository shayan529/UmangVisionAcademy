import React, { useEffect, useState } from "react";
import {
  Award,
  Crown,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Search,
  FileText,
  DollarSign,
  Building,
} from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

const DEFAULT_NOMINATIONS = [];
const DEFAULT_DIRECTORY = [];

export default function AdminScholarships() {
  const [nominations, setNominations] = useState(DEFAULT_NOMINATIONS);
  const [directory, setDirectory] = useState(DEFAULT_DIRECTORY);
  const [activeTab, setActiveTab] = useState("nominations"); // 'nominations' | 'directory'
  const [loading, setLoading] = useState(true);

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
        if (!res.ok) throw new Error("Failed to load scholarship data");
        const payload = await res.json();
        setNominations(
          Array.isArray(payload?.data?.nominations)
            ? payload.data.nominations
            : [],
        );
        setDirectory(
          Array.isArray(payload?.data?.directory) ? payload.data.directory : [],
        );
      })
      .catch(() => {
        setNominations([]);
        setDirectory([]);
        toast.error("Could not load scholarship data from backend.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Review / Award modal
  const [activeNomForReview, setActiveNomForReview] = useState(null);
  const [awardGrantInput, setAwardGrantInput] = useState("100");

  // New Directory item form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSch, setNewSch] = useState({
    name: "",
    provider: "",
    award: "",
    category: "Merit-cum-Means",
    eligibility: "",
    deadline: "",
    link: "",
  });

  const handleGrantScholarship = async (status, pct = null) => {
    const nextNominations = nominations.map((n) =>
      n.id === activeNomForReview.id
        ? {
            ...n,
            status: status === "awarded" ? `Awarded ${pct}%` : "Rejected",
            grantPercentage: pct,
          }
        : n,
    );
    setNominations(nextNominations);

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
          data: { nominations: nextNominations, directory },
        }),
      });
      if (!res.ok) throw new Error("Failed to sync scholarship review");
      toast.success(
        `Nomination ${status === "awarded" ? `awarded with ${pct}% grant` : "rejected"}.`,
      );
    } catch {
      toast.error("Backend sync failed. Review updated locally only.");
    }
    setActiveNomForReview(null);
  };

  const handleAddDirectoryItem = async (e) => {
    e.preventDefault();
    if (!newSch.name || !newSch.provider || !newSch.award) {
      toast.error(
        "Please fill in scholarship title, provider and award amount.",
      );
      return;
    }
    const nextDirectory = [
      {
        ...newSch,
        id: `dir-${Date.now()}`,
      },
      ...directory,
    ];
    setDirectory(nextDirectory);

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
          data: { nominations, directory: nextDirectory },
        }),
      });
      if (!res.ok) throw new Error("Failed to sync directory");
      toast.success("New scholarship added to student directory!");
    } catch {
      toast.error("Directory not saved to backend.");
    }
    setShowAddModal(false);
    setNewSch({
      name: "",
      provider: "",
      award: "",
      category: "Merit-cum-Means",
      eligibility: "",
      deadline: "",
      link: "",
    });
  };

  const handleDeleteDirectoryItem = (id) => {
    setDirectory((prev) => prev.filter((d) => d.id !== id));
    toast.success("Scholarship listing removed.");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Award size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
                Higher-Study Scholarship Management Hub
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                Review Elite student scholarship nominations, evaluate financial
                justifications, grant awards, and manage the Global Scholarship
                Directory.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("nominations")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "nominations"
                  ? "bg-amber-500 text-slate-950 font-black shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Elite Nominations (
              {nominations.filter((n) => n.status === "Pending Review").length})
            </button>
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "directory"
                  ? "bg-amber-500 text-slate-950 font-black shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Directory Listings ({directory.length})
            </button>
          </div>
        </div>
      </div>

      {/* ── TAB 1: Nominations ── */}
      {activeTab === "nominations" && (
        <div className="space-y-4">
          {nominations.map((nom) => (
            <div
              key={nom.id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Crown size={16} className="text-amber-400" />
                    {nom.studentName} — {nom.selectedClass}
                  </h3>
                  <p className="text-xs text-slate-400">{nom.studentEmail}</p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    nom.status.startsWith("Awarded")
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : nom.status === "Rejected"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {nom.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">
                    Academic Score / Percentile:
                  </span>
                  <span className="text-white font-bold text-sm">
                    {nom.marks}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">
                    Target College / Program:
                  </span>
                  <span className="text-indigo-300 font-semibold">
                    {nom.targetCollege}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">
                    Household Income Tier:
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    {nom.householdIncome}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
                <strong className="text-slate-200 block mb-1">
                  Student Statement of Purpose:
                </strong>
                {nom.sop}
              </div>

              {nom.status === "Pending Review" && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setActiveNomForReview(nom)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
                  >
                    Award Scholarship Grant
                  </button>
                  <button
                    onClick={() => handleGrantScholarship("rejected")}
                    className="px-4 py-2.5 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/50 font-bold text-xs"
                  >
                    Reject Application
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Award Modal */}
          {activeNomForReview && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-1">
                  Award Higher-Study Grant
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Applicant: {activeNomForReview.studentName} (
                  {activeNomForReview.marks})
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Select Scholarship Grant Percentage
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {["25", "50", "75", "100"].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setAwardGrantInput(pct)}
                          className={`py-3 rounded-xl text-xs font-black border transition-all ${
                            awardGrantInput === pct
                              ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg"
                              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveNomForReview(null)}
                      className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleGrantScholarship("awarded", awardGrantInput)
                      }
                      className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Confirm {awardGrantInput}% Award
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Directory Management ── */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Plus size={16} /> Add New Scholarship Listing
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {directory.map((sch) => (
              <div
                key={sch.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {sch.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      Deadline: {sch.deadline}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {sch.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">{sch.provider}</p>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/40 text-xs space-y-1 mb-4">
                    <p>
                      <strong>Award:</strong>{" "}
                      <span className="text-emerald-400 font-bold">
                        {sch.award}
                      </span>
                    </p>
                    <p>
                      <strong>Eligibility:</strong> {sch.eligibility}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <a
                    href={sch.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Portal Link <ExternalLink size={12} />
                  </a>
                  <button
                    onClick={() => handleDeleteDirectoryItem(sch.id)}
                    className="p-2 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">
                  Add Scholarship to Student Directory
                </h3>

                <form
                  onSubmit={handleAddDirectoryItem}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">
                      Scholarship Title
                    </label>
                    <input
                      type="text"
                      value={newSch.name}
                      onChange={(e) =>
                        setNewSch({ ...newSch, name: e.target.value })
                      }
                      required
                      placeholder="e.g. Tata Trust Higher Education Fellowship"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-400 uppercase mb-1">
                        Provider / Foundation
                      </label>
                      <input
                        type="text"
                        value={newSch.provider}
                        onChange={(e) =>
                          setNewSch({ ...newSch, provider: e.target.value })
                        }
                        required
                        placeholder="e.g. Tata Trusts"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-400 uppercase mb-1">
                        Award Amount
                      </label>
                      <input
                        type="text"
                        value={newSch.award}
                        onChange={(e) =>
                          setNewSch({ ...newSch, award: e.target.value })
                        }
                        required
                        placeholder="e.g. Up to ₹3,00,000"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">
                      Eligibility Criteria
                    </label>
                    <input
                      type="text"
                      value={newSch.eligibility}
                      onChange={(e) =>
                        setNewSch({ ...newSch, eligibility: e.target.value })
                      }
                      placeholder="e.g. Class 12 PCM with 85%+ score"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-400 uppercase mb-1">
                        Application Deadline
                      </label>
                      <input
                        type="text"
                        value={newSch.deadline}
                        onChange={(e) =>
                          setNewSch({ ...newSch, deadline: e.target.value })
                        }
                        placeholder="e.g. 31 Oct 2026"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-400 uppercase mb-1">
                        Application URL
                      </label>
                      <input
                        type="url"
                        value={newSch.link}
                        onChange={(e) =>
                          setNewSch({ ...newSch, link: e.target.value })
                        }
                        placeholder="https://..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                    >
                      Publish Scholarship Listing
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
