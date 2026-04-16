import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleLogin } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getDashboardPath } from '../utils/auth';

interface GoogleLoginButtonProps {
  onSuccess: (user: any) => void;
  onError?: (error: any) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();
  const googleLoginMutation = useGoogleLogin();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const res = await googleLoginMutation.mutateAsync(credentialResponse.credential);
      onSuccess(res.user);
      toast.success(`Welcome, ${res.user.firstName}!`);
      navigate(getDashboardPath(res.user.role));
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Google authentication failed';
      toast.error(message);
      if (onError) onError(message);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          toast.error('Login Failed');
          if (onError) onError('Login Failed');
        }}
        useOneTap
        theme="outline"
        shape="pill"
        width="100%"
      />
    </div>
  );
};

export default GoogleLoginButton;
