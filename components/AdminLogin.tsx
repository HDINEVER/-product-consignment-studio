import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('请填写完整信息');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-yellow-400 border-2 border-black rounded-full">
            <Lock size={32} />
          </div>
        </div>
        
        <h2 className="text-2xl font-black text-center mb-2 uppercase">管理员登录</h2>
        <p className="text-gray-500 text-center mb-8 font-bold text-sm">请输入管理员账号密码</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold mb-2 text-sm">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="admin@example.com"
              className="w-full border-2 border-black p-3 rounded font-bold outline-none focus:ring-4 focus:ring-yellow-400 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-bold mb-2 text-sm">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="请输入密码"
              className="w-full border-2 border-black p-3 rounded font-bold outline-none focus:ring-4 focus:ring-yellow-400 transition-all"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold animate-bounce">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-black py-3 rounded border-2 border-transparent hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                登录中...
              </>
            ) : (
              <>
                登录 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded text-xs">
          <p className="font-bold text-yellow-800">测试账号</p>
          <p className="text-yellow-700 mt-1">邮箱：admin@example.com</p>
          <p className="text-yellow-700">密码：admin123</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
