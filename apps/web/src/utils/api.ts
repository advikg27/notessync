import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const { state } = JSON.parse(authStorage);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch (error) {
      console.error('Failed to parse auth storage:', error);
    }
  }
  return config;
});

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// Module API
export const moduleApi = {
  create: (data: any) => api.post('/modules', data),
  list: (params?: any) => api.get('/modules', { params }),
  get: (id: string) => api.get(`/modules/${id}`),
  update: (id: string, data: any) => api.put(`/modules/${id}`, data),
  delete: (id: string) => api.delete(`/modules/${id}`),
  versions: (id: string) => api.get(`/modules/${id}/versions`),
  restore: (id: string, versionNumber: number) =>
    api.post(`/modules/${id}/restore`, { versionNumber }),
};

// Course API
export const courseApi = {
  create: (data: { name: string }) => api.post('/courses', data),
  list: () => api.get('/courses'),
  get: (id: string) => api.get(`/courses/${id}`),
  modules: (id: string) => api.get(`/courses/${id}/modules`),
  members: (id: string) => api.get(`/courses/${id}/members`),
  updateMemberRole: (courseId: string, memberId: string, role: string) =>
    api.patch(`/courses/${courseId}/members/${memberId}/role`, { role }),
  enroll: (id: string) => api.post(`/courses/${id}/enroll`),
  join: (data: { courseId: string }) => api.post('/courses/join', data),
  update: (id: string, data: { name: string }) =>
    api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
};

// Compiler API
export const compilerApi = {
  compile: (data: { moduleIds: string[]; format: 'html' | 'pdf'; title?: string }) =>
    api.post('/compiler/compile', data, {
      responseType: data.format === 'pdf' ? 'blob' : 'text',
    }),
  dependencyGraph: (moduleId: string) =>
    api.get(`/compiler/dependency-graph/${moduleId}`),
};

