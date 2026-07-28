export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: 'SUPERUSER' | 'ADMIN' | 'USER';
  
}
export interface AuthResponse {
  access_token: string;
  user: User;
}
export interface AuditLog {
  id: number;
  action: string;
  timestamp: string;
  user: User;
}