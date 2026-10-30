import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attaches JWT token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@PernasSolidarias:token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handles Blob error decoding and 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        error.response.data = JSON.parse(text);
      } catch {
        // Not a JSON blob, keep original
      }
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('@PernasSolidarias:token');
      localStorage.removeItem('@PernasSolidarias:user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);
