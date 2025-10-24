import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-e2de53ff`;

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  token?: string | null;
}

async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, token } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || publicAnonKey}`,
  };
  
  const config: RequestInit = {
    method,
    headers,
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }
  
  return response.json();
}

// ==================== AUTH API ====================

export const authAPI = {
  signup: async (email: string, password: string, name: string) => {
    return apiCall('/auth/signup', {
      method: 'POST',
      body: { email, password, name },
    });
  },
  
  signin: async (email: string, password: string) => {
    return apiCall('/auth/signin', {
      method: 'POST',
      body: { email, password },
    });
  },
  
  getMe: async (token: string) => {
    return apiCall('/auth/me', { token });
  },
};

// ==================== REPORTS API ====================

export const reportsAPI = {
  create: async (reportData: any, token: string) => {
    return apiCall('/reports', {
      method: 'POST',
      body: reportData,
      token,
    });
  },
  
  getAll: async (token?: string) => {
    return apiCall('/reports', { token });
  },
  
  getById: async (id: string, token?: string) => {
    return apiCall(`/reports/${id}`, { token });
  },
  
  update: async (id: string, updates: any, token: string) => {
    return apiCall(`/reports/${id}`, {
      method: 'PUT',
      body: updates,
      token,
    });
  },
  
  delete: async (id: string, token: string) => {
    return apiCall(`/reports/${id}`, {
      method: 'DELETE',
      token,
    });
  },
  
  getUserReports: async (token: string) => {
    return apiCall('/reports/user/me', { token });
  },
};

// ==================== COMMENTS API ====================

export const commentsAPI = {
  add: async (reportId: string, text: string, token: string) => {
    return apiCall(`/reports/${reportId}/comments`, {
      method: 'POST',
      body: { text },
      token,
    });
  },
  
  getAll: async (reportId: string) => {
    return apiCall(`/reports/${reportId}/comments`);
  },
};

// ==================== RATINGS API ====================

export const ratingsAPI = {
  add: async (reportId: string, rating: number, token: string) => {
    return apiCall(`/reports/${reportId}/rating`, {
      method: 'POST',
      body: { rating },
      token,
    });
  },
  
  get: async (reportId: string) => {
    return apiCall(`/reports/${reportId}/rating`);
  },
};

// ==================== ENTITIES API ====================

export const entitiesAPI = {
  getAll: async () => {
    return apiCall('/entities');
  },
  
  update: async (entities: any[], token: string) => {
    return apiCall('/entities', {
      method: 'PUT',
      body: { entities },
      token,
    });
  },
};

// ==================== ADMIN API ====================

export const adminAPI = {
  getUsers: async (token: string) => {
    return apiCall('/admin/users', { token });
  },
  
  updateUser: async (userId: string, updates: any, token: string) => {
    return apiCall(`/admin/users/${userId}`, {
      method: 'PUT',
      body: updates,
      token,
    });
  },
  
  getAnalytics: async (token: string) => {
    return apiCall('/admin/analytics', { token });
  },
};
