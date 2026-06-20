// src/components/common/PermissionGate.jsx
//
// Wrap any action/button/section that should only render if the current
// user has a given permission. Falls back to nothing (or a custom
// `fallback`) when access is missing — never throws, never blocks render.
//
// Usage:
//   <PermissionGate module="courses" action="delete">
//     <button onClick={handleDelete}>Delete Course</button>
//   </PermissionGate>
//
//   <PermissionGate anyOf={[["payments","refund"], ["payments","export"]]}>
//     <PaymentsToolbar />
//   </PermissionGate>

import { useSelector } from "react-redux";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "../../utils/permissions";

const PermissionGate = ({
  module,
  action = "view",
  anyOf,
  allOf,
  fallback = null,
  children,
}) => {
  const { user } = useSelector((state) => state.auth);

  let allowed;
  if (anyOf) allowed = hasAnyPermission(user, anyOf);
  else if (allOf) allowed = hasAllPermissions(user, allOf);
  else allowed = hasPermission(user, module, action);

  return allowed ? children : fallback;
};

export default PermissionGate;
