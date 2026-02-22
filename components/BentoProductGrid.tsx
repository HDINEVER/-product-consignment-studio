import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../contexts/AuthContext';
import { LayoutGrid, LayoutDashboard, ListIcon, Edit, Trash2, Heart, ShoppingCart, Star, Check, X } from 'lucide-react';

interface BentoGridProps {
  products: Product[];
  isAdmin?: boolean;
  onProductSelect: (product: Product, element?: HTMLElement) => void;
  onAddToCart: (product: Product) => void;
  isFavorited?: (productId: string) => boolean;
  onToggleFavorite?: (productId: string) => void;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  onEditCategory?: (productId: string) => void;
  onEditIP?: (productId: string) => void;
  editingTag?: { productId: string; type: 'category' | 'ip' } | null;
  categories?: string[];
  ips?: string[];
  onCategoryChange?: (productId: string, value: string) => void;
  onIPChange?: (productId: string, value: string) => void;
  onTagBlur?: () => void;
  emptyMessage?: string;
}

type ViewMode = 'bento' | 'grid' | 'list';

export default function BentoProductGrid({
  products,
  isAdmin = false,
  onProductSelect,
  onAddToCart,
  isFavorited,
  onToggleFavorite,
  onEdit,
  onDelete,
  emptyMessage = '没有找到商品',
}: BentoGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isExpanded, setIsExpanded] = useState(false);
  const buttonGroupRef = React.useRef<HTMLDivElement>(null);

  // 监听外部点击以收缩按钮组
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonGroupRef.current && !buttonGroupRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-32 h-32 mb-6 bg-brutal-yellow/20 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
          <LayoutGrid size={48} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-black text-gray-600 mb-2">暂无商品</h3>
        <p className="text-gray-400 text-center max-w-md">{emptyMessage}</p>
      </div>
    );
  }

  // 管理员操作按钮（复用）
  const AdminButtons = ({ productId }: { productId: string }) =>
    isAdmin ? (
      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(productId); }}
          className="p-2 bg-brutal-yellow text-black rounded-lg border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:bg-yellow-400 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          title="编辑商品"
          aria-label="编辑商品"
        >
          <Edit size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(productId); }}
          className="p-2 bg-red-500 text-white rounded-lg border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:bg-red-600 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          title="删除商品"
          aria-label="删除商品"
        >
          <Trash2 size={14} />
        </button>
      </div>
    ) : null;

  return (
    <div className="relative">
      {/* 浮动视图切换按钮组 */}
      <div ref={buttonGroupRef} className="fixed bottom-45 sm:bottom-50 right-6 sm:right-8 z-40">
        <div className="flex flex-col gap-2 sm:gap-3 items-end">
          {isExpanded && (
            <>
              <button
                onClick={() => { setViewMode('bento'); setIsExpanded(false); }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-black flex items-center justify-center transition-all duration-200 touch-target active:scale-95 ${
                  viewMode === 'bento' ? 'bg-gray-200 text-black shadow-brutal' : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-brutal'
                }`}
                title="大图模式"
                aria-label="切换到大图模式"
              >
                <LayoutDashboard size={20} className="sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => { setViewMode('grid'); setIsExpanded(false); }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-black flex items-center justify-center transition-all duration-200 touch-target active:scale-95 ${
                  viewMode === 'grid' ? 'bg-gray-200 text-black shadow-brutal' : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-brutal'
                }`}
                title="小卡片模式"
                aria-label="切换到小卡片模式"
              >
                <LayoutGrid size={20} className="sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => { setViewMode('list'); setIsExpanded(false); }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-black flex items-center justify-center transition-all duration-200 touch-target active:scale-95 ${
                  viewMode === 'list' ? 'bg-gray-200 text-black shadow-brutal' : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-brutal'
                }`}
                title="列表布局"
                aria-label="切换到列表布局"
              >
                <ListIcon size={20} className="sm:w-6 sm:h-6" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-black flex items-center justify-center transition-all duration-200 touch-target active:scale-95 ${
              isExpanded ? 'bg-black text-white shadow-brutal' : 'bg-brutal-cyan text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-brutal'
            }`}
            title={isExpanded ? '收起' : '切换视图'}
            aria-label={isExpanded ? '收起视图选项' : '展开视图选项'}
          >
            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
              {isExpanded ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <>
                  {viewMode === 'bento' && <LayoutDashboard size={20} />}
                  {viewMode === 'grid' && <LayoutGrid size={20} />}
                  {viewMode === 'list' && <ListIcon size={20} />}
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Bento 大图模式：CSS Grid，特定卡片占两列 */}
      {viewMode === 'bento' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {products.map((product, i) => {
            const pIndex = i % 12;
            const isWide = pIndex === 0 || pIndex === 4 || pIndex === 9 || pIndex === 11;
            return (
              <div key={product.id} className={`relative group ${isWide ? 'col-span-2' : 'col-span-1'}`}>
                <ProductCard
                  product={product}
                  isAdmin={isAdmin}
                  isFavorited={isFavorited?.(product.id)}
                  onSelect={onProductSelect}
                  onAddToCart={onAddToCart}
                  onToggleFavorite={onToggleFavorite}
                />
                <AdminButtons productId={product.id} />
              </div>
            );
          })}
        </div>
      )}

      {/* Grid 小卡片模式：响应式多列，2→3→4→5 cols */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {products.map((product) => (
            <div key={product.id} className="relative group">
              <ProductCard
                product={product}
                isAdmin={isAdmin}
                isFavorited={isFavorited?.(product.id)}
                onSelect={onProductSelect}
                onAddToCart={onAddToCart}
                onToggleFavorite={onToggleFavorite}
              />
              <AdminButtons productId={product.id} />
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="flex flex-col gap-3 sm:gap-4">
          {products.map((product) => (
            <ListProductCard
              key={product.id}
              product={product}
              isAdmin={isAdmin}
              isFavorited={isFavorited?.(product.id)}
              onSelect={onProductSelect}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ListProductCardProps {
  product: Product;
  isAdmin?: boolean;
  isFavorited?: boolean;
  onSelect?: (product: Product, element?: HTMLElement) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
}

function ListProductCard({
  product,
  isAdmin,
  isFavorited = false,
  onSelect,
  onAddToCart,
  onToggleFavorite,
  onEdit,
  onDelete,
}: ListProductCardProps) {
  const [status, setStatus] = useState<'idle' | 'ordered' | 'rated'>('idle');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(() =>
    localStorage.getItem(`rated_${product.id}`) === 'true'
  );
  const { submitProductRating } = useProducts();
  const { user } = useAuth();

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
    const result = await submitProductRating(product.id, val, user?.$id);
    setIsSubmitting(false);
    if (result === 'success') {
      localStorage.setItem(`rated_${product.id}`, 'true');
      setAlreadyRated(true);
      setStatus('rated');
    } else if (result === 'already_rated') {
      localStorage.setItem(`rated_${product.id}`, 'true');
      setAlreadyRated(true);
    } else {
      setRating(0);
    }
  };

  return (
    <div
      className="group flex items-center bg-white rounded-xl sm:rounded-2xl border-[3px] sm:border-[3.5px] border-black shadow-[3px_3px_0_0_#000] sm:shadow-[5px_5px_0_0_#000] overflow-hidden hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_0_#000] sm:hover:shadow-[7px_7px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000] transition-all cursor-pointer relative duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
      onClick={(e) => onSelect?.(product, e.currentTarget as HTMLElement)}
    >
      <div className="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 bg-gray-100 overflow-hidden relative border-r-[3px] sm:border-r-[3.5px] border-black">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      <div className="flex-1 flex items-center justify-between p-2 sm:p-4 gap-2 sm:gap-4 relative z-10 bg-white">
        {/* 左侧主要信息 */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 flex-wrap">
            {product.category && (
              <span className="bg-brutal-yellow px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-black border-2 border-black rounded-md leading-none">
                {product.category}
              </span>
            )}
            {product.ip && (
              <span className="bg-brutal-blue text-white px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-black border-2 border-black rounded-md leading-none">
                {product.ip}
              </span>
            )}
          </div>
          <h3 className="font-black text-sm sm:text-lg line-clamp-1">{product.title}</h3>
          {product.description && (
            <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1 line-clamp-1 hidden sm:block">{product.description}</p>
          )}
        </div>

        {/* 右侧价格与操作 */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <span className="text-base sm:text-xl font-black mr-0 sm:mr-2">¥{product.basePrice}</span>
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(product.id); }}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={`no-drag relative z-20 p-1.5 sm:p-2 rounded-lg border-[2px] sm:border-[3px] border-black shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all text-sm ${
                isFavorited ? 'bg-white text-pink-500' : 'bg-white text-gray-400'
              }`}
              title={isFavorited ? '取消收藏' : '收藏'}
              aria-label={isFavorited ? '取消收藏' : '收藏'}
            >
              <Heart
                size={14}
                className={`sm:w-5 sm:h-5 transition-colors ${isFavorited ? 'text-pink-500' : 'text-gray-400'}`}
                fill={isFavorited ? '#ec4899' : 'none'}
                stroke={isFavorited ? '#ec4899' : 'currentColor'}
              />
            </button>
          )}
          {isAdmin && (
            <>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(product.id); }}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                title="编辑商品"
                aria-label="编辑商品"
                className="no-drag relative z-20 p-1.5 sm:p-2 bg-brutal-yellow rounded-lg border-[2px] sm:border-[3px] border-black shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000] hover:bg-yellow-400 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all text-sm hidden sm:block"
              >
                <Edit size={14} className="sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(product.id); }}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                title="删除商品"
                aria-label="删除商品"
                className="no-drag relative z-20 p-1.5 sm:p-2 bg-red-500 text-white rounded-lg border-[2px] sm:border-[3px] border-black shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000] hover:bg-red-600 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all text-sm hidden sm:block"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
              </button>
            </>
          )}
          {status === 'idle' ? (
            <button
              onClick={(e) => { e.preventDefault(); handleOrder(e); }}
              className="no-drag relative z-20 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-black text-white rounded-lg sm:rounded-xl border-[2px] sm:border-[3px] border-black font-bold shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-[10px] sm:text-sm flex items-center gap-1 sm:gap-1.5 overflow-hidden group/btn"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer pointer-events-none" />
              <ShoppingCart size={12} className="sm:w-[18px] sm:h-[18px]" />
              <span className="text-[10px] sm:text-sm">ORDER</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-green-600 font-black text-[10px] sm:text-sm italic animate-bounce pr-1">
              <Check size={14} className="sm:w-5 sm:h-5" strokeWidth={3} />
              ORDERED
            </div>
          )}
        </div>
      </div>

      {/* 评分覆盖层 */}
      {status === 'ordered' && (
        <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-300 cursor-default" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); setStatus('rated'); }}
            title="关闭"
            aria-label="关闭评分"
            className="absolute top-2 right-2 sm:top-3 sm:right-3 text-black hover:scale-110 transition-transform"
          >
            <X size={20} className="sm:w-[24px] sm:h-[24px]" strokeWidth={3} />
          </button>
          <div className="flex items-center gap-3 sm:gap-4 mb-2">
            <h4 className="font-black text-sm sm:text-base italic uppercase">Rate product</h4>
          </div>
          <div className="flex gap-1.5 sm:gap-2 mb-2">
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
                className={`transition-transform hover:scale-125 active:scale-90 p-1 ${alreadyRated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Star
                  size={20}
                  className="sm:w-[28px] sm:h-[28px]"
                  fill={star <= (hoverRating || rating) ? '#000' : 'none'}
                  stroke="black"
                  strokeWidth={2.5}
                />
              </button>
            ))}
          </div>
          {alreadyRated && (
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">已评分</p>
          )}
          <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Share your experience</p>
        </div>
      )}

      {status === 'rated' && (
        <div className="absolute inset-0 z-30 bg-black/90 text-white flex flex-col items-center justify-center gap-2 animate-in zoom-in duration-200 cursor-default" onClick={(e) => e.stopPropagation()}>
          <div className="text-3xl animate-bounce">⭐</div>
          <p className="font-black text-sm sm:text-base italic uppercase tracking-wider">Thanks for rating!</p>
        </div>
      )}
    </div>
  );
}
