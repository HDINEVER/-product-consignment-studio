import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createSwapy } from 'swapy';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { LayoutGrid, ListIcon, Shuffle } from 'lucide-react';

interface BentoGridProps {
  products: Product[];
  isAdmin?: boolean;
  onProductSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
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

// 预定义的 Bento 布局模式
const BENTO_PATTERNS = [
  // 模式1: 左边大，右边两小
  { spans: [2, 1, 1], rows: [2, 1, 1] },
  // 模式2: 顶部宽，下面三个
  { spans: [3, 1, 1, 1], rows: [1, 1, 1, 1] },
  // 模式3: 均匀分布
  { spans: [1, 1, 1], rows: [1, 1, 1] },
];

export default function BentoProductGrid({
  products,
  isAdmin = false,
  onProductSelect,
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
  emptyMessage = '没有找到商品',
}: BentoGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const swapyRef = useRef<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('bento');
  const [productOrder, setProductOrder] = useState<string[]>([]);
  const [isSwapEnabled, setIsSwapEnabled] = useState(false);

  // 初始化商品顺序
  useEffect(() => {
    setProductOrder(products.map(p => p.id));
  }, [products]);

  // 初始化 Swapy
  useEffect(() => {
    if (!containerRef.current || !isSwapEnabled || viewMode !== 'bento') return;

    // 等待 DOM 更新
    const timer = setTimeout(() => {
      if (containerRef.current) {
        try {
          swapyRef.current = createSwapy(containerRef.current, {
            animation: 'dynamic',
          });

          swapyRef.current.onSwap(({ data }: any) => {
            // 更新商品顺序
            const newOrder = data.array
              .filter((item: any) => item.item !== null)
              .map((item: any) => item.item);
            setProductOrder(newOrder);
            
            // 可以在这里保存到本地存储
            localStorage.setItem('productLayoutOrder', JSON.stringify(newOrder));
          });
        } catch (e) {
          console.error('Swapy initialization error:', e);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (swapyRef.current) {
        swapyRef.current.destroy();
        swapyRef.current = null;
      }
    };
  }, [isSwapEnabled, viewMode, products.length]);

  // 根据顺序重排商品
  const orderedProducts = useCallback(() => {
    if (productOrder.length === 0) return products;
    
    const orderMap = new Map(productOrder.map((id, index) => [id, index]));
    return [...products].sort((a, b) => {
      const indexA = orderMap.get(a.id) ?? Number.MAX_VALUE;
      const indexB = orderMap.get(b.id) ?? Number.MAX_VALUE;
      return indexA - indexB;
    });
  }, [products, productOrder]);

  // 计算 Bento 布局的列跨度 - 响应式布局
  const getBentoClass = (index: number): string => {
    const pattern = index % 10;
    switch (pattern) {
      case 0:
        // 手机端不使用大卡片，平板和PC使用
        return 'col-span-1 sm:col-span-2 row-span-1 sm:row-span-2'; // 特大卡片
      case 1:
      case 2:
        return 'col-span-1 row-span-1'; // 标准卡片
      case 3:
        return 'col-span-1 row-span-1 sm:row-span-2'; // 高卡片
      case 4:
        return 'col-span-1 sm:col-span-2 row-span-1'; // 宽卡片
      case 5:
      case 6:
      case 7:
        return 'col-span-1 row-span-1'; // 标准卡片
      case 8:
        return 'col-span-1 row-span-1 sm:row-span-2'; // 高卡片
      case 9:
        return 'col-span-1 row-span-1'; // 标准卡片
      default:
        return 'col-span-1 row-span-1';
    }
  };

  // 获取网格类名 - 响应式
  const getGridClass = (): string => {
    switch (viewMode) {
      case 'bento':
        return 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[160px] sm:auto-rows-[180px] md:auto-rows-[200px] lg:auto-rows-[220px] gap-3 sm:gap-4 lg:gap-5';
      case 'grid':
        return 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5';
      case 'list':
        return 'flex flex-col gap-3 sm:gap-4';
      default:
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5';
    }
  };

  // 空状态
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

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 视图控制栏 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-gray-500">
            共 {products.length} 件商品
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* 切换拖拽模式 - 仅管理员，大屏显示 */}
          {isAdmin && viewMode === 'bento' && (
            <button
              onClick={() => setIsSwapEnabled(!isSwapEnabled)}
              className={`hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-2 border-black font-bold text-xs sm:text-sm transition-all ${
                isSwapEnabled
                  ? 'bg-brutal-yellow shadow-brutal'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <Shuffle size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden md:inline">{isSwapEnabled ? '完成排序' : '拖拽排序'}</span>
              <span className="md:hidden">{isSwapEnabled ? '完成' : '排序'}</span>
            </button>
          )}

          {/* 视图模式切换 */}
          <div className="flex rounded-xl border-2 border-black overflow-hidden">
            <button
              onClick={() => setViewMode('bento')}
              className={`p-2.5 transition-colors ${
                viewMode === 'bento' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              title="Bento 布局"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 border-l-2 border-black transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              title="网格布局"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 border-l-2 border-black transition-colors ${
                viewMode === 'list' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              title="列表布局"
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 商品网格 */}
      <div
        ref={containerRef}
        className={getGridClass()}
      >
        {orderedProducts().map((product, index) => (
          <div
            key={product.id}
            className={`${viewMode === 'bento' ? getBentoClass(index) : ''} ${
              viewMode === 'list' ? 'max-w-2xl' : ''
            }`}
            data-swapy-slot={isSwapEnabled ? product.id : undefined}
          >
            <div 
              className="h-full"
              data-swapy-item={isSwapEnabled ? product.id : undefined}
            >
              {viewMode === 'list' ? (
                <ListProductCard
                  product={product}
                  isAdmin={isAdmin}
                  onSelect={onProductSelect}
                  onAddToCart={onAddToCart}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ) : (
                <ProductCard
                  product={product}
                  isAdmin={isAdmin}
                  isDraggable={isSwapEnabled}
                  onSelect={onProductSelect}
                  onAddToCart={onAddToCart}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onEditCategory={onEditCategory}
                  onEditIP={onEditIP}
                  editingTag={editingTag}
                  categories={categories}
                  ips={ips}
                  onCategoryChange={onCategoryChange}
                  onIPChange={onIPChange}
                  onTagBlur={onTagBlur}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 列表视图的商品卡片
interface ListProductCardProps {
  product: Product;
  isAdmin?: boolean;
  onSelect?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
}

function ListProductCard({ 
  product, 
  isAdmin, 
  onSelect, 
  onAddToCart,
  onEdit,
  onDelete,
}: ListProductCardProps) {
  return (
    <div 
      className="flex bg-white rounded-2xl border-2 border-black shadow-brutal overflow-hidden hover:shadow-brutal-lg transition-all cursor-pointer"
      onClick={() => onSelect?.(product)}
    >
      <div className="w-40 h-40 flex-shrink-0 bg-gray-100">
        <img 
          src={product.image} 
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {product.category && (
              <span className="bg-brutal-yellow px-2 py-1 text-xs font-black border-2 border-black rounded-lg">
                {product.category}
              </span>
            )}
            {product.ip && (
              <span className="bg-brutal-blue text-white px-2 py-1 text-xs font-black border-2 border-black rounded-lg">
                {product.ip}
              </span>
            )}
          </div>
          <h3 className="font-black text-lg">{product.title}</h3>
          {product.description && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-2xl font-black">¥{product.basePrice}</span>
          
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(product.id);
                  }}
                  className="p-2 bg-brutal-yellow rounded-lg border-2 border-black shadow-brutal hover:bg-yellow-400 transition-all"
                >
                  编辑
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(product.id);
                  }}
                  className="p-2 bg-red-500 text-white rounded-lg border-2 border-black shadow-brutal hover:bg-red-600 transition-all"
                >
                  删除
                </button>
              </>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(product);
              }}
              className="px-4 py-2 bg-black text-white rounded-xl border-2 border-black font-bold shadow-brutal hover:bg-gray-800 transition-all"
            >
              加入购物车
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
