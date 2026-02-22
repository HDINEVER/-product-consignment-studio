import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Responsive, Layout, useContainerWidth } from 'react-grid-layout';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { LayoutGrid, LayoutDashboard, ListIcon, Shuffle, Edit, Trash2, Heart } from 'lucide-react';

// Responsive grid component from react-grid-layout v2
const ResponsiveGridLayout = Responsive;

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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isDraggable, setIsDraggable] = useState(false);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({});
  const [isExpanded, setIsExpanded] = useState(false); // 控制按钮组展开/收缩
  const buttonGroupRef = React.useRef<HTMLDivElement>(null); // 用于检测外部点击
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true });

  // 根据容器宽度计算响应式行高和间距
  const responsiveRowHeight = useMemo(() => {
    if (width < 480) return 180;    // 手机端：紧凑行高
    if (width < 768) return 200;    // 平板端
    return 240;                      // PC端
  }, [width]);

  const responsiveMargin = useMemo((): [number, number] => {
    if (width < 480) return [8, 8];    // 手机端：更小间距
    if (width < 768) return [10, 10];  // 平板端
    return [14, 14];                    // PC端
  }, [width]);
  
  // Generate Optimized Bento Layout
  const generateBentoLayout = useCallback((products: Product[]) => {
    const lgLayout: Layout[] = [];
    const mdLayout: Layout[] = [];
    const smLayout: Layout[] = [];
    const xsLayout: Layout[] = [];
    const xxsLayout: Layout[] = [];

    products.forEach((product, i) => {
      const id = product.id;
      
      // --- Bento Pattern Logic (4 Columns) ---
      // Pattern cycle of 12 items to fit nicely in 4 columns
      const pIndex = i % 12;
      const chunkY = Math.floor(i / 12) * 5; // Approx height
      
      let lgItem: Layout = { i: id, x: 0, y: Infinity, w: 1, h: 1 };

      // Row 1 (y=0)
      if (pIndex === 0)      { lgItem = { i: id, x: 0, y: chunkY + 0, w: 2, h: 2 }; }
      else if (pIndex === 1) { lgItem = { i: id, x: 2, y: chunkY + 0, w: 1, h: 1 }; }
      else if (pIndex === 2) { lgItem = { i: id, x: 3, y: chunkY + 0, w: 1, h: 2 }; } // Tall right
      else if (pIndex === 3) { lgItem = { i: id, x: 2, y: chunkY + 1, w: 1, h: 1 }; } // Under item 1
      
      // Row 3 (y=2)
      else if (pIndex === 4) { lgItem = { i: id, x: 0, y: chunkY + 2, w: 2, h: 1 }; } // Wide
      else if (pIndex === 5) { lgItem = { i: id, x: 2, y: chunkY + 2, w: 1, h: 1 }; }
      else if (pIndex === 6) { lgItem = { i: id, x: 3, y: chunkY + 2, w: 1, h: 1 }; }
      
      // Row 4 (y=3)
      else if (pIndex === 7) { lgItem = { i: id, x: 0, y: chunkY + 3, w: 1, h: 1 }; }
      else if (pIndex === 8) { lgItem = { i: id, x: 1, y: chunkY + 3, w: 1, h: 1 }; }
      else if (pIndex === 9) { lgItem = { i: id, x: 2, y: chunkY + 3, w: 2, h: 1 }; } // Wide
      
      // Row 5 (y=4)
      else if (pIndex === 10) { lgItem = { i: id, x: 0, y: chunkY + 4, w: 1, h: 1 }; }
      else if (pIndex === 11) { lgItem = { i: id, x: 1, y: chunkY + 4, w: 3, h: 1 }; } // Very Wide
      
      lgLayout.push(lgItem);

      // --- XS / Mobile Layout (2 Cols) ---
      // Fix: Avoid huge 2x2 cards on mobile. Make them 2x1 (banner) or 1x1.
      let xsItem: Layout = { i: id, x: (i % 2), y: Math.floor(i / 2), w: 1, h: 1 };
      
      if (pIndex === 0) {
        // Transform the 2x2 big card into a 2x1 banner for mobile
        xsItem = { i: id, x: 0, y: Infinity, w: 2, h: 1 };
      } else if (pIndex === 4 || pIndex === 9 || pIndex === 11) {
        // Keep wide items wide (full width on 2-col)
        xsItem = { i: id, x: 0, y: Infinity, w: 2, h: 1 };
      } else {
        // Standard cells
        xsItem = { i: id, x: (i % 2), y: Infinity, w: 1, h: 1 };
      }
      xsLayout.push(xsItem);
      
      // --- XXS / Small Mobile (2 Cols) ---
      // 双列布局，交替排列
      xxsLayout.push({ i: id, x: (i % 2), y: Math.floor(i / 2), w: 1, h: 1 });

      // --- MD (3 Cols) & SM (2 Cols) ---
      // Simple logic or reuse layout props but limit width
      mdLayout.push({ ...lgItem, w: Math.min(lgItem.w, 3) }); 
      smLayout.push({ ...xsItem }); 
    });

    return { lg: lgLayout, md: mdLayout, sm: smLayout, xs: xsLayout, xxs: xxsLayout };
  }, []);

  // Update layout when products change
  useEffect(() => {
    if (products.length > 0) {
      const newLayouts = generateBentoLayout(products);
      setLayouts(newLayouts);
    }
  }, [products, generateBentoLayout]);

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

  // Regular Grid Layout
  const generateGridLayout = useCallback((products: Product[]) => {
     return {
       lg: products.map((p, i) => ({ i: p.id, x: i % 4, y: Math.floor(i / 4), w: 1, h: 1 })),
       md: products.map((p, i) => ({ i: p.id, x: i % 3, y: Math.floor(i / 3), w: 1, h: 1 })),
       sm: products.map((p, i) => ({ i: p.id, x: i % 2, y: Math.floor(i / 2), w: 1, h: 1 })),
       xs: products.map((p, i) => ({ i: p.id, x: i % 2, y: Math.floor(i / 2), w: 1, h: 1 })),
       xxs: products.map((p, i) => ({ i: p.id, x: i % 2, y: Math.floor(i / 2), w: 1, h: 1 })),
     };
  }, []);
  
  const currentLayouts = useMemo(() => {
    if (viewMode === 'grid') return generateGridLayout(products);
    if (!layouts.lg) return generateBentoLayout(products);
    return layouts;
  }, [viewMode, products, layouts, generateGridLayout, generateBentoLayout]);

    const onLayoutChange = (layout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
     // Optional: Persist layout changes
  };

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
    <div className="relative">
      {/* 浮动按钮组 - 固定在右下方，收藏按钮上方 */}
      <div ref={buttonGroupRef} className="fixed bottom-[180px] sm:bottom-[200px] right-6 sm:right-8 z-40">
        <div className="flex flex-col gap-2 sm:gap-3 items-end">
          {/* 展开状态：显示所有按钮 */}
          {isExpanded && (
            <>
              {/* 大图模式按钮 */}
              <button
                onClick={() => {
                  setViewMode('bento');
                  setIsExpanded(false);
                }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-black flex items-center justify-center transition-all duration-200 touch-target active:scale-95 ${
                  viewMode === 'bento' 
                    ? 'bg-gray-200 text-black shadow-brutal' 
                    : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-brutal active:shadow-brutal-sm'
                }`}
                title="大图模式"
                aria-label="切换到大图模式"
              >
                <LayoutDashboard size={20} className="sm:w-6 sm:h-6" />
              </button>

              {/* 小卡片模式按钮 */}
              <button
                onClick={() => {
                  setViewMode('grid');
                  setIsExpanded(false);
                }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-black flex items-center justify-center transition-all duration-200 touch-target active:scale-95 ${
                  viewMode === 'grid' 
                    ? 'bg-gray-200 text-black shadow-brutal' 
                    : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-brutal active:shadow-brutal-sm'
                }`}
                title="小卡片模式"
                aria-label="切换到小卡片模式"
              >
                <LayoutGrid size={20} className="sm:w-6 sm:h-6" />
              </button>

              {/* 列表模式按钮 */}
              <button
                onClick={() => {
                  setViewMode('list');
                  setIsExpanded(false);
                }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-black flex items-center justify-center transition-all duration-200 touch-target active:scale-95 ${
                  viewMode === 'list' 
                    ? 'bg-gray-200 text-black shadow-brutal' 
                    : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-brutal active:shadow-brutal-sm'
                }`}
                title="列表布局"
                aria-label="切换到列表布局"
              >
                <ListIcon size={20} className="sm:w-6 sm:h-6" />
              </button>

              {/* 管理员拖拽按钮（仅在 bento/grid 模式下显示）*/}
              {isAdmin && (viewMode === 'bento' || viewMode === 'grid') && (
                <button
                  onClick={() => setIsDraggable(!isDraggable)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-black flex items-center justify-center transition-all duration-200 touch-target active:scale-95 ${
                    isDraggable
                      ? 'bg-brutal-yellow shadow-brutal'
                      : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-brutal active:shadow-brutal-sm'
                  }`}
                  title={isDraggable ? '锁定布局' : '调整布局'}
                  aria-label={isDraggable ? '锁定布局' : '调整布局'}
                >
                  <Shuffle size={20} className="sm:w-6 sm:h-6" />
                </button>
              )}
            </>
          )}

          {/* 主按钮：显示当前视图模式，点击展开/收缩 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-black flex items-center justify-center transition-all duration-200 touch-target active:scale-95 ${
              isExpanded
                ? 'bg-black text-white shadow-brutal hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:shadow-brutal-sm'
                : 'bg-brutal-cyan text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-brutal active:shadow-brutal-sm'
            }`}
            title={isExpanded ? '收起' : '切换视图'}
            aria-label={isExpanded ? '收起视图选项' : '展开视图选项'}
          >
            {/* 图标内容 - 只旋转图标，不旋转背景 */}
            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
              {isExpanded ? (
                // 展开时显示 X 图标
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                // 收缩时显示当前视图模式图标
                <>
                  {viewMode === 'bento' && <LayoutDashboard size={20} />}
                  {viewMode === 'grid' && (
                    <LayoutGrid size={20} />
                  )}
                  {viewMode === 'list' && <ListIcon size={20} />}
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      {(viewMode === 'bento' || viewMode === 'grid') ? (
        <div ref={containerRef}>
          {mounted && (
            <ResponsiveGridLayout
              className="layout"
              layouts={currentLayouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 4, md: 3, sm: 2, xs: 2, xxs: 2 }}
              rowHeight={responsiveRowHeight}
              width={width}
              isDraggable={isDraggable && isAdmin}
              isResizable={isDraggable && isAdmin}
              onLayoutChange={onLayoutChange}
              draggableHandle=".drag-handle"
              margin={responsiveMargin}
              containerPadding={[0, 0]}
              draggableCancel=".no-drag"
            >
              {products.map((product) => (
                <div key={product.id} className="relative group bg-transparent h-full">
                  {/* Drag Handle */}
                  {isDraggable && isAdmin && (
                     <div className="absolute top-2 right-2 z-50 p-1 bg-white border-2 border-black rounded cursor-move drag-handle hover:bg-brutal-yellow shadow-sm">
                        <Shuffle size={14} />
                     </div>
                  )}
                  <div className="h-full w-full">
                     <ProductCard
                        product={product}
                        isAdmin={isAdmin}
                        isFavorited={isFavorited?.(product.id)}
                        onSelect={onProductSelect}
                        onAddToCart={onAddToCart}
                        onToggleFavorite={onToggleFavorite}
                      />
                  </div>
                  
                  {/* 管理员操作按钮 - 悬浮显示 */}
                  {isAdmin && !isDraggable && (
                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(product.id);
                        }}
                        className="p-2 bg-brutal-yellow text-black rounded-lg border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:bg-yellow-400 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                        title="编辑商品"
                        aria-label="编辑商品"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(product.id);
                        }}
                        className="p-2 bg-red-500 text-white rounded-lg border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:bg-red-600 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                        title="删除商品"
                        aria-label="删除商品"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </div>
      ) : (
        /* List View */
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
  return (
    <div 
      className="flex bg-white rounded-2xl border-2 border-black shadow-brutal overflow-hidden hover:shadow-brutal-lg transition-all cursor-pointer"
      onClick={(e) => onSelect?.(product, e.currentTarget as HTMLElement)}
    >
      <div className="w-24 h-24 sm:w-40 sm:h-40 flex-shrink-0 bg-gray-100">
        <img 
          src={product.image} 
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {product.category && (
              <span className="bg-brutal-yellow px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black border-2 border-black rounded-lg">
                {product.category}
              </span>
            )}
            {product.ip && (
              <span className="bg-brutal-blue text-white px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black border-2 border-black rounded-lg">
                {product.ip}
              </span>
            )}
          </div>
          <h3 className="font-black text-base sm:text-lg line-clamp-1">{product.title}</h3>
          {product.description && (
            <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2 sm:mt-3">
          <span className="text-lg sm:text-2xl font-black">¥{product.basePrice}</span>
          
          <div className="flex items-center gap-2">
            {/* 收藏按钮 */}
            {onToggleFavorite && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(product.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className={`p-1.5 sm:p-2 rounded-lg border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all text-sm ${
                  isFavorited ? 'bg-pink-100 text-pink-500' : 'bg-white text-gray-400'
                }`}
                title={isFavorited ? "取消收藏" : "收藏"}
                aria-label={isFavorited ? "取消收藏" : "收藏"}
              >
                <Heart 
                  size={14} 
                  className="sm:w-4 sm:h-4" 
                  fill={isFavorited ? "currentColor" : "none"}
                />
              </button>
            )}
            {isAdmin && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(product.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="p-1.5 sm:p-2 bg-brutal-yellow rounded-lg border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:bg-yellow-400 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all text-sm"
                >
                  <Edit size={14} className="sm:w-4 sm:h-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(product.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="p-1.5 sm:p-2 bg-red-500 text-white rounded-lg border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:bg-red-600 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all text-sm"
                >
                  <Trash2 size={14} className="sm:w-4 sm:h-4" />
                </button>
              </>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(product);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-black text-white rounded-lg sm:rounded-xl border-2 border-black font-bold shadow-brutal hover:bg-gray-800 transition-all text-xs sm:text-sm"
            >
              购买
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
