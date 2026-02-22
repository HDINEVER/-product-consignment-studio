import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Package, Heart, Settings, ChevronRight, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'orders'>('info');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    // TODO: Implement profile update API call
    alert('个人信息已更新');
  };

  const menuItems = [
    { id: 'info', label: '个人信息', icon: User },
    { id: 'addresses', label: '收货地址', icon: MapPin },
    { id: 'orders', label: '我的订单', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-yellow-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 返回按钮 */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-white text-black font-bold border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
        >
          <ArrowLeft size={20} />
          返回首页
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 md:p-8 mb-6 md:mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 bg-yellow-400 border-4 border-black rounded-full flex items-center justify-center">
                <User className="text-black w-8 h-8 md:w-10 md:h-10" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-black mb-1 truncate">{user?.name || '用户'}</h1>
                <p className="text-sm md:text-base text-gray-600 break-all">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full md:w-auto px-6 py-2 bg-black text-white font-bold border-4 border-black rounded-xl hover:bg-white hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              退出登录
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-1 md:col-span-3"
          >
            <div className="bg-white border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-2 md:p-4 flex overflow-x-auto md:block gap-2 md:gap-0 [&::-webkit-scrollbar]:hidden">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'orders') {
                        navigate('/orders');
                      } else {
                        setActiveTab(item.id as any);
                      }
                    }}
                    className={`shrink-0 md:w-full flex items-center justify-between p-3 md:p-4 mb-0 md:mb-2 font-bold border-4 border-black rounded-xl transition-all ${
                      isActive
                        ? 'bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)]'
                        : 'bg-white hover:bg-yellow-100 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <Icon size={20} className="shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </div>
                    <ChevronRight size={20} className="hidden md:block shrink-0" />
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-1 md:col-span-9"
          >
            <div className="bg-white border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 md:p-8 mb-8 md:mb-0">
              {activeTab === 'info' && (
                <div>
                  <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 md:w-6 md:h-6" />
                    个人信息设置
                  </h2>
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <label className="block font-bold mb-1 md:mb-2 text-sm md:text-base">姓名</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 md:px-4 md:py-3 border-4 border-black rounded-xl text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-yellow-400"
                        placeholder="请输入姓名"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 md:mb-2 text-sm md:text-base">手机号</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 md:px-4 md:py-3 border-4 border-black rounded-xl text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-yellow-400"
                        placeholder="请输入手机号"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 md:mb-2 text-sm md:text-base">邮箱</label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 md:px-4 md:py-3 border-4 border-black rounded-xl text-sm md:text-base bg-gray-100 cursor-not-allowed text-gray-500 overflow-hidden text-ellipsis"
                      />
                      <p className="text-xs md:text-sm text-gray-500 mt-1">邮箱地址不可修改</p>
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      className="w-full md:w-auto px-8 py-3 bg-yellow-400 text-black font-black border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                    >
                      保存修改
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
                      <MapPin className="w-5 h-5 md:w-6 md:h-6" />
                      收货地址管理
                    </h2>
                    <button
                      onClick={() => navigate('/profile/addresses/new')}
                      className="w-full md:w-auto px-6 py-2 bg-yellow-400 text-black font-black border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                    >
                      + 新增地址
                    </button>
                  </div>
                  <div className="text-center py-8 md:py-12 text-gray-500">
                    <MapPin className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm md:text-base">暂无收货地址</p>
                    <p className="text-xs md:text-sm mt-2">点击"新增地址"添加您的收货地址</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
