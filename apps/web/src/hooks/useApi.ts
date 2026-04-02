import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type {
  AuthResponse,
  BackendFolder,
  CreateFolderDto,
  BackendQRCode,
  CreateQRCodeDto,
  UpdateQRCodeDto,
  DashboardStats,
  DetailedQRCode
} from '../types/api';

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get<AuthResponse>('/auth/me');
      return response.data.user;
    },
    retry: false,
    refetchOnWindowFocus: true,
  });
};

export const useFolders = () => {
  return useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await api.get<BackendFolder[]>('/folders');
      return response.data;
    },
    refetchOnWindowFocus: true,
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFolderDto) => {
      const response = await api.post<BackendFolder>('/folders', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
};

export interface FetchQRsParams {
  status?: 'active' | 'archived';
  folderId?: string;
  type?: string;
  search?: string;
}

export const useQRCodes = (params?: FetchQRsParams) => {
  return useQuery({
    queryKey: ['qrCodes', params],
    queryFn: async () => {
      const response = await api.get<BackendQRCode[]>('/qr-codes', { params });
      return response.data;
    },
    refetchOnWindowFocus: true,
  });
};

export const useQRCode = (id: string) => {
  return useQuery({
    queryKey: ['qrCode', id],
    queryFn: async () => {
      const response = await api.get<DetailedQRCode>(`/qr-codes/${id}`);
      return response.data;
    },
    enabled: !!id,
    refetchOnWindowFocus: true,
  });
};

export const useCreateQRCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateQRCodeDto) => {
      const response = await api.post<BackendQRCode>('/qr-codes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qrCodes'] });
      queryClient.invalidateQueries({ queryKey: ['qrStats'] });
    },
  });
};

export const useUpdateQRCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateQRCodeDto }) => {
      const response = await api.put<BackendQRCode>(`/qr-codes/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['qrCodes'] });
      queryClient.invalidateQueries({ queryKey: ['qrCode', id] });
    },
  });
};

export const useDuplicateQRCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<BackendQRCode>(`/qr-codes/${id}/duplicate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qrCodes'] });
      queryClient.invalidateQueries({ queryKey: ['qrStats'] });
    },
  });
};

export const useDeleteQRCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/qr-codes/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['qrCodes'] });
      queryClient.invalidateQueries({ queryKey: ['qrCode', id] });
      queryClient.invalidateQueries({ queryKey: ['qrStats'] });
    },
  });
};

export const useQRStats = () => {
  return useQuery({
    queryKey: ['qrStats'],
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/qr-codes/stats');
      return response.data;
    },
    refetchOnWindowFocus: true,
  });
};
