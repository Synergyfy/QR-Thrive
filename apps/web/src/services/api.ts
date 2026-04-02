import axios from 'axios';
import type {
  AuthResponse,
  BackendFolder,
  CreateFolderDto,
  CreateQRCodeDto,
  BackendQRCode,
  DashboardStats,
} from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SESSION_HINT_KEY = 'qr-thrive-session';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Assuming backend endpoint /auth/refresh exists, but if it's automatic via cookie,
    // interceptor might just handle generic retries. For now, we'll let it fail so hooks handle it.
    if (error.response?.status === 401 && !originalRequest._retry && localStorage.getItem(SESSION_HINT_KEY)) {
      originalRequest._retry = true;
      try {
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        return apiClient(originalRequest);
      } catch (err) {
        localStorage.removeItem(SESSION_HINT_KEY);
        return Promise.reject(err);
      }
    }
    
    if (error.response?.status === 401) {
       localStorage.removeItem(SESSION_HINT_KEY);
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  signup: async (data: any) => {
    const res = await apiClient.post<AuthResponse>('/auth/signup', data);
    localStorage.setItem(SESSION_HINT_KEY, 'true');
    return res.data;
  },
  login: async (data: any) => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    localStorage.setItem(SESSION_HINT_KEY, 'true');
    return res.data;
  },
  logout: async () => {
    localStorage.removeItem(SESSION_HINT_KEY);
    return (await apiClient.post('/auth/logout')).data;
  },
  getMe: async () => (await apiClient.get<AuthResponse>('/auth/me')).data,
};

export const foldersApi = {
  getFolders: async () => (await apiClient.get<BackendFolder[]>('/folders')).data,
  createFolder: async (data: CreateFolderDto) => (await apiClient.post<BackendFolder>('/folders', data)).data,
  deleteFolder: async (id: string) => (await apiClient.delete(`/folders/${id}`)).data,
};

export const qrCodesApi = {
  getQRCodes: async (params?: any) => {
    const res = await apiClient.get<BackendQRCode[]>('/qr-codes', { params });
    // Transform backend qr code to match the expected format in UI
    return (res.data || []).map(qr => ({
      ...qr,
      shortUrl: qr.shortUrl || `/s/${qr.shortId}`,
      config: {
        data: qr.data || {},
        design: qr.design || {},
        frame: qr.frame || {},
        logo: qr.logo,
        width: qr.width || 400,
        height: qr.height || 400,
        margin: qr.margin || 20,
        isDynamic: qr.isDynamic ?? true,
        shortId: qr.shortId
      }
    }));
  },
  getQRCode: async (id: string) => {
    const qr = (await apiClient.get<BackendQRCode>(`/qr-codes/${id}`)).data;
    return {
      ...qr,
      shortUrl: qr.shortUrl || `/s/${qr.shortId}`,
      config: {
        data: qr.data || {},
        design: qr.design || {},
        frame: qr.frame || {},
        logo: qr.logo,
        width: qr.width || 400,
        height: qr.height || 400,
        margin: qr.margin || 20,
        isDynamic: qr.isDynamic ?? true,
        shortId: qr.shortId
      }
    };
  },
  getPublicQRCode: async (shortId: string) => {
    const res = await apiClient.get<BackendQRCode>(`/qr-codes/public/${shortId}`);
    const qr = res.data;
    return {
      ...qr,
      shortUrl: qr.shortUrl || `/s/${qr.shortId}`,
      config: {
        data: qr.data || {},
        design: qr.design || {},
        frame: qr.frame || {},
        logo: qr.logo,
        width: qr.width || 400,
        height: qr.height || 400,
        margin: qr.margin || 20,
        isDynamic: qr.isDynamic ?? true,
        shortId: qr.shortId
      }
    };
  },
  createQRCode: async (data: CreateQRCodeDto) => (await apiClient.post<BackendQRCode>('/qr-codes', data)).data,
  updateQRCode: async (id: string, data: Partial<BackendQRCode>) => (await apiClient.put<BackendQRCode>(`/qr-codes/${id}`, data)).data,
  duplicateQRCode: async (id: string) => (await apiClient.post<BackendQRCode>(`/qr-codes/${id}/duplicate`)).data,
  deleteQRCode: async (id: string) => (await apiClient.delete(`/qr-codes/${id}`)).data,
};

export const statsApi = {
  getDashboardStats: async () => (await apiClient.get<DashboardStats>('/qr-codes/stats')).data,
};
