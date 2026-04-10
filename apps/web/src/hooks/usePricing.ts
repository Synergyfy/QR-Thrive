import { useQuery } from '@tanstack/react-query';
import { pricingApi } from '../services/pricing.service';

export const usePublicPlans = () => {
  return useQuery({
    queryKey: ['public-plans'],
    queryFn: pricingApi.getPublicPlans,
    staleTime: 1000 * 60 * 60, // 1 hour - prices don't change often
  });
};

export const usePublicConfig = () => {
  return useQuery({
    queryKey: ['public-config'],
    queryFn: pricingApi.getPublicConfig,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
