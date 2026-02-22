import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { account } from '../lib/appwrite';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refreshAuth, syncGuestCart } = useAuth();

  useEffect(() => {
    const finishLogin = async () => {
      // createOAuth2Token 回调时，URL 会携带 userId 和 secret 参数
      // 需要用这两个参数调用 createSession 来建立真正的会话
      const params = new URLSearchParams(window.location.search);
      const userId = params.get('userId');
      const secret = params.get('secret');

      if (userId && secret) {
        try {
          await account.createSession(userId, secret);
          console.log('✅ OAuth Token 换取 Session 成功');
        } catch (err) {
          console.error('❌ 创建 Session 失败:', err);
          navigate('/auth/failure', { replace: true });
          return;
        }
      }

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
