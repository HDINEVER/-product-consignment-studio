import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import { X, Plus, Minus, ShoppingCart, AlertCircle, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../contexts/AuthContext';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  triggerRect?: DOMRect | null;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  product,
  triggerRect
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addToCart } = useCart();
  const { isGuest } = useAuth();

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

  // 动态计算 PC 端弹窗的位置
  // PC端弹窗固定宽度 700px, 预估高度 450px (横置矩形)
  const MODAL_WIDTH = 700;
  const MODAL_HEIGHT = 450;
  const [modalPosition, setModalPosition] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (isOpen && triggerRect) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      let x = 0;
      let y = 0;

      // 默认尝试在卡片的右侧弹出
      const spaceRight = windowWidth - triggerRect.right;
      const spaceLeft = triggerRect.left;
      
      if (spaceRight >= MODAL_WIDTH + 20) {
        // 右侧空间足够，在右侧弹出，上边对齐卡片
        x = triggerRect.right + 20;
        y = triggerRect.top;
      } else if (spaceLeft >= MODAL_WIDTH + 20) {
        // 左侧空间足够，在左侧弹出，上边对齐卡片
        x = triggerRect.left - MODAL_WIDTH - 20;
        y = triggerRect.top;
      } else {
        // 左右空间都不够，居中显示
        x = (windowWidth - MODAL_WIDTH) / 2;
        y = (windowHeight - MODAL_HEIGHT) / 2;
      }

      // 防止上下溢出屏幕
      if (y + MODAL_HEIGHT > windowHeight - 20) {
        y = Math.max(20, windowHeight - MODAL_HEIGHT - 20); // 尽量底部留20px，如果还是不够就贴着顶
      }
      
      setModalPosition({ x, y });
    } else {
      setModalPosition(null);
    }
  }, [isOpen, triggerRect]);

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
          />

          {/* 弹窗容器 - 响应式位置 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={
              modalPosition && window.innerWidth >= 640 // PC 端动态定位
                ? {
                    position: 'fixed',
                    left: modalPosition.x,
                    top: modalPosition.y,
                    width: MODAL_WIDTH,
                    maxHeight: '90vh' // 确保不超过屏幕高度
                  }
                : {} // 移动端让 css class 接管 (bottom drawer)
            }
            className={`
              flex flex-col overflow-hidden z-[201] bg-white border-2 sm:border-4 border-black rounded-xl sm:rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
              ${!modalPosition || window.innerWidth < 640 ? 'fixed inset-x-2 bottom-2 max-h-[85vh] sm:max-h-[90vh]' : ''}
              ${(!modalPosition || window.innerWidth < 640) && window.innerWidth >= 640 ? `sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[${MODAL_WIDTH}px]` : ''}
            `}
          >
            {/* 头部 */}
            <div className="p-3 sm:p-4 bg-brutal-yellow border-b-2 sm:border-b-4 border-black flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-black text-white rounded-lg sm:rounded-xl border-2 border-black">
                  <ShoppingBag size={18} className="sm:w-5 sm:h-5" strokeWidth={3} />
                </div>
                <h2 className="text-lg sm:text-lg font-black tracking-tight">{product.title}</h2>
              </div>
              <button
                onClick={onClose}
                disabled={isAdding}
                className="p-1.5 sm:p-2 bg-white hover:bg-red-400 rounded-lg sm:rounded-xl transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 shrink-0 ml-2"
                aria-label="关闭"
              >
                <X size={18} className="sm:w-5 sm:h-5" strokeWidth={3} />
              </button>
            </div>

            {/* 游客提示 */}
            {isGuest && !isOutOfStock && (
              <div className="px-3 sm:px-4 py-2 sm:py-3 bg-orange-100 border-b-2 border-black text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-2 shrink-0">
                <AlertCircle size={16} className="text-orange-600 shrink-0" />
                <span className="truncate">游客模式下购物车数据仅保存在本地</span>
              </div>
            )}

            {/* 成功提示 */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-green-500 text-white px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold flex items-center gap-2 whitespace-nowrap"
                >
                  <ShoppingCart size={20} />
                  已加入购物车！
                </motion.div>
              )}
            </AnimatePresence>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gray-50 flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* 左侧：商品大图 - 带3D悬停效果 */}
              <div className="w-full sm:w-[280px] flex-shrink-0 flex justify-center">
                <div 
                  className="relative select-none w-full max-w-[280px]"
                  style={{ perspective: '1000px' }}
                  onMouseMove={handleImageMouseMove}
                  onMouseEnter={handleImageMouseEnter}
                  onMouseLeave={handleImageMouseLeave}
                >
                  <div 
                    ref={imageRef}
                    className="relative bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden aspect-square transition-transform duration-150 ease-out transform-gpu"
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
                    {product.category && product.category !== '全部' && (
                      <div className="absolute top-3 left-3 bg-brutal-yellow px-2 md:px-3 py-1 text-xs font-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {product.category}
                      </div>
                    )}
                    
                    {/* IP标签 */}
                    {product.ip && product.ip !== '全部' && (
                      <div className="absolute top-3 right-3 bg-brutal-blue text-white px-2 md:px-3 py-1 text-xs font-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {product.ip}
                      </div>
                    )}

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

              {/* 右侧：商品信息与价格（紧密布局） */}
              <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-0">
                <div className="bg-white border-2 sm:border-4 border-black rounded-xl p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="text-xs sm:text-sm font-bold text-gray-500 mb-1">价格</div>
                      <div className="text-2xl sm:text-3xl font-black text-brutal-blue">
                        ¥{product.basePrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* 数量选择器 */}
                  {!isOutOfStock && (
                    <div className="pt-3 border-t-2 border-gray-100 mt-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">数量</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border-2 border-black rounded-lg overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <button
                            onClick={handleDecrease}
                            disabled={quantity <= 1 || isAdding}
                            className="px-2 py-1.5 hover:bg-yellow-400 transition-colors disabled:opacity-50 border-r-2 border-black"
                          >
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="w-10 text-center font-black text-sm">{quantity}</span>
                          <button
                            onClick={handleIncrease}
                            disabled={quantity >= maxQuantity || isAdding}
                            className="px-2 py-1.5 hover:bg-yellow-400 transition-colors disabled:opacity-50 border-l-2 border-black"
                          >
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                        <span className="text-xs font-bold text-gray-500">库存 {maxQuantity}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 材质信息 */}
                {product.materialType && (
                  <div className="bg-white border-2 sm:border-4 border-black rounded-xl p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-gray-500 block mb-1">材质</span>
                    <span className="font-bold text-sm">{product.materialType}</span>
                  </div>
                )}

                {/* 商品描述 */}
                {product.description && (
                  <div className="bg-white border-2 sm:border-4 border-black rounded-xl p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-2 sm:mb-4 flex-1 overflow-y-auto">
                    <span className="text-xs sm:text-sm font-bold text-gray-500 block mb-2">商品描述</span>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {product.description}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 底部 - 加入购物车按钮 */}
            <div className="p-3 sm:p-4 border-t-2 sm:border-t-4 border-black bg-white shrink-0">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className="w-full py-3 sm:py-4 bg-yellow-400 text-black font-black text-base sm:text-lg border-2 sm:border-4 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-500 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] sm:hover:translate-x-[3px] hover:translate-y-[2px] sm:hover:translate-y-[3px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
              >
                {isAdding ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-3 border-black border-t-transparent rounded-full"></div>
                    <span>处理中...</span>
                  </>
                ) : isOutOfStock ? (
                  <>
                    <AlertCircle size={20} strokeWidth={3} />
                    <span>已售罄</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} className="sm:w-6 sm:h-6" strokeWidth={3} />
                    <span>加入购物车 • ¥{(product.basePrice * quantity).toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductDetailModal;
