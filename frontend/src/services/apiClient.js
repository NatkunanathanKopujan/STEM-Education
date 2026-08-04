import axios from 'axios';
import { storage } from '../utils/storage';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  return authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice(7)
    : null;
};

apiClient.interceptors.request.use((config) => {
  const token = config.skipAuth ? null : storage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.skipAuth) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const requestToken = getBearerToken(error.config?.headers?.Authorization);
      const currentToken = storage.getToken();
      const belongsToCurrentSession = !requestToken || !currentToken || requestToken === currentToken;

      if (belongsToCurrentSession) {
        storage.clearAuth();
        window.dispatchEvent(new CustomEvent('auth:session-expired'));

        if (!window.location.pathname.includes('/login')) {
          window.location.assign('/login');
        }
      }
    }

    return Promise.reject(error);
  },
);
