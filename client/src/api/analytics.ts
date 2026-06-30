import api from './axios';

export type AnalyticsFilters = {
  from?: string;
  to?: string;
  vendorId?: string;
  category?: string;
  status?: string;
};

export const getExecutiveAnalytics = async (filters?: AnalyticsFilters) => {
  const response = await api.get('/analytics/dashboard', {
    params: filters,
  });

  return response.data;
};