import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { hasBaseRole, hasAssignedPermissions } from "../../utils/permissions";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Wait for auth check to complete
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1120",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid #1e293b",
              borderTopColor: "#7c3aed",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#64748b", fontSize: 14 }}>Loading...</p>
        </div>
        <style>
          {`@keyframes spin { to { transform: rotate(360deg); } }`}
        </style>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Every user must have a base role string
  if (!user.role && !Array.isArray(user.roles)) {
    return <Navigate to="/login" replace />;
  }

  // Determine role membership for redirect fallback
  const isAdmin = hasBaseRole(user, "admin");
  const isStaff = hasBaseRole(user, "staff");
  const isInstructor = hasBaseRole(user, "instructor");
  // A staff user who also has assigned permission-roles gets staff dashboard
  const isPermissionStaff = isStaff && hasAssignedPermissions(user);

  // Check access.
  // "staff" in allowedRoles matches any user whose role is "staff"
  // (with or without assigned permission-roles).
  const hasAccess =
    allowedRoles.length === 0 ||
    allowedRoles.some((allowedRole) => hasBaseRole(user, allowedRole));

  if (!hasAccess) {
    const fallback = isAdmin
      ? "/admin-dashboard"
      : isPermissionStaff
        ? "/staff-dashboard"
        : isInstructor
          ? "/instructor-dashboard"
          : "/student-dashboard";

    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
