import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Upload,
  Users,
} from "lucide-react";
import api from "../../config/api.js";

const ROLE_OPTIONS = [
  { value: "student", label: "Students", icon: Users },
  { value: "instructor", label: "Instructors", icon: GraduationCap },
];

export default function AdminBulkImport({ refreshUsers }) {
  const fileInputRef = useRef(null);
  const [role, setRole] = useState("student");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [importStats, setImportStats] = useState(null);

  // Holds the file + preview while awaiting admin confirmation
  const [pendingFile, setPendingFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImportClick = () => fileInputRef.current?.click();

  const resetPending = () => {
    setPendingFile(null);
    setPreview(null);
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const accepted = /\.(csv|xlsx|xls|docx|txt)$/i.test(file.name);
    if (!accepted) {
      setImportError(
        "Supported formats: CSV, Excel (.xlsx/.xls), DOCX, or TXT",
      );
      event.target.value = "";
      return;
    }

    setImporting(true);
    setImportError("");
    setImportSuccess("");
    setImportStats(null);
    resetPending();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("role", role);

    try {
      // Step 1: dry run — no ?confirm, backend returns a preview only
      const { data } = await api.post("/users/bulk-import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.preview) {
        setPendingFile(file);
        setPreview(data);
      }
    } catch (err) {
      setImportError(
        err.response?.data?.message || err.message || "Import failed.",
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingFile) return;

    setImporting(true);
    setImportError("");

    const formData = new FormData();
    formData.append("file", pendingFile);
    formData.append("role", role);

    try {
      const { data } = await api.post(
        "/users/bulk-import?confirm=true",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setImportSuccess(data.message || "Import completed successfully.");
      setImportStats({
        inserted: data.inserted || 0,
        skipped: data.skipped || 0,
        skippedRows: data.skippedRows || [],
      });
      resetPending();
      if (refreshUsers) await refreshUsers();
    } catch (err) {
      setImportError(
        err.response?.data?.message || err.message || "Import failed.",
      );
    } finally {
      setImporting(false);
    }
  };

  const handleCancelPending = () => {
    resetPending();
    setImportError("");
  };

  return (
    <div className="max-w-4xl flex flex-col gap-6 animate-fadeIn">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
          Accounts Import
        </p>
        <h2 className="text-2xl font-extrabold text-white">Bulk Data Upload</h2>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
        <p className="text-xs text-slate-400 mb-3">
          Choose the account type you want to import.
        </p>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = role === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setRole(option.value);
                  resetPending();
                }}
                disabled={!!pendingFile}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  selected
                    ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-200"
                    : "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Icon size={14} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              Upload {role === "student" ? "student" : "instructor"} data
            </p>
            <p className="text-xs text-slate-400 mt-1">
              CSV, Excel, DOCX, or TXT files are supported.
            </p>
          </div>
          <button
            type="button"
            onClick={handleImportClick}
            disabled={importing || !!pendingFile}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/20 transition disabled:opacity-60"
          >
            <Upload size={16} />
            {importing ? "Working..." : "Upload File"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.docx,.txt"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      {/* Confirmation step — shows a sample of parsed rows under the chosen role
          before anything is written to the database. */}
      {preview && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-200 mb-2">
            Confirm import: {preview.totalRows} row(s) as{" "}
            <span className="uppercase">{preview.targetRole}</span>
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 mb-3 overflow-x-auto">
            <table className="text-xs text-slate-300 w-full">
              <thead>
                <tr className="text-slate-500 text-left">
                  <th className="pr-4 py-1">Row</th>
                  <th className="pr-4 py-1">Name</th>
                  <th className="pr-4 py-1">Email</th>
                  <th className="pr-4 py-1">Phone</th>
                </tr>
              </thead>
              <tbody>
                {preview.sample.map((r) => (
                  <tr key={r.row}>
                    <td className="pr-4 py-1">{r.row}</td>
                    <td className="pr-4 py-1">{r.name || "—"}</td>
                    <td className="pr-4 py-1">{r.email || "—"}</td>
                    <td className="pr-4 py-1">{r.phoneNumber || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-amber-200/80 mb-3">
            Double-check these look like {preview.targetRole} records before
            importing.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition disabled:opacity-60"
            >
              {importing
                ? "Importing..."
                : `Confirm Import as ${preview.targetRole}`}
            </button>
            <button
              type="button"
              onClick={handleCancelPending}
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-600 transition disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-xs text-slate-300">
        <p className="font-semibold text-slate-200 mb-1">Expected columns</p>
        <p className="text-slate-400">
          Use any of: <span className="font-medium">name</span>,{" "}
          <span className="font-medium">email</span>,{" "}
          <span className="font-medium">phoneNumber</span>,{" "}
          <span className="font-medium">password</span>,{" "}
          <span className="font-medium">city</span>,{" "}
          <span className="font-medium">state</span>,{" "}
          <span className="font-medium">pincode</span>
        </p>
      </div>

      {importError && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">
          <AlertCircle size={16} className="mt-0.5 flex-none" />
          <p className="text-xs">{importError}</p>
        </div>
      )}

      {importSuccess && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
          <CheckCircle2 size={16} className="mt-0.5 flex-none" />
          <div>
            <p className="text-xs font-semibold">{importSuccess}</p>
            {importStats && (
              <p className="text-[11px] text-emerald-200/90 mt-1">
                Inserted: {importStats.inserted} · Skipped:{" "}
                {importStats.skipped}
              </p>
            )}
          </div>
        </div>
      )}

      {importStats?.skippedRows?.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
          <p className="font-semibold mb-2">Skipped rows</p>
          <ul className="space-y-1">
            {importStats.skippedRows.map((item, index) => (
              <li key={`${item.row}-${index}`}>
                Row {item.row}: {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
