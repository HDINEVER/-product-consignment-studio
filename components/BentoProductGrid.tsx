import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Responsive, Layout, useContainerWidth } from 'react-grid-layout';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { LayoutGrid, ListIcon, Shuffle, Edit, Trash2 } from 'lucide-react';

// Responsive grid component from react-grid-layout v2
const ResponsiveGridLayout = Responsive;

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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isDraggable, setIsDraggable] = useState(false);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({});
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true });
  
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
      
      // --- XXS / Small Mobile (1 Col) ---
      // Everything full width
      xxsLayout.push({ i: id, x: 0, y: i, w: 1, h: 1 });

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

  // Regular Grid Layout
  const generateGridLayout = useCallback((products: Product[]) => {
     return {
       lg: products.map((p, i) => ({ i: p.id, x: i % 4, y: Math.floor(i / 4), w: 1, h: 1 })),
       md: products.map((p, i) => ({ i: p.id, x: i % 3, y: Math.floor(i / 3), w: 1, h: 1 })),
       sm: products.map((p, i) => ({ i: p.id, x: i % 2, y: Math.floor(i / 2), w: 1, h: 1 })),
       xs: products.map((p, i) => ({ i: p.id, x: i % 2, y: Math.floor(i / 2), w: 1, h: 1 })),
       xxs: products.map((p, i) => ({ i: p.id, x: 0, y: i, w: 1, h: 1 })),
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
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
           <span className="text-xs sm:text-sm font-bold text-gray-500">
            共 {products.length} 件商品
          </span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
           {isAdmin && (viewMode === 'bento' || viewMode === 'grid') && (
            <button
              onClick={() => setIsDraggable(!isDraggable)}
              className={`hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-2 border-black font-bold text-xs sm:text-sm transition-all ${
                isDraggable
                  ? 'bg-brutal-yellow shadow-brutal'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <Shuffle size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden md:inline">{isDraggable ? '锁定布局' : '调整布局'}</span>
              <span className="md:hidden">{isDraggable ? '锁定' : '调整'}</span>
            </button>
          )}

           <div className="flex rounded-xl border-2 border-black overflow-hidden">
            <button
              onClick={() => setViewMode('bento')}
              className={`p-2.5 transition-colors ${
                viewMode === 'bento' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
              title="大图模式"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 border-l-2 border-black transition-colors ${
                viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
              title="小卡片模式"
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
                viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
              title="列表布局"
            >
              <ListIcon size={18} />
            </button>
          </div>
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
              cols={{ lg: 4, md: 3, sm: 2, xs: 2, xxs: 1 }}
              rowHeight={240}
              width={width}
              isDraggable={isDraggable && isAdmin}
              isResizable={isDraggable && isAdmin}
              onLayoutChange={onLayoutChange}
              draggableHandle=".drag-handle"
              margin={[16, 16]}
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
                        isDraggable={false}
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
                  </div>
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
                  onSelect={onProductSelect}
                  onAddToCart={onAddToCart}
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
            {isAdmin && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(product.id);
                  }}
                  className="p-1.5 sm:p-2 bg-brutal-yellow rounded-lg border-2 border-black shadow-brutal hover:bg-yellow-400 transition-all text-sm"
                >
                  <Edit size={14} className="sm:w-4 sm:h-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(product.id);
                  }}
                  className="p-1.5 sm:p-2 bg-red-500 text-white rounded-lg border-2 border-black shadow-brutal hover:bg-red-600 transition-all text-sm"
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
