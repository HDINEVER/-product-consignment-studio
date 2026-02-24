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
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40"
    >
      <button
        onClick={onClick}
        className="relative group px-5 py-4 sm:px-6 sm:py-4 bg-yellow-400 text-black font-black text-base sm:text-lg border-3 sm:border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] sm:active:translate-x-[6px] sm:active:translate-y-[6px] transition-all flex items-center gap-3 touch-target min-h-[56px] min-w-[56px]"
        aria-label="打开购物车"
        style={{ WebkitTapHighlightColor: 'transparent' }}
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
