import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEnrolledCourses } from "../../redux/slices/courseSlice";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const getLocalProgress = (courseId, totalLessons) => {
  if (!courseId || !totalLessons) return { progress: 0, completedLessons: 0 };
  try {
    const saved = JSON.parse(
      localStorage.getItem(`course-progress-${courseId}`) || "null",
    );
    if (!saved) return { progress: 0, completedLessons: 0 };
    const completedLessons = (saved.completed ?? []).length;
    const progress = Math.round((completedLessons / totalLessons) * 100);
    return { progress, completedLessons };
  } catch {
    return { progress: 0, completedLessons: 0 };
  }
};

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
const A4CertificateCard = ({ cert, studentName }) => {
  const t = themes[cert.theme] || themes.purple;
  const [c1, c2] = t.colors;

  return (
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
          inset: "14px",
          border: `1.5px solid ${t.accent}44`,
          borderRadius: 10,
          pointerEvents: "none",
        }}
      />

      {/* medal - top right */}
      <div
        style={{
          position: "absolute",
          top: 32,
          right: 36,
          fontSize: "clamp(22px, 3.5vw, 40px)",
          zIndex: 2,
        }}
      >
        🏅
      </div>

      {/* inner content */}
      <div
        style={{
          position: "absolute",
          inset: "28px 32px",
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
            marginBottom: 16,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 11,
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
                fontSize: 9,
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
              marginBottom: 10,
            }}
          >
            <img
              src="/Logo.png"
              alt="Umang Vision Academy logo"
              style={{
                width: 70,
                height: 70,
                borderRadius: 16,
                objectFit: "contain",
                background: "rgba(255,255,255,0.08)",
                padding: 8,
              }}
            />
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: t.accent,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontFamily: "sans-serif",
              marginBottom: 8,
            }}
          >
            {cert.title}
          </div>
          <div
            style={{
              width: "30%",
              height: 1,
              background: `linear-gradient(90deg, transparent, ${t.accent}88, transparent)`,
              margin: "0 auto 10px",
            }}
          />
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.78)",
              fontFamily: "Georgia, serif",
              marginBottom: 10,
              lineHeight: 1.7,
            }}
          >
            This is to certify that{" "}
            <strong>{studentName || "Student Name"}</strong> has exhibited
            outstanding dedication and successfully completed the course{" "}
            <strong>“{cert.course}”</strong>.
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.78)",
              fontFamily: "Georgia, serif",
              marginBottom: 10,
              lineHeight: 1.7,
            }}
          >
            Awarded on <strong>{cert.issuedDate}</strong>, this certificate
            confirms the successful completion of the program and recognizes
            excellence in learning and achievement.
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.78)",
              fontFamily: "Georgia, serif",
              marginBottom: 0,
              lineHeight: 1.7,
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
                fontSize: 8,
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
                fontSize: 9,
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
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: `2px solid ${t.accent}88`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 2px",
                fontSize: 18,
              }}
            >
              🎓
            </div>
            <div
              style={{
                fontSize: 7,
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
                fontSize: 14,
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
                width: 70,
                height: 1,
                background: `${t.accent}66`,
                marginLeft: "auto",
                marginBottom: 2,
              }}
            />
            <div
              style={{
                fontSize: 8,
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
      style={{
        background: `linear-gradient(135deg, ${c1}cc 0%, ${c2}cc 100%)`,
        border: `1px solid ${t.border}55`,
        borderRadius: 14,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
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
      <div
        style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}
      >
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
        padding: "20px",
        animation: "fadeIn 0.18s ease",
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

          <div style={{ display: "flex", gap: 10 }}>
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
    const { progress } = getLocalProgress(c._id, totalLessons);
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

  const inProgressCourses = (enrolled ?? [])
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
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>
          Certificates
        </h2>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          {enrolledLoading
            ? "Loading…"
            : `${earnedCertificates.length} certificate${earnedCertificates.length !== 1 ? "s" : ""} earned · ${inProgressCourses.length} in progress`}
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
          🏅 Earned Certificates
        </h3>

        {enrolledLoading ? (
          <div style={{ color: "#64748b", fontSize: 13 }}>
            Loading certificates…
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
              No Certificates Earned Yet
            </div>
            <div style={{ fontSize: 12, maxWidth: 360, margin: "0 auto" }}>
              Complete all lessons in a course that offers a certificate to
              unlock your achievement here!
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
          ⏳ In Progress — Complete to earn
        </h3>

        {enrolledLoading ? (
          <div style={{ color: "#64748b", fontSize: 13 }}>
            Loading active courses…
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
            No courses currently in progress.
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
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#f1f5f9",
                      marginBottom: 6,
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
                <Link to={`/courses/${course.id}`}>
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
