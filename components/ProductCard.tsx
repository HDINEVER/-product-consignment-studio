import React, { useRef, useState } from 'react';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  onSelect?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({
  product,
  isAdmin = false,
  onSelect,
  onAddToCart,
}: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // 根据productAttribute获取标签文本和样式
  const getTagConfig = () => {
    if (!product.productAttribute) return null;
    
    const configs = {
      new: { text: 'NEW', color: 'bg-[#ff3e00]', accent: 'bg-[#00e0b0]' },
      hot: { text: 'HOT', color: 'bg-[#4d61ff]', accent: 'bg-[#ffd700]' },
      discount: { text: 'SALE', color: 'bg-[#00d084]', accent: 'bg-[#ff3e00]' }
    };
    
    return configs[product.productAttribute as keyof typeof configs];
  };

  const tagConfig = getTagConfig();
  const color = tagConfig?.color || 'bg-[#4d61ff]';
  const accent = tagConfig?.accent || 'bg-[#ffd700]';

  const handleTouchTap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' && touchStartRef.current) {
      const dx = Math.abs(e.clientX - touchStartRef.current.x);
      const dy = Math.abs(e.clientY - touchStartRef.current.y);
      if (dx < 10 && dy < 10) {
        onSelect?.(product);
      }
      touchStartRef.current = null;
    }
  };

  return (
    <div className="group relative w-full max-w-[320px] sm:max-w-[340px] lg:max-w-[360px] mx-auto">
      {/* 核心卡片容器 */}
      <div className={`
        relative w-full bg-white border-[3px] sm:border-[3.5px] border-black rounded-xl overflow-hidden
        transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)]
        shadow-[5px_5px_0_0_#000] sm:shadow-[7px_7px_0_0_#000]
        group-hover:translate-x-[-3px] group-hover:translate-y-[-3px]
        group-hover:shadow-[8px_8px_0_0_#000] sm:group-hover:shadow-[12px_12px_0_0_#000]
        active:translate-x-[2px] active:translate-y-[2px]
        active:shadow-[3px_3px_0_0_#000] sm:active:shadow-[4px_4px_0_0_#000]
        cursor-pointer
      `}
      onClick={() => onSelect?.(product)}
      onPointerDown={(e) => {
        if (e.pointerType === 'touch') {
          touchStartRef.current = { x: e.clientX, y: e.clientY };
        }
      }}
      onPointerUp={handleTouchTap}
      >
        
        {/* 顶部图案装饰层 */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* 网格背景 */}
          <div 
            className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-400" 
            style={{ 
              backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', 
              backgroundSize: '12px 12px' 
            }}
          />
          {/* 动态点状层 - 仅在Hover时更明显 */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-400"
            style={{ 
              backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', 
              backgroundSize: '16px 16px' 
            }}
          />
        </div>

        {/* 标签 - 仅在有productAttribute时显示 */}
        {tagConfig && (
          <div className={`
            absolute top-3 right-3 sm:top-4 sm:right-4 z-30 
            px-2.5 py-0.5 sm:px-3 sm:py-1 
            border-2 border-black font-black 
            text-[10px] sm:text-xs uppercase tracking-widest 
            ${accent} 
            shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000] 
            transform -rotate-2 
            group-hover:rotate-2 transition-transform
          `}>
            {tagConfig.text}
          </div>
        )}

        {/* 收藏按钮 */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border-2 border-black rounded-full shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          aria-label="收藏"
        >
          <Heart 
            size={14} 
            className="sm:w-[18px] sm:h-[18px]"
            fill={isLiked ? "#ff3e00" : "none"} 
            stroke={isLiked ? "#ff3e00" : "currentColor"} 
          />
        </button>

        {/* 产品图片区域 - 使用真实产品图片 */}
        <div className={`relative h-48 sm:h-56 ${color} border-b-[3px] sm:border-b-[3.5px] border-black flex items-center justify-center overflow-hidden`}>
          {/* 背景斜纹动画 */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{ 
              backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px)' 
            }}
          />
          
          {/* 产品图片 */}
          <img
            src={product.image}
            alt={product.title}
            className="relative z-10 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* 底部点状装饰图 */}
          <div className="absolute bottom-2 left-2 opacity-30 transform -rotate-12 scale-75">
            <svg width="60" height="30" viewBox="0 0 60 30">
              <circle cx="10" cy="10" r="3" fill="black" />
              <circle cx="30" cy="10" r="3" fill="black" />
              <circle cx="50" cy="10" r="3" fill="black" />
              <circle cx="20" cy="20" r="3" fill="black" />
              <circle cx="40" cy="20" r="3" fill="black" />
            </svg>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="relative z-10 p-4 sm:p-5 bg-white">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-black text-base sm:text-xl text-black truncate pr-4">
              {product.title}
            </h3>
            <div className="flex items-center gap-1">
              <Star size={12} className="sm:w-[14px] sm:h-[14px]" fill="#000" />
              <span className="font-bold text-xs sm:text-sm">4.8</span>
            </div>
          </div>
          
          {/* 分隔线 */}
          <div className="my-2 sm:my-3 border-t-2 border-dashed border-gray-200 relative">
            <span className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[9px] sm:text-[10px] text-gray-400">
              OFFICIAL
            </span>
          </div>

          <div className="flex items-end justify-between mt-3 sm:mt-4">
            <div className="relative">
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 block uppercase tracking-tighter">
                Price
              </span>
              <div className="relative inline-block">
                <span className="text-xl sm:text-2xl font-black text-black">
                  ¥{product.basePrice}
                </span>
                <div className={`absolute bottom-0.5 sm:bottom-1 left-0 w-full h-1.5 sm:h-2 ${accent} -z-10 opacity-60`} />
              </div>
            </div>

            {/* 购买按钮 */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(product);
              }}
              className={`
                relative flex items-center gap-1.5 sm:gap-2 
                px-3 py-1.5 sm:px-4 sm:py-2 
                bg-black text-white font-bold rounded-lg
                border-2 border-black 
                shadow-[3px_3px_0_0_#000] sm:shadow-[4px_4px_0_0_#000]
                hover:translate-x-[-2px] hover:translate-y-[-2px] 
                hover:shadow-[5px_5px_0_0_#000] sm:hover:shadow-[6px_6px_0_0_#000]
                active:translate-x-[1px] active:translate-y-[1px] 
                active:shadow-[2px_2px_0_0_#000]
                transition-all overflow-hidden group/btn
              `}
            >
              {/* 扫光效果 */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
              <ShoppingCart size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span className="text-xs sm:text-sm">BUY</span>
            </button>
          </div>
        </div>

        {/* 装饰角 */}
        <div className="absolute -bottom-1.5 sm:-bottom-2 -right-1.5 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-black rotate-45 z-0" />
      </div>
      
    </div>
  );
}
