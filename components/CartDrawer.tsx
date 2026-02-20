import React, { useState } from 'react';
import { X, Trash2, FileText, Send, ShoppingBag, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity?: (index: number, quantity: number) => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  cart, 
  onRemoveItem,
  onUpdateQuantity 
}) => {
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (onUpdateQuantity && newQuantity >= 1) {
      onUpdateQuantity(index, newQuantity);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 - 点击关闭 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* Popover 弹窗 - 响应式位置 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-x-2 bottom-2 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[400px] md:w-[450px] max-h-[85vh] sm:max-h-[80vh] z-[101] bg-white border-2 sm:border-4 border-black rounded-xl sm:rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()} // 防止点击内部关闭
      >
        {/* 头部 */}
        <div className="p-3 sm:p-4 bg-yellow-400 border-b-2 sm:border-b-4 border-black flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-black text-white rounded-lg sm:rounded-xl border-2 border-black">
              <ShoppingBag size={18} className="sm:w-5 sm:h-5" strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">购物车</h2>
              <p className="text-[10px] sm:text-xs font-bold text-gray-700">
                {cart.length} 件商品
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 sm:p-2 bg-white hover:bg-red-400 rounded-lg sm:rounded-xl transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            aria-label="关闭购物车"
          >
            <X size={18} className="sm:w-5 sm:h-5" strokeWidth={3} />
          </button>
        </div>

        {/* 游客提示 */}
        {isGuest && cart.length > 0 && (
          <div className="px-3 sm:px-4 py-2 sm:py-3 bg-orange-100 border-b-2 border-black text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className="text-base sm:text-lg">⚠️</span>
            <span className="truncate">游客模式，请登录以保存购物车</span>
          </div>
        )}

        {/* 商品列表 - 可滚动 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 sm:border-4 border-gray-300 mb-3 sm:mb-4">
                <ShoppingBag size={32} className="sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <p className="font-black text-base sm:text-lg text-gray-800">购物车是空的</p>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1 sm:mt-2">
                快去挑选喜欢的商品吧！
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {cart.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative flex gap-2 sm:gap-3 p-2 sm:p-3 border-2 sm:border-4 border-black rounded-lg sm:rounded-xl bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-all"
                >
                  {/* 商品图片 */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl border-2 border-black overflow-hidden shrink-0 bg-gray-100">
                    <img 
                      src={item.image} 
                      alt={item.productTitle} 
                      className="w-full h-full object-cover" 
                    />
                  </div>

                  {/* 商品信息 */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm line-clamp-1">{item.productTitle}</h3>
                      <p className="text-[10px] sm:text-xs font-medium text-gray-600 mt-0.5 sm:mt-1 line-clamp-1">
                        {item.variantName}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-1 sm:mt-2">
                      <span className="font-black text-sm sm:text-base text-yellow-600">
                        ¥{(item.price * item.quantity).toFixed(2)}
                      </span>
                      
                      {/* 数量调整 */}
                      {onUpdateQuantity && (
                        <div className="flex items-center gap-0.5 sm:gap-1 border-2 border-black bg-white rounded-md sm:rounded-lg overflow-hidden">
                          <button
                            onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-0.5 sm:p-1 hover:bg-yellow-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="减少数量"
                          >
                            <Minus size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={3} />
                          </button>
                          <span className="font-black text-xs sm:text-sm w-6 sm:w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                            className="p-0.5 sm:p-1 hover:bg-yellow-400 transition-colors"
                            aria-label="增加数量"
                          >
                            <Plus size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={3} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 删除按钮 */}
                  <button 
                    onClick={() => onRemoveItem(idx)}
                    className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 p-1 sm:p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-md sm:rounded-lg transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    aria-label="移除商品"
                  >
                    <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={3} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 - 总价和结算按钮 */}
        {cart.length > 0 && (
          <div className="p-3 sm:p-4 border-t-2 sm:border-t-4 border-black bg-white shrink-0">
            <div className="flex justify-between items-baseline mb-3 sm:mb-4">
              <span className="text-gray-600 font-bold text-xs sm:text-sm uppercase tracking-wider">总计</span>
              <div className="flex items-baseline gap-0.5 sm:gap-1">
                <span className="text-xs sm:text-sm font-black">¥</span>
                <span className="text-2xl sm:text-3xl font-black text-black">{total.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              className="w-full bg-yellow-400 text-black py-3 sm:py-4 rounded-lg sm:rounded-xl font-black text-base sm:text-lg hover:bg-yellow-500 transition-all border-2 sm:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] sm:active:translate-x-[4px] sm:active:translate-y-[4px] flex items-center justify-center gap-2"
            >
              <span>去结算</span>
              <Send size={18} className="sm:w-5 sm:h-5" strokeWidth={3} />
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default CartDrawer;

