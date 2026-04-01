import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { AuthResponse, SignupData, LoginData } from '../types/auth';

const AUTH_QUERY_KEY = ['auth-user'];

export const useAuthQuery = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<AuthResponse>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authService.refresh, // Attempt to refresh/get user on initial load
    retry: false,
    staleTime: Infinity, // User session is valid until 401
  });

  const loginMutation = useMutation<AuthResponse, Error, LoginData>({
    mutationFn: (data: LoginData) => authService.login(data),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
    },
  });

  const signupMutation = useMutation<AuthResponse, Error, SignupData>({
    mutationFn: (data: SignupData) => authService.signup(data),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
    },
  });

  const logoutMutation = useMutation<{ message: string }, Error, void>({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear(); // Clear all cache on logout
    },
  });

  return {
    user: data?.user || null,
    loading: isLoading,
    error,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
};
