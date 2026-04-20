import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../services/api';
import toast from 'react-hot-toast';

export const useSubscribeFree = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { planId: string }) => paymentsApi.subscribeFree(data),
    onSuccess: (data) => {
      toast.success(data.message || 'Subscribed successfully!');
      // Invalidate both user and pricing data to refresh plan states
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to subscribe to the free plan.';
      toast.error(message);
    },
  });
};
