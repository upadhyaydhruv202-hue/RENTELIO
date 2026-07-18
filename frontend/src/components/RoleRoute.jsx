import { Navigate } from 'react-router-dom';

/** Restrict a route to specific roles. */
export default function RoleRoute({ user, roles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role || 'user')) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
