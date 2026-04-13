import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import type { AdminStats, AdminUsersResponse, SystemConfig, Plan, Country, PricingConfig } from '../types/api';

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

// Plans Hooks
export const useAdminPlans = () => {
  return useQuery<Plan[]>({
    queryKey: ['adminPlans'],
    queryFn: adminApi.getPlans,
  });
};

export const useUpsertPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Plan> & { id?: string }) => {
      if (data.id) return adminApi.updatePlan(data.id, data);
      return adminApi.createPlan(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
    },
  });
};

// Pricing & Geography Hooks
export const useAdminCountries = () => {
  return useQuery<Country[]>({
    queryKey: ['adminCountries'],
    queryFn: adminApi.getCountries,
  });
};

export const useUpsertCountry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Country>) => adminApi.upsertCountry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCountries'] });
    },
  });
};

export const useAdminPricingConfig = () => {
  return useQuery<PricingConfig>({
    queryKey: ['adminPricingConfig'],
    queryFn: adminApi.getPricingConfig,
  });
};

export const useUpdatePricingConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PricingConfig>) => adminApi.updatePricingConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPricingConfig'] });
    },
  });
};
