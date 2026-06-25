import { useEffect, useMemo, useState } from "react";
import api from "../../config/api";
import { useTranslation } from "react-i18next";

const cardStyle = {
  background: "#111827",
  border: "1px solid #1e293b",
  borderRadius: 16,
  padding: 18,
};

export default function StudentReferences() {
  const { t } = useTranslation();
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState("");
  const [editingName, setEditingName] = useState("");

  const hasItems = useMemo(() => references.length > 0, [references.length]);

  const loadReferences = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/references");
      setReferences(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || t("studentReferences.failedLoad"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, []);

  const createItem = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setSaving(true);
    setError("");
    try {
      const { data } = await api.post("/references", { name: trimmed });
      setReferences((prev) => [data, ...prev]);
      setName("");
    } catch (err) {
      setError(
        err.response?.data?.message || t("studentReferences.failedCreate"),
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditingName(item.name || "");
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditingName("");
  };

  const saveEdit = async () => {
    const trimmed = editingName.trim();
    if (!editingId || !trimmed) return;

    setSaving(true);
    setError("");
    try {
      const { data } = await api.put(`/references/${editingId}`, {
        name: trimmed,
      });
      setReferences((prev) =>
        prev.map((item) => (item._id === editingId ? data : item)),
      );
      cancelEdit();
    } catch (err) {
      setError(
        err.response?.data?.message || t("studentReferences.failedUpdate"),
      );
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id) => {
    if (!window.confirm(t("studentReferences.confirmDelete"))) return;

    setSaving(true);
    setError("");
    try {
      await api.delete(`/references/${id}`);
      setReferences((prev) => prev.filter((item) => item._id !== id));
      if (editingId === id) cancelEdit();
    } catch (err) {
      setError(
        err.response?.data?.message || t("studentReferences.failedDelete"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9" }}>
          {t("studentReferences.title")}
        </h2>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          {t("studentReferences.subtitle")}
        </p>
      </div>

      <div style={cardStyle}>
        <p
          style={{
            color: "#cbd5e1",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          {t("studentReferences.create")}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("studentReferences.inputPlaceholder")}
            style={{
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 10,
              padding: "10px 12px",
              color: "#f1f5f9",
              fontSize: 13,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={createItem}
            disabled={saving || !name.trim()}
            style={{
              background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
              border: "none",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#fff",
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {t("studentReferences.add")}
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <p
          style={{
            color: "#cbd5e1",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          {t("studentReferences.list")}
        </p>

        {error && (
          <div
            style={{
              marginBottom: 10,
              color: "#fca5a5",
              background: "rgba(127,29,29,.25)",
              border: "1px solid rgba(248,113,113,.2)",
              borderRadius: 10,
              padding: "8px 10px",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: "#64748b", fontSize: 13 }}>
            {t("studentReferences.loading")}
          </p>
        ) : !hasItems ? (
          <p style={{ color: "#64748b", fontSize: 13 }}>
            {t("studentReferences.empty")}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {references.map((item) => (
              <div
                key={item._id}
                style={{
                  border: "1px solid #1e293b",
                  borderRadius: 12,
                  padding: 10,
                  background: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {editingId === item._id ? (
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    style={{
                      flex: 1,
                      background: "#111827",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      padding: "8px 10px",
                      color: "#f1f5f9",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                ) : (
                  <span style={{ flex: 1, color: "#e2e8f0", fontSize: 13 }}>
                    {item.name}
                  </span>
                )}

                {editingId === item._id ? (
                  <>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={saving || !editingName.trim()}
                      style={{
                        background: "#065f46",
                        border: "none",
                        borderRadius: 8,
                        padding: "7px 10px",
                        color: "#d1fae5",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: saving ? "not-allowed" : "pointer",
                      }}
                    >
                      {t("studentReferences.save")}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                      style={{
                        background: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: 8,
                        padding: "7px 10px",
                        color: "#cbd5e1",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: saving ? "not-allowed" : "pointer",
                      }}
                    >
                      {t("studentReferences.cancel")}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      disabled={saving}
                      style={{
                        background: "#312e81",
                        border: "none",
                        borderRadius: 8,
                        padding: "7px 10px",
                        color: "#c7d2fe",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: saving ? "not-allowed" : "pointer",
                      }}
                    >
                      {t("studentReferences.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item._id)}
                      disabled={saving}
                      style={{
                        background: "#7f1d1d",
                        border: "none",
                        borderRadius: 8,
                        padding: "7px 10px",
                        color: "#fecaca",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: saving ? "not-allowed" : "pointer",
                      }}
                    >
                      {t("studentReferences.delete")}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
