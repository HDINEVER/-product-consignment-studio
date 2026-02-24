import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { account } from '../lib/appwrite';
import Loader from './ui/loader';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refreshAuth, syncGuestCart } = useAuth();

  const isProcessing = useRef(false);

  useEffect(() => {
    const finishLogin = async () => {
      if (isProcessing.current) return;
      isProcessing.current = true;

      // createOAuth2Token 回调时，URL 会携带 userId 和 secret 参数
      // 需要用这两个参数调用 createSession 来建立真正的会话
      const params = new URLSearchParams(window.location.search);
      const userId = params.get('userId');
      const secret = params.get('secret');

      if (userId && secret) {
        try {
          // 先尝试获取当前用户，看是否已经登录了（比如 React Strict Mode 跑了两次）
          let alreadyLoggedIn = false;
          try {
            await account.get();
            alreadyLoggedIn = true;
          } catch (e) {
            // 未登录，正常现象
          }
          
          if (!alreadyLoggedIn) {
            await account.createSession(userId, secret);
            console.log('✅ OAuth Token 换取 Session 成功');
          }
        } catch (err: any) {
          console.error('❌ 创建 Session 失败:', err);
          // 如果报错说会话已存在或者不合法，可以酌情处理
          // 但既然发生了错误，且不是已登录状态，就要调到 failure
          navigate('/auth/failure', { replace: true });
          return;
        }
      }

      try {
        await refreshAuth();
        await syncGuestCart();
        navigate('/', { replace: true });
      } catch (err) {
        console.error('❌ 刷新用户状态失败:', err);
        navigate('/', { replace: true }); // 如果只是这里失败也至少回到主页
      }
    };

    finishLogin();
  }, [navigate, refreshAuth, syncGuestCart]);

  return (
    <div className="min-h-screen bg-brutal-light flex items-center justify-center p-6">
      <div className="bg-white border-4 border-black rounded-xl shadow-brutal p-6 flex items-center gap-3">
        <Loader size="sm" />
        <span className="font-bold">正在完成登录...</span>
      </div>
    </div>
  );
};

export default AuthCallback;
