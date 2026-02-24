import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Database, 
  User,
  Package,
  ShoppingCart,
  FileText,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { databases, account, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite';
import { useAuth } from '../contexts/AuthContext';
import Loader from './ui/loader';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'skipped';
  message: string;
  icon: React.ReactNode;
}

const AdminTest: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const iconMap: Record<string, React.ReactNode> = {
    connection: <Database size={18} />,
    auth: <User size={18} />,
    products: <Package size={18} />,
    cart: <ShoppingCart size={18} />,
    orders: <FileText size={18} />,
    admin: <Shield size={18} />,
  };

  const updateResult = (index: number, result: Partial<TestResult>) => {
    setResults(prev => prev.map((r, i) => 
      i === index ? { ...r, ...result } : r
    ));
  };

  const runTests = async () => {
    setTesting(true);
    
    // 初始化测试项
    const initialResults: TestResult[] = [
      { name: '连接测试', status: 'pending', message: '正在连接数据库...', icon: iconMap.connection },
      { name: '用户认证', status: 'pending', message: '检查登录状态...', icon: iconMap.auth },
      { name: '商品读取', status: 'pending', message: '测试商品读取权限...', icon: iconMap.products },
      { name: '购物车操作', status: 'pending', message: '测试购物车权限...', icon: iconMap.cart },
      { name: '订单访问', status: 'pending', message: '测试订单权限...', icon: iconMap.orders },
      { name: '管理员权限', status: 'pending', message: '测试管理员功能...', icon: iconMap.admin },
    ];
    setResults(initialResults);

    // 延迟函数
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // Test 1: 数据库连接
      await delay(500);
      try {
        await databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [
          Query.limit(1)
        ]);
        updateResult(0, { status: 'success', message: '✓ 数据库连接正常' });
      } catch (error: any) {
        updateResult(0, { status: 'error', message: `✗ 连接失败: ${error.message}` });
      }

      // Test 2: 用户认证
      await delay(500);
      if (!isAuthenticated) {
        updateResult(1, { status: 'error', message: '✗ 未登录，请先登录' });
      } else {
        try {
          const currentUser = await account.get();
          updateResult(1, { 
            status: 'success', 
            message: `✓ 已登录: ${currentUser.email}` 
          });
        } catch (error: any) {
          updateResult(1, { status: 'error', message: `✗ 认证失败: ${error.message}` });
        }
      }

      // Test 3: 商品读取
      await delay(500);
      try {
        const products = await databases.listDocuments(
          DATABASE_ID, 
          COLLECTIONS.PRODUCTS,
          [Query.limit(5)]
        );
        updateResult(2, { 
          status: 'success', 
          message: `✓ 成功读取 ${products.total} 个商品` 
        });
      } catch (error: any) {
        updateResult(2, { status: 'error', message: `✗ 读取失败: ${error.message}` });
      }

      // Test 4: 购物车操作
      await delay(500);
      if (!isAuthenticated) {
        updateResult(3, { status: 'skipped', message: '⊘ 跳过 (需要登录)' });
      } else {
        try {
          // 尝试读取当前用户的购物车
          await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.CART_ITEMS,
            [Query.equal('userId', user!.$id), Query.limit(5)]  // ✅ 驼峰命名
          );
          updateResult(3, { status: 'success', message: '✓ 购物车访问正常' });
        } catch (error: any) {
          updateResult(3, { status: 'error', message: `✗ 购物车错误: ${error.message}` });
        }
      }

      // Test 5: 订单访问
      await delay(500);
      if (!isAuthenticated) {
        updateResult(4, { status: 'skipped', message: '⊘ 跳过 (需要登录)' });
      } else {
        try {
          await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            [Query.equal('userId', user!.$id), Query.limit(5)]  // ✅ 驼峰命名
          );
          updateResult(4, { status: 'success', message: '✓ 订单访问正常' });
        } catch (error: any) {
          updateResult(4, { status: 'error', message: `✗ 订单错误: ${error.message}` });
        }
      }

      // Test 6: 管理员权限
      await delay(500);
      if (!isAdmin) {
        updateResult(5, { 
          status: 'skipped', 
          message: `⊘ 当前角色: ${user?.role || '游客'} (非管理员)` 
        });
      } else {
        try {
          // 管理员尝试创建并立即删除一个测试商品
          const testProduct = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            ID.unique(),
            {
              name: '__TEST_PRODUCT__',
              description: 'Admin permission test',
              price: 0,
              stockQuantity: 0,
              categoryId: '',  // 测试商品，不需要分类
              ipId: '',  // 测试商品，不需要IP标签
              isActive: false,  // 测试商品，设为不活跃
              createdAt: new Date().toISOString(),  // ✅ 驼峰命名
            }
          );
          
          // 删除测试商品
          await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            testProduct.$id
          );

          updateResult(5, { 
            status: 'success', 
            message: '✓ 管理员权限验证成功 (可创建/删除商品)' 
          });
        } catch (error: any) {
          updateResult(5, { 
            status: 'error', 
            message: `✗ 管理员权限不足: ${error.message}` 
          });
        }
      }

    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 border-green-500 text-green-700';
      case 'error': return 'bg-red-100 border-red-500 text-red-700';
      case 'skipped': return 'bg-gray-100 border-gray-400 text-gray-600';
      default: return 'bg-yellow-100 border-yellow-500 text-yellow-700';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'error': return <XCircle className="text-red-500" size={20} />;
      case 'skipped': return <AlertTriangle className="text-gray-400" size={20} />;
      default: return <Loader size="sm" />;
    }
  };

  return (
    <div className="min-h-screen bg-brutal-bg p-6">
      <div className="max-w-2xl mx-auto">
        {/* 标题卡片 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-black shadow-brutal-lg mb-6 rounded-2xl overflow-hidden"
        >
          <div className="bg-brutal-black text-white px-6 py-4 flex items-center gap-3 rounded-t-xl">
            <div className="w-2 h-8 bg-brutal-blue" />
            <Shield size={24} />
            <h1 className="text-xl font-bold">Appwrite 权限测试面板</h1>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              点击下方按钮测试您在 Appwrite 数据库中的权限配置是否正确。
            </p>
            
            {/* 当前用户状态 */}
            <div className="bg-brutal-bg border-2 border-black p-4 mb-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="text-brutal-black" size={20} />
                  <span className="font-bold">当前状态:</span>
                </div>
                <div className="flex items-center gap-2">
                  {isAuthenticated ? (
                    <>
                      <span className="text-green-600 font-medium">
                        {user?.email}
                      </span>
                      {isAdmin && (
                        <span className="bg-brutal-yellow text-black px-2 py-0.5 text-xs font-bold border-2 border-black rounded-lg">
                          ADMIN
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500">未登录 (游客)</span>
                  )}
                </div>
              </div>
            </div>

            {/* 测试按钮 */}
            <button
              onClick={runTests}
              disabled={testing}
              className="btn-brutal w-full bg-brutal-blue text-white py-4 font-bold text-lg
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {testing ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader size="sm" />
                  正在测试中...
                </span>
              ) : (
                <>
                  <RefreshCw size={24} />
                  运行权限测试
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* 测试结果 */}
        {results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border-4 border-black shadow-brutal rounded-2xl overflow-hidden"
          >
            <div className="bg-brutal-black text-white px-6 py-3 flex items-center gap-3 rounded-t-xl">
              <div className="w-2 h-6 bg-brutal-yellow" />
              <h2 className="font-bold">测试结果</h2>
            </div>
            
            <div className="divide-y-2 divide-black">
              {results.map((result, index) => (
                <motion.div
                  key={result.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 flex items-center gap-4 border-l-4 ${getStatusColor(result.status)}`}
                >
                  <div className="p-2 bg-white border-2 border-current rounded">
                    {result.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{result.name}</h3>
                    <p className="text-sm">{result.message}</p>
                  </div>
                  {getStatusIcon(result.status)}
                </motion.div>
              ))}
            </div>

            {/* 结果统计 */}
            <div className="bg-brutal-bg p-4 border-t-4 border-black">
              <div className="flex justify-center gap-6 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  通过: {results.filter(r => r.status === 'success').length}
                </span>
                <span className="flex items-center gap-2">
                  <XCircle className="text-red-500" size={16} />
                  失败: {results.filter(r => r.status === 'error').length}
                </span>
                <span className="flex items-center gap-2">
                  <AlertTriangle className="text-gray-400" size={16} />
                  跳过: {results.filter(r => r.status === 'skipped').length}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* 帮助信息 */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-brutal-yellow/30 border-2 border-brutal-yellow"
        >
          <h3 className="font-bold flex items-center gap-2 mb-2">
            <AlertTriangle size={18} />
            权限配置说明
          </h3>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• <strong>products</strong>: Any 可读, Admins 可增删改</li>
            <li>• <strong>cart_items</strong>: Users 可增删改自己的数据</li>
            <li>• <strong>orders</strong>: Users 可创建/读取自己的订单</li>
            <li>• <strong>users</strong>: Users 可读取/更新自己的资料</li>
            <li>• 管理员需要加入 Appwrite 的 <code className="bg-white px-1 border">Admins</code> Team</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminTest;
