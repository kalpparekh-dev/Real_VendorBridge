import api from './axios';
import { Invoice } from '../types';

export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get('/invoices');
  return response.data;
};

export const getInvoice = async (id: string): Promise<Invoice> => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

export const createInvoice = async (data: any): Promise<Invoice> => {
  const response = await api.post('/invoices', data);
  return response.data;
};

export const payInvoice = async (id: string, data: any): Promise<any> => {
  const response = await api.post(`/invoices/${id}/pay`, data);
  return response.data;
};
