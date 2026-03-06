export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
  licenseWarning: string | null;
  isTemporaryPassword: boolean;
}

export interface AuthError {
  message: string;
  statusCode?: number;
}