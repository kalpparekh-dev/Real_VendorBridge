import api from './axios';
import { User } from '../types';

export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (data: any) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data;
};
