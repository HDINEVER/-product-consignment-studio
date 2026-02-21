import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refreshAuth, syncGuestCart } = useAuth();

  useEffect(() => {
    const finishLogin = async () => {
      await refreshAuth();
      await syncGuestCart();
      navigate('/', { replace: true });
    };

    finishLogin();
  }, [navigate, refreshAuth, syncGuestCart]);

  return (
    <div className="min-h-screen bg-brutal-light flex items-center justify-center p-6">
      <div className="bg-white border-4 border-black rounded-xl shadow-brutal p-6 flex items-center gap-3">
        <Loader2 className="animate-spin" size={20} />
        <span className="font-bold">正在完成登录...</span>
      </div>
    </div>
  );
};

export default AuthCallback;
