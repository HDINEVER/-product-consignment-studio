import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../utils/api';
import AdminLogin from './AdminLogin';
import AnimatedButton from './AnimatedButton';

interface Order {
  id: number;
  order_number: string;
  user_email: string;
  status: string;
  payment_status: string;
  total_amount: number;
  shipping_fee: number;
  created_at: string;
  items: any[];
  shipping_address: any;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待付款', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
  paid: { label: '已付款', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: CheckCircle },
  shipped: { label: '已发货', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Truck },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: XCircle },
};

const AdminOrders: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      if (id) {
        loadOrderDetail(Number(id));
      } else {
        loadOrders();
      }
    }
  }, [user, isAdmin, id]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getOrders({ page: 1, limit: 100 });
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      alert('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetail = async (orderId: number) => {
    try {
      setLoading(true);
      const response = await adminAPI.getOrders({ page: 1, limit: 100 });
      const order = (response.data || []).find((o: any) => String(o.id || o.$id) === String(orderId));
      if (order) {
        setSelectedOrder(order);
      } else {
        alert('订单不存在');
        navigate('/admin/orders');
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      alert('加载订单失败');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    if (!confirm(`确定要将订单状态更改为"${statusConfig[newStatus]?.label}"吗？`)) return;

    try {
      setUpdating(true);
      await adminAPI.updateOrderStatus(orderId, newStatus);
      alert('订单状态已更新');
      
      if (selectedOrder) {
        await loadOrderDetail(orderId);
      } else {
        await loadOrders();
      }
    } catch (error: any) {
      alert(error.message || '更新失败');
    } finally {
      setUpdating(false);
    }
  };

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

  if (!user || !isAdmin) {
    return <AdminLogin />;
  }

  // 订单详情页
  if (selectedOrder) {
    const StatusIcon = statusConfig[selectedOrder.status]?.icon || Package;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white border-b-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => navigate('/admin/orders')}
              className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors font-bold"
            >
              <ArrowLeft size={20} />
              返回订单列表
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border-4 border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-center mb-8 pb-8 border-b-4 border-black">
              <StatusIcon size={64} className="mx-auto mb-4" />
              <h1 className="text-3xl font-black mb-2">
                {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
              </h1>
              <p className="text-gray-600">订单号：{selectedOrder.order_number}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(selectedOrder.created_at || (selectedOrder as any).$createdAt).toLocaleString('zh-CN')}
              </p>
            </div>

            {/* 状态更新 */}
            <div className="mb-8">
              <h3 className="font-black text-xl mb-4">更新订单状态</h3>
              <div className="flex gap-3 flex-wrap">
                {Object.keys(statusConfig).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus((selectedOrder as any).$id || selectedOrder.id, status)}
                    disabled={updating || selectedOrder.status === status}
                    className={`px-4 py-2 border-3 border-black rounded-xl font-bold transition-all disabled:opacity-50 ${
                      selectedOrder.status === status
                        ? statusConfig[status].color + ' scale-105'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {statusConfig[status].label}
                  </button>
                ))}
              </div>
            </div>

            {/* 用户信息 */}
            <div className="mb-8">
              <h3 className="font-black text-xl mb-4">用户信息</h3>
              <div className="bg-gray-50 border-3 border-black rounded-xl p-6">
                <p className="mb-2"><span className="text-gray-600">邮箱：</span><span className="font-bold">{selectedOrder.user_email}</span></p>
              </div>
            </div>

            {/* 收货地址 */}
            {selectedOrder.shipping_address && (
              <div className="mb-8">
                <h3 className="font-black text-xl mb-4">收货信息</h3>
                <div className="bg-gray-50 border-3 border-black rounded-xl p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">收货人：</span>
                      <span className="font-bold">{selectedOrder.shipping_address.contact_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">电话：</span>
                      <span className="font-bold">{selectedOrder.shipping_address.contact_phone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">地址：</span>
                      <span className="font-bold">
                        {selectedOrder.shipping_address.province}
                        {selectedOrder.shipping_address.city}
                        {selectedOrder.shipping_address.district}
                        {selectedOrder.shipping_address.address}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 商品清单 */}
            <div className="mb-8">
              <h3 className="font-black text-xl mb-4">商品清单</h3>
              <div className="space-y-4">
                {selectedOrder.items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-gray-50 border-3 border-black rounded-xl"
                  >
                    <div className="flex-1">
                      {/* ✅ 驼峰命名：productName, variantName */}
                      <p className="font-bold">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-sm text-gray-500">规格: {item.variantName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">¥{item.price} × {item.quantity}</p>
                      <p className="text-lg font-black text-yellow-600">
                        ¥{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 金额汇总 */}
            <div className="bg-yellow-100 border-4 border-black rounded-2xl p-6">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">商品总价</span>
                  <span className="font-bold">¥{selectedOrder.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>运费</span>
                  <span className="font-bold">
                    {selectedOrder.shipping_fee === 0 ? '免运费' : `¥${selectedOrder.shipping_fee.toFixed(2)}`}
                  </span>
                </div>
              </div>
              <div className="border-t-3 border-black pt-4 flex justify-between items-baseline">
                <span className="text-lg font-bold">实付金额</span>
                <div>
                  <span className="text-sm">¥</span>
                  <span className="text-3xl font-black">
                    {(selectedOrder.total_amount + selectedOrder.shipping_fee).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 订单列表页
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="bg-white border-b-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black">订单管理</h1>
            <Link to="/admin">
              <AnimatedButton variant="outline">
                <ArrowLeft size={18} className="mr-2" />
                返回后台首页
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">加载中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Package size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-black mb-2">还没有订单</h2>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const StatusIcon = statusConfig[order.status]?.icon || Package;
              
              return (
                <div
                  key={(order as any).$id || order.id}
                  className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <div className="bg-gray-50 border-b-4 border-black px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{order.order_number}</p>
                      <p className="text-sm text-gray-600">{order.user_email}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at || (order as any).$createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <span className={`px-4 py-2 ${statusConfig[order.status]?.color} border-3 border-black rounded-xl font-bold flex items-center gap-2`}>
                      <StatusIcon size={18} />
                      {statusConfig[order.status]?.label || order.status}
                    </span>
                  </div>

                  <div className="p-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">订单金额</p>
                      <p className="text-3xl font-black text-yellow-600">
                        ¥{(order.total_amount || 0).toFixed(2)}
                      </p>
                    </div>

                    <Link to={`/admin/orders/${(order as any).$id || order.id}`}>
                      <AnimatedButton className="bg-black text-white">
                        查看详情
                      </AnimatedButton>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
