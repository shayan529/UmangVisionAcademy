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
// A4 ratio = 297:210 landscape = ~1.414:1  →  width:height ≈ 794:562 (96dpi)
const A4CertificateCard = ({ cert, studentName }) => {
  const t = themes[cert.theme] || themes.purple;
  const [c1, c2] = t.colors;

  return (
    <div
      id={`cert-card-${cert.id}`}
      style={{
        width: "100%",
        aspectRatio: "297 / 210", // A4 landscape ratio
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
      {/* ── decorative background rings ── */}
      <div
        style={{
          position: "absolute",
          right: -80,
          top: -80,
          width: 320,
          height: 320,
          borderRadius: "50%",
          border: `1px solid rgba(255,255,255,0.08)`,
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
          border: `1px solid rgba(255,255,255,0.06)`,
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
          border: `1px solid rgba(255,255,255,0.07)`,
          pointerEvents: "none",
        }}
      />

      {/* ── outer gold border frame ── */}
      <div
        style={{
          position: "absolute",
          inset: "14px",
          border: `1.5px solid ${t.accent}44`,
          borderRadius: 10,
          pointerEvents: "none",
        }}
      />

      {/* ── inner content ── */}
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
        {/* TOP: platform + badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "clamp(7px, 1.1vw, 11px)",
                fontWeight: 800,
                color: t.accent,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontFamily: "sans-serif",
                marginBottom: 2,
              }}
            >
              AICoaching Platform
            </div>
            <div
              style={{
                fontSize: "clamp(6px, 0.9vw, 9px)",
                color: "rgba(255,255,255,0.45)",
                fontFamily: "sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              Verify ID: {cert.id} · Issued: {cert.issuedDate}
            </div>
          </div>
          <div style={{ fontSize: "clamp(22px, 3.5vw, 40px)" }}>🏅</div>
        </div>

        {/* MIDDLE: main certificate body */}
        <div style={{ textAlign: "center", padding: "0 4%" }}>
          {/* certificate of completion label */}
          <div
            style={{
              fontSize: "clamp(8px, 1.2vw, 12px)",
              fontWeight: 700,
              color: t.accent,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontFamily: "sans-serif",
              marginBottom: "1.5%",
            }}
          >
            {cert.title}
          </div>

          {/* decorative line */}
          <div
            style={{
              width: "30%",
              height: 1,
              background: `linear-gradient(90deg, transparent, ${t.accent}88, transparent)`,
              margin: "0 auto 2%",
            }}
          />

          {/* "This is to certify that" */}
          <div
            style={{
              fontSize: "clamp(7px, 1vw, 10px)",
              color: "rgba(255,255,255,0.65)",
              fontStyle: "italic",
              fontFamily: "Georgia, serif",
              marginBottom: "1%",
            }}
          >
            This is to certify that
          </div>

          {/* STUDENT NAME */}
          <div
            style={{
              fontSize: "clamp(18px, 3.2vw, 36px)",
              fontWeight: 700,
              color: "#ffffff",
              fontFamily: "Georgia, serif",
              letterSpacing: "0.03em",
              lineHeight: 1.1,
              marginBottom: "1%",
              textShadow: `0 2px 12px ${t.accent}44`,
            }}
          >
            {studentName || "Student Name"}
          </div>

          {/* "has successfully completed" */}
          <div
            style={{
              fontSize: "clamp(7px, 1vw, 10px)",
              color: "rgba(255,255,255,0.65)",
              fontStyle: "italic",
              fontFamily: "Georgia, serif",
              marginBottom: "1.5%",
            }}
          >
            has successfully completed the course
          </div>

          {/* COURSE TITLE */}
          <div
            style={{
              fontSize: "clamp(11px, 1.8vw, 20px)",
              fontWeight: 800,
              color: t.accent,
              fontFamily: "sans-serif",
              letterSpacing: "0.02em",
              lineHeight: 1.2,
              marginBottom: "1.5%",
            }}
          >
            {cert.course}
          </div>

          {/* "on this date" */}
          <div
            style={{
              fontSize: "clamp(6px, 0.9vw, 9px)",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "sans-serif",
            }}
          >
            on {cert.issuedDate}
          </div>
        </div>

        {/* BOTTOM: signatory */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: `1px solid rgba(255,255,255,0.12)`,
            paddingTop: "1.2%",
          }}
        >
          {/* left: credential */}
          <div>
            <div
              style={{
                fontSize: "clamp(6px, 0.85vw, 8px)",
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
                fontSize: "clamp(6px, 0.9vw, 9px)",
                color: t.accent,
                fontFamily: "monospace",
                fontWeight: 700,
              }}
            >
              {cert.id}
            </div>
          </div>

          {/* center: platform seal */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "clamp(28px, 4vw, 44px)",
                height: "clamp(28px, 4vw, 44px)",
                borderRadius: "50%",
                border: `2px solid ${t.accent}88`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 2px",
                fontSize: "clamp(12px, 2vw, 20px)",
              }}
            >
              🎓
            </div>
            <div
              style={{
                fontSize: "clamp(5px, 0.7vw, 7px)",
                color: "rgba(255,255,255,0.4)",
                fontFamily: "sans-serif",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Official Seal
            </div>
          </div>

          {/* right: signatory */}
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "clamp(9px, 1.4vw, 14px)",
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
                width: "clamp(40px, 6vw, 70px)",
                height: 1,
                background: `${t.accent}66`,
                marginLeft: "auto",
                marginBottom: 2,
              }}
            />
            <div
              style={{
                fontSize: "clamp(6px, 0.85vw, 8px)",
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

// ── Main Certificates page ────────────────────────────────────────────────────
export default function Certificates() {
  const dispatch = useDispatch();
  const [copiedId, setCopiedId] = useState("");
  const [copiedLink, setCopiedLink] = useState("");
  const [downloadingCertId, setDownloadingCertId] = useState("");

  const { enrolled = [], enrolledLoading } = useSelector((s) => s.courses);
  // Grab student name from auth state — adjust selector to match your store
  const studentName = useSelector(
    (s) => s.auth?.user?.name || s.user?.name || "Student",
  );

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

      // A4 landscape at 150dpi: 1754 × 1240 px
      const A4_W = 1754;
      const A4_H = 1240;

      const canvas = await html2canvas(element, {
        scale: A4_W / element.offsetWidth,
        useCORS: true,
        backgroundColor: null,
        width: element.offsetWidth,
        height: element.offsetHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      // jsPDF in mm: A4 landscape = 297 × 210
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

  const earnedCertificates = studentCourses
    .filter((c) => c.progress >= 100 && c.certificate?.enabled)
    .map((c) => ({
      id: `CERT-${c._id.slice(-6).toUpperCase()}`,
      course: c.title,
      instructor:
        c.certificate?.signatoryName || c.instructor?.name || "Instructor",
      instructorTitle: c.certificate?.signatoryTitle || "Lead Instructor",
      issuedDate: new Date(c.updatedAt || Date.now()).toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        },
      ),
      theme: c.certificate?.theme || "purple",
      title: c.certificate?.title || "Certificate of Completion",
    }));

  const inProgressCourses = studentCourses
    .filter((c) => c.progress < 100)
    .map((c) => ({
      title: c.title,
      progress: c.progress,
      thumb: categoryEmoji(c.category),
      id: c._id,
    }));

  return (
    <div>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

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
          earnedCertificates.map((cert) => {
            const t = themes[cert.theme] || themes.purple;
            return (
              <div
                key={cert.id}
                style={{ marginBottom: 24, animation: "fadeIn 0.3s ease" }}
              >
                {/* A4 certificate card */}
                <A4CertificateCard cert={cert} studentName={studentName} />

                {/* Action bar below card */}
                <div
                  data-html2canvas-ignore="true"
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
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
                      onClick={() => copyId(cert.id)}
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
                      onClick={() => handleDownloadPDF(cert)}
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
                          downloadingCertId === cert.id
                            ? "not-allowed"
                            : "pointer",
                        opacity: downloadingCertId === cert.id ? 0.6 : 1,
                      }}
                    >
                      {downloadingCertId === cert.id
                        ? "Generating…"
                        : "⬇ Download PDF"}
                    </button>
                    <button
                      onClick={() => copyLink(cert.id)}
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
                      {copiedLink === cert.id
                        ? "Link Copied ✓"
                        : "🔗 Copy Link"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
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
    </div>
  );
}
