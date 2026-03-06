import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.warn('NEXT_PUBLIC_API_URL is not defined, using default URL');
}


const baseURL = API_BASE_URL || 'https://api.genx-dev.insightgen.ai';

// Add debug logging to check if URL is loaded
console.log('API Base URL:', API_BASE_URL);

// Create axios instance
export const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const TokenService = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Set token expiration
    const expiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem('tokenExpiresAt', expiresAt.toString());
  },
  
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
  },
  
  isTokenValid: () => {
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (!expiresAt) return false;
    return Date.now() < parseInt(expiresAt);
  },
};

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh on 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = TokenService.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        // Call refresh token endpoint
        const response = await axios.post(`${baseURL}/identity-access-service/api/v1/auth/token/refresh`, {
          refreshToken,
        });
        
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
        
        TokenService.setTokens(accessToken, newRefreshToken, expiresIn);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login on refresh failure
        TokenService.clearTokens();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);