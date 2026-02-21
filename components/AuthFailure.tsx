import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const AuthFailure: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brutal-light flex items-center justify-center p-6">
      <div className="bg-white border-4 border-black rounded-xl shadow-brutal p-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-red-600">
          <AlertTriangle size={20} />
          <span className="font-bold">Google 登录失败</span>
        </div>
        <p className="text-sm text-gray-600">请稍后重试或使用邮箱密码登录。</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="px-4 py-2 bg-black text-white font-bold rounded-lg border-2 border-black shadow-brutal-sm"
        >
          返回首页
        </button>
      </div>
    </div>
  );
};

export default AuthFailure;
