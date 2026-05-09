import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  RefreshCw,
  Lock,
  Ghost,
  LogIn,
  ShoppingBag,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';
import AnimatedButton from './AnimatedButton';
import Loader from './ui/loader';

// ========== 类型定义 ==========
interface OrderItem {
  $id: string;
  orderId: string;        // ✅ 驼峰命名
  productId: string;      // ✅ 驼峰命名
  productName: string;    // ✅ 驼峰命名（商品名称快照）
  productImage: string;   // ✅ 驼峰命名（商品图片快照）
  variantId?: string;
  variantName?: string;   // ✅ 驼峰命名（规格名称快照）
  variantPrice?: number;
  variantImage?: string;
  price: number;
  quantity: number;
  createdAt: string;      // ✅ 驼峰命名
}

interface Order {
  $id: string;
  orderId: string;       // ✅ 订单编号
  userId: string;        // ✅ 驼峰命名
  status: string;
  totalAmount: number;   // ✅ 驼峰命名
  paymentMethod: string; // ✅ 驼峰命名
  remark?: string;
  
  // ✅ 收货地址快照（简化版 - 3个字段）
  shippingContactName: string;     // 收货人
  shippingContactPhone: string;    // 电话
  shippingFullAddress: string;     // 完整地址
  
  createdAt: string;     // ✅ 驼峰命名
  updatedAt: string;     // ✅ 驼峰命名
  
  // 关联订单明细
  items?: OrderItem[];
  
  // 管理员可见：下单用户信息
  userEmail?: string;    // ✅ 驼峰命名
  userName?: string;     // ✅ 驼峰命名
}

// ========== 订单状态配置 ==========
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { 
    label: '待付款', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-400',
    icon: Clock 
  },
  paid: { 
    label: '已付款', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-400',
    icon: CheckCircle 
  },
  shipped: { 
    label: '已发货', 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-400',
    icon: Truck 
  },
  completed: { 
    label: '已完成', 
    color: 'text-green-700', 
    bgColor: 'bg-green-400',
    icon: CheckCircle 
  },
  cancelled: { 
    label: '已取消', 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-400',
    icon: XCircle 
  },
  refunded: { 
    label: '已退款', 
    color: 'text-red-700', 
    bgColor: 'bg-red-400',
    icon: RefreshCw 
  },
};

