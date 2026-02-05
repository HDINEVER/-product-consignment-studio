import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Simple client-side check. 
  // For higher security, this should be validated by the backend API.
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onLogin();
    } else {
      setError(true);
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
        
        <h2 className="text-2xl font-black text-center mb-2 uppercase">Admin Access</h2>
        <p className="text-gray-500 text-center mb-8 font-bold text-sm">Please enter the security code</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Enter password..."
              className="w-full border-2 border-black p-3 rounded font-bold outline-none focus:ring-4 focus:ring-yellow-400 transition-all"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs font-bold mt-2 animate-bounce">
                Incorrect password!
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white font-black py-3 rounded border-2 border-transparent hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group"
          >
            UNLOCK <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
