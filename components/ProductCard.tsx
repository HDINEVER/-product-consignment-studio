import React from 'react';
import { ShoppingCart, Edit, Trash2, GripVertical } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  isDraggable?: boolean;
  onSelect?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
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
}

export default function ProductCard({
  product,
  isAdmin = false,
  isDraggable = false,
  onSelect,
  onAddToCart,
  onEdit,
  onDelete,
  onEditCategory,
  onEditIP,
  editingTag,
  categories = [],
  ips = [],
  onCategoryChange,
  onIPChange,
  onTagBlur,
}: ProductCardProps) {
  const isEditingCategory = editingTag?.productId === product.id && editingTag?.type === 'category';
  const isEditingIP = editingTag?.productId === product.id && editingTag?.type === 'ip';

  return (
    <div className="relative group h-full touch-feedback">
      {/* 商品卡片主体 */}
      <div 
        className="h-full bg-white rounded-2xl border-2 border-black shadow-brutal overflow-hidden flex flex-col transition-all duration-200 hover:shadow-brutal-lg hover:-translate-y-1 cursor-pointer active:scale-[0.98] active:shadow-brutal-sm"
        onClick={() => !editingTag && onSelect?.(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !editingTag) {
            e.preventDefault();
            onSelect?.(product);
          }
        }}
      >
        {/* 拖拽手柄 - 仅管理员可见 */}
        {isDraggable && isAdmin && (
          <div 
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            data-swapy-handle
          >
            <div className="bg-white/90 backdrop-blur-sm border-2 border-black rounded-lg px-3 py-1 shadow-brutal-sm flex items-center gap-1">
              <GripVertical size={14} className="text-gray-600" />
              <span className="text-xs font-bold text-gray-600">拖拽</span>
            </div>
          </div>
        )}

        {/* 分类标签 */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20">
          {isEditingCategory ? (
            <select
              className="bg-brutal-yellow px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-black border-2 border-black rounded-lg sm:rounded-xl shadow-brutal cursor-pointer focus:outline-none focus:ring-2 focus:ring-black"
              value={product.category}
              onChange={(e) => {
                e.stopPropagation();
                onCategoryChange?.(product.id, e.target.value);
              }}
              onBlur={onTagBlur}
              onClick={(e) => e.stopPropagation()}
              title="选择分类"
              aria-label="选择商品分类"
              autoFocus
            >
              {categories.filter(c => c !== '全部').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          ) : (
            <button
              className={`bg-brutal-yellow px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-black border-2 border-black rounded-lg sm:rounded-xl shadow-brutal transition-all ${
                isAdmin 
                  ? 'hover:bg-yellow-400 hover:scale-105 cursor-pointer' 
                  : 'cursor-default'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (isAdmin) onEditCategory?.(product.id);
              }}
              title={isAdmin ? '点击编辑分类' : product.category}
            >
              {product.category || '未分类'}
            </button>
          )}
        </div>

        {/* IP标签 */}
        {product.ip && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20">
            {isEditingIP ? (
              <select
                className="bg-brutal-blue text-white px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-black border-2 border-black rounded-lg sm:rounded-xl shadow-brutal cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
                value={product.ip}
                onChange={(e) => {
                  e.stopPropagation();
                  onIPChange?.(product.id, e.target.value);
                }}
                onBlur={onTagBlur}
                onClick={(e) => e.stopPropagation()}
                title="选择IP"
                aria-label="选择商品IP"
                autoFocus
              >
                {ips.filter(ip => ip !== '全部').map(ipTag => (
                  <option key={ipTag} value={ipTag}>{ipTag}</option>
                ))}
              </select>
            ) : (
              <button
                className={`bg-brutal-blue text-white px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-black border-2 border-black rounded-lg sm:rounded-xl shadow-brutal transition-all ${
                  isAdmin 
                    ? 'hover:bg-blue-500 hover:scale-105 cursor-pointer' 
                    : 'cursor-default'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isAdmin) onEditIP?.(product.id);
                }}
                title={isAdmin ? '点击编辑IP' : product.ip}
              >
                {product.ip}
              </button>
            )}
          </div>
        )}

        {/* 商品图片 */}
        <div className="relative flex-1 min-h-[120px] bg-gray-100 overflow-hidden">
          <img 
            src={product.image} 
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* 图片遮罩 - 悬停时显示 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* 商品信息 */}
        <div className="p-2 sm:p-3 border-t-2 border-black bg-white shrink-0">
          <h3 className="font-black text-xs sm:text-sm leading-tight line-clamp-1 mb-1.5 sm:mb-2">
            {product.title}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm sm:text-lg font-black">¥{product.basePrice}</span>
              <span className="text-[10px] sm:text-xs font-bold text-gray-400">起</span>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(product);
              }}
              className="p-1.5 sm:p-2 bg-black text-white rounded-lg border-2 border-black shadow-brutal-sm hover:bg-gray-800 transition-all active:scale-95 active:shadow-none touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="加入购物车"
              aria-label="加入购物车"
            >
              <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 管理员操作按钮 */}
      {isAdmin && (
        <div className="absolute bottom-12 sm:bottom-14 right-1.5 sm:right-2 flex gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(product.id);
            }}
            className="p-2 sm:p-2.5 bg-brutal-yellow text-black rounded-lg border-2 border-black shadow-brutal-sm hover:bg-yellow-400 hover:scale-105 active:scale-95 transition-all touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="编辑商品"
            aria-label="编辑商品"
          >
            <Edit size={12} className="sm:w-3.5 sm:h-3.5" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(product.id);
            }}
            className="p-2 sm:p-2.5 bg-red-500 text-white rounded-lg border-2 border-black shadow-brutal-sm hover:bg-red-600 hover:scale-105 active:scale-95 transition-all touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="删除商品"
            aria-label="删除商品"
          >
            <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
