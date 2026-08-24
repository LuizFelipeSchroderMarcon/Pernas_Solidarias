import { api } from './api';
import type { AuthResponse, User, ApiSuccessResponse } from '../types';

export const authService = {
  async login(email: string, senha: string): Promise<AuthResponse> {
    const response = await api.post<ApiSuccessResponse<AuthResponse> | AuthResponse>('/auth/login', {
      email,
      senha,
    });
    // Support both { data: { token, user } } and direct { token, user }
    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as AuthResponse;
  },

  async register(email: string, senha: string): Promise<{ message: string; user: User }> {
    const response = await api.post<ApiSuccessResponse<User>>('/auth/register', { email, senha });
    return {
      message: response.data.message || 'Cadastro realizado com sucesso!',
      user: response.data.data,
    };
  },

  async me(): Promise<{ user: User }> {
    const response = await api.get<ApiSuccessResponse<User> | { user: User }>('/auth/me');
    if ('data' in response.data && response.data.data) {
      return { user: response.data.data };
    }
    return response.data as { user: User };
  },
};
