export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
}

export interface SignupData {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  confirmPassword?: string;
}

export interface LoginData {
  email: string;
  password?: string;
}
