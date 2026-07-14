import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getCustomRoles, hasBaseRole } from "../../utils/permissions";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  const location = useLocation();

  // Wait for auth check to finish
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
          {`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // A custom role (e.g. "HR Manager", "Payroll Admin") is detected by
  // PRESENCE of an embedded role object in user.roles — not by whether any
  // of its granted permissions happen to be non-empty. This must stay in
  // sync with the same check in Login.jsx's post-login redirect, or a
  // custom-role user can end up bounced to a different dashboard by the
  // route guard than the one they were sent to right after logging in.
  const isAdmin = hasBaseRole(user, "admin");
  const isCustomRoleUser = !isAdmin && getCustomRoles(user).length > 0;

  // Base role strings only (filters out embedded custom-role objects).
  const baseRoles = (user?.roles || []).filter(
    (role) => typeof role === "string",
  );

  // User has no role of any kind — neither a base role string nor a
  // custom role object. Nothing to grant access with.
  if (baseRoles.length === 0 && !isCustomRoleUser) {
    return <Navigate to="/login" replace />;
  }

  // Check access.
  // A custom-role user (who isn't also a base admin) is restricted to the
  // "staff" route ONLY — even if their account also carries a base role
  // string like "student" or "instructor" from how the account was
  // originally created. Without this, a custom-role user would pass the
  // base-role check below and be allowed onto /student-dashboard or
  // /instructor-dashboard directly, bypassing the staff panel entirely.
  const hasAccess =
    allowedRoles.length === 0 ||
    allowedRoles.some(
      (allowedRole) =>
        allowedRole === "staff"
          ? isCustomRoleUser
          : hasBaseRole(user, allowedRole),
    );

  if (!hasAccess) {
    const fallback = isAdmin
      ? "/admin-dashboard"
      : isCustomRoleUser
        ? "/staff-dashboard"
        : hasBaseRole(user, "instructor")
          ? "/instructor-dashboard"
          : "/student-dashboard";

    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
