import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCourses,
  deleteCourse,
  clearCourseSuccess,
  clearCourseError,
} from "../../redux/slices/courseSlice"; // adjust path to match yours
import {
  StatCard,
  Card,
  SectionHeader,
  Btn,
  ProgressBar,
} from "./InstructorUi";

const InstructorCourses = ({ showToast, onNewCourse }) => {
  const dispatch = useDispatch();
  const { courses, loading, error, success } = useSelector((s) => s.courses);

  // ── Fetch on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  // ── React to success / error toasts ──────────────────────────────────────
  useEffect(() => {
    if (success) {
      showToast(success);
      dispatch(clearCourseSuccess());
    }
  }, [success, dispatch, showToast]);

  useEffect(() => {
    if (error) {
      showToast(`Error: ${error}`);
      dispatch(clearCourseError());
    }
  }, [error, dispatch, showToast]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const published = courses.filter((c) => c.status === "published").length;
  const draft = courses.filter((c) => c.status === "draft").length;
  const archived = courses.filter((c) => c.status === "archived").length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDelete = (course) => {
    if (window.confirm(`Delete "${course.title}"?`)) {
      dispatch(deleteCourse(course._id));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard label="Published" value={String(published)} color="#a78bfa" />
        <StatCard label="Draft" value={String(draft)} color="#fbbf24" />
        <StatCard label="Archived" value={String(archived)} color="#64748b" />
      </div>

      {/* Course list */}
      <Card>
        <SectionHeader
          title="All Courses"
          action={
            <Btn
              variant="primary"
              style={{ fontSize: 12 }}
              onClick={onNewCourse}
            >
              + New Course
            </Btn>
          }
        />

        {/* Loading state */}
        {loading && (
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              color: "#64748b",
              fontSize: 14,
            }}
          >
            Loading courses…
          </div>
        )}

        {/* Empty state */}
        {!loading && courses.length === 0 && (
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              color: "#64748b",
              fontSize: 14,
            }}
          >
            No courses yet.{" "}
            <span
              style={{ color: "#a78bfa", cursor: "pointer" }}
              onClick={onNewCourse}
            >
              Create your first course →
            </span>
          </div>
        )}

        {/* Course rows */}
        {!loading &&
          courses.map((c) => (
            <div
              key={c._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 0",
                borderBottom: "1px solid #1e293b",
              }}
            >
              {/* Icon / thumbnail */}
              <div
                style={{
                  width: 42,
                  height: 42,
                  background: c.bg ?? "#1e293b",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {c.icon ?? "📚"}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}
                >
                  {c.title}
                </div>
                <div
                  style={{ fontSize: 12, color: "#64748b", margin: "3px 0" }}
                >
                  {c.students ?? c.enrolledCount ?? 0} students ·{" "}
                  {c.earn ?? `$${c.revenue ?? 0}`} earned
                </div>
                <ProgressBar value={c.prog ?? c.avgCompletion ?? 0} />
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                  {c.prog ?? c.avgCompletion ?? 0}% avg completion
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background:
                      c.status === "published"
                        ? "#052e16"
                        : c.status === "draft"
                          ? "#1c1003"
                          : "#1e293b",
                    color:
                      c.status === "published"
                        ? "#4ade80"
                        : c.status === "draft"
                          ? "#fbbf24"
                          : "#64748b",
                  }}
                >
                  {c.status}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn
                    variant="ghost"
                    style={{ fontSize: 11, padding: "4px 10px" }}
                    onClick={() => showToast(`Editing: ${c.title}`)}
                  >
                    Edit
                  </Btn>
                  <Btn
                    variant="ghost"
                    style={{ fontSize: 11, padding: "4px 10px" }}
                    onClick={() => showToast("Opening analytics…")}
                  >
                    Stats
                  </Btn>
                  <Btn
                    variant="ghost"
                    style={{
                      fontSize: 11,
                      padding: "4px 10px",
                      color: "#f87171",
                    }}
                    onClick={() => handleDelete(c)}
                  >
                    Delete
                  </Btn>
                </div>
              </div>
            </div>
          ))}
      </Card>
    </>
  );
};

export default InstructorCourses;
