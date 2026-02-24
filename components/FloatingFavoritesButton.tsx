import React from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingFavoritesButtonProps {
  favoriteCount: number;
  onClick: () => void;
  isFavoritesOpen: boolean;
}

const FloatingFavoritesButton: React.FC<FloatingFavoritesButtonProps> = ({ 
  favoriteCount, 
  onClick,
  isFavoritesOpen 
}) => {
  if (isFavoritesOpen) return null; // 收藏夹打开时隐藏悬浮按钮
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed bottom-[102px] right-6 sm:bottom-[116px] sm:right-8 z-40"
    >
      <button
        onClick={onClick}
        className="relative group px-5 py-4 sm:px-6 sm:py-4 bg-pink-400 text-white font-black text-base sm:text-lg border-3 sm:border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] sm:active:translate-x-[6px] sm:active:translate-y-[6px] transition-all flex items-center gap-3 touch-target min-h-[56px] min-w-[56px]"
        aria-label="打开收藏夹"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <Heart size={28} strokeWidth={3} className="fill-white" />
        
        {/* 收藏数量徽章 */}
        {favoriteCount > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[32px] h-8 px-2 bg-red-500 text-white font-black text-sm border-4 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {favoriteCount > 99 ? '99+' : favoriteCount}
          </div>
        )}
        
        {/* Hover 提示文字 */}
        <motion.span
          initial={{ width: 0, opacity: 0 }}
          whileHover={{ width: 'auto', opacity: 1 }}
          className="overflow-hidden whitespace-nowrap"
        >
          我的收藏
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

export default FloatingFavoritesButton;
