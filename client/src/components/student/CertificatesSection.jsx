import React, { useEffect, useState } from "react";
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
  purple: { colors: ["#4c1d95", "#7c3aed"], accent: "#a78bfa" },
  blue: { colors: ["#1e3a8a", "#3b82f6"], accent: "#93c5fd" },
  green: { colors: ["#064e3b", "#10b981"], accent: "#6ee7b7" },
  gold: { colors: ["#78350f", "#d97706"], accent: "#fde047" },
  dark: { colors: ["#0f172a", "#334155"], accent: "#cbd5e1" },
};

export default function Certificates() {
  const dispatch = useDispatch();
  const [copiedId, setCopiedId] = useState("");
  const [copiedLink, setCopiedLink] = useState("");
  const [downloadingCertId, setDownloadingCertId] = useState("");

  const { enrolled = [], enrolledLoading } = useSelector((s) => s.courses);

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

      const canvas = await html2canvas(element, {
        scale: 2.5, // High resolution
        useCORS: true,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${cert.course.replace(/\s+/g, "_")}_Certificate.pdf`);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    } finally {
      setDownloadingCertId("");
    }
  };

  // Derive progress & certificate availability
  const studentCourses = (enrolled ?? []).map((c) => {
    const totalLessons = c.lessons?.length ?? c.totalLessons ?? 0;
    const { progress } = getLocalProgress(c._id, totalLessons);
    return {
      ...c,
      totalLessons,
      progress,
    };
  });

  // Filter dynamic certificates: completed courses with certificates enabled
  const earnedCertificates = studentCourses
    .filter((c) => c.progress >= 100 && c.certificate?.enabled)
    .map((c) => {
      const certTitle = c.certificate?.title || "Certificate of Completion";
      const sigName = c.certificate?.signatoryName || c.instructor?.name || "Instructor";
      const sigTitle = c.certificate?.signatoryTitle || "Lead Instructor";
      const themeName = c.certificate?.theme || "purple";
      const activeTheme = themes[themeName] || themes.purple;

      return {
        id: `CERT-${c._id.slice(-6).toUpperCase()}`,
        course: c.title,
        instructor: sigName,
        instructorTitle: sigTitle,
        issuedDate: new Date(c.updatedAt || Date.now()).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        score: 100,
        category: c.category || "General",
        colors: activeTheme.colors,
        accent: activeTheme.accent,
        title: certTitle,
      };
    });

  // Filter in-progress courses (progress < 100) or completed courses where certificate is pending/disabled
  const inProgressCourses = studentCourses
    .filter((c) => c.progress < 100)
    .map((c) => ({
      title: c.title,
      progress: c.progress,
      needed: 100,
      thumb: categoryEmoji(c.category),
      id: c._id,
    }));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>Certificates</h2>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          {enrolledLoading
            ? "Loading…"
            : `${earnedCertificates.length} certificate${earnedCertificates.length !== 1 ? "s" : ""} earned · ${inProgressCourses.length} in progress`}
        </p>
      </div>

      {/* Earned */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          🏅 Earned Certificates
        </h3>

        {enrolledLoading ? (
          <div style={{ color: "#64748b", fontSize: 13 }}>Loading certificates…</div>
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
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
              No Certificates Earned Yet
            </div>
            <div style={{ fontSize: 12, maxWidth: 360, margin: "0 auto" }}>
              Complete all lessons in a course that offers a certificate to unlock and view your achievement here!
            </div>
          </div>
        ) : (
          earnedCertificates.map((cert) => (
            <div
              key={cert.id}
              id={`cert-card-${cert.id}`}
              style={{
                background: `linear-gradient(135deg, ${cert.colors[0]}, ${cert.colors[1]})`,
                borderRadius: 20,
                padding: "28px 28px",
                marginBottom: 16,
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                border: `1px solid ${cert.accent}22`,
              }}
            >
              {/* decorative circles */}
              <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
              <div style={{ position: "absolute", right: 40, bottom: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: cert.accent, letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>
                      {cert.title}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>AICoaching Platform · {cert.issuedDate}</div>
                  </div>
                  <div style={{ fontSize: 36 }}>🏅</div>
                </div>

                {/* Course name */}
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{cert.course}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                  Instructor: {cert.instructor} <span style={{ opacity: 0.6, fontSize: 11 }}>({cert.instructorTitle})</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
                  Completion Status: <span style={{ color: "#fde68a", fontWeight: 700 }}>100% Success</span>
                </div>

                {/* Credential ID */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "monospace" }}>
                    {cert.id}
                  </div>
                  <button onClick={() => copyId(cert.id)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "5px 10px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                    {copiedId === cert.id ? "Copied ✓" : "Copy ID"}
                  </button>
                </div>

                {/* Action buttons */}
                <div data-html2canvas-ignore="true" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button 
                    onClick={() => handleDownloadPDF(cert)} 
                    disabled={downloadingCertId === cert.id}
                    style={{ 
                      padding: "8px 16px", 
                      background: "#fff", 
                      color: cert.colors[0], 
                      border: "none", 
                      borderRadius: 10, 
                      fontSize: 12, 
                      fontWeight: 700, 
                      cursor: downloadingCertId === cert.id ? "not-allowed" : "pointer" 
                    }}
                  >
                    {downloadingCertId === cert.id ? "Generating PDF…" : "⬇ Download PDF"}
                  </button>
                  <button onClick={() => copyLink(cert.id)} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {copiedLink === cert.id ? "Link Copied ✓" : "🔗 Copy Link"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* In progress */}
      <div>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          ⏳ In Progress — Complete to earn
        </h3>

        {enrolledLoading ? (
          <div style={{ color: "#64748b", fontSize: 13 }}>Loading active courses…</div>
        ) : inProgressCourses.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 13, background: "#111827", border: "1px solid #1e293b", padding: 16, borderRadius: 16, textAlign: "center" }}>
            No courses currently in progress.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {inProgressCourses.map((course) => (
              <div key={course.id} style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 28, width: 44, height: 44, background: "#1e293b", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {course.thumb}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>{course.title}</div>
                  <div style={{ height: 5, background: "#1e293b", borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ height: "100%", width: `${course.progress}%`, background: "linear-gradient(90deg,#7c3aed,#06b6d4)", borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{course.progress}% complete — finish to unlock certificate</div>
                </div>
                <Link to={`/courses/${course.id}`}>
                  <button style={{ padding: "7px 14px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
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
