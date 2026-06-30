import api from './axios';
import { Notification } from '../types';

export const getNotifications = async (): Promise<any> => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markAsRead = async (id: string): Promise<void> => {
  await api.post(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.post('/notifications/read-all');
};

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};