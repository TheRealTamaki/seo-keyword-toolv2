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
  getByProject: (projectId: string, params?: any) =>
    api.get(`/keywords/project/${projectId}`, { params }),
  getById: (id: string) => api.get(`/keywords/${id}`),
  create: (data: any) => api.post('/keywords', data),
  bulkCreate: (data: any[]) => api.post('/keywords/bulk', { keywords: data }),
  update: (id: string, data: any) => api.put(`/keywords/${id}`, data),
  delete: (id: string) => api.delete(`/keywords/${id}`),
  getUntracked: (projectId: string) => api.get(`/keywords/project/${projectId}/untracked`),
  getWithRankings: (projectId: string, params?: any) =>
    api.get(`/keywords/project/${projectId}/rankings`, { params }),
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
  get: () => api.get('/api-keys'),
  create: (data: { provider: string; apiKey: string; apiPassword?: string }) =>
    api.post('/api-keys', data),
  delete: (id: string) => api.delete(`/api-keys/${id}`),
  validate: (data: { provider: string; apiKey: string; apiPassword?: string }) =>
    api.post('/api-keys/validate', data),
};

// Notification Preferences endpoints
export const notificationPreferencesService = {
  get: () => api.get('/alerts/preferences/settings'),
  update: (data: any) => api.put('/alerts/preferences/settings', data),
};

// User endpoints
export const userService = {
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

// Keyword Research endpoints
export const keywordResearchService = {
  discover: (data: {
    seeds?: string[];
    domain?: string;
    includeAutocomplete?: boolean;
    includeRelated?: boolean;
    location?: string;
    language?: string;
  }) => api.post('/keyword-research/discover', data),
  analyze: (data: { keywords: string[]; location?: string; language?: string }) =>
    api.post('/keyword-research/analyze', data),
  autocomplete: (params: { keyword: string; location?: string; language?: string }) =>
    api.get('/keyword-research/autocomplete', { params }),
  related: (params: { keyword: string; location?: string; language?: string }) =>
    api.get('/keyword-research/related', { params }),
  domain: (params: { domain: string; location?: string; limit?: number }) =>
    api.get('/keyword-research/domain', { params }),
  filter: (data: any) => api.post('/keyword-research/filter', data),
  insights: (data: { keywords: any[] }) => api.post('/keyword-research/insights', data),
};

// Keyword Lists endpoints
export const keywordListsService = {
  getAll: (params?: any) => api.get('/keyword-lists', { params }),
  getById: (id: string) => api.get(`/keyword-lists/${id}`),
  create: (data: { name: string; description?: string; projectId?: string }) =>
    api.post('/keyword-lists', data),
  update: (id: string, data: any) => api.put(`/keyword-lists/${id}`, data),
  delete: (id: string) => api.delete(`/keyword-lists/${id}`),
  addKeywords: (id: string, data: { keywords: any[] }) =>
    api.post(`/keyword-lists/${id}/keywords`, data),
  getKeywords: (id: string, params?: any) =>
    api.get(`/keyword-lists/${id}/keywords`, { params }),
  updateKeyword: (listId: string, itemId: string, data: any) =>
    api.patch(`/keyword-lists/${listId}/keywords/${itemId}`, data),
  deleteKeyword: (listId: string, itemId: string) =>
    api.delete(`/keyword-lists/${listId}/keywords/${itemId}`),
  bulkDeleteKeywords: (listId: string, data: { itemIds: string[] }) =>
    api.post(`/keyword-lists/${listId}/keywords/bulk-delete`, data),
  export: (id: string) => api.get(`/keyword-lists/${id}/export`),
};

export default api;
