import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Package } from 'lucide-react';
import { cartAPI } from '../utils/api';
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
    stock_quantity: number;
    variant_values?: Record<string, string>;
  };
  subtotal: number;
}

interface Cart {
  items: CartItem[];
  total_amount: number;
  total_items: number;
}

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.data);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      setUpdating(itemId);
      await cartAPI.updateCartItem(itemId, newQuantity);
      await loadCart();
    } catch (error: any) {
      alert(error.message || '更新失败');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: number) => {
    if (!confirm('确定要删除这个商品吗？')) return;
    
    try {
      setUpdating(itemId);
      await cartAPI.deleteCartItem(itemId);
      await loadCart();
    } catch (error: any) {
      alert(error.message || '删除失败');
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    if (!confirm('确定要清空购物车吗？')) return;
    
    try {
      setLoading(true);
      await cartAPI.clearCart();
      await loadCart();
    } catch (error: any) {
      alert(error.message || '清空失败');
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      alert('购物车是空的');
      return;
    }
    navigate('/checkout');
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

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-bold">继续购物</span>
            </button>
            
            <h1 className="text-3xl font-black flex items-center gap-3">
              <ShoppingBag size={32} />
              购物车
              {!isEmpty && (
                <span className="px-3 py-1 bg-yellow-400 border-2 border-black rounded-full text-lg">
                  {cart.total_items}
                </span>
              )}
            </h1>
            
            {!isEmpty && (
              <button
                onClick={clearCart}
                className="text-sm text-red-500 hover:text-red-700 font-bold underline"
              >
                清空购物车
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isEmpty ? (
          // 空购物车
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="bg-white border-4 border-black rounded-3xl p-12 inline-block shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <Package size={80} className="mx-auto mb-6 text-gray-300" />
              <h2 className="text-2xl font-black mb-4">购物车是空的</h2>
              <p className="text-gray-600 mb-6">快去挑选心仪的商品吧！</p>
              <AnimatedButton
                onClick={() => navigate('/')}
                className="bg-yellow-400"
              >
                去逛逛
              </AnimatedButton>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 商品列表 */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {cart.items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="flex gap-6">
                      {/* 商品图片 */}
                      <Link
                        to={`/product/${item.product.id}`}
                        className="flex-shrink-0"
                      >
                        <div className="w-24 h-24 bg-gray-100 border-3 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>

                      {/* 商品信息 */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${item.product.id}`}
                          className="font-bold text-lg hover:text-blue-600 transition-colors block mb-2"
                        >
                          {item.product.name}
                        </Link>
                        
                        {item.sku.variant_values && Object.keys(item.sku.variant_values).length > 0 && (
                          <div className="flex gap-2 mb-3">
                            {Object.entries(item.sku.variant_values).map(([key, value]) => (
                              <span
                                key={key}
                                className="px-2 py-1 bg-gray-100 border-2 border-black rounded-lg text-xs font-bold"
                              >
                                {value}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          {/* 价格 */}
                          <div className="text-2xl font-black">
                            ¥{item.sku.price.toFixed(2)}
                          </div>

                          {/* 数量控制 */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={updating === item.id || item.quantity <= 1}
                              className="w-8 h-8 bg-white border-2 border-black rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-1 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                              <Minus size={16} className="mx-auto" />
                            </button>
                            
                            <span className="w-12 text-center font-bold text-lg">
                              {item.quantity}
                            </span>
                            
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={updating === item.id || item.quantity >= item.sku.stock_quantity}
                              className="w-8 h-8 bg-white border-2 border-black rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-1 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                              <Plus size={16} className="mx-auto" />
                            </button>
                          </div>

                          {/* 删除按钮 */}
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={updating === item.id}
                            className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                            title="删除"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>

                        {/* 小计 */}
                        <div className="mt-3 pt-3 border-t-2 border-gray-200 text-right">
                          <span className="text-sm text-gray-600">小计：</span>
                          <span className="ml-2 text-xl font-black text-yellow-600">
                            ¥{item.subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* 结算栏 */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                >
                  <h3 className="font-black text-xl mb-4">订单摘要</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">商品数量</span>
                      <span className="font-bold">{cart.total_items} 件</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">商品总价</span>
                      <span className="font-bold">¥{cart.total_amount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-green-600">
                      <span>运费</span>
                      <span className="font-bold">免运费</span>
                    </div>
                    
                    <div className="border-t-3 border-black pt-3 mt-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-bold">合计</span>
                        <div className="text-right">
                          <span className="text-sm">¥</span>
                          <span className="text-3xl font-black text-yellow-600">
                            {cart.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatedButton
                    onClick={handleCheckout}
                    className="w-full bg-yellow-400 text-lg"
                  >
                    去结算
                  </AnimatedButton>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    点击结算表示您已同意 <span className="underline">服务条款</span>
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
