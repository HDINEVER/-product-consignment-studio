import React, { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  onLogin: (email: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      onLogin(email);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-yellow-400/90 backdrop-blur-md"></div>
      
      <div className="relative bg-white w-full max-w-md p-8 rounded-2xl border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] animate-in bounce-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
            <Mail size={32} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">欢迎来到寄售站</h1>
          <p className="text-gray-500 font-medium">请输入邮箱开始浏览二次元周边</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="otaku@example.com"
              className="w-full px-4 py-3 rounded-lg border-2 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 font-bold placeholder:font-normal"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
          >
            {loading ? '正在进入...' : (
              <>
                <span>进入站点</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          Protected by Cloudflare (Mock). By entering you agree to our terms.
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
