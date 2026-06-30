import api from './axios';
import { Activity } from '../types';

export interface ActivityResponse {
  data: Activity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  entity?: string;
  userId?: string;
}

export const getActivities = async (
  filters?: ActivityFilters
): Promise<ActivityResponse> => {
  const response = await api.get('/activities', {
    params: filters,
  });

  return response.data;
};