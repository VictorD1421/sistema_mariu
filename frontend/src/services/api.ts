import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse, AuditLog } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export const loginRequest = (username: string, pass: string) => 
  api.post<AuthResponse>('/auth/login', { username, password: pass });

export const getAuditLogs = () => 
  api.get<AuditLog[]>('/audit-logs');

export default api;