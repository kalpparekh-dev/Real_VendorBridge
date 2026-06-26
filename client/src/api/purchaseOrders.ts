import api from './axios';
import { PurchaseOrder } from '../types';

export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const response = await api.get('/purchase-orders');
  return response.data;
};

export const getPurchaseOrder = async (id: string): Promise<PurchaseOrder> => {
  const response = await api.get(`/purchase-orders/${id}`);
  return response.data;
};
