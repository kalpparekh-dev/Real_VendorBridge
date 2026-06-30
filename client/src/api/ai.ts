import api from './axios';

export const chatWithAI = async (message: string) => {
  const response = await api.post('/ai/chat', {
    message,
  });

  return response.data;
};