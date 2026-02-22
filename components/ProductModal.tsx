import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, variantName: string, price: number, quantity: number) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Reset state when product changes
  useEffect(() => {
    if (isOpen) {
      setSelectedVariantIdx(0);
      setQuantity(1);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentVariant = product.variants[selectedVariantIdx];

  const handleAdd = () => {
    onAddToCart(product, currentVariant.name, currentVariant.price, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out animate-in fade-in" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white w-full max-w-2xl rounded-2xl border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-none animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 ease-out">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white border-[3px] border-black rounded-full hover:bg-black hover:text-white transition-colors shadow-md"
        >
          <X size={20} />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 relative">
          <img 
            src={product.image} 
            alt={product.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-black text-white px-3 py-1 text-sm font-bold tracking-wider">
            {product.category}
          </div>
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
          <div className="mb-1">
            <span className="text-purple-600 font-bold text-sm tracking-widest uppercase">{product.ip}</span>
          </div>
          <h2 className="text-2xl font-black mb-4 leading-tight text-gray-900">{product.title}</h2>
          
          <p className="text-gray-600 mb-6 text-sm leading-relaxed border-l-4 border-gray-200 pl-4">
            {product.description}
          </p>

          <div className="mt-auto space-y-6">
            {/* Variant Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">选择款式</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariantIdx(idx)}
                    className={`px-4 py-2 border-2 rounded-lg text-sm font-bold transition-all ${
                      selectedVariantIdx === idx
                        ? 'border-black bg-yellow-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                        : 'border-gray-200 text-gray-500 hover:border-black hover:text-black'
                    }`}
                  >
                    {variant.name} <span className="ml-1 text-xs opacity-70">¥{variant.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">数量</label>
              <div className="flex items-center space-x-2 border-2 border-black rounded-lg p-1">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-bold">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Total Price & Add Button */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">总计</span>
                <span className="text-2xl font-black">¥ {currentVariant.price * quantity}</span>
              </div>
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-lg font-bold border-2 border-transparent hover:bg-gray-800 hover:scale-105 transition-all shadow-lg active:scale-95"
              >
                <ShoppingCart size={18} />
                <span>加入购物车</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
