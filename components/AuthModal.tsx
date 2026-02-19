import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, AlertTriangle, ShoppingCart, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasGuestCartItems, getGuestCartCount } from '../utils/guestCart';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  showGuestWarning?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  showGuestWarning = false,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register, loginWithGoogle } = useAuth();

  const guestCartCount = getGuestCartCount();
  const hasGuestCart = hasGuestCartItems();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('请输入您的姓名');
        }
        await register(email, password, name);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* 模态框 - Gumroad 圆角风格 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <div className="w-full max-w-md bg-white border-4 border-black shadow-brutal-lg rounded-2xl overflow-hidden">
            {/* 标题栏 - 明日方舟风格 */}
            <div className="bg-brutal-black text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-brutal-yellow" />
                <h2 className="text-xl font-bold tracking-wide">
                  {mode === 'login' ? '用户登录' : '新用户注册'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 游客购物车警告 */}
            {(showGuestWarning || hasGuestCart) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-brutal-yellow border-b-4 border-black px-6 py-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-black text-brutal-yellow rounded-lg">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-black">
                      您有 {guestCartCount} 件商品在购物车中
                    </p>
                    <p className="text-sm text-black/70 mt-1">
                      登录后将自动同步到您的账户，不会丢失！
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 表单内容 */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* 错误提示 */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 bg-red-100 border-2 border-red-500 p-3 rounded-xl"
                >
                  <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </motion.div>
              )}

              {/* 注册模式：姓名输入 */}
              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-black uppercase tracking-wide">
                    姓名
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="您的姓名"
                      className="input-brutal pl-12"
                      required
                    />
                  </div>
                </div>
              )}

              {/* 邮箱输入 */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-black uppercase tracking-wide">
                  邮箱地址
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="input-brutal pl-12"
                    required
                  />
                </div>
              </div>

              {/* 密码输入 */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-black uppercase tracking-wide">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-brutal pl-12"
                    required
                    minLength={8}
                  />
                </div>
                {mode === 'register' && (
                  <p className="text-xs text-gray-500">密码至少 8 位字符</p>
                )}
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="btn-brutal w-full bg-brutal-yellow text-black py-4 text-lg font-bold
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    处理中...
                  </>
                ) : mode === 'login' ? (
                  '立即登录'
                ) : (
                  '创建账户'
                )}
              </button>

              {/* 分割线 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">或者</span>
                </div>
              </div>

              {/* Google 登录按钮 */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="btn-brutal w-full bg-white text-black py-3 font-bold
                         flex items-center justify-center gap-3 hover:bg-gray-50"
              >
                {/* Google Logo SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                使用 Google 账号登录
              </button>

              {/* 切换模式 */}
              <div className="text-center pt-2">
                <p className="text-gray-600">
                  {mode === 'login' ? '还没有账号？' : '已有账号？'}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="ml-2 font-bold text-brutal-black underline decoration-4 
                             decoration-brutal-yellow hover:bg-brutal-yellow transition-colors px-1"
                  >
                    {mode === 'login' ? '立即注册' : '返回登录'}
                  </button>
                </p>
              </div>
            </form>

            {/* 底部装饰 - 明日方舟风格条纹 */}
            <div className="h-2 bg-brutal-black flex rounded-b-xl overflow-hidden">
              <div className="w-1/4 bg-brutal-yellow" />
              <div className="w-1/4 bg-brutal-black" />
              <div className="w-1/4 bg-brutal-blue" />
              <div className="w-1/4 bg-brutal-black" />
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
