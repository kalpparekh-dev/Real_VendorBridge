import api from './axios';
import { Activity } from '../types';

export const getActivities = async (): Promise<Activity[]> => {
  const response = await api.get('/activities');
  return response.data;
};
