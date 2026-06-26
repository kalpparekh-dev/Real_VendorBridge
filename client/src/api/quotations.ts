import api from './axios';
import { Quotation } from '../types';

export const getQuotations = async (): Promise<Quotation[]> => {
  const response = await api.get('/quotations');
  return response.data;
};

export const getQuotation = async (id: string): Promise<Quotation> => {
  const response = await api.get(`/quotations/${id}`);
  return response.data;
};

export const createQuotation = async (data: any): Promise<Quotation> => {
  const response = await api.post('/quotations', data);
  return response.data;
};

export const approveQuotation = async (id: string, comments?: string): Promise<any> => {
  const response = await api.post(`/quotations/${id}/approve`, { comments });
  return response.data;
};

export const rejectQuotation = async (id: string, comments?: string): Promise<any> => {
  const response = await api.post(`/quotations/${id}/reject`, { comments });
  return response.data;
};
