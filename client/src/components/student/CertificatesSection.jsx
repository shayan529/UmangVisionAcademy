import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEnrolledCourses } from "../../redux/slices/courseSlice";
import { loadCurrentUser } from "../../redux/slices/authSlice";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useTranslation } from "react-i18next";

// Progress is derived from server-side `user.courseProgress` on the client.

const categoryEmoji = (category = "") => {
  const map = {
    ai: "🤖",
    ml: "🧠",
    design: "🎨",
    web: "💻",
    data: "📊",
    business: "📈",
    marketing: "📣",
  };
  return map[category.toLowerCase()] ?? "📚";
};

const themes = {
  purple: {
    colors: ["#3b0764", "#6d28d9"],
    accent: "#c4b5fd",
    border: "#7c3aed",
  },
  blue: {
    colors: ["#1e3a8a", "#1d4ed8"],
    accent: "#bfdbfe",
    border: "#3b82f6",
  },
  green: {
    colors: ["#052e16", "#166534"],
    accent: "#bbf7d0",
    border: "#16a34a",
  },
  gold: {
    colors: ["#451a03", "#b45309"],
    accent: "#fef08a",
    border: "#d97706",
  },
  dark: {
    colors: ["#0f172a", "#1e293b"],
    accent: "#e2e8f0",
    border: "#475569",
  },
};

