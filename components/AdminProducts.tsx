import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Edit2, Trash2, Search, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Loader from './ui/loader';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  category_id: number;
  status: string;
  is_featured: boolean;
  created_at: string;
  imageUrl?: string;
  price?: number;
  stock?: number;
}

export default function AdminProducts() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
    fetchProducts();
  }, [isAdmin, navigate]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:8788/api/products?page=1&limit=100');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error('获取商品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个商品吗？')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8788/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert('商品删除成功');
        fetchProducts();
      } else {
        alert('商品删除失败');
      }
    } catch (error) {
      console.error('删除商品失败:', error);
      alert('操作失败');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-400',
      inactive: 'bg-gray-400',
      out_of_stock: 'bg-red-400'
    };
    const labels = {
      active: '上架中',
      inactive: '已下架',
      out_of_stock: '缺货'
    };
    return (
      <span className={`px-3 py-1 ${styles[status as keyof typeof styles] || 'bg-gray-400'} text-black font-bold border-2 border-black`}>
        {labels[status as keyof typeof labels] || status}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-400 border-4 border-black">
                <Package size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black">商品管理</h1>
                <p className="text-gray-600">管理您的所有商品</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/products/new')}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Plus size={20} />
              添加商品
            </button>
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
              placeholder="搜索商品名称..."
              className="w-full pl-12 pr-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 font-bold"
            />
          </div>
        </motion.div>

        {/* Products Table */}
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
                <th className="px-6 py-4 text-left font-black">商品名称</th>
                <th className="px-6 py-4 text-left font-black">分类</th>
                <th className="px-6 py-4 text-left font-black">状态</th>
                <th className="px-6 py-4 text-left font-black">精选</th>
                <th className="px-6 py-4 text-left font-black">创建时间</th>
                <th className="px-6 py-4 text-left font-black">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                    <p>暂无商品</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b-2 border-black hover:bg-yellow-50">
                    <td className="px-6 py-4 font-bold">#{product.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{product.name}</div>
                      <div className="text-sm text-gray-600">{product.slug}</div>
                    </td>
                    <td className="px-6 py-4">{product.category_id}</td>
                    <td className="px-6 py-4">{getStatusBadge(product.status)}</td>
                    <td className="px-6 py-4">
                      {product.is_featured ? (
                        <span className="text-yellow-600">⭐ 是</span>
                      ) : (
                        <span className="text-gray-400">否</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(product.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="p-2 bg-blue-400 border-[3px] border-black hover:bg-blue-500 transition-colors"
                          title="查看"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                          className="p-2 bg-yellow-400 border-[3px] border-black hover:bg-yellow-500 transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 bg-red-400 border-[3px] border-black hover:bg-red-500 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
              <div className="text-3xl font-black mb-2">{products.length}</div>
              <div className="text-gray-600">总商品数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black mb-2">
                {products.filter(p => p.status === 'active').length}
              </div>
              <div className="text-gray-600">上架中</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black mb-2">
                {products.filter(p => p.is_featured).length}
              </div>
              <div className="text-gray-600">精选商品</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black mb-2">
                {products.filter(p => p.status === 'out_of_stock').length}
              </div>
              <div className="text-gray-600">缺货</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
