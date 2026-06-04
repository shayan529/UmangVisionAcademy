import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../../config/api.js";

// ── Local state (no Redux slice needed — single page load) ───────────────────
const useCourseDemo = (id) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/courses/public/${id}`)
      .then(({ data }) => {
        setCourse(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Course not found.");
        setLoading(false);
      });
  }, [id]);

  return { course, loading, error };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const levelColor = {
  Beginner: "#34d399",
  Intermediate: "#fbbf24",
  Advanced: "#f87171",
};

const fmt = (mins) => {
  if (!mins) return null;
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

const stars = (avg = 0) =>
  Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      style={{
        color: i < Math.round(avg) ? "#fbbf24" : "#334155",
        fontSize: 14,
      }}
    >
      ★
    </span>
  ));

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ w = "100%", h = 16, r = 8 }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: r,
      background: "linear-gradient(90deg,#1e293b 25%,#263348 50%,#1e293b 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }}
  />
);

// ── Video player ──────────────────────────────────────────────────────────────
const VideoPlayer = ({ url, poster }) => {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    if (!ref.current) return;
    playing ? ref.current.pause() : ref.current.play();
    setPlaying(!playing);
  };

  const onTimeUpdate = () => {
    if (!ref.current) return;
    setProgress((ref.current.currentTime / ref.current.duration) * 100 || 0);
  };

  const seek = (e) => {
    if (!ref.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    ref.current.currentTime = pct * ref.current.duration;
  };

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        background: "#000",
        aspectRatio: "16/9",
        cursor: "pointer",
      }}
      onClick={toggle}
    >
      <video
        ref={ref}
        src={url}
        poster={poster}
        muted={muted}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => setPlaying(false)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Play overlay */}
      {!playing && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: "rgba(124,58,237,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 40px rgba(124,58,237,0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            <span style={{ fontSize: 26, marginLeft: 4, color: "#fff" }}>
              ▶
            </span>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "8px 12px 10px",
          background: "linear-gradient(transparent,rgba(0,0,0,0.7))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Seek bar */}
        <div
          onClick={seek}
          style={{
            height: 4,
            background: "rgba(255,255,255,0.2)",
            borderRadius: 2,
            cursor: "pointer",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "#7c3aed",
              borderRadius: 2,
              transition: "width 0.1s",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={toggle}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 16,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <button
            onClick={() => setMuted(!muted)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 600,
            }}
          >
            DEMO PREVIEW
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CourseDemo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const { course, loading, error } = useCourseDemo(id);
  const [addedToCart, setAddedToCart] = useState(false);

  // Check if already in cart
  const cartIds = useSelector((s) => s.cart?.cartIds ?? []);
  const isInCart = cartIds.includes(id);

  const handleEnrollClick = () => {
    if (!user) {
      navigate("/login", { state: { from: `/courses/${id}/demo` } });
      return;
    }
    // Import addToCart lazily to avoid circular deps
    import("../../redux/slices/cartSlice").then(({ addToCart }) => {
      dispatch(addToCart(id));
      setAddedToCart(true);
    });
  };

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .demo-fade { animation: fadeUp 0.4s ease both; }
        .lesson-row:hover { background: #1e293b !important; }
        .enroll-btn:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#0b1120",
          color: "#f1f5f9",
          fontFamily: "'Inter','Segoe UI',sans-serif",
        }}
      >
        {/* ── Nav bar ── */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 28px",
            borderBottom: "1px solid #1e293b",
            background: "#0b1120",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ← Back
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>
            Skill<span style={{ color: "#a78bfa" }}>Sphere</span>
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            {!user && (
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "8px 18px",
                  borderRadius: 10,
                  border: "1px solid #334155",
                  background: "transparent",
                  color: "#94a3b8",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Log in
              </button>
            )}
          </div>
        </nav>

        {/* ── Error state ── */}
        {error && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 48 }}>😔</div>
            <p style={{ color: "#f87171", fontWeight: 600 }}>{error}</p>
            <button
              onClick={() => navigate("/courses")}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "#7c3aed",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Browse Courses
            </button>
          </div>
        )}

        {/* ── Main content ── */}
        {!error && (
          <div
            style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr minmax(0, 360px)",
                gap: 32,
                alignItems: "start",
              }}
              className="demo-fade"
            >
              {/* ── LEFT ── */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 28 }}
              >
                {/* Title block */}
                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <Sk w="60%" h={12} />
                    <Sk w="90%" h={36} r={10} />
                    <Sk w="70%" h={16} />
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: `${levelColor[course.level] ?? "#818cf8"}18`,
                          color: levelColor[course.level] ?? "#818cf8",
                          border: `1px solid ${levelColor[course.level] ?? "#818cf8"}30`,
                        }}
                      >
                        {course.level}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: "#1e293b",
                          color: "#94a3b8",
                        }}
                      >
                        {course.category}
                      </span>
                    </div>
                    <h1
                      style={{
                        fontSize: "clamp(24px,4vw,38px)",
                        fontWeight: 800,
                        color: "#f1f5f9",
                        lineHeight: 1.2,
                        marginBottom: 12,
                      }}
                    >
                      {course.title}
                    </h1>
                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: 15,
                        lineHeight: 1.7,
                      }}
                    >
                      {course.summary}
                    </p>

                    {/* Stats row */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 20,
                        marginTop: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex" }}>
                          {stars(course.ratingAverage)}
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#fbbf24",
                          }}
                        >
                          {course.ratingAverage?.toFixed(1) || "New"}
                        </span>
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          ({course.reviewCount ?? 0} reviews)
                        </span>
                      </div>
                      <span style={{ fontSize: 13, color: "#64748b" }}>
                        👥 {course.enrolledCount ?? 0} students
                      </span>
                      {course.lessonCount > 0 && (
                        <span style={{ fontSize: 13, color: "#64748b" }}>
                          📚 {course.lessonCount} lessons
                        </span>
                      )}
                      {course.durationHours > 0 && (
                        <span style={{ fontSize: 13, color: "#64748b" }}>
                          ⏱ {course.durationHours}h total
                        </span>
                      )}
                    </div>

                    {/* Instructor */}
                    {course.instructor && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginTop: 16,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg,#7c3aed,#06b6d4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {course.instructor.name?.charAt(0) ?? "I"}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, color: "#64748b" }}>
                            Instructor
                          </p>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#e2e8f0",
                            }}
                          >
                            {course.instructor.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Video player */}
                {loading ? (
                  <Sk
                    h={0}
                    r={20}
                    style={{ aspectRatio: "16/9", height: "auto" }}
                  />
                ) : course.demoVideoUrl ? (
                  <div>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#818cf8",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: 10,
                      }}
                    >
                      🎬 Course Preview
                    </p>
                    <VideoPlayer
                      url={course.demoVideoUrl}
                      poster={course.thumbnailUrl}
                    />
                  </div>
                ) : (
                  /* No demo video — show thumbnail or placeholder */
                  <div
                    style={{
                      borderRadius: 20,
                      overflow: "hidden",
                      aspectRatio: "16/9",
                      background: "#111827",
                      border: "1px dashed #334155",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <>
                        <span style={{ fontSize: 40 }}>🎓</span>
                        <p style={{ color: "#475569", fontSize: 13 }}>
                          No demo video yet
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Description */}
                {!loading && course.description && (
                  <div
                    style={{
                      background: "#111827",
                      border: "1px solid #1e293b",
                      borderRadius: 18,
                      padding: "22px 24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#f1f5f9",
                        marginBottom: 12,
                      }}
                    >
                      About this course
                    </h3>
                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: 14,
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {course.description}
                    </p>
                  </div>
                )}

                {/* Lesson list */}
                {!loading && course.lessons?.length > 0 && (
                  <div
                    style={{
                      background: "#111827",
                      border: "1px solid #1e293b",
                      borderRadius: 18,
                      padding: "22px 24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#f1f5f9",
                        marginBottom: 16,
                      }}
                    >
                      Course Curriculum{" "}
                      <span
                        style={{
                          color: "#64748b",
                          fontWeight: 400,
                          fontSize: 13,
                        }}
                      >
                        ({course.lessons.length} lessons)
                      </span>
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      {course.lessons.map((lesson, i) => (
                        <div
                          key={i}
                          className="lesson-row"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 12px",
                            borderRadius: 10,
                            transition: "background 0.15s",
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: "#1e293b",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#64748b",
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#e2e8f0",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {lesson.title}
                            </p>
                            {lesson.description && (
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "#64748b",
                                  marginTop: 2,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {lesson.description}
                              </p>
                            )}
                          </div>
                          {lesson.durationMinutes > 0 && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "#64748b",
                                flexShrink: 0,
                              }}
                            >
                              {fmt(lesson.durationMinutes)}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 10,
                              color: "#475569",
                              flexShrink: 0,
                            }}
                          >
                            🔒
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {!loading && course.tags?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {course.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "4px 12px",
                          borderRadius: 20,
                          background: "#1e293b",
                          color: "#64748b",
                          border: "1px solid #334155",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── RIGHT: sticky enroll card ── */}
              <div style={{ position: "sticky", top: 80 }}>
                <div
                  style={{
                    background: "#111827",
                    border: "1px solid #1e293b",
                    borderRadius: 22,
                    overflow: "hidden",
                  }}
                >
                  {/* Thumbnail */}
                  {loading ? (
                    <Sk h={200} r={0} />
                  ) : course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      style={{
                        width: "100%",
                        height: 200,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 200,
                        background: "linear-gradient(135deg,#1e1b4b,#0f172a)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 48,
                      }}
                    >
                      🎓
                    </div>
                  )}

                  <div style={{ padding: "22px 22px 26px" }}>
                    {loading ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <Sk w="50%" h={36} r={8} />
                        <Sk h={48} r={14} />
                        <Sk h={40} r={14} />
                      </div>
                    ) : (
                      <>
                        {/* Price */}
                        <div style={{ marginBottom: 20 }}>
                          <div
                            style={{
                              fontSize: 36,
                              fontWeight: 800,
                              color: "#f1f5f9",
                            }}
                          >
                            {course.price ? (
                              `$${course.price}`
                            ) : (
                              <span style={{ color: "#34d399" }}>Free</span>
                            )}
                          </div>
                          {course.price > 0 && (
                            <p
                              style={{
                                fontSize: 12,
                                color: "#64748b",
                                marginTop: 4,
                              }}
                            >
                              One-time payment · Lifetime access
                            </p>
                          )}
                        </div>

                        {/* CTA */}
                        <button
                          className="enroll-btn"
                          onClick={handleEnrollClick}
                          style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: 14,
                            border: "none",
                            background:
                              isInCart || addedToCart
                                ? "linear-gradient(135deg,#059669,#34d399)"
                                : "linear-gradient(135deg,#7c3aed,#06b6d4)",
                            color: "#fff",
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
                            marginBottom: 12,
                          }}
                        >
                          {isInCart || addedToCart
                            ? "✓ Added to Cart"
                            : user
                              ? "Add to Cart"
                              : "Enroll Now"}
                        </button>

                        {(isInCart || addedToCart) && (
                          <button
                            onClick={() => navigate("/cart")}
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: 14,
                              border: "1px solid #334155",
                              background: "transparent",
                              color: "#94a3b8",
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Go to Cart →
                          </button>
                        )}

                        {!user && (
                          <p
                            style={{
                              textAlign: "center",
                              fontSize: 12,
                              color: "#475569",
                              marginTop: 10,
                            }}
                          >
                            Already enrolled?{" "}
                            <button
                              onClick={() => navigate("/login")}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#818cf8",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              Log in
                            </button>
                          </p>
                        )}

                        {/* What you get */}
                        <div
                          style={{
                            marginTop: 20,
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          {[
                            course.lessonCount > 0 &&
                              `${course.lessonCount} lessons`,
                            course.durationHours > 0 &&
                              `${course.durationHours} hours of content`,
                            "Lifetime access",
                            "Certificate of completion",
                          ]
                            .filter(Boolean)
                            .map((item) => (
                              <div
                                key={item}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  fontSize: 13,
                                  color: "#94a3b8",
                                }}
                              >
                                <span style={{ color: "#34d399" }}>✓</span>{" "}
                                {item}
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
