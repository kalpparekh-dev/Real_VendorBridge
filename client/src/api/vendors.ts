import api from './axios';
import { Vendor } from '../types';

export const getVendors = async (): Promise<Vendor[]> => {
  const response = await api.get('/vendors');
  return response.data;
};

export const getVendor = async (id: string): Promise<Vendor> => {
  const response = await api.get(`/vendors/${id}`);
  return response.data;
};

export const createVendor = async (data: any): Promise<Vendor> => {
  const response = await api.post('/vendors', data);
  return response.data;
};

export const updateVendor = async (id: string, data: any): Promise<Vendor> => {
  const response = await api.put(`/vendors/${id}`, data);
  return response.data;
};

export const deleteVendor = async (id: string): Promise<void> => {
  await api.delete(`/vendors/${id}`);
};
