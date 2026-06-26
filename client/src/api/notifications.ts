import api from './axios';
import { Notification } from '../types';

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markAsRead = async (id: string): Promise<void> => {
  await api.post(`/notifications/${id}/read`);
};
