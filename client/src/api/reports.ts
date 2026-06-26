import api from './axios';

export const getSpendByCategory = async (): Promise<any[]> => {
  const response = await api.get('/reports/spend');
  return response.data;
};

export const getRFQVolume = async (): Promise<any[]> => {
  const response = await api.get('/reports/rfq-volume');
  return response.data;
};

export const getVendorPerformance = async (): Promise<any[]> => {
  const response = await api.get('/reports/vendor-performance');
  return response.data;
};
