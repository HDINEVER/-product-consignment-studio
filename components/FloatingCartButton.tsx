import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingCartButtonProps {
  cartCount: number;
  onClick: () => void;
  isCartOpen: boolean;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ 
  cartCount, 
  onClick,
  isCartOpen 
}) => {
  if (isCartOpen) return null; // 购物车打开时隐藏悬浮按钮
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-8 right-8 z-40"
    >
      <button
        onClick={onClick}
        className="relative group px-6 py-4 bg-yellow-400 text-black font-black text-lg border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center gap-3"
        aria-label="打开购物车"
      >
        <ShoppingCart size={28} strokeWidth={3} />
        
        {/* 商品数量徽章 */}
        {cartCount > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[32px] h-8 px-2 bg-red-500 text-white font-black text-sm border-4 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {cartCount > 99 ? '99+' : cartCount}
          </div>
        )}
        
        {/* Hover 提示文字 */}
        <motion.span
          initial={{ width: 0, opacity: 0 }}
          whileHover={{ width: 'auto', opacity: 1 }}
          className="overflow-hidden whitespace-nowrap"
        >
          查看购物车
        </motion.span>
        
        <ArrowRight 
          size={20} 
          strokeWidth={3} 
          className="group-hover:translate-x-1 transition-transform"
        />
      </button>
    </motion.div>
  );
};

export default FloatingCartButton;
