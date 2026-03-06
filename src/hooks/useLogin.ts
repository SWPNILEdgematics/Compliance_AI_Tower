import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { LoginCredentials, LoginResponse } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
  statusCode?: number;
}

export function useLogin() {
  const router = useRouter();
  const { login } = useAuth();

  return useMutation<LoginResponse, AxiosError<ErrorResponse>, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await authService.login(credentials);
      return response;
    },
    onSuccess: (data) => {
      // Save tokens using auth context
      login({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      });
      
      // Show warning if license warning exists
      if (data.licenseWarning) {
        console.warn('License Warning:', data.licenseWarning);
        // You can show a toast notification here
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Login failed:', error.response?.data?.message || error.message);
    },
  });
}