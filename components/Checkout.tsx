import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, CreditCard, Package, CheckCircle, Plus, Loader, AlertCircle } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS, Query, ID, Permission, Role } from '../lib/appwrite';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../hooks/useCart';
import AnimatedButton from './AnimatedButton';

// ========== 类型定义 ==========
interface Address {
  $id: string;
  user_id: string;
  contact_name: string;
  contact_phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  zipcode?: string;
  is_default: boolean;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  
  // 新地址表单
  const [newAddress, setNewAddress] = useState({
    contact_name: '',
    contact_phone: '',
    province: '',
    city: '',
    district: '',
    address: '',
    zipcode: '',
    is_default: false,
  });
  
  const [remark, setRemark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wechat');

  // ========== 检查登录状态 ==========
  useEffect(() => {
    if (isGuest) {
      alert('请先登录后再结算');
      navigate('/');
      return;
    }
    
    if (cartItems.length === 0) {
      alert('购物车是空的');
      navigate('/cart');
      return;
    }
    
    loadAddresses();
  }, [isGuest, cartItems.length, navigate]);

  // ========== 加载收货地址 ==========
  const loadAddresses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ADDRESSES,
        [
          Query.equal('user_id', user.$id),
          Query.orderDesc('is_default'),
        ]
      );

      const fetchedAddresses = response.documents as unknown as Address[];
      setAddresses(fetchedAddresses);
      
