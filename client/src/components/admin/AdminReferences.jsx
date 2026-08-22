import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Bookmark,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Tag,
  X,
  Loader2,
  AlertCircle,
  Filter,
  Sparkles,
} from "lucide-react";
import apiClient from "../../config/api";

const CATEGORY_OPTIONS = [
  "General",
  "Referral",
  "Social Media",
  "Academic",
  "Partner",
  "Campaign",
  "Walk-in",
  "Other",
];

export default function AdminReferences({ showToast }) {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "General",
    description: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch references from backend
  const fetchReferences = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await apiClient.get("/references");
      setReferences(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load references.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferences();
  }, [fetchReferences]);

  // Handle open add modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category: "General",
      description: "",
      isActive: true,
    });
    setModalError("");
    setModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      category: item.category || "General",
      description: item.description || "",
      isActive: item.isActive !== false,
    });
    setModalError("");
    setModalOpen(true);
  };

  // Save reference (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setModalError("Reference name is required.");
      return;
    }

    setSaving(true);
    setModalError("");
    try {
      if (editingItem) {
        const { data } = await apiClient.put(`/references/${editingItem._id}`, formData);
        setReferences((prev) =>
          prev.map((item) => (item._id === editingItem._id ? data : item))
        );
        showToast?.("Reference updated successfully.");
      } else {
        const { data } = await apiClient.post("/references", formData);
        setReferences((prev) => [data, ...prev]);
        showToast?.("Reference created successfully.");
      }
      setModalOpen(false);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to save reference.");
    } finally {
      setSaving(false);
    }
  };

  // Delete reference
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/references/${deleteTarget._id}`);
      setReferences((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      showToast?.("Reference deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to delete reference.");
    } finally {
      setDeleting(false);
    }
  };

  // Toggle active status directly
  const handleToggleStatus = async (item) => {
    try {
      const nextStatus = !item.isActive;
      const { data } = await apiClient.put(`/references/${item._id}`, {
        name: item.name,
        isActive: nextStatus,
      });
      setReferences((prev) =>
        prev.map((ref) => (ref._id === item._id ? data : ref))
      );
      showToast?.(`Reference marked as ${nextStatus ? "Active" : "Inactive"}.`);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to update status.");
    }
  };

  // Filtered references
  const filteredReferences = useMemo(() => {
    return references.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && item.isActive !== false) ||
        (selectedStatus === "inactive" && item.isActive === false);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [references, search, selectedCategory, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = references.length;
    const active = references.filter((r) => r.isActive !== false).length;
    const totalUsers = references.reduce((sum, r) => sum + (r.userCount || 0), 0);
    const categoriesCount = new Set(references.map((r) => r.category || "General")).size;

    return { total, active, totalUsers, categoriesCount };
  }, [references]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-900/40 p-5 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit text-xs font-extrabold uppercase tracking-wider mb-2">
              <Bookmark size={14} />
              <span>Master Data</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight mt-0.5">
              References Management
            </h1>

            <p className="text-xs md:text-sm text-slate-400 leading-relaxed mt-1 max-w-2xl">
              Manage referral & marketing lead sources selected by students and users during registration.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-indigo-600/25 whitespace-nowrap cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <Plus size={16} />
            Add Reference
          </button>
        </div>
      </div>

      {/* Stat summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-3.5 sm:p-4 flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Bookmark size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Total Items
            </span>
            <span className="text-base sm:text-lg font-black text-white">{stats.total}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-3.5 sm:p-4 flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Active Items
            </span>
            <span className="text-base sm:text-lg font-black text-white">{stats.active}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-3.5 sm:p-4 flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Linked Users
            </span>
            <span className="text-base sm:text-lg font-black text-white">{stats.totalUsers}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-3.5 sm:p-4 flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Tag size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Categories
            </span>
            <span className="text-base sm:text-lg font-black text-white">{stats.categoriesCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111827] border border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-md">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference name or category…"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 w-full sm:w-auto">
            <Filter size={12} className="text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer w-full truncate"
            >
              <option value="all" className="bg-slate-900 text-white">All Categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 w-full sm:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer w-full truncate"
            >
              <option value="all" className="bg-slate-900 text-white">All Statuses</option>
              <option value="active" className="bg-slate-900 text-white">Active Only</option>
              <option value="inactive" className="bg-slate-900 text-white">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Table / List */}
      {error && (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-4 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchReferences}
            className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-lg font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-[#111827] border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredReferences.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-slate-800 bg-[#111827]/50 text-center">
          <div className="h-12 w-12 rounded-2xl bg-indigo-950/50 border border-indigo-900/40 text-indigo-400 flex items-center justify-center mb-3">
            <Sparkles size={20} />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No References Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {search || selectedCategory !== "all" || selectedStatus !== "all"
              ? "No reference sources match your filter criteria. Try resetting search filters."
              : "No reference sources have been created yet. Click below to add your first reference."}
          </p>
          {!search && selectedCategory === "all" && selectedStatus === "all" ? (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition"
            >
              <Plus size={14} /> Add First Reference
            </button>
          ) : (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setSelectedStatus("all");
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReferences.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl border border-slate-800/80 bg-[#111827] p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-slate-700/80 shadow-xl relative overflow-hidden group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        title="Click to toggle active state"
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border cursor-pointer transition-all ${
                          item.isActive !== false
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        {item.isActive !== false ? "Active" : "Inactive"}
                      </button>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                      <Tag size={11} className="text-indigo-400" />
                      {item.category || "General"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title="Edit reference"
                      className="h-8 w-8 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-300 hover:bg-indigo-500/10 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      title="Delete reference"
                      className="h-8 w-8 rounded-xl border border-slate-800 bg-slate-900/60 text-red-400 hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 my-2.5 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Users size={13} className="text-indigo-400" />
                  <strong className="text-white font-extrabold">{item.userCount || 0}</strong> students
                </span>

                {item.createdBy?.name && (
                  <span className="truncate max-w-[140px] text-[11px] font-medium text-slate-400">
                    By {item.createdBy.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Bookmark size={16} />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingItem ? "Edit Reference Source" : "Add Reference Source"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {modalError && (
                <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-200">
                  {modalError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Reference Name <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Google Search, Newspaper, Friend Referral"
                  className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Description / Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief note on how or where this reference source is used..."
                  className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-950 border border-slate-800 p-3 mt-1">
                <div>
                  <span className="text-xs font-bold text-white block">Active Status</span>
                  <span className="text-[10px] text-slate-400">
                    Allow students to pick this reference option
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    formData.isActive ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      formData.isActive ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800/80 mt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingItem ? "Save Changes" : "Create Reference"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3 text-red-400">
              <div className="h-9 w-9 rounded-xl bg-red-950/50 border border-red-900/40 flex items-center justify-center">
                <Trash2 size={18} />
              </div>
              <h3 className="text-base font-bold text-white">Delete Reference?</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{deleteTarget.name}"</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-900 hover:bg-red-800 text-red-100 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
