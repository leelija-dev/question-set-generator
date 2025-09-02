import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // equivalent to credentials: 'include'
});

// Helper
async function http(path, options = {}) {
  try {
    const { method = 'GET', data, ...config } = options;
    const response = await api.request({
      url: path,
      method,
      data,
      ...config,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || `HTTP ${error.response.status}`);
    }
    throw new Error(error.message || 'Request failed');
  }
}

// Boards
export const BoardsAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status !== undefined && params.status !== null && params.status !== '') q.set('status', params.status);
    const qs = q.toString();
    return http(`/boards${qs ? `?${qs}` : ''}`);
  },
  create: (data) => http('/boards', { method: 'POST', data }),
  update: (id, data) => http(`/boards/${id}`, { method: 'PUT', data }),
  remove: (id) => http(`/boards/${id}`, { method: 'DELETE' }),
  metrics: (id) => http(`/boards/${id}/metrics`),
};

// Classes
export const ClassesAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.boardId) q.set('boardId', params.boardId);
    if (params.status !== undefined && params.status !== null && params.status !== '') q.set('status', params.status);
    const qs = q.toString();
    return http(`/classes${qs ? `?${qs}` : ''}`);
  },
  create: (data) => http('/classes', { method: 'POST', data }),
  update: (id, data) => http(`/classes/${id}`, { method: 'PUT', data }),
  remove: (id) => http(`/classes/${id}`, { method: 'DELETE' }),
};

// Subjects
export const SubjectsAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.boardId) q.set('boardId', params.boardId);
    if (params.classId) q.set('classId', params.classId);
    if (params.status !== undefined && params.status !== null && params.status !== '') q.set('status', params.status);
    const qs = q.toString();
    return http(`/subjects${qs ? `?${qs}` : ''}`);
  },
  create: (data) => http('/subjects', { method: 'POST', data }),
  update: (id, data) => http(`/subjects/${id}`, { method: 'PUT', data }),
  remove: (id) => http(`/subjects/${id}`, { method: 'DELETE' }),
};

// Questions
export const QuestionsAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.boardId) q.set('boardId', params.boardId);
    if (params.classId) q.set('classId', params.classId);
    if (params.subjectId) q.set('subjectId', params.subjectId);
    if (params.difficulty) q.set('difficulty', params.difficulty);
    if (params.status !== undefined && params.status !== null && params.status !== '') q.set('status', params.status);
    if (params.q) q.set('q', params.q);
    const qs = q.toString();
    return http(`/questions${qs ? `?${qs}` : ''}`);
  },
  create: (data) => http('/questions', { method: 'POST', data }),
  update: (id, data) => http(`/questions/${id}`, { method: 'PUT', data }),
  remove: (id) => http(`/questions/${id}`, { method: 'DELETE' }),
};

// Requests
export const RequestsAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.type && params.type !== 'all') q.set('type', params.type);
    if (params.status && params.status !== 'all') q.set('status', params.status);
    if (params.activeStatus !== undefined && params.activeStatus !== null && params.activeStatus !== '') q.set('activeStatus', params.activeStatus);
    const qs = q.toString();
    return http(`/requests${qs ? `?${qs}` : ''}`);
  },
  create: (data) => http('/requests', { method: 'POST', data }),
  approve: (id, note) => http(`/requests/${id}/approve`, { method: 'PUT', data: { note } }),
  reject: (id, note) => http(`/requests/${id}/reject`, { method: 'PUT', data: { note } }),
};

// QuestionSetsAPI using axios
export const QuestionSetsAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.boardId) q.set("boardId", params.boardId);
    if (params.classId) q.set("classId", params.classId);
    if (params.subjectId) q.set("subjectId", params.subjectId);
    if (params.q) q.set("q", params.q);
    const qs = q.toString();
    return http(`/question-sets${qs ? `?${qs}` : ""}`);
  },
  create: (data) => http('/question-sets', { method: 'POST', data }),
  remove: (id) => http(`/question-sets/${id}`, { method: 'DELETE' }),
  get: (id) => http(`/question-sets/${id}`),
};

export default { BoardsAPI, ClassesAPI, SubjectsAPI, QuestionsAPI, RequestsAPI, QuestionSetsAPI };
