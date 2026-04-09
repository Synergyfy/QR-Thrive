import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import type { AdminStats, AdminUsersResponse, SystemConfig } from '../types/api';

export const useAdminStats = (range = '7d') => {
  return useQuery<AdminStats>({
    queryKey: ['adminStats', range],
    queryFn: () => adminApi.getStats(range),
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 seconds
  });
};

export const useAdminUsers = (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
  return useQuery<AdminUsersResponse>({
    queryKey: ['adminUsers', params],
    queryFn: () => adminApi.getUsers(params),
    refetchOnWindowFocus: true,
  });
};

export const useSystemConfig = () => {
  return useQuery<SystemConfig>({
    queryKey: ['systemConfig'],
    queryFn: adminApi.getConfig,
    staleTime: 60000, // 1 minute
  });
};

export const useUpdateSystemConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SystemConfig>) => adminApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
    },
  });
};

export const useBanUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.banUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
};

export const useExportUsers = () => {
  return useMutation({
    mutationFn: adminApi.exportUsers,
  });
};
