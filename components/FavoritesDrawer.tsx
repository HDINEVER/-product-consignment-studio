import React from 'react';
import { X, Heart, Trash2, ShoppingCart, ExternalLink, Sparkles, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '../types';

interface FavoriteItem extends Product {
  favoriteId: string;
}

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteItem[];
  onRemoveItem: (favoriteId: string) => void;
  onAddToCart?: (product: Product) => void;
  onProductClick?: (product: Product) => void; // ✅ 新增：产品点击回调
}

const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({ 
  isOpen, 
  onClose, 
  favorites, 
  onRemoveItem,
  onAddToCart,
  onProductClick // ✅ 新增
}) => {

  const handleViewProduct = (product: Product, e?: React.MouseEvent) => {
    // ✅ 阻止事件传播，防止意外触发其他点击事件
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('🔍 收藏夹点击产品:', product.id, product.title);
    
    // ✅ 修改：调用回调函数而不是导航
    if (onProductClick) {
      onProductClick(product);
      onClose(); // 关闭收藏夹抽屉
    } else {
      console.warn('⚠️ onProductClick 回调未定义！');
    }
  };

  const handleAddToCart = (product: Product) => {
    onAddToCart?.(product);
  };

  const handleRemoveFavorite = (favoriteId: string) => {
    if (window.confirm('确定要移除该收藏吗？')) {
      onRemoveItem(favoriteId);
    }
  };

  const handleContinueShopping = () => {
    onClose(); // ✅ 修改：只关闭抽屉，不导航
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 - 点击关闭 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* Popover 弹窗 - 响应式位置 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-x-2 bottom-2 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[400px] md:w-[450px] max-h-[85vh] sm:max-h-[80vh] z-[101] bg-white border-2 sm:border-4 border-black rounded-xl sm:rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()} // 防止点击内部关闭
      >
        {/* 头部 */}
        <div className="p-3 sm:p-4 bg-pink-400 border-b-2 sm:border-b-4 border-black flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white text-pink-500 rounded-lg sm:rounded-xl border-2 border-black">
              <Heart size={18} className="sm:w-5 sm:h-5 fill-pink-500" strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">我的收藏</h2>
              <p className="text-[10px] sm:text-xs font-bold text-white/90">
                {favorites.length} 件商品
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-white hover:bg-gray-100 rounded-lg sm:rounded-xl transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            aria-label="关闭"
          >
            <X size={18} className="sm:w-5 sm:h-5" strokeWidth={3} />
          </button>
        </div>

        {/* 商品列表 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="p-4 sm:p-6 bg-pink-100 rounded-2xl border-2 sm:border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 sm:mb-6">
                <Heart size={40} className="sm:w-12 sm:h-12 text-pink-400" strokeWidth={3} />
              </div>
              <p className="text-base sm:text-lg font-bold mb-2 sm:mb-3">收藏夹是空的</p>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 px-4">
                浏览商品时点击❤️图标添加收藏
              </p>
              <button
                onClick={handleContinueShopping}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-pink-400 text-white font-black text-sm sm:text-base border-2 sm:border-3 border-black rounded-lg sm:rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
              >
                去逛逛
              </button>
            </div>
          ) : (
            favorites.map((item) => (
              <div 
                key={item.favoriteId}
                className="group relative flex gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 hover:bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              >
                {/* 产品图片 */}
                <div 
                  className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-white border-2 border-black rounded-lg overflow-hidden cursor-pointer"
                  onClick={(e) => handleViewProduct(item, e)}
                >
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        console.error('❌ 图片加载失败:', item.image);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Sparkles className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* 查看详情提示 */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                </div>

                {/* 产品信息 */}
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-black text-sm sm:text-base mb-1 truncate cursor-pointer hover:text-pink-500 transition-colors"
                    onClick={(e) => handleViewProduct(item, e)}
                  >
                    {item.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    {item.category && (
                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-800 font-bold border border-black rounded">
                        {item.category}
                      </span>
                    )}
                    {item.ip && (
                      <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-purple-100 text-purple-800 font-bold border border-black rounded">
                        {item.ip}
                      </span>
                    )}
                    {/* 评分显示 */}
                    <div className="flex items-center gap-0.5">
                      <Star size={10} className="sm:w-3 sm:h-3 text-yellow-500" fill="#eab308" />
                      <span className="text-[10px] sm:text-xs font-bold text-gray-600">
                        {(item.rating || 5).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg sm:text-xl font-black text-pink-500">
                      ¥{item.basePrice}
                    </span>
                    
                    <div className="flex items-center gap-1 sm:gap-2">
                      {/* 加入购物车按钮 */}
                      {onAddToCart && (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="p-1.5 sm:p-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                          title="加入购物车"
                        >
                          <ShoppingCart size={14} className="sm:w-4 sm:h-4" strokeWidth={3} />
                        </button>
                      )}
                      
                      {/* 移除收藏按钮 */}
                      <button
                        onClick={() => handleRemoveFavorite(item.favoriteId)}
                        className="p-1.5 sm:p-2 bg-white hover:bg-red-50 text-red-500 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                        title="移除收藏"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部操作栏 - 仅在有收藏时显示 */}
        {favorites.length > 0 && (
          <div className="p-3 sm:p-4 bg-gray-50 border-t-2 sm:border-t-4 border-black shrink-0">
            <button
              onClick={handleContinueShopping}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-pink-400 hover:bg-pink-500 text-white font-black text-sm sm:text-base border-2 sm:border-3 border-black rounded-lg sm:rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
            >
              继续浏览
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default FavoritesDrawer;