      // 自动选择默认地址
      const defaultAddress = fetchedAddresses.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.$id);
      } else if (fetchedAddresses.length > 0) {
        setSelectedAddressId(fetchedAddresses[0].$id);
      }
    } catch (err: any) {
      console.error('❌ 加载地址失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // ========== 添加新地址 ==========
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // 验证表单
    if (!newAddress.contact_name || !newAddress.contact_phone || !newAddress.address) {
      alert('请填写必填项');
      return;
    }

    try {
      const addressDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ADDRESSES,
        ID.unique(),
        {
          user_id: user.$id,
          ...newAddress,
          created_at: new Date().toISOString(),
        },
        [
          // 行级安全：只有该用户可以读取、更新、删除
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );

      console.log('✅ 地址添加成功');
      
      // 刷新地址列表
      await loadAddresses();
      
      // 自动选择新地址
      setSelectedAddressId(addressDoc.$id);
      
      // 关闭表单
      setShowAddressForm(false);
      
      // 重置表单
      setNewAddress({
        contact_name: '',
        contact_phone: '',
        province: '',
        city: '',
        district: '',
        address: '',
        zipcode: '',
        is_default: false,
      });
    } catch (err: any) {
      console.error('❌ 添加地址失败:', err);
      alert(err.message || '添加地址失败');
    }
  };

  // ========== 提交订单 ==========
  const handleSubmitOrder = async () => {
    if (!user) return;
    
    // 验证
    if (cartItems.length === 0) {
      alert('购物车是空的');
      return;
    }
    
    if (!selectedAddressId) {
      alert('请选择收货地址');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('📝 开始创建订单...');
      
      const selectedAddress = addresses.find(addr => addr.$id === selectedAddressId);
      if (!selectedAddress) {
        throw new Error('地址不存在');
      }

      // 1️⃣ 创建订单主表
      const order = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        ID.unique(),
        {
          user_id: user.$id,
          status: 'pending',
          total_amount: cartTotal,
          payment_method: paymentMethod,
          remark: remark,
          
          // 收货地址快照
          shipping_contact_name: selectedAddress.contact_name,
          shipping_contact_phone: selectedAddress.contact_phone,
          shipping_province: selectedAddress.province,
          shipping_city: selectedAddress.city,
          shipping_district: selectedAddress.district,
          shipping_address: selectedAddress.address,
          shipping_zipcode: selectedAddress.zipcode || '',
          
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        [
          // 行级安全：只有该用户可以读取、更新
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
        ]
      );

      console.log('✅ 订单创建成功:', order.$id);

      // 2️⃣ 创建订单明细
      await Promise.all(
        cartItems.map((item) =>
          databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.ORDER_ITEMS,
            ID.unique(),
            {
              order_id: order.$id,
              product_id: item.productId,
              product_name: item.productTitle,
              product_image: item.image,
              variant_name: item.variantName || '',
              price: item.price,  // 价格快照
              quantity: item.quantity,
              created_at: new Date().toISOString(),
            },
            [
              Permission.read(Role.user(user.$id)),
            ]
          )
        )
      );

      console.log('✅ 订单明细创建成功');

      // 3️⃣ 清空购物车
      await clearCart();
      console.log('✅ 购物车已清空');

      // 成功提示并跳转
      alert('🎉 订单提交成功！');
      navigate(`/orders/${order.$id}`);
    } catch (err: any) {
      console.error('❌ 订单提交失败:', err);
      setError(err.message || '订单提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-gray-600 font-bold text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header */}
      <div className="bg-white border-b-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors font-bold"
          >
            <ArrowLeft size={20} />
            返回购物车
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 错误提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-400 border-4 border-black p-4 mb-6 flex items-center gap-3"
          >
            <AlertCircle size={24} />
            <p className="font-bold">{error}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：地址和订单信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 收货地址 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="flex items-center gap-2 text-2xl font-black">
                  <MapPin size={24} />
                  收货地址
                </h2>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  <Plus size={18} />
                  新增地址
                </button>
              </div>

              {/* 新增地址表单 */}
              <AnimatePresence>
                {showAddressForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddAddress}
                    className="bg-yellow-50 border-4 border-black p-4 mb-6"
                  >
                    <h3 className="font-black text-lg mb-4">新增收货地址</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold mb-2">收货人 *</label>
                        <input
                          type="text"
                          required
                          value={newAddress.contact_name}
                          onChange={(e) => setNewAddress({ ...newAddress, contact_name: e.target.value })}
                          className="w-full px-4 py-2 border-4 border-black font-bold focus:outline-none focus:bg-white"
                          placeholder="请输入收货人姓名"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-2">手机号 *</label>
                        <input
                          type="tel"
                          required
                          value={newAddress.contact_phone}
                          onChange={(e) => setNewAddress({ ...newAddress, contact_phone: e.target.value })}
                          className="w-full px-4 py-2 border-4 border-black font-bold focus:outline-none focus:bg-white"
                          placeholder="请输入手机号"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-2">省份 *</label>
                        <input
                          type="text"
                          required
                          value={newAddress.province}
                          onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                          className="w-full px-4 py-2 border-4 border-black font-bold focus:outline-none focus:bg-white"
                          placeholder="请输入省份"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-2">城市 *</label>
                        <input
                          type="text"
                          required
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="w-full px-4 py-2 border-4 border-black font-bold focus:outline-none focus:bg-white"
                          placeholder="请输入城市"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block font-bold mb-2">详细地址 *</label>
                        <textarea
                          required
                          value={newAddress.address}
                          onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                          className="w-full px-4 py-2 border-4 border-black font-bold focus:outline-none focus:bg-white resize-none"
                          rows={3}
                          placeholder="请输入详细地址（街道、楼栋、门牌号等）"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-black text-white font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        保存地址
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="px-4 py-2 bg-white text-black font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        取消
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* 地址列表 */}
              {addresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-bold">还没有收货地址，请添加</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.$id}
                      className={`block p-4 border-4 border-black cursor-pointer transition-all ${
                        selectedAddressId === addr.$id
                          ? 'bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          value={addr.$id}
                          checked={selectedAddressId === addr.$id}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black">{addr.contact_name}</span>
                            <span className="font-bold text-gray-600">{addr.contact_phone}</span>
                            {addr.is_default && (
                              <span className="px-2 py-0.5 bg-red-400 text-white text-xs font-bold border border-black">
                                默认
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-gray-700">
                            {addr.province} {addr.city} {addr.district} {addr.address}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </motion.div>

            {/* 支付方式 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <h2 className="flex items-center gap-2 text-2xl font-black mb-6">
                <CreditCard size={24} />
                支付方式
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'alipay', label: '支付宝', icon: '💳' },
                  { value: 'wechat', label: '微信支付', icon: '💚' },
                  { value: 'cod', label: '货到付款', icon: '📦' },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center gap-3 p-4 border-4 border-black cursor-pointer transition-all ${
                      paymentMethod === method.value
                        ? 'bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-2xl">{method.icon}</span>
                    <span className="font-bold">{method.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>

            {/* 订单备注 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <h2 className="text-2xl font-black mb-4">订单备注</h2>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:bg-yellow-50 resize-none"
                rows={4}
                placeholder="给卖家留言（选填）"
              />
            </motion.div>
          </div>

          {/* 右侧：订单汇总 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-8"
            >
              <h2 className="flex items-center gap-2 text-2xl font-black mb-6">
                <Package size={24} />
                订单汇总
              </h2>

              {/* 商品列表 */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 border-2 border-black p-3 bg-gray-50">
                    <div className="w-16 h-16 border-2 border-black overflow-hidden shrink-0 bg-white">
                      <img src={item.image} alt={item.productTitle} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-sm line-clamp-1">{item.productTitle}</h3>
                      <p className="text-xs text-gray-600 font-bold">{item.variantName}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="font-bold text-sm">¥{item.price}</span>
                        <span className="text-xs text-gray-500">x{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 价格明细 */}
              <div className="border-t-4 border-black pt-4 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>商品总计</span>
                  <span>¥{cartTotal}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-600">
                  <span>运费</span>
                  <span>待计算</span>
                </div>
                <div className="flex justify-between text-2xl font-black pt-2 border-t-2 border-black">
                  <span>合计</span>
                  <span className="text-red-600">¥{cartTotal}</span>
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                onClick={handleSubmitOrder}
                disabled={submitting || !selectedAddressId}
                className="w-full mt-6 px-6 py-4 bg-yellow-400 text-black font-black text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="animate-spin" size={20} />
                    提交中...
                  </span>
                ) : (
                  '🚀 提交订单'
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
