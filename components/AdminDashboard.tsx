import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, Package, ShoppingCart, Users, DollarSign, 
  TrendingUp, AlertCircle, Clock, CheckCircle 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, productAPI } from '../utils/api';
import AdminLogin from './AdminLogin';
import AnimatedButton from './AnimatedButton';

interface DashboardStats {
  total_products: number;
  total_orders: number;
  total_users: number;
  total_revenue: number;
  pending_orders: number;
  low_stock_products: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  user_email: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && isAdmin) {
      loadDashboardData();
    }
  }, [user, isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 获取仪表板统计
      const dashboardResponse = await adminAPI.getDashboard();
      setStats(dashboardResponse.data.stats);
      setRecentOrders(dashboardResponse.data.recent_orders || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 认证加载中
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录或非管理员
  if (!user || !isAdmin) {
    return <AdminLogin />;
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: '待付款', color: 'bg-yellow-100 text-yellow-700' },
    paid: { label: '已付款', color: 'bg-blue-100 text-blue-700' },
    shipped: { label: '已发货', color: 'bg-purple-100 text-purple-700' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
    cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-700' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black">管理后台</h1>
              <p className="text-sm text-gray-600 mt-1">欢迎回来，{user.name || user.email}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/">
                <AnimatedButton variant="outline" className="flex items-center gap-2">
                  <Package size={18} />
                  返回前台
                </AnimatedButton>
              </Link>
              
              <AnimatedButton 
                onClick={handleLogout}
                className="bg-red-500 text-white flex items-center gap-2"
              >
                <LogOut size={18} />
                退出登录
              </AnimatedButton>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">加载数据中...</p>
          </div>
        ) : (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* 总商品数 */}
              <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 border-3 border-black rounded-xl">
                    <Package size={24} />
                  </div>
                  <TrendingUp className="text-green-500" size={20} />
                </div>
                <h3 className="text-gray-600 text-sm font-bold mb-1">总商品数</h3>
                <p className="text-4xl font-black">{stats?.total_products || 0}</p>
              </div>

              {/* 总订单数 */}
              <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 border-3 border-black rounded-xl">
                    <ShoppingCart size={24} />
                  </div>
                  <Clock className="text-orange-500" size={20} />
                </div>
                <h3 className="text-gray-600 text-sm font-bold mb-1">总订单数</h3>
                <p className="text-4xl font-black">{stats?.total_orders || 0}</p>
                <p className="text-xs text-gray-500 mt-2">
                  待处理: {stats?.pending_orders || 0}
                </p>
              </div>

              {/* 总用户数 */}
              <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 border-3 border-black rounded-xl">
                    <Users size={24} />
                  </div>
                  <CheckCircle className="text-purple-500" size={20} />
                </div>
                <h3 className="text-gray-600 text-sm font-bold mb-1">总用户数</h3>
                <p className="text-4xl font-black">{stats?.total_users || 0}</p>
              </div>

              {/* 总营收 */}
              <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 border-3 border-black rounded-xl">
                    <DollarSign size={24} />
                  </div>
                  <TrendingUp className="text-green-500" size={20} />
                </div>
                <h3 className="text-gray-600 text-sm font-bold mb-1">总营收</h3>
                <p className="text-4xl font-black">¥{(stats?.total_revenue || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* 警告信息 */}
            {stats && stats.low_stock_products > 0 && (
              <div className="bg-yellow-50 border-4 border-yellow-400 rounded-2xl p-6 mb-8 flex items-center gap-4">
                <AlertCircle className="text-yellow-600" size={32} />
                <div>
                  <h3 className="font-black text-lg mb-1">库存警告</h3>
                  <p className="text-sm text-gray-700">
                    有 <span className="font-bold text-yellow-600">{stats.low_stock_products}</span> 件商品库存不足
                  </p>
                </div>
              </div>
            )}

            {/* 快捷操作 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Link to="/admin/products">
                <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
                  <Package className="mb-3" size={32} />
                  <h3 className="font-black text-xl mb-2">商品管理</h3>
                  <p className="text-sm text-gray-600">管理所有商品和库存</p>
                </div>
              </Link>

              <Link to="/admin/orders">
                <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
                  <ShoppingCart className="mb-3" size={32} />
                  <h3 className="font-black text-xl mb-2">订单管理</h3>
                  <p className="text-sm text-gray-600">处理客户订单</p>
                </div>
              </Link>

              <Link to="/admin/users">
                <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
                  <Users className="mb-3" size={32} />
                  <h3 className="font-black text-xl mb-2">用户管理</h3>
                  <p className="text-sm text-gray-600">查看用户信息</p>
                </div>
              </Link>
            </div>

            {/* 最近订单 */}
            {recentOrders.length > 0 && (
              <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-2xl mb-6">最近订单</h3>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-gray-50 border-3 border-black rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-bold">{order.order_number}</p>
                        <p className="text-sm text-gray-600">{order.user_email}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      
                      <div className="text-right mr-4">
                        <p className="font-bold text-lg">¥{order.total_amount.toFixed(2)}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border-2 border-black ${
                          statusConfig[order.status]?.color || 'bg-gray-100'
                        }`}>
                          {statusConfig[order.status]?.label || order.status}
                        </span>
                      </div>

                      <Link to={`/admin/orders/${order.id}`}>
                        <AnimatedButton variant="outline" className="text-sm">
                          查看详情
                        </AnimatedButton>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
