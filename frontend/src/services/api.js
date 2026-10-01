import axios from 'axios';

// Base API instance. Uses proxies defined in vite.config.js
const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Alert Hook
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // User is unauthorized (Token expired / Logged out)
      if (error.response.status === 401 && !window.location.pathname.includes('/login')) {
        localStorage.clear();
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth Endpoints ---
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
};

// --- Customer Endpoints ---
export const customerAPI = {
  getAccounts: () => api.get('/api/customer/accounts'),
  getAccountDetails: (accNum) => api.get(`/api/customer/accounts/${accNum}`),
  createAccount: (data) => api.post('/api/customer/accounts', data),
  executeTransaction: (data) => api.post('/api/customer/transactions', data),
  getTransactions: () => api.get('/api/customer/transactions'),
  getAccountTransactions: (accNum) => api.get(`/api/customer/transactions/${accNum}`),
  
  // Download pdf file statement
  downloadStatement: (accNum) => api.get(`/api/customer/accounts/${accNum}/statement`, {
    responseType: 'blob', // Critical for file downloads!
  }),
  
  getNotifications: () => api.get('/api/customer/notifications'),
  getUnreadNotifications: () => api.get('/api/customer/notifications/unread'),
  markNotificationRead: (id) => api.put(`/api/customer/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/api/customer/notifications/read-all'),
  
  // Send message to chatbot assistant
  chat: (message) => api.post('/api/customer/chat', { message }),

  // Loans
  getLoans: () => api.get('/api/customer/loans'),
  applyForLoan: (data) => api.post('/api/customer/loans', data),

  // Cards
  getCards: () => api.get('/api/customer/cards'),
  applyForCard: (data) => api.post('/api/customer/cards', data),
};

// --- Admin Endpoints ---
export const adminAPI = {
  getCustomers: () => api.get('/api/admin/customers'),
  freezeCustomer: (id) => api.put(`/api/admin/customers/${id}/freeze`),
  unfreezeCustomer: (id) => api.put(`/api/admin/customers/${id}/unfreeze`),
  
  getAccounts: () => api.get('/api/admin/accounts'),
  approveAccount: (id) => api.put(`/api/admin/accounts/${id}/approve`),
  rejectAccount: (id) => api.put(`/api/admin/accounts/${id}/reject`),
  freezeAccount: (accNum) => api.put(`/api/admin/accounts/${accNum}/freeze`),
  unfreezeAccount: (accNum) => api.put(`/api/admin/accounts/${accNum}/unfreeze`),
  
  getTransactions: () => api.get('/api/admin/transactions'),
  getFraudAlerts: () => api.get('/api/admin/fraud-alerts'),
  resolveFraudAlert: (id, status) => api.put(`/api/admin/fraud-alerts/${id}/resolve?status=${status}`),
  getAuditLogs: () => api.get('/api/admin/audit-logs'),
  getAnalytics: () => api.get('/api/admin/analytics'),

  // Loans
  getLoans: () => api.get('/api/admin/loans'),
  approveLoan: (id) => api.put(`/api/admin/loans/${id}/approve`),
  rejectLoan: (id) => api.put(`/api/admin/loans/${id}/reject`),

  // Cards
  getCards: () => api.get('/api/admin/cards'),
  approveCard: (id) => api.put(`/api/admin/cards/${id}/approve`),
  rejectCard: (id) => api.put(`/api/admin/cards/${id}/reject`),
  toggleCardLock: (id) => api.put(`/api/admin/cards/${id}/toggle-lock`),
};


export default api;
