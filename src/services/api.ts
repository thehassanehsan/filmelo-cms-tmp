import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('filmelo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('filmelo_token');
      localStorage.removeItem('filmelo_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; full_name: string; role: string; phone?: string }) =>
    api.post('/auth/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
  me: () => api.get('/auth/me'),
  updateProfile: (data: Partial<{ full_name: string; phone: string; avatar_url: string; backup_email: string }>) =>
    api.put('/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

// Users
export const usersApi = {
  list: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getProfessionals: () => api.get('/users/professionals/list'),
  getProfessionalStats: () => api.get('/users/professional/stats'),
};

// Clients
export const clientsApi = {
  list: () => api.get('/clients'),
  create: (data: any) => api.post('/clients', data),
  get: (id: string) => api.get(`/clients/${id}`),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

// Sales
export const salesApi = {
  list: () => api.get('/sales'),
  create: (data: any) => api.post('/sales', data),
  update: (id: string, data: any) => api.put(`/sales/${id}`, data),
  delete: (id: string) => api.delete(`/sales/${id}`),
};

// Accounting
export const accountingApi = {
  list: (params?: any) => api.get('/accounting', { params }),
  create: (data: any) => api.post('/accounting', data),
  update: (id: string, data: any) => api.put(`/accounting/${id}`, data),
  delete: (id: string) => api.delete(`/accounting/${id}`),
};

// Schedule
export const scheduleApi = {
  list: (params?: any) => api.get('/schedule', { params }),
  create: (data: any) => api.post('/schedule', data),
  update: (id: string, data: any) => api.put(`/schedule/${id}`, data),
  delete: (id: string) => api.delete(`/schedule/${id}`),
};

// Tasks
export const tasksApi = {
  list: (params?: any) => api.get('/tasks', { params }),
  create: (data: any) => api.post('/tasks', data),
  get: (id: string) => api.get(`/tasks/${id}`),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  addDependency: (taskId: string, dependsOnId: string) =>
    api.post(`/tasks/${taskId}/dependencies`, { depends_on_task_id: dependsOnId }),
  removeDependency: (taskId: string, depId: string) =>
    api.delete(`/tasks/${taskId}/dependencies/${depId}`),
};

// Attendance
export const attendanceApi = {
  list: (params?: any) => api.get('/attendance', { params }),
  create: (data: any) => api.post('/attendance', data),
  update: (id: string, data: any) => api.put(`/attendance/${id}`, data),
  delete: (id: string) => api.delete(`/attendance/${id}`),
};

// Daily Reports
export const dailyReportsApi = {
  list: (params?: any) => api.get('/daily-reports', { params }),
  create: (data: any) => api.post('/daily-reports', data),
  update: (id: string, data: any) => api.put(`/daily-reports/${id}`, data),
  delete: (id: string) => api.delete(`/daily-reports/${id}`),
};

// Client Reports
export const clientReportsApi = {
  list: (params?: any) => api.get('/client-reports', { params }),
  create: (data: any) => api.post('/client-reports', data),
  get: (id: string) => api.get(`/client-reports/${id}`),
  update: (id: string, data: any) => api.put(`/client-reports/${id}`, data),
  delete: (id: string) => api.delete(`/client-reports/${id}`),
};

// Dashboard
export const dashboardApi = {
  admin: () => api.get('/dashboard/admin'),
  professional: () => api.get('/dashboard/professional'),
  client: () => api.get('/dashboard/client'),
};
