import { Navigate } from 'react-router-dom';
import { DASHBOARDS, ROLES } from '../lib/authRoles';

/**
 * Guard a portal by active session.
 * portal: 'admin' | 'vendor' | 'user'
 */
export default function PortalRoute({ portal, admin, vendor, customer, children }) {
  if (portal === 'admin') {
    if (!admin) return <Navigate to="/admin/login" replace />;
    if (admin.role !== ROLES.SUPER_ADMIN) {
      return <Navigate to="/admin/login" replace />;
    }
    return children;
  }

  if (portal === 'vendor') {
    if (!vendor) return <Navigate to="/vendor/login" replace />;
    return children;
  }

  if (portal === 'user') {
    if (!customer) return <Navigate to="/user/login" replace />;
    return children;
  }

  return <Navigate to={DASHBOARDS[ROLES.USER]} replace />;
}
