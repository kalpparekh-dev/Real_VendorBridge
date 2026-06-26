import api from './axios';
import { RFQ } from '../types';

export const getRFQs = async (): Promise<RFQ[]> => {
  const response = await api.get('/rfqs');
  return response.data;
};

export const getRFQ = async (id: string): Promise<RFQ> => {
  const response = await api.get(`/rfqs/${id}`);
  return response.data;
};

export const createRFQ = async (data: any): Promise<RFQ> => {
  const response = await api.post('/rfqs', data);
  return response.data;
};

export const updateRFQ = async (id: string, data: any): Promise<RFQ> => {
  const response = await api.put(`/rfqs/${id}`, data);
  return response.data;
};

export const publishRFQ = async (id: string): Promise<RFQ> => {
  const response = await api.post(`/rfqs/${id}/publish`);
  return response.data;
};
