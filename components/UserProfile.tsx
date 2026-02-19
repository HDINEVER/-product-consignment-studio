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
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-white text-black font-bold border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <ArrowLeft size={20} />
          返回首页
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-yellow-400 border-4 border-black rounded-full flex items-center justify-center">
                <User size={40} className="text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-black mb-1">{user?.name || '用户'}</h1>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-black text-white font-bold border-4 border-black rounded-xl hover:bg-white hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              退出登录
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-3"
          >
            <div className="bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4">
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
                    className={`w-full flex items-center justify-between p-4 mb-2 font-bold border-4 border-black rounded-xl transition-all ${
                      isActive
                        ? 'bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white hover:bg-yellow-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={20} />
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-9"
          >
            <div className="bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
              {activeTab === 'info' && (
                <div>
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                    <Settings size={24} />
                    个人信息设置
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block font-bold mb-2">姓名</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border-4 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-yellow-400"
                        placeholder="请输入姓名"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-2">手机号</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border-4 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-yellow-400"
                        placeholder="请输入手机号"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-2">邮箱</label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-3 border-4 border-black rounded-xl bg-gray-100 cursor-not-allowed"
                      />
                      <p className="text-sm text-gray-500 mt-1">邮箱地址不可修改</p>
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      className="px-8 py-3 bg-yellow-400 text-black font-black border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      保存修改
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black flex items-center gap-2">
                      <MapPin size={24} />
                      收货地址管理
                    </h2>
                    <button
                      onClick={() => navigate('/profile/addresses/new')}
                      className="px-6 py-2 bg-yellow-400 text-black font-black border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      + 新增地址
                    </button>
                  </div>
                  <div className="text-center py-12 text-gray-500">
                    <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                    <p>暂无收货地址</p>
                    <p className="text-sm mt-2">点击"新增地址"添加您的收货地址</p>
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
