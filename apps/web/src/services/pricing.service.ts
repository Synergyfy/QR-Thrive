import { apiClient } from './api';
import type { PublicPlan, SystemConfig } from '../types/api';

export const pricingApi = {
  /**
   * Fetches plans localized to the user's IP.
   */
  getPublicPlans: async () => {
    const res = await apiClient.get<PublicPlan[]>('/plans');
    return res.data;
  },

  /**
   * Fetches the public system configuration (Hero, Features, FAQs).
   */
  getPublicConfig: async () => {
    const res = await apiClient.get<SystemConfig>('/admin/config');
    return res.data;
  },

  /**
   * Admin only: Suggest a localized price based on live FX rates.
   */
  suggestPrice: async (basePriceUSD: number, targetCurrencyCode: string) => {
    const res = await apiClient.get('/pricing/suggest', { params: { basePriceUSD, targetCurrencyCode } });
    return res.data;
  },
};
