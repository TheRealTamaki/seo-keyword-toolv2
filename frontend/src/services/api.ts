import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
};

// Projects endpoints
export const projectsService = {
  getAll: () => api.get('/projects'),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

// Keywords endpoints
export const keywordsService = {
  getByProject: (projectId: string) => api.get(`/keywords/${projectId}`),
  create: (data: any) => api.post('/keywords', data),
  delete: (id: string) => api.delete(`/keywords/${id}`),
};

// Rankings endpoints
export const rankingsService = {
  getByKeyword: (keywordId: string) => api.get(`/rankings/${keywordId}`),
  check: (data: any) => api.post('/rankings/check', data),
};

// Competitors endpoints
export const competitorsService = {
  getByProject: (projectId: string) => api.get(`/competitors/${projectId}`),
  create: (data: any) => api.post('/competitors', data),
  delete: (id: string) => api.delete(`/competitors/${id}`),
};

// API Keys endpoints
export const apiKeysService = {
  get: (userId: string) => api.get(`/api-keys/${userId}`),
  create: (data: any) => api.post('/api-keys', data),
  update: (id: string, data: any) => api.put(`/api-keys/${id}`, data),
  delete: (id: string) => api.delete(`/api-keys/${id}`),
  validate: (id: string) => api.post(`/api-keys/${id}/validate`),
};

export default api;
