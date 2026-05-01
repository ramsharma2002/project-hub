import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — force logout
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  signup: (data) => API.post('/auth/signup', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/me', data),
  getAllUsers: () => API.get('/auth/users'),
};

// Projects
export const projectsAPI = {
  getAll: () => API.get('/projects'),
  getOne: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
  addMember: (id, data) => API.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => API.delete(`/projects/${id}/members/${userId}`),
};

// Tasks
export const tasksAPI = {
  getByProject: (projectId, params) =>
    API.get(`/projects/${projectId}/tasks`, { params }),
  getOne: (id) => API.get(`/tasks/${id}`),
  create: (projectId, data) => API.post(`/projects/${projectId}/tasks`, data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  delete: (id) => API.delete(`/tasks/${id}`),
};

// Dashboard
export const dashboardAPI = {
  get: () => API.get('/dashboard'),
};

export default API;
