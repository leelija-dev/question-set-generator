const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Helper
async function http(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => 'Request failed');
    throw new Error(msg || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

// Boards
export const BoardsAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status !== undefined && params.status !== null && params.status !== '') q.set('status', params.status);
    const qs = q.toString();
    return http(`/boards${qs ? `?${qs}` : ''}`);
  },
  create: (data) => http('/boards', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => http(`/boards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
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
  create: (data) => http('/classes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => http(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
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
  create: (data) => http('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => http(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => http(`/subjects/${id}`, { method: 'DELETE' }),
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
  create: (data) => http('/requests', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id, note) => http(`/requests/${id}/approve`, { method: 'PUT', body: JSON.stringify({ note }) }),
  reject: (id, note) => http(`/requests/${id}/reject`, { method: 'PUT', body: JSON.stringify({ note }) }),
};

export default { BoardsAPI, ClassesAPI, SubjectsAPI, RequestsAPI };