// ========== 主组件 ==========
const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { id: orderIdFromUrl } = useParams<{ id: string }>();
  const { user, isGuest, isUser, isAdmin, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ========== 加载订单列表 ==========
  const loadOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      let ordersData: Order[] = [];
      
      if (isAdmin) {
        // 🔑 管理员：获取全站所有订单
        console.log('👑 管理员模式：加载全站订单');
        const ordersResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.ORDERS,
          [
            Query.limit(100),
          ]
        );
        
        ordersData = ordersResponse.documents as unknown as Order[];
        
        // 获取每个订单的用户信息
        const userIds = [...new Set(ordersData.map(order => order.userId))];
        const usersMap = new Map<string, { email: string; name: string }>();
        
        await Promise.all(
          userIds.map(async (userId) => {
            try {
              const userDoc = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId
              );
              usersMap.set(userId, {
                email: userDoc.email as string || '未知',
                name: userDoc.name as string || '匿名用户',
              });
            } catch {
              usersMap.set(userId, { email: '已删除用户', name: '已删除' });
            }
          })
        );
        
        // 追加用户信息到订单
        ordersData = ordersData.map(order => ({
          ...order,
          userEmail: usersMap.get(order.userId)?.email,   // ✅ 驼峰命名
          userName: usersMap.get(order.userId)?.name,     // ✅ 驼峰命名
        }));
        
      } else if (isUser) {
        // 👤 普通用户：只获取自己的订单
        console.log('👤 用户模式：加载个人订单');
        const ordersResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.ORDERS,
          [
            Query.equal('userId', user.$id),  // ✅ 驼峰命名
            Query.limit(50),
          ]
        );
        
        ordersData = ordersResponse.documents as unknown as Order[];
      }
      
      // 为每个订单加载订单明细
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          try {
            const itemsResponse = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.ORDER_ITEMS,
              [
                Query.equal('orderId', order.$id),  // ✅ 驼峰命名
              ]
            );
            
            return {
              ...order,
              items: itemsResponse.documents as unknown as OrderItem[],
            };
          } catch {
            return { ...order, items: [] };
          }
        })
      );
      
      setOrders(ordersWithItems);
      console.log(`✅ 成功加载 ${ordersWithItems.length} 个订单`);
      
    } catch (err: any) {
      console.error('❌ 加载订单失败:', err);
      setError(err.message || '加载订单失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  // ========== 页面加载时触发 ==========
  useEffect(() => {
    if (authLoading) return; // 等待认证状态加载完成
    
    if (isUser || isAdmin) {
      loadOrders();
    }
  }, [user, isUser, isAdmin, authLoading]);

  // ========== URL 参数自动打开订单详情 ==========
  useEffect(() => {
    if (orderIdFromUrl && orders.length > 0) {
      const targetOrder = orders.find(order => order.$id === orderIdFromUrl);
      if (targetOrder) {
        console.log('🎯 自动打开订单详情:', orderIdFromUrl);
        setSelectedOrder(targetOrder);
        // 清理 URL（移除订单 ID，保持在订单列表页）
        navigate('/orders', { replace: true });
      }
    }
  }, [orderIdFromUrl, orders, navigate]);
  
  // ========== 查看订单详情 ==========
  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
  };
  
  const handleCloseDetail = () => {
    setSelectedOrder(null);
  };
  
  // ========== 渲染：游客状态 (无权限) ==========
  if (authLoading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <Loader size="lg" text="加载中..." />
      </div>
    );
  }
  
  if (isGuest) {
    return (
      <div className="min-h-screen bg-yellow-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* 返回按钮 */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 px-4 py-2 bg-white text-black font-bold border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            返回首页
          </button>
          
          {/* 锁定提示卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 flex flex-col items-center text-center"
          >
            <div className="p-6 bg-yellow-400 border-4 border-black rounded-2xl mb-6">
              <Lock size={64} strokeWidth={3} />
            </div>
            
            <h1 className="text-4xl font-black mb-4">订单功能已锁定</h1>
            <p className="text-xl text-gray-700 mb-8 max-w-md">
              您尚未登录，无法查看订单历史
            </p>
            
            <AnimatedButton
              onClick={() => navigate('/?auth=login')}
              className="w-full max-w-xs px-8 py-6 bg-yellow-400 text-black font-black text-2xl border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3"
            >
              <LogIn size={28} />
              去登录 / 注册
            </AnimatedButton>
            
            <p className="mt-6 text-gray-600">
              登录后即可查看订单、管理地址、追踪物流
            </p>
          </motion.div>
        </div>
      </div>
    );
  }
  
  // ========== 渲染：已登录用户 (普通用户 / 管理员) ==========
  return (
    <div className="min-h-screen bg-yellow-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-white text-black font-bold border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              返回首页
            </button>
            
            <div className="flex items-center gap-3">
              <Package size={32} strokeWidth={3} />
              <h1 className="text-4xl font-black">
                {isAdmin ? '📊 全站订单管理' : '我的订单'}
              </h1>
            </div>
          </div>
          
          {isAdmin && (
            <div className="px-4 py-2 bg-purple-400 border-4 border-black rounded-xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              👑 管理员模式
            </div>
          )}
        </div>
        
        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader className="animate-spin" size={48} />
              <p className="text-xl font-bold">加载订单中...</p>
            </div>
          </div>
        )}
        
        {/* 错误提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 bg-red-400 border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-3">
              <XCircle size={24} />
              <p className="font-bold text-lg">{error}</p>
            </div>
            <button
              onClick={loadOrders}
              className="mt-4 px-4 py-2 bg-white border-[3px] border-black rounded-xl font-bold hover:bg-gray-100"
            >
              重试
            </button>
          </motion.div>
        )}
        
        {/* 订单列表 */}
        {!loading && !error && (
          <>
            {orders.length === 0 ? (
              // 空状态
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 flex flex-col items-center text-center"
              >
                <div className="p-8 bg-gray-200 border-4 border-black rounded-2xl mb-6">
                  <Ghost size={80} strokeWidth={2} />
                </div>
                
                <h2 className="text-3xl font-black mb-4">
                  {isAdmin ? '暂无订单数据' : '您还没有历史订单'}
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  {isAdmin ? '系统中还没有任何订单' : '快去选购心仪的商品吧！'}
                </p>
                
                <AnimatedButton
                  onClick={() => navigate('/')}
                  className="px-8 py-4 bg-yellow-400 text-black font-black text-xl border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3"
                >
                  <ShoppingBag size={24} />
                  去逛逛
                </AnimatedButton>
              </motion.div>
            ) : (
              // 订单列表
              <div className="space-y-6">
                {orders.map((order, index) => {
                  const statusInfo = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <motion.div
                      key={order.$id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      {/* 订单头部 */}
                      <div className="p-6 bg-gray-100 border-b-4 border-black flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className={`px-4 py-2 ${statusInfo.bgColor} border-4 border-black rounded-xl font-black flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                            <StatusIcon size={20} />
                            {statusInfo.label}
                          </div>
                          
                          <div className="font-mono font-bold text-gray-700">
                            订单号: {order.$id.slice(-8).toUpperCase()}
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar size={16} />
                            {new Date(order.createdAt).toLocaleString('zh-CN')}
                          </div>
                        </div>
                        
                        {/* 管理员专属：显示下单用户 */}
                        {isAdmin && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-purple-200 border-2 border-black rounded-lg font-bold">
                            <User size={16} />
                            {order.userName || '未知'} ({order.userEmail})
                          </div>
                        )}
                      </div>
                      
                      {/* 订单内容 */}
                      <div className="p-6">
                        {/* 商品列表 */}
                        <div className="space-y-4 mb-6">
                          {order.items?.map((item, idx) => (
                            <div key={item.$id} className="flex items-center gap-4 pb-4 border-b-2 border-dashed border-gray-300 last:border-0">
                              <div className="w-20 h-20 bg-gray-200 border-4 border-black rounded-xl overflow-hidden shrink-0">
                                {/* ✅ 驼峰命名：productImage, productName */}
                                {(item.variantImage || item.productImage) ? (
                                  <img
                                    src={item.variantImage || item.productImage}
                                    alt={item.variantName || item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package size={32} className="text-gray-400" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                {/* ✅ 驼峰命名：productName, variantName */}
                                <h3 className="font-bold text-lg truncate">{item.productName}</h3>
                                {item.variantName && (
                                  <p className="text-gray-600 text-sm">{item.variantName}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm font-mono">
                                  <span className="font-bold">¥{item.price.toFixed(2)}</span>
                                  <span className="text-gray-600">x {item.quantity}</span>
                                </div>
                              </div>
                              
                              <div className="text-right font-black text-xl">
                                ¥{(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* 订单信息 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {/* 收货地址 */}
                          <div className="p-4 bg-blue-50 border-2 border-black rounded-xl">
                            <div className="flex items-center gap-2 mb-3 font-black">
                              <MapPin size={18} />
                              收货地址
                            </div>
                            <div className="space-y-1 text-sm">
                              <p className="font-bold">{order.shippingContactName} {order.shippingContactPhone}</p>
                              <p className="text-gray-700">
                                {order.shippingFullAddress}
                              </p>
                            </div>
                          </div>
                          
                          {/* 支付方式 */}
                          <div className="p-4 bg-green-50 border-2 border-black rounded-xl">
                            <div className="flex items-center gap-2 mb-3 font-black">
                              <CreditCard size={18} />
                              支付方式
                            </div>
                            <p className="font-bold text-lg">
                              {order.paymentMethod === 'alipay' && '支付宝'}
                              {order.paymentMethod === 'wechat' && '微信支付'}
                              {order.paymentMethod === 'card' && '银行卡'}
                              {order.paymentMethod === 'cod' && '货到付款'}
                            </p>
                            {order.remark && (
                              <div className="mt-3 pt-3 border-t border-gray-300">
                                <div className="flex items-center gap-2 text-sm font-bold mb-1">
                                  <FileText size={14} />
                                  备注
                                </div>
                                <p className="text-sm text-gray-700">{order.remark}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* 订单底部：总价和操作 */}
                        <div className="flex items-center justify-between pt-6 border-t-4 border-black">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-black">订单总价:</span>
                            <span className="text-4xl font-black text-yellow-600">
                              ￥{order.totalAmount.toFixed(2)}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleViewDetail(order)}
                            className="px-6 py-3 bg-yellow-400 text-black font-black border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                          >
                            查看详情
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 订单详情弹窗（可选实现） */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseDetail}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border-4 border-black rounded-2xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-yellow-400 border-b-4 border-black p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-black">订单详情</h2>
                <button
                  onClick={handleCloseDetail}
                  className="p-2 bg-white border-[3px] border-black rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="关闭订单详情"
                >
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <p className="font-mono text-lg"><strong>订单 ID:</strong> {selectedOrder.$id}</p>
                  <p className="text-lg"><strong>创建时间:</strong> {new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}</p>
                  <p className="text-lg"><strong>状态:</strong> {statusConfig[selectedOrder.status]?.label}</p>
                  <p className="text-2xl font-black"><strong>总金额:</strong> ¥{selectedOrder.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
