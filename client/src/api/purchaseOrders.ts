import api from './axios';
import { PurchaseOrder } from '../types';

export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const response = await api.get('/purchase-orders');
  return response.data;
};

export const getPurchaseOrder = async (
  id: string
): Promise<PurchaseOrder> => {
  const response = await api.get(`/purchase-orders/${id}`);
  return response.data;
};

export const downloadPurchaseOrderPDF = async (id: string) => {
  const response = await api.get(`/purchase-orders/${id}/pdf`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type: 'application/pdf',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `PurchaseOrder-${id}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};

export const sendPurchaseOrderEmail = async (id: string) => {
  const response = await api.post(`/purchase-orders/${id}/email`);
  return response.data;
};