// ── A4CertificateCard ─────────────────────────────────────────────────────────
// Wrapped in a container-query context (containerType: "inline-size") so all
// font sizes below use `cqw` (percent of THIS element's own width) instead of
// vw/viewport units. That means: on a narrow phone the rendered card shrinks
// and its text shrinks proportionally with it, while the hidden off-screen
// copy used for PDF generation (still rendered at a fixed 860px) keeps its
// full-size text — so PDF output quality is unaffected by mobile scaling.
const A4CertificateCard = ({ cert, studentName }) => {
  const t = themes[cert.theme] || themes.purple;
  const [c1, c2] = t.colors;

  return (
    <div style={{ containerType: "inline-size" }}>
      <div
        id={`cert-card-${cert.id}`}
        style={{
          width: "100%",
          aspectRatio: "297 / 210",
          background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
          borderRadius: 16,
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          boxSizing: "border-box",
          border: `2px solid ${t.border}55`,
          boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
        }}
      >
        {/* decorative rings */}
        <div
          style={{
            position: "absolute",
            right: -80,
            top: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.06)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -60,
            bottom: -60,
            width: 280,
            height: 280,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.07)",
            pointerEvents: "none",
          }}
        />

        {/* outer border frame */}
        <div
          style={{
            position: "absolute",
            inset: "1.6cqw",
            border: `1.5px solid ${t.accent}44`,
            borderRadius: 10,
            pointerEvents: "none",
          }}
        />

        {/* medal - top right */}
        <div
          style={{
            position: "absolute",
            top: "3.7cqw",
            right: "4.2cqw",
            fontSize: "clamp(16px, 4.5cqw, 40px)",
            zIndex: 2,
          }}
        >
          🏅
        </div>

        {/* inner content */}
        <div
          style={{
            position: "absolute",
            inset: "3.2cqw 3.7cqw",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            zIndex: 1,
          }}
        >
          {/* TOP */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "1.8cqw",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "clamp(8px, 1.3cqw, 12px)",
                  fontWeight: 800,
                  color: t.accent,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  fontFamily: "sans-serif",
                  marginBottom: 2,
                }}
              >
                Umang Vision Academy
              </div>
              <div
                style={{
                  fontSize: "clamp(6px, 1cqw, 9px)",
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                Verify ID: {cert.id} · Issued: {cert.issuedDate}
              </div>
            </div>
          </div>

          {/* MIDDLE */}
          <div style={{ textAlign: "center", padding: "0 4%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "1.2cqw",
              }}
            >
              <img
                src="/Logo.png"
                alt="Umang Vision Academy logo"
                style={{
                  width: "clamp(36px, 8cqw, 70px)",
                  height: "clamp(36px, 8cqw, 70px)",
                  borderRadius: 16,
                  objectFit: "contain",
                  background: "rgba(255,255,255,0.08)",
                  padding: "clamp(4px, 0.9cqw, 8px)",
                }}
              />
            </div>
            <div
              style={{
                fontSize: "clamp(9px, 1.4cqw, 12px)",
                fontWeight: 700,
                color: t.accent,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                fontFamily: "sans-serif",
                marginBottom: "0.9cqw",
              }}
            >
              {cert.title}
            </div>
            <div
              style={{
                width: "30%",
                height: 1,
                background: `linear-gradient(90deg, transparent, ${t.accent}88, transparent)`,
                margin: "0 auto 1.2cqw",
              }}
            />
            <div
              style={{
                fontSize: "clamp(9px, 1.5cqw, 13px)",
                color: "rgba(255,255,255,0.78)",
                fontFamily: "Georgia, serif",
                marginBottom: "1.2cqw",
                lineHeight: 1.6,
              }}
            >
              This is to certify that{" "}
              <strong>{studentName || "Student Name"}</strong> has exhibited
              outstanding dedication and successfully completed the course{" "}
              <strong>“{cert.course}”</strong>.
            </div>
            <div
              style={{
                fontSize: "clamp(9px, 1.5cqw, 13px)",
                color: "rgba(255,255,255,0.78)",
                fontFamily: "Georgia, serif",
                marginBottom: "1.2cqw",
                lineHeight: 1.6,
              }}
            >
              Awarded on <strong>{cert.issuedDate}</strong>, this certificate
              confirms the successful completion of the program and recognizes
              excellence in learning and achievement.
            </div>
            <div
              style={{
                fontSize: "clamp(9px, 1.5cqw, 13px)",
                color: "rgba(255,255,255,0.78)",
                fontFamily: "Georgia, serif",
                marginBottom: 0,
                lineHeight: 1.6,
              }}
            >
              Presented by Umang Vision Academy as an official record of
              accomplishment for the student’s hard work and growth.
            </div>
          </div>

          {/* BOTTOM */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderTop: "1px solid rgba(255,255,255,0.12)",
              paddingTop: "1.2%",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "clamp(6px, 0.9cqw, 8px)",
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "sans-serif",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                Credential ID
              </div>
              <div
                style={{
                  fontSize: "clamp(7px, 1cqw, 9px)",
                  color: t.accent,
                  fontFamily: "monospace",
                  fontWeight: 700,
                }}
              >
                {cert.id}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "clamp(26px, 5cqw, 44px)",
                  height: "clamp(26px, 5cqw, 44px)",
                  borderRadius: "50%",
                  border: `2px solid ${t.accent}88`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 2px",
                  fontSize: "clamp(11px, 2cqw, 18px)",
                }}
              >
                🎓
              </div>
              <div
                style={{
                  fontSize: "clamp(5px, 0.8cqw, 7px)",
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "sans-serif",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Official Seal
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "clamp(10px, 1.6cqw, 14px)",
                  fontFamily: "Georgia, serif",
                  fontStyle: "italic",
                  color: t.accent,
                  marginBottom: 2,
                  opacity: 0.9,
                }}
              >
                {cert.instructor}
              </div>
              <div
                style={{
                  width: "clamp(40px, 8cqw, 70px)",
                  height: 1,
                  background: `${t.accent}66`,
                  marginLeft: "auto",
                  marginBottom: 2,
                }}
              />
              <div
                style={{
                  fontSize: "clamp(6px, 0.9cqw, 8px)",
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                {cert.instructorTitle}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Collapsed Certificate Row ─────────────────────────────────────────────────
const CertificateRow = ({
  cert,
  studentName,
  onView,
  onCopyId,
  onCopyLink,
  onDownload,
  copiedId,
  copiedLink,
  downloadingCertId,
}) => {
  const t = themes[cert.theme] || themes.purple;
  const [c1, c2] = t.colors;

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-xl"
      style={{
        background: `linear-gradient(135deg, ${c1}cc 0%, ${c2}cc 100%)`,
        border: `1px solid ${t.border}55`,
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* Medal icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "rgba(255,255,255,0.1)",
          border: `1px solid ${t.accent}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        🏅
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 3,
          }}
        >
          {cert.course}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: t.accent,
              fontFamily: "monospace",
              background: "rgba(0,0,0,0.25)",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            {cert.id}
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            {cert.issuedDate}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto mt-2 sm:mt-0">
        <button
          onClick={() => onView(cert)}
          style={{
            padding: "7px 14px",
            background: "rgba(255,255,255,0.12)",
            border: `1px solid ${t.accent}55`,
            borderRadius: 9,
            color: t.accent,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
          }
        >
          👁 View Certificate
        </button>

        <button
          onClick={() => onCopyId(cert.id)}
          title="Copy credential ID"
          style={{
            padding: "7px 10px",
            background: "rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 9,
            color: "rgba(255,255,255,0.7)",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {copiedId === cert.id ? "✓" : "Copy ID"}
        </button>

        <button
          onClick={() => onDownload(cert)}
          disabled={downloadingCertId === cert.id}
          title="Download PDF"
          style={{
            padding: "7px 10px",
            background:
              downloadingCertId === cert.id
                ? "rgba(124,58,237,0.3)"
                : "linear-gradient(135deg,#7c3aed,#06b6d4)",
            border: "none",
            borderRadius: 9,
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            cursor: downloadingCertId === cert.id ? "not-allowed" : "pointer",
            opacity: downloadingCertId === cert.id ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {downloadingCertId === cert.id ? "…" : "⬇ PDF"}
        </button>
      </div>
    </div>
  );
};

// ── Certificate Modal ─────────────────────────────────────────────────────────
const CertificateModal = ({
  cert,
  studentName,
  onClose,
  onCopyId,
  onCopyLink,
  onDownload,
  copiedId,
  copiedLink,
  downloadingCertId,
}) => {
  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(10px, 4vw, 20px)",
        animation: "fadeIn 0.18s ease",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 860,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Close button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              padding: "6px 14px",
              cursor: "pointer",
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Certificate */}
        <A4CertificateCard cert={cert} studentName={studentName} />

        {/* Action bar */}
        <div
          data-html2canvas-ignore="true"
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: "#1e293b",
                borderRadius: 8,
                padding: "5px 12px",
                fontSize: 12,
                color: "#94a3b8",
                fontFamily: "monospace",
              }}
            >
              {cert.id}
            </div>
            <button
              onClick={() => onCopyId(cert.id)}
              style={{
                background: "#1e293b",
                border: "none",
                borderRadius: 8,
                padding: "5px 10px",
                color: "#e2e8f0",
                fontSize: 11,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {copiedId === cert.id ? "Copied ✓" : "Copy ID"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => onDownload(cert)}
              disabled={downloadingCertId === cert.id}
              style={{
                padding: "8px 18px",
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                cursor:
                  downloadingCertId === cert.id ? "not-allowed" : "pointer",
                opacity: downloadingCertId === cert.id ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {downloadingCertId === cert.id ? "Generating…" : "⬇ Download PDF"}
            </button>
            <button
              onClick={() => onCopyLink(cert.id)}
              style={{
                padding: "8px 16px",
                background: "#1e293b",
                color: "#e2e8f0",
                border: "1px solid #334155",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {copiedLink === cert.id ? "Link Copied ✓" : "🔗 Copy Link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Certificates page ────────────────────────────────────────────────────
export default function Certificates() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [copiedId, setCopiedId] = useState("");
  const [copiedLink, setCopiedLink] = useState("");
  const [downloadingCertId, setDownloadingCertId] = useState("");
  const [viewingCert, setViewingCert] = useState(null);

  const { enrolled = [], enrolledLoading } = useSelector((s) => s.courses);
  const studentName = useSelector(
    (s) => s.auth?.user?.name || s.user?.name || "Student",
  );
  const user = useSelector((s) => s.auth?.user);

  useEffect(() => {
    // Fetch fresh user data (including newly earned certificates) and enrolled courses
    dispatch(loadCurrentUser({ force: true }));
    dispatch(fetchEnrolledCourses());
  }, [dispatch]);

  const copyId = (id) => {
    navigator.clipboard.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const copyLink = (id) => {
    const link = `${window.location.origin}/certificates/verify/${id}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(""), 2000);
  };

  const handleDownloadPDF = async (cert) => {
    setDownloadingCertId(cert.id);
    try {
      const element = document.getElementById(`cert-card-${cert.id}`);
      if (!element) return;
      const A4_W = 1754;
      const canvas = await html2canvas(element, {
        scale: A4_W / element.offsetWidth,
        useCORS: true,
        backgroundColor: null,
        width: element.offsetWidth,
        height: element.offsetHeight,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
      pdf.save(`${cert.course.replace(/\s+/g, "_")}_Certificate.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloadingCertId("");
    }
  };

  const studentCourses = (enrolled ?? []).map((c) => {
    const totalLessons = c.lessons?.length ?? c.totalLessons ?? 0;
    
    if (typeof c.progress === "number") {
      return { ...c, totalLessons, progress: c.progress };
    }

    const progObj = user?.courseProgress?.[c._id] || null;
    const completedLessons = progObj ? (progObj.completed || []).length : 0;
    const progress = progObj
      ? Math.round((completedLessons / Math.max(1, totalLessons)) * 100)
      : 0;
    return { ...c, totalLessons, progress };
  });

  const earnedCertificates = (user?.earnedCertificates ?? []).map((c) => ({
    id: `CERT-${c.courseId.toString().slice(-6).toUpperCase()}`,
    course: c.courseTitle,
    instructor: c.signatoryName || c.instructorName || "Instructor",
    instructorTitle: c.signatoryTitle || "Lead Instructor",
    issuedDate: new Date(c.issuedAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    theme: c.theme || "purple",
    title: c.certificateTitle || "Certificate of Completion",
  }));

  // For in-progress, still use enrolled courses but derive progress from quizSubmissions
  const earnedCourseIds = new Set(
    (user?.earnedCertificates ?? []).map((c) => c.courseId.toString()),
  );

  const inProgressCourses = studentCourses
    .filter(
      (c) => !earnedCourseIds.has(c._id?.toString()) && c.certificate?.enabled,
    )
    .map((c) => ({
      title: c.title,
      progress: c.progress ?? 0,
      thumb: categoryEmoji(c.category),
      id: c._id,
    }));

  return (
    <div>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* Modal */}
      {viewingCert && (
        <CertificateModal
          cert={viewingCert}
          studentName={studentName}
          onClose={() => setViewingCert(null)}
          onCopyId={copyId}
          onCopyLink={copyLink}
          onDownload={handleDownloadPDF}
          copiedId={copiedId}
          copiedLink={copiedLink}
          downloadingCertId={downloadingCertId}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: "clamp(20px, 5vw, 26px)",
            fontWeight: 800,
            color: "#f1f5f9",
          }}
        >
          {t("studentCertificates.title")}
        </h2>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          {enrolledLoading
            ? t("studentCertificates.loading")
            : t("studentCertificates.summary", {
                earned: earnedCertificates.length,
                progress: inProgressCourses.length,
              })}
        </p>
      </div>

      {/* Earned */}
      <div style={{ marginBottom: 32 }}>
        <h3
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#94a3b8",
            marginBottom: 14,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          🏅 {t("studentCertificates.earned")}
        </h3>

        {enrolledLoading ? (
          <div style={{ color: "#64748b", fontSize: 13 }}>
            {t("studentCertificates.loadingCertificates")}
          </div>
        ) : earnedCertificates.length === 0 ? (
          <div
            style={{
              background: "#111827",
              border: "1px dashed #334155",
              borderRadius: 20,
              padding: "40px 20px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎓</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#e2e8f0",
                marginBottom: 4,
              }}
            >
              {t("studentCertificates.noneEarnedTitle")}
            </div>
            <div style={{ fontSize: 12, maxWidth: 360, margin: "0 auto" }}>
              {t("studentCertificates.noneEarnedDesc")}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {earnedCertificates.map((cert) => (
              <CertificateRow
                key={cert.id}
                cert={cert}
                studentName={studentName}
                onView={setViewingCert}
                onCopyId={copyId}
                onCopyLink={copyLink}
                onDownload={handleDownloadPDF}
                copiedId={copiedId}
                copiedLink={copiedLink}
                downloadingCertId={downloadingCertId}
              />
            ))}
          </div>
        )}
      </div>

      {/* In progress */}
      <div>
        <h3
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#94a3b8",
            marginBottom: 14,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          ⏳ {t("studentCertificates.inProgress")}
        </h3>

        {enrolledLoading ? (
          <div style={{ color: "#64748b", fontSize: 13 }}>
            {t("studentCertificates.loadingActive")}
          </div>
        ) : inProgressCourses.length === 0 ? (
          <div
            style={{
              color: "#64748b",
              fontSize: 13,
              background: "#111827",
              border: "1px solid #1e293b",
              padding: 16,
              borderRadius: 16,
              textAlign: "center",
            }}
          >
            {t("studentCertificates.noProgress")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {inProgressCourses.map((course) => (
              <div
                key={course.id}
                style={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: 16,
                  padding: "16px 18px",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    width: 44,
                    height: 44,
                    background: "#1e293b",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {course.thumb}
                </div>
                <div style={{ flex: "1 1 160px", minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#f1f5f9",
                      marginBottom: 6,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {course.title}
                  </div>
                  <div
                    style={{
                      height: 5,
                      background: "#1e293b",
                      borderRadius: 3,
                      overflow: "hidden",
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${course.progress}%`,
                        background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {course.progress}% complete — finish to unlock certificate
                  </div>
                </div>
                <Link to={`/courses/${course.id}`} style={{ flexShrink: 0 }}>
                  <button
                    style={{
                      padding: "7px 14px",
                      background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                      border: "none",
                      borderRadius: 10,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Continue →
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        style={{
          position: "fixed",
          left: -9999,
          top: -9999,
          width: 860,
          pointerEvents: "none",
          opacity: 0,
          zIndex: -1,
        }}
      >
        {earnedCertificates.map((cert) => (
          <A4CertificateCard
            key={cert.id}
            cert={cert}
            studentName={studentName}
          />
        ))}
      </div>
    </div>
  );
}
