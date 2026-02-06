import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, RefreshCw } from 'lucide-react';
import { orderAPI } from '../utils/api';
import AnimatedButton from './AnimatedButton';

interface OrderItem {
  id: number;
  product_name: string;
  sku_code: string;
  quantity: number;
  price: number;
  variant_values?: Record<string, string>;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  shipping_fee: number;
  payment_method: string;
  payment_status: string;
  remark?: string;
  created_at: string;
  items: OrderItem[];
  shipping_address: {
    contact_name: string;
    contact_phone: string;
    province: string;
    city: string;
    district: string;
    address: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待付款', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
  paid: { label: '已付款', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: CheckCircle },
  shipped: { label: '已发货', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Truck },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: XCircle },
  refunded: { label: '已退款', color: 'bg-red-100 text-red-700 border-red-300', icon: RefreshCw },
};

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadOrderDetail(Number(id));
    } else {
      loadOrders();
    }
  }, [id]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getOrders({ page: 1, limit: 50 });
      setOrders(response.data.items || []);
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
      const response = await orderAPI.getOrder(orderId);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Failed to load order detail:', error);
      alert('加载订单详情失败');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('确定要取消这个订单吗？')) return;

    try {
      setCancelling(orderId);
      await orderAPI.cancelOrder(orderId);
      alert('订单已取消');
      
      if (selectedOrder) {
        await loadOrderDetail(orderId);
      } else {
        await loadOrders();
      }
    } catch (error: any) {
      alert(error.message || '取消订单失败');
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">加载中...</p>
        </div>
      </div>
    );
  }

  // 订单详情页
  if (selectedOrder) {
    const StatusIcon = statusConfig[selectedOrder.status]?.icon || Package;
    const canCancel = selectedOrder.status === 'pending' || selectedOrder.status === 'paid';

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        {/* Header */}
        <div className="bg-white border-b-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-bold">返回订单列表</span>
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-4 border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            {/* 订单状态 */}
            <div className="text-center mb-8 pb-8 border-b-4 border-black">
              <StatusIcon size={64} className="mx-auto mb-4 text-gray-700" />
              <h1 className="text-3xl font-black mb-2">
                {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
              </h1>
              <p className="text-gray-600">订单号：{selectedOrder.order_number}</p>
              <p className="text-sm text-gray-500 mt-2">{formatDate(selectedOrder.created_at)}</p>
            </div>

            {/* 收货地址 */}
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

            {/* 商品列表 */}
            <div className="mb-8">
              <h3 className="font-black text-xl mb-4">商品清单</h3>
              <div className="space-y-4">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-4 bg-gray-50 border-3 border-black rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-bold">{item.product_name}</p>
                      {item.variant_values && Object.keys(item.variant_values).length > 0 && (
                        <p className="text-sm text-gray-600">
                          {Object.values(item.variant_values).join(' / ')}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">SKU: {item.sku_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">¥{item.price.toFixed(2)} × {item.quantity}</p>
                      <p className="text-lg font-black text-yellow-600">
                        ¥{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 订单金额 */}
            <div className="mb-8">
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

            {/* 其他信息 */}
            <div className="space-y-3 mb-8">
              <div className="flex justify-between">
                <span className="text-gray-600">支付方式</span>
                <span className="font-bold">
                  {selectedOrder.payment_method === 'alipay' && '支付宝'}
                  {selectedOrder.payment_method === 'wechat' && '微信支付'}
                  {selectedOrder.payment_method === 'cod' && '货到付款'}
                </span>
              </div>
              {selectedOrder.remark && (
                <div>
                  <span className="text-gray-600">备注：</span>
                  <span className="font-bold">{selectedOrder.remark}</span>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            {canCancel && (
              <AnimatedButton
                onClick={() => handleCancelOrder(selectedOrder.id)}
                disabled={cancelling === selectedOrder.id}
                className="w-full bg-red-500 text-white"
              >
                {cancelling === selectedOrder.id ? '取消中...' : '取消订单'}
              </AnimatedButton>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // 订单列表页
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-bold">返回首页</span>
            </button>
            
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Package size={32} />
              我的订单
            </h1>
            
            <div className="w-24"></div> {/* Spacer for alignment */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          // 空状态
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="bg-white border-4 border-black rounded-3xl p-12 inline-block shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <Package size={80} className="mx-auto mb-6 text-gray-300" />
              <h2 className="text-2xl font-black mb-4">还没有订单</h2>
              <p className="text-gray-600 mb-6">快去下单吧！</p>
              <AnimatedButton
                onClick={() => navigate('/')}
                className="bg-yellow-400"
              >
                去购物
              </AnimatedButton>
            </div>
          </motion.div>
        ) : (
          // 订单列表
          <div className="space-y-6">
            {orders.map((order) => {
              const StatusIcon = statusConfig[order.status]?.icon || Package;
              const statusStyle = statusConfig[order.status]?.color || 'bg-gray-100';
              const canCancel = order.status === 'pending' || order.status === 'paid';

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  {/* 订单头部 */}
                  <div className="bg-gray-50 border-b-4 border-black px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">订单号：{order.order_number}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                    <span className={`px-4 py-2 ${statusStyle} border-3 border-black rounded-xl font-bold flex items-center gap-2`}>
                      <StatusIcon size={18} />
                      {statusConfig[order.status]?.label || order.status}
                    </span>
                  </div>

                  {/* 订单内容 */}
                  <div className="p-6">
                    <div className="space-y-3 mb-4">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span className="text-gray-700">
                            {item.product_name} × {item.quantity}
                          </span>
                          <span className="font-bold">¥{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500">...还有 {order.items.length - 3} 件商品</p>
                      )}
                    </div>

                    <div className="border-t-2 border-gray-200 pt-4 flex justify-between items-center">
                      <div>
                        <span className="text-gray-600">合计：</span>
                        <span className="text-2xl font-black text-yellow-600 ml-2">
                          ¥{order.total_amount.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <AnimatedButton
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="bg-white border-3 border-black"
                        >
                          查看详情
                        </AnimatedButton>
                        
                        {canCancel && (
                          <AnimatedButton
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancelling === order.id}
                            className="bg-red-100 text-red-700 border-3 border-black"
                          >
                            {cancelling === order.id ? '取消中...' : '取消订单'}
                          </AnimatedButton>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
