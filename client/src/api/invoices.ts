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

export const downloadInvoicePDF = async (id: string) => {
  const response = await api.get(`/invoices/${id}/pdf`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type: 'application/pdf',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Invoice-${id}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};

export const sendInvoiceEmail = async (id: string) => {
  const response = await api.post(`/invoices/${id}/email`);
  return response.data;
};