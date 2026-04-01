import api from './api.service';
import type { SignupData, LoginData, AuthResponse } from '../types/auth';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const authService = {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async logout(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  async refresh(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh');
    return response.data;
  },

  async getMe(): Promise<AuthResponse> {
    const response = await api.get<AuthResponse>('/auth/me');
    return response.data;
  }
};
