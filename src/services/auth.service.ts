import { apiClient } from '@/lib/api-client';
import { LoginCredentials, LoginResponse } from '@/types/auth';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/identity-access-service/api/v1/auth/login', credentials);
    console.log('Login response:', response.data);
    
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/identity-access-service/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local tokens
      localStorage.clear();
    }
  },
  
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/identity-access-service/api/v1/auth/token/refresh', {
      refreshToken,
    });
    return response.data;
  },
};