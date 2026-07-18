const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}, { auth = false } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (auth) {
    const token = localStorage.getItem('rentelio_customer_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

/** Admin / staff APIs */
export const api = {
  login: (email, password) =>
    request('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getDashboard: () => request('/dashboard'),
  getProducts: () => request('/products'),
  createProduct: (payload) =>
    request('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  getRentals: () => request('/rentals'),
  createRental: (payload) =>
    request('/rentals', { method: 'POST', body: JSON.stringify(payload) }),
  updateRental: (id, payload) =>
    request(`/rentals/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getPendingReturns: () => request('/rentals/returns/pending'),
  getDeposits: () => request('/rentals/deposits/all'),
  updateDeposit: (id, status) =>
    request(`/rentals/deposits/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

/** Customer storefront APIs */
export const userApi = {
  register: (payload) =>
    request('/user/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (email, password) =>
    request('/user/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getDashboard: () => request('/user/dashboard', {}, { auth: true }),
  getProfile: () => request('/user/profile', {}, { auth: true }),
  updateProfile: (payload) =>
    request('/user/profile', { method: 'PUT', body: JSON.stringify(payload) }, { auth: true }),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v != null)
    ).toString();
    return request(`/user/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (id) => request(`/user/products/${id}`),

  createRental: (payload) =>
    request('/user/rentals', { method: 'POST', body: JSON.stringify(payload) }, { auth: true }),
  getRentals: () => request('/user/rentals', {}, { auth: true }),
  getRental: (id) => request(`/user/rentals/${id}`, {}, { auth: true }),
  cancelRental: (id) =>
    request(`/user/rentals/${id}/cancel`, { method: 'PUT' }, { auth: true }),
};

export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0);

export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');
