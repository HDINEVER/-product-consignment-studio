import React, { useRef, useState, useEffect } from 'react';
import { ShoppingCart, Heart, Star, X, Check } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  isFavorited?: boolean;
  onSelect?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
}

export default function ProductCard({
  product,
  isAdmin = false,
  isFavorited = false,
  onSelect,
  onAddToCart,
  onToggleFavorite,
}: ProductCardProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const [status, setStatus] = useState<'idle' | 'ordered' | 'rated'>('idle');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 防重复评分：服务器端优先（已登录），localStorage 作为游客降级
  const [alreadyRated, setAlreadyRated] = useState(() =>
    localStorage.getItem(`rated_${product.id}`) === 'true'
  );
  const { submitProductRating } = useProducts();
  const { user } = useAuth();

  // 评分成功后 1.5s 自动返回产品卡片
  useEffect(() => {
    if (status !== 'rated') return;
    const timer = setTimeout(() => {
      setStatus('idle');
      setRating(0);
    }, 1500);
    return () => clearTimeout(timer);
  }, [status]);

  const handleOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStatus('ordered');
    onAddToCart?.(product);
  };

  const submitRating = async (e: React.MouseEvent, val: number) => {
    e.stopPropagation();
    if (isSubmitting || alreadyRated) return;
    
    setIsSubmitting(true);
    setRating(val);
    
    // 传入 userId，服务器端防重复（游客时 userId 为 undefined，仅用 localStorage）
    const result = await submitProductRating(product.id, val, user?.$id);
    
    setIsSubmitting(false);
    if (result === 'success') {
      localStorage.setItem(`rated_${product.id}`, 'true');
      setAlreadyRated(true);
      setStatus('rated');
    } else if (result === 'already_rated') {
      // 服务器端确认已评过，同步本地状态
      localStorage.setItem(`rated_${product.id}`, 'true');
      setAlreadyRated(true);
    } else {
      // error：重置，让用户重试
      setRating(0);
    }
  };

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
        active:translate-x-[5px] active:translate-y-[5px]
        active:shadow-[2px_2px_0_0_#000] sm:active:shadow-[2px_2px_0_0_#000]
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
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite?.(product.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="no-drag absolute top-3 left-3 sm:top-4 sm:left-4 z-20 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border-2 border-black rounded-full shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] sm:active:translate-x-[3px] sm:active:translate-y-[3px] transition-all"
          aria-label={isFavorited ? "取消收藏" : "收藏"}
          title={isFavorited ? "取消收藏" : "收藏"}
        >
          <Heart 
            size={14} 
            className={`sm:w-[18px] sm:h-[18px] transition-colors ${isFavorited ? 'text-pink-500' : 'text-gray-400'}`}
            fill={isFavorited ? "#ec4899" : "none"} 
            stroke={isFavorited ? "#ec4899" : "currentColor"} 
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
              <span className="font-bold text-xs sm:text-sm">{(product.rating || 5).toFixed(1)}</span>
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

            {/* 购买按钮或状态 */}
            {status === 'idle' ? (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  handleOrder(e);
                }}
              className={`no-drag
                relative flex items-center gap-1.5 sm:gap-2 
                px-3 py-1.5 sm:px-4 sm:py-2 
                bg-black text-white font-bold rounded-lg
                border-2 border-black 
                shadow-[3px_3px_0_0_#000] sm:shadow-[4px_4px_0_0_#000]
                hover:translate-x-[-2px] hover:translate-y-[-2px] 
                hover:shadow-[5px_5px_0_0_#000] sm:hover:shadow-[6px_6px_0_0_#000]
                active:shadow-none
                active:translate-x-[3px] active:translate-y-[3px] 
                sm:active:translate-x-[4px] sm:active:translate-y-[4px]
                transition-all overflow-hidden group/btn
              `}
            >
              {/* 扫光效果 */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                <ShoppingCart size={14} className="sm:w-[18px] sm:h-[18px]" />
                <span className="text-xs sm:text-sm">ORDER</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 text-green-600 font-black text-xs sm:text-sm italic animate-bounce">
                <Check size={16} className="sm:w-5 sm:h-5" strokeWidth={3} />
                ORDERED
              </div>
            )}
          </div>
        </div>

        {/* 评分覆盖层 (下单后显示) */}
        {status === 'ordered' && (
          <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300 cursor-default" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={(e) => { e.stopPropagation(); setStatus('rated'); }}
              title="关闭"
              aria-label="关闭评分"
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-black hover:scale-110 transition-transform"
            >
              <X size={20} className="sm:w-[24px] sm:h-[24px]" strokeWidth={3} />
            </button>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${accent} border-2 border-black rounded-full flex items-center justify-center mb-4 shadow-[4px_4px_0_0_#000]`}>
              <Star size={20} className="sm:w-[24px] sm:h-[24px]" fill="white" stroke="black" strokeWidth={2} />
            </div>
            <h4 className="font-black text-base sm:text-lg mb-1 italic uppercase">Rate this product</h4>
            <p className="text-[10px] sm:text-xs font-bold text-gray-500 mb-6 uppercase tracking-widest">Share your experience</p>
            
            <div className="flex gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onTouchStart={() => setHoverRating(star)}
                  onTouchEnd={() => setHoverRating(0)}
                  onClick={(e) => submitRating(e, star)}
                  disabled={alreadyRated || isSubmitting}
                  title={`评${star}星`}
                  aria-label={`评${star}星`}
                  className={`transition-transform hover:scale-125 active:scale-90 ${
                    alreadyRated ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Star 
                    size={28} 
                    className="sm:w-[32px] sm:h-[32px]"
                    fill={star <= (hoverRating || rating) ? "#000" : "none"} 
                    stroke="black"
                    strokeWidth={2.5}
                  />
                </button>
              ))}
            </div>
            {alreadyRated && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest -mt-4 mb-4">已评分</p>
            )}

            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">Your feedback helps the community</p>
          </div>
        )}

        {/* 评分成功：短暂 toast 反馈，1.5s 后自动关闭 */}
        {status === 'rated' && (
          <div className="absolute inset-0 z-30 bg-black/90 text-white flex flex-col items-center justify-center gap-2 animate-in zoom-in duration-200 cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="text-3xl animate-bounce">⭐</div>
            <p className="font-black text-sm sm:text-base italic uppercase tracking-wider">Thanks for rating!</p>
          </div>
        )}

        {/* 装饰角 */}
        <div className="absolute -bottom-1.5 sm:-bottom-2 -right-1.5 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-black rotate-45 z-0" />
      </div>
      
    </div>
  );
}
