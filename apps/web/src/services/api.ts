import axios from 'axios';
import type {
  AuthResponse,
  BackendFolder,
  CreateFolderDto,
  CreateQRCodeDto,
  BackendQRCode,
  DashboardStats,
  Scan,
  AdminStats,
  AdminUsersResponse,
  SystemConfig,
} from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:3005/api/v1');
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
  googleLogin: async (token: string) => {
    const res = await apiClient.post<AuthResponse>('/auth/google', { token });
    localStorage.setItem(SESSION_HINT_KEY, 'true');
    return res.data;
  },
  logout: async () => {
    localStorage.removeItem(SESSION_HINT_KEY);
    return (await apiClient.post('/auth/logout')).data;
  },
  getMe: async () => {
    if (!localStorage.getItem(SESSION_HINT_KEY)) return null;
    return (await apiClient.get<AuthResponse>('/auth/me')).data;
  },
};

export const foldersApi = {
  getFolders: async () => (await apiClient.get<BackendFolder[]>('/folders')).data,
  createFolder: async (data: CreateFolderDto) => (await apiClient.post<BackendFolder>('/folders', data)).data,
  deleteFolder: async (id: string) => (await apiClient.delete(`/folders/${id}`)).data,
};

export const qrCodesApi = {
  getQRCodes: async (params?: any) => {
    const res = await apiClient.get<(BackendQRCode & { _count?: { scans: number } })[]>('/qr-codes', { params });
    // Transform backend qr code to match the expected format in UI
    return (res.data || []).map(qr => ({
      ...qr,
      scans: qr.scans ?? qr._count?.scans ?? 0,
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
    const qr = (await apiClient.get<BackendQRCode & { _count?: { scans: number } }>(`/qr-codes/${id}`)).data;
    return {
      ...qr,
      scans: qr.scans ?? qr._count?.scans ?? 0,
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
  getScans: async (id: string) => (await apiClient.get<Scan[]>(`/qr-codes/${id}/scans`)).data,
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

export const uploadApi = {
  getSignedUrl: async (fileType: string, fileName: string, fileSize: number) => {
    const res = await apiClient.post<{ signedUrl: string; cloudinaryUrl: string; publicId: string }>(
      '/upload/signed-url',
      { fileType, fileName, fileSize }
    );
    return res.data;
  },
  deleteFile: async (publicId: string) => {
    const res = await apiClient.delete(`/upload/file/${publicId}`);
    return res.data;
  },
};

export const mediaApi = {
  getSignature: async () => (await apiClient.get<{ signature: string; timestamp: number; folder: string; cloudName: string; apiKey: string }>('/media/signature')).data,
  updateQRCodeMedia: async (id: string, secureUrl: string) => (await apiClient.patch(`/media/${id}`, { secureUrl })).data,
  uploadToCloudinary: async (file: File, credentials: { signature: string; timestamp: number; folder: string; cloudName: string; apiKey: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', credentials.signature);
    formData.append('timestamp', credentials.timestamp.toString());
    formData.append('api_key', credentials.apiKey);
    formData.append('folder', credentials.folder);
    
    // Unauthenticated POST directly to Cloudinary
    // Note: Use /auto/ upload for dynamic handling of videos, PDFs, images, etc.
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${credentials.cloudName}/auto/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  }
};

export const adminApi = {
  getStats: async (range = '7d') => (await apiClient.get<AdminStats>('/admin/stats', { params: { range } })).data,
  getUsers: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => 
    (await apiClient.get<AdminUsersResponse>('/admin/users', { params })).data,
  getConfig: async () => (await apiClient.get<SystemConfig>('/admin/config')).data,
  updateConfig: async (data: Partial<SystemConfig>) => (await apiClient.patch<SystemConfig>('/admin/config', data)).data,
  banUser: async (id: string) => (await apiClient.patch(`/admin/users/${id}/ban`)).data,
  deleteUser: async (id: string) => (await apiClient.delete(`/admin/users/${id}`)).data,
  exportUsers: async () => {
    const res = await apiClient.get('/admin/users/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users-export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
