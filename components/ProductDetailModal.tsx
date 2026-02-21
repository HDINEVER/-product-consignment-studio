import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import { X, Plus, Minus, ShoppingCart, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../contexts/AuthContext';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  product 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addToCart } = useCart();
  const { isGuest, user } = useAuth();

  // 3D Hover 效果状态
  const imageRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 0, y: 0, opacity: 0 });
  const [scale, setScale] = useState(1);

  const MAX_ROTATION = 8;
  const HOVER_SCALE = 1.01;

  const handleImageMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -MAX_ROTATION;
    const rotateY = ((x - centerX) / centerX) * MAX_ROTATION;
    setRotation({ x: rotateX, y: rotateY });
    setShine({ x, y, opacity: 0.4 });
  };

  const handleImageMouseEnter = () => setScale(HOVER_SCALE);

  const handleImageMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setShine({ ...shine, opacity: 0 });
    setScale(1);
  };

  // 重置数量当弹窗打开时
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setShowSuccess(false);
      // 重置 3D 效果
      setRotation({ x: 0, y: 0 });
      setShine({ x: 0, y: 0, opacity: 0 });
      setScale(1);
    }
  }, [isOpen]);

  if (!product) return null;

  // 获取最大可购买数量
  const maxQuantity = product.stockQuantity || 99;
  const isOutOfStock = maxQuantity === 0;

  // 增加数量
  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      setQuantity(prev => prev + 1);
    }
  };

  // 减少数量
  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // 加入购物车
  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    
    setIsAdding(true);
    try {
      await addToCart({
        productId: product.id,              // ✅ 驼峰命名
        productName: product.title,         // ✅ 驼峰命名
        productImage: product.image,        // ✅ 驼峰命名
        variantName: '',                    // ✅ 驼峰命名
        price: product.basePrice,
        quantity: quantity,
      });

      // 显示成功提示
      setShowSuccess(true);
      
      // 1.5 秒后自动关闭弹窗
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('加入购物车失败：', error);
      alert('加入购物车失败，请重试');
    } finally {
      setIsAdding(false);
    }
  };

  // 处理背景点击关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isAdding) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            {/* 弹窗容器 - 响应式 */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-brutal-bg border-2 sm:border-4 border-black rounded-lg sm:rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-[95vw] sm:w-full max-w-5xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden relative"
            >
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                disabled={isAdding}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center font-black disabled:opacity-50"
                aria-label="关闭"
              >
                <X size={20} />
              </button>

              {/* 成功提示 */}
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-green-500 text-white px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold flex items-center gap-2"
                  >
                    <ShoppingCart size={20} />
                    已加入购物车！
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 内容区域 */}
              <div className="overflow-y-auto max-h-[85vh] sm:max-h-[90vh]">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8">
                  {/* 左侧：商品大图 - 带3D悬停效果 */}
                  <div className="w-full lg:flex-1 lg:max-w-[400px] xl:max-w-[500px]">
                    <div 
                      className="relative select-none"
                      style={{ perspective: '1000px' }}
                      onMouseMove={handleImageMouseMove}
                      onMouseEnter={handleImageMouseEnter}
                      onMouseLeave={handleImageMouseLeave}
                    >
                      <div 
                        ref={imageRef}
                        className="relative bg-gray-200 border-2 border-black rounded-lg sm:rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden aspect-square transition-transform duration-150 ease-out transform-gpu"
                        style={{
                          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(${scale}, ${scale}, ${scale})`,
                        }}
                      >
                        {/* 光泽层 */}
                        <div
                          className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay transition-opacity duration-300"
                          style={{
                            background: `radial-gradient(circle at ${shine.x}px ${shine.y}px, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 60%)`,
                            opacity: shine.opacity,
                          }}
                        />
                        
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* 分类标签 */}
                        <div className="absolute top-4 left-4 bg-brutal-yellow px-3 py-1 text-xs font-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          {product.category}
                        </div>

                        {/* 库存状态标签 */}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                            <div className="bg-red-500 text-white px-6 py-3 font-black text-xl border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              已售罄
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 右侧：商品信息 */}
                  <div className="flex-1 flex flex-col gap-3 sm:gap-4 lg:gap-6">
                    {/* 商品名称 */}
                    <div>
                      <h2 className="font-black text-xl sm:text-2xl lg:text-3xl xl:text-4xl mb-2 leading-tight">
                        {product.title}
                      </h2>
                      {product.ip && (
                        <div className="text-sm font-bold text-gray-500 flex items-center gap-2">
                          <span className="px-2 py-1 bg-gray-200 border border-black rounded">
                            {product.ip}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 价格 */}
                    <div className="bg-white border-2 border-black rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="text-xs sm:text-sm font-bold text-gray-500 mb-1">价格</div>
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-brutal-blue">
                        ¥{product.basePrice.toFixed(2)}
                      </div>
                    </div>

                    {/* 商品描述 */}
                    {product.description && (
                      <div className="bg-white border-2 border-black rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-xs sm:text-sm font-bold text-gray-500 mb-2">商品描述</div>
                        <div className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed max-h-32 sm:max-h-48 overflow-y-auto">
                          {product.description}
                        </div>
                      </div>
                    )}

                    {/* 材质信息（如果有） */}
                    {product.materialType && (
                      <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-sm font-bold text-gray-500 mb-1">材质</div>
                        <div className="font-bold">{product.materialType}</div>
                      </div>
                    )}

                    {/* 数量选择器 */}
                    {!isOutOfStock && (
                      <div className="bg-white border-2 border-black rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-xs sm:text-sm font-bold text-gray-500 mb-2 sm:mb-3">选择数量</div>
                        <div className="flex items-center gap-2 sm:gap-4">
                          {/* 减少按钮 */}
                          <button
                            onClick={handleDecrease}
                            disabled={quantity <= 1 || isAdding}
                            title="减少数量"
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center font-black disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus size={16} className="sm:w-5 sm:h-5" />
                          </button>

                          {/* 数量显示 */}
                          <div className="flex-1 text-center">
                            <div className="text-2xl sm:text-3xl font-black">{quantity}</div>
                          </div>

                          {/* 增加按钮 */}
                          <button
                            onClick={handleIncrease}
                            disabled={quantity >= maxQuantity || isAdding}
                            title="增加数量"
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center font-black disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus size={16} className="sm:w-5 sm:h-5" />
                          </button>

                          {/* 库存提示 */}
                          <div className="text-xs sm:text-sm font-bold text-gray-500 whitespace-nowrap">
                            库存：{maxQuantity}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 加入购物车按钮 */}
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock || isAdding}
                      className="w-full py-3 sm:py-4 lg:py-5 bg-brutal-black text-brutal-yellow font-black text-base sm:text-lg lg:text-xl border-2 sm:border-4 border-black rounded-lg sm:rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] sm:hover:translate-x-[4px] hover:translate-y-[2px] sm:hover:translate-y-[4px] transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:disabled:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                    >
                      {isAdding ? (
                        <>
                          <div className="animate-spin w-6 h-6 border-3 border-brutal-yellow border-t-transparent rounded-full"></div>
                          <span>正在加入...</span>
                        </>
                      ) : isOutOfStock ? (
                        <>
                          <AlertCircle size={24} />
                          <span>商品已售罄</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={24} />
                          <span>加入购物车</span>
                        </>
                      )}
                    </button>

                    {/* 游客提示 */}
                    {isGuest && !isOutOfStock && (
                      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-3 flex items-start gap-3">
                        <AlertCircle size={20} className="text-blue-500 shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-bold text-blue-700">游客模式</div>
                          <div className="text-blue-600">
                            购物车数据仅保存在本地，清除浏览器缓存后将丢失。
                            建议<span className="font-bold">登录账号</span>以保存购物车。
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductDetailModal;
