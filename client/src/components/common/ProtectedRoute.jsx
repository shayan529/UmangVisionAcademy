import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { hasBaseRole, hasCustomRole } from "../../utils/permissions";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const location = useLocation();

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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user.role) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = hasBaseRole(user, "admin");
  // A user with a custom Role object is treated as "staff" for routing
  const isCustomRoleUser = hasCustomRole(user);
  const isInstructor = hasBaseRole(user, "instructor");

  // "staff" in allowedRoles grants access to both explicit staff users AND
  // users whose role is a custom Role object (they route to the staff dashboard).
  const hasAccess =
    allowedRoles.length === 0 ||
    allowedRoles.some((allowedRole) => {
      if (allowedRole === "staff") return isCustomRoleUser || hasBaseRole(user, "staff");
      return hasBaseRole(user, allowedRole);
    });

  if (!hasAccess) {
    const fallback = isAdmin
      ? "/admin-dashboard"
      : isCustomRoleUser
        ? "/staff-dashboard"
        : isInstructor
          ? "/instructor-dashboard"
          : "/student-dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
