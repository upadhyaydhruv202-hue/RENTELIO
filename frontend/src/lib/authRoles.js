/** Canonical app roles — User (customer), Vendor, Super Admin */
export const ROLES = {
  USER: 'user',
  VENDOR: 'vendor',
  SUPER_ADMIN: 'admin',
};

export const DASHBOARDS = {
  [ROLES.USER]: '/user/dashboard',
  [ROLES.VENDOR]: '/vendor/dashboard',
  [ROLES.SUPER_ADMIN]: '/admin/dashboard',
};

export function dashboardForRole(role) {
  return DASHBOARDS[role] || '/user/login';
}

/** Clear other portal sessions so only one role is active at a time */
export function clearOtherSessions(keep) {
  if (keep !== 'admin') {
    localStorage.removeItem('rentelio_user');
    localStorage.removeItem('rentelio_token');
  }
  if (keep !== 'user') {
    localStorage.removeItem('rentelio_customer');
    localStorage.removeItem('rentelio_customer_token');
  }
  if (keep !== 'vendor') {
    localStorage.removeItem('rentelio_vendor');
    localStorage.removeItem('rentelio_vendor_token');
  }
}
