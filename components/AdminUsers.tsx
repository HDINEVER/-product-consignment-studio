import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, User, Ban, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Loader from './ui/loader';

interface UserData {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  status: string;
  created_at: string;
}

export default function AdminUsers() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8788/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8788/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        alert(`用户${newStatus === 'active' ? '已激活' : '已禁用'}`);
        fetchUsers();
      } else {
        alert('操作失败');
      }
    } catch (error) {
      console.error('更新用户状态失败:', error);
      alert('操作失败');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-red-400',
      seller: 'bg-blue-400',
      customer: 'bg-green-400'
    };
    const labels = {
      admin: '管理员',
      seller: '卖家',
      customer: '顾客'
    };
    return (
      <span className={`px-3 py-1 ${styles[role as keyof typeof styles] || 'bg-gray-400'} text-black font-bold border-2 border-black inline-flex items-center gap-1`}>
        {role === 'admin' && <Shield size={14} />}
        {labels[role as keyof typeof labels] || role}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="px-3 py-1 bg-green-400 text-black font-bold border-2 border-black inline-flex items-center gap-1">
        <CheckCircle size={14} />
        正常
      </span>
    ) : (
      <span className="px-3 py-1 bg-gray-400 text-black font-bold border-2 border-black inline-flex items-center gap-1">
        <Ban size={14} />
        已禁用
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <Loader size="lg" text="加载中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-400 border-4 border-black">
              <Users size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black">用户管理</h1>
              <p className="text-gray-600">管理系统所有用户</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索用户名称或邮箱..."
              className="w-full pl-12 pr-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 font-bold"
            />
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
        >
          <table className="w-full">
            <thead className="bg-yellow-400 border-b-4 border-black">
              <tr>
                <th className="px-6 py-4 text-left font-black">ID</th>
                <th className="px-6 py-4 text-left font-black">姓名</th>
                <th className="px-6 py-4 text-left font-black">邮箱</th>
                <th className="px-6 py-4 text-left font-black">手机</th>
                <th className="px-6 py-4 text-left font-black">角色</th>
                <th className="px-6 py-4 text-left font-black">状态</th>
                <th className="px-6 py-4 text-left font-black">注册时间</th>
                <th className="px-6 py-4 text-left font-black">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>暂无用户</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b-2 border-black hover:bg-yellow-50">
                    <td className="px-6 py-4 font-bold">#{user.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center">
                          <User size={20} />
                        </div>
                        <span className="font-bold">{user.name || '未设置'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">{user.phone || '-'}</td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`px-4 py-2 font-bold border-[3px] border-black transition-colors ${
                            user.status === 'active'
                              ? 'bg-gray-400 hover:bg-gray-500'
                              : 'bg-green-400 hover:bg-green-500'
                          }`}
                        >
                          {user.status === 'active' ? '禁用' : '激活'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6"
        >
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-black mb-2">{users.length}</div>
              <div className="text-gray-600">总用户数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black mb-2">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="text-gray-600">管理员</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black mb-2">
                {users.filter(u => u.role === 'customer').length}
              </div>
              <div className="text-gray-600">顾客</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black mb-2">
                {users.filter(u => u.status === 'active').length}
              </div>
              <div className="text-gray-600">活跃用户</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
