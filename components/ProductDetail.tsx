import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Heart, Share2, Package, Truck, Shield } from 'lucide-react';
import { productAPI } from '../utils/api';
import { useCart } from '../hooks/useCart';
import AnimatedButton from './AnimatedButton';

interface ProductSku {
  id: number;
  sku_code: string;
  price: number;
  stock_quantity: number;
  variant_values?: Record<string, string>;
  images?: string[];
}

interface ProductDetail {
  id: number;
  name: string;
  description: string;
  brand?: string;
  model?: string;
  category?: { id: number; name: string };
  skus: ProductSku[];
  total_sold: number;
  rating: number;
  reviews_count: number;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProduct(Number(id));
      setProduct(response.data);
      // 默认选择第一个 SKU
      if (response.data.skus && response.data.skus.length > 0) {
        setSelectedSku(response.data.skus[0]);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      alert('加载商品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSku || !product) {
      alert('请选择商品规格');
      return;
    }

    try {
      setAddingToCart(true);
      const success = await addToCart({
        productId: product.id.toString(),
        productName: product.name,
        productImage: selectedSku.images?.[0] || '/placeholder.jpg',
        variantName: selectedSku.sku_code,
        price: selectedSku.price,
        quantity,
      });
      if (success) {
        alert('✅ 已加入购物车！');
      }
    } catch (error: any) {
      alert(error.message || '加入购物车失败');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedSku) {
      alert('请选择商品规格');
      return;
    }
    
    await handleAddToCart();
    navigate('/checkout');
  };

  const currentImages = selectedSku?.images || [];
  const currentImage = currentImages[currentImageIndex] || '/placeholder.jpg';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">商品不存在</p>
          <Link to="/" className="text-blue-500 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white border-b-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-bold">返回</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：图片展示 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* 主图 */}
            <div className="relative aspect-square bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* 图片导航 */}
              {currentImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {currentImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full border-2 border-black transition-all ${
                        index === currentImageIndex
                          ? 'bg-yellow-400 scale-125'
                          : 'bg-white hover:bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 缩略图 */}
            {currentImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {currentImages.slice(0, 4).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square bg-white border-3 border-black rounded-lg overflow-hidden transition-all hover:scale-105 ${
                      index === currentImageIndex
                        ? 'ring-4 ring-yellow-400 shadow-lg'
                        : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* 右侧：商品信息 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* 商品名称和标签 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.brand && (
                  <span className="px-3 py-1 bg-purple-100 border-2 border-black rounded-full text-sm font-bold">
                    {product.brand}
                  </span>
                )}
                {product.category && (
                  <span className="px-3 py-1 bg-blue-100 border-2 border-black rounded-full text-sm font-bold">
                    {product.category.name}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black mb-2">{product.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>⭐ {product.rating.toFixed(1)} ({product.reviews_count} 评价)</span>
                <span>已售 {product.total_sold}</span>
              </div>
            </div>

            {/* 价格 */}
            {selectedSku && (
              <div className="bg-yellow-100 border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold">¥</span>
                  <span className="text-5xl font-black">{selectedSku.price.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  库存：{selectedSku.stock_quantity} 件
                </p>
              </div>
            )}

            {/* SKU 选择 */}
            {product.skus.length > 1 && (
              <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-bold mb-3">选择规格</p>
                <div className="grid grid-cols-2 gap-3">
                  {product.skus.map((sku) => (
                    <button
                      key={sku.id}
                      onClick={() => setSelectedSku(sku)}
                      className={`p-3 border-3 border-black rounded-xl font-bold transition-all ${
                        selectedSku?.id === sku.id
                          ? 'bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] scale-105'
                          : 'bg-white hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                      <div className="text-sm">
                        {Object.values(sku.variant_values || {}).join(' / ')}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        ¥{sku.price} · 库存{sku.stock_quantity}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 数量选择 */}
            <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-bold mb-3">购买数量</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-white border-3 border-black rounded-xl font-bold text-xl hover:bg-gray-100 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:shadow-none active:translate-y-[4px] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-12 text-center border-3 border-black rounded-xl font-bold text-xl"
                  min="1"
                  max={selectedSku?.stock_quantity}
                />
                <button
                  onClick={() => setQuantity(Math.min(selectedSku?.stock_quantity || 999, quantity + 1))}
                  className="w-12 h-12 bg-white border-3 border-black rounded-xl font-bold text-xl hover:bg-gray-100 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:shadow-none active:translate-y-[4px] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  +
                </button>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="grid grid-cols-2 gap-4">
              <AnimatedButton
                onClick={handleAddToCart}
                disabled={addingToCart || !selectedSku || selectedSku.stock_quantity === 0}
                className="bg-yellow-400 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                加入购物车
              </AnimatedButton>
              
              <AnimatedButton
                onClick={handleBuyNow}
                disabled={addingToCart || !selectedSku || selectedSku.stock_quantity === 0}
                className="bg-black text-white flex items-center justify-center gap-2"
              >
                立即购买
              </AnimatedButton>
            </div>

            {/* 服务保障 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white border-3 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Package className="mx-auto mb-2" size={24} />
                <p className="text-xs font-bold">正品保证</p>
              </div>
              <div className="text-center p-4 bg-white border-3 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Truck className="mx-auto mb-2" size={24} />
                <p className="text-xs font-bold">快速配送</p>
              </div>
              <div className="text-center p-4 bg-white border-3 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Shield className="mx-auto mb-2" size={24} />
                <p className="text-xs font-bold">售后无忧</p>
              </div>
            </div>

            {/* 商品描述 */}
            {product.description && (
              <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-bold text-lg mb-3">商品详情</h3>
                <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
