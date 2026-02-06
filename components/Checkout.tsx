import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CreditCard, Package, CheckCircle } from 'lucide-react';
import { cartAPI, orderAPI } from '../utils/api';
import AnimatedButton from './AnimatedButton';

interface CartItem {
  id: number;
  sku_id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    image: string;
  };
  sku: {
    sku_code: string;
    price: number;
    variant_values?: Record<string, string>;
  };
  subtotal: number;
}

interface Cart {
  items: CartItem[];
  total_amount: number;
}

interface ShippingAddress {
  contact_name: string;
  contact_phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  zipcode: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    contact_name: '',
    contact_phone: '',
    province: '',
    city: '',
    district: '',
    address: '',
    zipcode: '',
  });
  
  const [paymentMethod, setPaymentMethod] = useState('alipay');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      if (!response.data || response.data.items.length === 0) {
        alert('购物车是空的');
        navigate('/cart');
        return;
      }
      setCart(response.data);
    } catch (error) {
      console.error('Failed to load cart:', error);
      alert('加载购物车失败');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cart || cart.items.length === 0) {
      alert('购物车是空的');
      return;
    }

    // 验证表单
    if (!shippingAddress.contact_name) {
      alert('请填写收货人姓名');
      return;
    }
    if (!shippingAddress.contact_phone || !/^1[3-9]\d{9}$/.test(shippingAddress.contact_phone)) {
      alert('请填写正确的手机号');
      return;
    }
    if (!shippingAddress.province || !shippingAddress.city || !shippingAddress.address) {
      alert('请填写完整的收货地址');
      return;
    }

    try {
      setSubmitting(true);
      
      const orderData = {
        items: cart.items.map(item => ({
          sku_id: item.sku_id,
          quantity: item.quantity,
          price: item.sku.price,
        })),
        shipping_address: shippingAddress,
        remark,
        payment_method: paymentMethod,
      };

      const response = await orderAPI.createOrder(orderData);
      
      // 订单创建成功
      alert('订单提交成功！');
      navigate(`/orders/${response.data.id}`);
    } catch (error: any) {
      alert(error.message || '订单提交失败');
    } finally {
      setSubmitting(false);
    }
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

  if (!cart) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-bold">返回购物车</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：表单 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 收货地址 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <h2 className="flex items-center gap-2 text-2xl font-black mb-6">
                <MapPin size={24} />
                收货地址
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-2">收货人 *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.contact_name}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, contact_name: e.target.value })}
                    className="w-full px-4 py-3 border-3 border-black rounded-xl font-medium focus:ring-4 focus:ring-yellow-400 outline-none transition-all"
                    placeholder="请输入收货人姓名"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">手机号 *</label>
                  <input
                    type="tel"
                    required
                    pattern="^1[3-9]\d{9}$"
                    value={shippingAddress.contact_phone}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, contact_phone: e.target.value })}
                    className="w-full px-4 py-3 border-3 border-black rounded-xl font-medium focus:ring-4 focus:ring-yellow-400 outline-none transition-all"
                    placeholder="请输入手机号"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">省份 *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.province}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, province: e.target.value })}
                    className="w-full px-4 py-3 border-3 border-black rounded-xl font-medium focus:ring-4 focus:ring-yellow-400 outline-none transition-all"
                    placeholder="请输入省份"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">城市 *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    className="w-full px-4 py-3 border-3 border-black rounded-xl font-medium focus:ring-4 focus:ring-yellow-400 outline-none transition-all"
                    placeholder="请输入城市"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">区/县</label>
                  <input
                    type="text"
                    value={shippingAddress.district}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, district: e.target.value })}
                    className="w-full px-4 py-3 border-3 border-black rounded-xl font-medium focus:ring-4 focus:ring-yellow-400 outline-none transition-all"
                    placeholder="请输入区/县"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">邮编</label>
                  <input
                    type="text"
                    value={shippingAddress.zipcode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, zipcode: e.target.value })}
                    className="w-full px-4 py-3 border-3 border-black rounded-xl font-medium focus:ring-4 focus:ring-yellow-400 outline-none transition-all"
                    placeholder="请输入邮编"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold mb-2">详细地址 *</label>
                  <textarea
                    required
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    className="w-full px-4 py-3 border-3 border-black rounded-xl font-medium focus:ring-4 focus:ring-yellow-400 outline-none transition-all resize-none"
                    rows={3}
                    placeholder="请输入详细地址（街道、楼栋、门牌号等）"
                  />
                </div>
              </div>
            </motion.div>

            {/* 支付方式 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
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
                    className={`flex items-center gap-3 p-4 border-3 border-black rounded-xl cursor-pointer transition-all ${
                      paymentMethod === method.value
                        ? 'bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] scale-105'
                        : 'bg-white hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5"
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
              className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <h2 className="text-2xl font-black mb-4">订单备注</h2>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full px-4 py-3 border-3 border-black rounded-xl font-medium focus:ring-4 focus:ring-yellow-400 outline-none transition-all resize-none"
                rows={3}
                placeholder="如有特殊需求，请在此备注（选填）"
              />
            </motion.div>
          </div>

          {/* 右侧：订单摘要 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* 商品清单 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
              >
                <h3 className="flex items-center gap-2 font-black text-xl mb-4">
                  <Package size={20} />
                  商品清单
                </h3>

                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 border-2 border-black rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.product.name}</p>
                        {item.sku.variant_values && (
                          <p className="text-xs text-gray-600">
                            {Object.values(item.sku.variant_values).join(' / ')}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm">×{item.quantity}</span>
                          <span className="font-bold">¥{item.subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t-3 border-black pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">商品总价</span>
                    <span className="font-bold">¥{cart.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>运费</span>
                    <span className="font-bold">免运费</span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-2 flex justify-between items-baseline">
                    <span className="text-lg font-bold">应付总额</span>
                    <div>
                      <span className="text-sm">¥</span>
                      <span className="text-3xl font-black text-yellow-600">
                        {cart.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 提交按钮 */}
              <AnimatedButton
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-400 text-lg flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    提交中...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    提交订单
                  </>
                )}
              </AnimatedButton>

              <p className="text-xs text-gray-500 text-center">
                点击提交订单表示您已阅读并同意
                <br />
                <span className="underline">用户协议</span> 和 <span className="underline">隐私政策</span>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
