import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Address {
  id: number;
  contact_name: string;
  contact_phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  zipcode?: string;
  is_default: boolean;
}

export default function AddressList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchAddresses();
  }, [isAuthenticated, navigate]);

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8788/api/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAddresses(data.data);
      }
    } catch (error) {
      console.error('获取地址列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8788/api/addresses/${id}/default`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchAddresses();
      }
    } catch (error) {
      console.error('设置默认地址失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个地址吗？')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8788/api/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert('地址删除成功');
        fetchAddresses();
      } else {
        alert('地址删除失败');
      }
    } catch (error) {
      console.error('删除地址失败:', error);
      alert('操作失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-2xl font-black">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-400 border-4 border-black">
                <MapPin size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black">收货地址管理</h1>
                <p className="text-gray-600">管理您的收货地址</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/profile/addresses/new')}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Plus size={20} />
              添加新地址
            </button>
          </div>
        </motion.div>

        {/* Addresses Grid */}
        {addresses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center"
          >
            <MapPin size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-gray-500 mb-4">暂无收货地址</p>
            <button
              onClick={() => navigate('/profile/addresses/new')}
              className="px-6 py-2 bg-yellow-400 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              添加新地址
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {addresses.map((address, index) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 relative"
              >
                {address.is_default && (
                  <div className="absolute top-0 right-0 bg-yellow-400 border-l-4 border-b-4 border-black px-4 py-2 font-black flex items-center gap-2">
                    <Check size={16} />
                    默认地址
                  </div>
                )}
                
                <div className="mb-4 pt-8">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-black">{address.contact_name}</h3>
                    <span className="text-gray-600">{address.contact_phone}</span>
                  </div>
                  <p className="text-gray-700">
                    {address.province} {address.city} {address.district} {address.address}
                  </p>
                  {address.zipcode && (
                    <p className="text-sm text-gray-500 mt-1">邮编: {address.zipcode}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-4 border-t-2 border-black">
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="px-4 py-2 bg-yellow-400 text-black font-bold border-2 border-black hover:bg-yellow-500 transition-colors"
                    >
                      设为默认
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/profile/addresses/${address.id}/edit`)}
                    className="p-2 bg-blue-400 border-2 border-black hover:bg-blue-500 transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-2 bg-red-400 border-2 border-black hover:bg-red-500 transition-colors"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
