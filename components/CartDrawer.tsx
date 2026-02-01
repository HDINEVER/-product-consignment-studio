import React, { useState } from 'react';
import { X, Trash2, FileText, Send, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (index: number) => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, cart, onRemoveItem }) => {
  const [showBOM, setShowBOM] = useState(false);
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleGenerateBOM = () => {
    setShowBOM(true);
  };

  const handleContactQQ = () => {
    // Generate a message string
    const message = `你好，我想咨询以下订单：\n` + 
      cart.map(item => `- [${item.productTitle}] (${item.variantName}) x${item.quantity}`).join('\n') +
      `\n总价预估: ¥${total}`;
    
    // Encode for URL
    const qqUrl = `https://wpa.qq.com/msgrd?v=3&uin=123456789&site=qq&menu=yes`;
    window.open(qqUrl, '_blank');
    navigator.clipboard.writeText(message);
    alert('订单信息已复制到剪贴板，正在跳转QQ...');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-yellow-400/20 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Floating Card Container */}
      <div className="relative w-full max-w-[500px] h-full p-4 md:p-6 flex flex-col pointer-events-none justify-center md:justify-start">
        <div className="pointer-events-auto flex-1 bg-white rounded-3xl border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 md:max-h-[95vh] mt-auto md:mt-0">
          
          {/* Header */}
          <div className="p-6 border-b-4 border-black flex justify-between items-center bg-yellow-400 relative overflow-hidden">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-black text-white rounded-lg border-2 border-transparent">
                <ShoppingBag size={20} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">
                {showBOM ? '购物清单 (BOM)' : '购物车'}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="relative z-10 p-2 bg-white hover:bg-black hover:text-white rounded-xl transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-200">
                  <FileText size={48} className="text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="font-black text-xl text-black mb-2">购物车是空的</p>
                  <p className="text-sm font-medium text-gray-400">快去挑选喜欢的二次元周边吧！</p>
                </div>
              </div>
            ) : showBOM ? (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="bg-[#fffdf5] border-2 border-black p-5 rounded-xl font-mono text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                   <div className="flex justify-between border-b-2 border-black pb-3 mb-3 font-black text-gray-900 uppercase tracking-wider">
                     <span>Item</span>
                     <span>Subtotal</span>
                   </div>
                   <div className="space-y-3">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div className="pr-4">
                          <div className="font-bold text-black">{item.productTitle}</div>
                          <div className="text-xs font-bold text-gray-500 bg-gray-200 inline-block px-1 rounded mt-1">{item.variantName}</div>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <div className="text-xs text-gray-500">x{item.quantity}</div>
                          <div className="font-black">¥{item.price * item.quantity}</div>
                        </div>
                      </div>
                    ))}
                   </div>
                   <div className="pt-4 mt-4 border-t-2 border-black flex justify-between text-xl font-black bg-yellow-400 -mx-5 -mb-5 p-5 border-t-2">
                     <span>总计 EST.</span>
                     <span>¥{total}</span>
                   </div>
                 </div>
                 <div className="text-sm font-medium text-gray-600 bg-blue-50 p-4 rounded-xl border-2 border-blue-200 flex gap-3">
                   <div className="text-2xl">💡</div>
                   <p>此BOM表仅供参考，实际价格可能因定制需求（如3D打印复杂度和后处理要求）有所浮动。请点击下方按钮联系QQ进行最终确认。</p>
                 </div>
               </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="group relative flex gap-4 p-4 border-2 border-black rounded-xl hover:bg-gray-50 transition-all bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1">
                    <div className="w-20 h-20 rounded-lg border-2 border-black overflow-hidden shrink-0 bg-gray-100">
                      <img src={item.image} alt={item.productTitle} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-black text-sm line-clamp-1">{item.productTitle}</h3>
                        <p className="text-xs font-bold text-gray-500 mt-1">{item.variantName}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-black text-lg">¥{item.price * item.quantity} <span className="text-xs text-gray-400 font-normal">x{item.quantity}</span></span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onRemoveItem(idx)}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t-4 border-black bg-gray-50">
            {!showBOM ? (
              <>
                <div className="flex justify-between items-end mb-6">
                  <span className="text-gray-500 font-bold uppercase text-sm tracking-wider">Total Amount</span>
                  <span className="text-4xl font-black tracking-tighter">¥{total}</span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={handleGenerateBOM}
                  className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] active:translate-x-[4px] border-2 border-transparent"
                >
                  结算并生成表单
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={() => setShowBOM(false)}
                  className="w-full py-4 border-2 border-black font-bold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  返回修改
                </button>
                <button 
                  onClick={handleContactQQ}
                  className="w-full bg-[#12B7F5] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#00A3E0] transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] border-2 border-transparent active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
                >
                  <Send size={20} />
                  <span>联系QQ确认订单 & 进群</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
