import React, { useState, useMemo, useEffect } from 'react';
import { Menu, Search, ShoppingCart, LayoutGrid, Filter, Package, User as UserIcon, AlertTriangle, LogIn, Plus, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATEGORIES, IPS, Product, CartItem, Category } from '../types';
import AtroposCard from './AtroposCard';
import ProductModal from './ProductModal';
import CartDrawer from './CartDrawer';
import FloatingCartButton from './FloatingCartButton';
import AuthModal from './AuthModal';
import AnimatedButton from './AnimatedButton';
import SidebarFilterButton from './SidebarFilterButton';
import ProductUploadModal from './ProductUploadModal';
import { useProducts, ProductFilters } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../contexts/AuthContext';
import { hasGuestCartItems } from '../utils/guestCart';

const Shop = () => {
    // 使用重构后的 hooks
    const { products, loading: productsLoading, error: productsError, fetchProducts, deleteProduct } = useProducts();
    const { cartItems, cartCount, addToCart, removeFromCart, updateQuantity, loading: cartLoading } = useCart();
    const { user, isAuthenticated, isGuest, isAdmin, hasGuestCart } = useAuth();

    // Shop State
    const [selectedCategory, setSelectedCategory] = useState<Category>('全部');
    const [selectedIP, setSelectedIP] = useState<string>('全部');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [viewProduct, setViewProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Auth Modal State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalWarning, setAuthModalWarning] = useState(false);

    // Product Upload Modal State (Admin)
    const [showProductUploadModal, setShowProductUploadModal] = useState(false);

    // 当筛选条件变化时重新获取商品
    useEffect(() => {
      const filters: ProductFilters = {};
      if (selectedCategory !== '全部') {
        filters.category = selectedCategory;
      }
      if (selectedIP !== '全部') {
        filters.ip = selectedIP;
      }
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      fetchProducts(filters);
    }, [selectedCategory, selectedIP, searchQuery, fetchProducts]);

    // Handlers - 使用 useCart hook
    const handleAddToCart = async (product: Product, variantName: string, price: number, quantity: number) => {
        const success = await addToCart({
          product_id: String(product.id),
          product_name: product.title,
          product_image: product.image,
          variant_name: variantName,
          price: price,
          quantity: quantity,
        });
        if (success) {
          setIsCartOpen(true);
        }
    };

    const handleRemoveFromCart = async (itemId: string) => {
        await removeFromCart(itemId);
    };
    
    const handleUpdateQuantity = async (index: number, quantity: number) => {
        const item = cartItems[index];
        if (item) {
          await updateQuantity(item.id, quantity);
        }
    };
    
    // 管理员：删除商品
    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('确认删除该商品？删除后将无法恢复。')) return;
        const success = await deleteProduct(productId);
        if (success) {
          alert('商品已删除');
          fetchProducts();
        }
    };

    // Handle login button click
    const handleLoginClick = () => {
      setAuthModalWarning(hasGuestCartItems());
      setShowAuthModal(true);
    };

    // Grid Layout Helper
    const isBentoLayout = selectedCategory === '全部';
  
    const getGridConfig = (index: number) => {
        if (!isBentoLayout) {
        return { 
            span: 'col-span-1', 
            intensity: 'normal' as const 
        };
        }

        const pattern = index % 10;
        if (pattern === 0) return { span: 'md:col-span-2 md:row-span-2', intensity: 'low' as const };
        if (pattern === 5) return { span: 'md:col-span-2', intensity: 'low' as const };
        if (pattern === 8) return { span: 'md:row-span-2', intensity: 'normal' as const };
        return { span: 'col-span-1 row-span-1', intensity: 'normal' as const };
    };

    // 购物车数量现在由 useCart hook 提供
    const totalCartCount = cartCount;

    return (
        <div className="min-h-screen bg-brutal-bg text-gray-900 font-sans selection:bg-brutal-yellow selection:text-black">
        
        {/* 游客模式提示横幅 - 仅在游客有购物车时显示 */}
        {isGuest && (hasGuestCart || hasGuestCartItems()) && (
          <div className="fixed top-0 left-0 right-0 bg-brutal-yellow border-b-4 border-black px-4 py-2 z-40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-black" />
              <span className="font-bold text-sm">
                ⚠️ 游客模式：购物车数据保存在本地，登录后自动同步
              </span>
            </div>
            <button
              onClick={handleLoginClick}
              className="px-4 py-1 text-sm flex items-center gap-2 bg-black text-white font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <LogIn size={16} />
              登录 / 注册
            </button>
          </div>
        )}

        {/* Top Navigation Bar */}
        <header className={`fixed left-0 right-0 h-16 bg-white border-b-4 border-black z-30 flex items-center px-4 justify-between ${!isAuthenticated ? 'top-12' : 'top-0'}`}>
            <div className="flex items-center gap-4">
            <AnimatedButton 
                variant="ghost"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2"
                aria-label="Toggle sidebar menu"
            >
                <Menu size={20} />
            </AnimatedButton>
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-brutal-black text-brutal-yellow flex items-center justify-center font-black text-xl border-2 border-black shadow-brutal rounded-xl">寄</div>
                <h1 className="font-black text-xl hidden sm:block tracking-tight">二次元寄售站</h1>
            </div>
            </div>

            <div className="hidden md:flex items-center bg-brutal-bg border-2 border-black px-4 py-2 w-96 shadow-brutal rounded-xl">
            <Search size={18} className="text-gray-400" />
            <input 
                type="text" 
                placeholder="搜索周边商品..." 
                className="bg-transparent border-none outline-none ml-2 w-full font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            </div>

            <div className="flex items-center gap-4">
            
            {isAuthenticated ? (
              <>
                <div className="hidden md:block text-xs font-bold text-right">
                    <div className="text-gray-500">欢迎回来</div>
                    <div className="flex items-center gap-1">
                    {user?.name || user?.email}
                    </div>
                </div>

                <Link to="/profile">
                  <AnimatedButton 
                      variant="icon"
                      className="relative p-3"
                      title="个人中心"
                  >
                      <UserIcon size={20} />
                  </AnimatedButton>
                </Link>

                <Link to="/orders">
                  <AnimatedButton 
                      variant="icon"
                      className="relative p-3"
                      title="我的订单"
                  >
                      <Package size={20} />
                  </AnimatedButton>
                </Link>
              </>
            ) : (
              <button
                onClick={handleLoginClick}
                className="hidden md:flex items-center gap-2 font-bold text-brutal-black hover:text-brutal-blue transition-colors"
              >
                <UserIcon size={20} />
                登录
              </button>
            )}
            </div>
        </header>

        {/* Main Layout */}
        <div className={`flex h-screen overflow-hidden ${!isAuthenticated ? 'pt-28' : 'pt-16'}`}>
            
            {/* Sidebar (IP Selector) */}
            <aside 
            className={`bg-white border-r-2 border-black overflow-y-auto transition-all duration-300 ease-in-out flex flex-col ${
                isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0'
            }`}
            >
            <div className="p-6">
                <h3 className="font-black text-lg mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Filter size={18} /> IP 筛选
                </h3>
                <div className="space-y-2">
                {IPS.map(ip => (
                    <SidebarFilterButton
                    key={ip}
                    isSelected={selectedIP === ip}
                    onClick={() => setSelectedIP(ip)}
                    >
                    {ip}
                    </SidebarFilterButton>
                ))}
                </div>
            </div>
            
            <div className="mt-auto p-6 border-t-2 border-gray-100">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <LayoutGrid size={14} />
                <span>v1.0.0 Alpha</span>
                </div>
            </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-[#f3f3f3] p-4 md:p-8 relative">
            
            {/* Category Tabs (Like Browser Tabs) */}
            <div className="mb-8 overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max items-center">
                {CATEGORIES.map(cat => (
                    <AnimatedButton
                    key={cat}
                    variant={selectedCategory === cat ? 'primary' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2 rounded-full whitespace-nowrap ${
                        selectedCategory === cat
                        ? ''
                        : 'text-gray-500 hover:text-black'
                    }`}
                    >
                    {cat}
                    </AnimatedButton>
                ))}
                
                {/* 管理员：发布新商品按钮 */}
                {isAdmin && (
                  <button
                    onClick={() => setShowProductUploadModal(true)}
                    className="ml-auto px-4 py-2 rounded-full flex items-center gap-2 bg-brutal-black text-brutal-yellow font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    <Plus size={18} />
                    发布新商品
                  </button>
                )}
                </div>
            </div>

            {/* Loading 状态 */}
            {productsLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-brutal-black border-t-brutal-yellow rounded-full"></div>
                <span className="ml-3 font-bold">加载中...</span>
              </div>
            )}

            {/* Error 状态 */}
            {productsError && !productsLoading && (
              <div className="bg-red-100 border-4 border-red-600 p-6 rounded-xl text-center">
                <AlertTriangle size={48} className="mx-auto text-red-600 mb-4" />
                <p className="font-bold text-red-600">{productsError}</p>
                <AnimatedButton
                  variant="outline"
                  onClick={() => fetchProducts()}
                  className="mt-4"
                >
                  重试
                </AnimatedButton>
              </div>
            )}

            {/* Products Grid - Conditional Layout */}
            {!productsLoading && !productsError && (
            <div className={`grid gap-6 pb-24 ${
                isBentoLayout 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[280px] grid-flow-dense' 
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
                {products.map((product, idx) => {
                const { span, intensity } = getGridConfig(idx);
                
                return (
                    <div key={product.id} className="relative group">
                      <Link to={`/product/${product.id}`}>
                      <AtroposCard 
                      className={`
                          h-full 
                          ${span} 
                          ${!isBentoLayout ? 'aspect-[3/4]' : ''}
                      `} 
                      intensity={intensity}
                      >
                    <div className="flex flex-col h-full">
                        {/* Image takes remaining space */}
                        <div className="flex-1 bg-gray-200 overflow-hidden relative border-b-2 border-black group">
                        <img 
                            src={product.image} 
                            alt={product.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-2 left-2 bg-yellow-400 px-2 py-1 text-xs font-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {product.category}
                        </div>
                        </div>
                        {/* Content takes minimal required space */}
                        <div className="bg-white p-4 flex flex-col justify-between shrink-0">
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{product.ip}</div>
                            <h3 className="font-black text-lg leading-tight line-clamp-1 mb-1">{product.title}</h3>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="font-mono font-bold text-xl">¥{product.basePrice}+</span>
                            <button 
                              className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
                              title="加入购物车"
                            >
                            <ShoppingCart size={16} />
                            </button>
                        </div>
                        </div>
                    </div>
                    </AtroposCard>
                    </Link>
                    
                    {/* 管理员：编辑/删除按钮 */}
                    {isAdmin && (
                      <div className="absolute top-2 right-2 bg-white border-2 border-black shadow-brutal rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                        <Link to={`/admin/products/${product.id}/edit`}>
                          <button 
                            className="p-2 bg-brutal-yellow hover:bg-yellow-500 text-black rounded transition-colors"
                            title="编辑商品"
                          >
                            <Edit size={16} />
                          </button>
                        </Link>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteProduct(String(product.id));
                          }}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                          title="删除商品"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                    </div>
                );
                })}
            </div>
            )}

            {/* 空状态 */}
            {!productsLoading && !productsError && products.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="text-6xl mb-4">👻</div>
                <p className="font-bold text-xl">这里什么都没有...</p>
                <button 
                    onClick={() => {setSelectedCategory('全部'); setSelectedIP('全部'); setSearchQuery('');}}
                    className="mt-4 px-6 py-2 bg-black text-white font-bold rounded-xl hover:bg-gray-800 border-2 border-black shadow-brutal"
                >
                    重置筛选
                </button>
                </div>
            )}
            </main>

        </div>

        {/* Modals & Drawers */}
        <ProductModal 
            isOpen={!!viewProduct} 
            product={viewProduct} 
            onClose={() => setViewProduct(null)} 
            onAddToCart={handleAddToCart}
        />
        
        <CartDrawer 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)} 
            cart={cartItems}
            onRemoveItem={(index) => cartItems[index] && handleRemoveFromCart(cartItems[index].id)}
            onUpdateQuantity={handleUpdateQuantity}
        />

        {/* 悬浮购物车按钮 - 右下角 */}
        <FloatingCartButton
            cartCount={cartCount}
            onClick={() => setIsCartOpen(true)}
            isCartOpen={isCartOpen}
        />

        {/* Auth Modal */}
        <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            showGuestWarning={authModalWarning}
        />

        {/* Product Upload Modal (Admin Only) */}
        {isAdmin && (
          <ProductUploadModal
            isOpen={showProductUploadModal}
            onClose={() => setShowProductUploadModal(false)}
            onSuccess={() => {
              fetchProducts(); // 刷新商品列表
            }}
          />
        )}

        </div>
    );
};

export default Shop;
                    className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none focus:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                  {errors.stock && (
                    <p className="mt-2 text-red-600 font-bold">{errors.stock.message}</p>
                  )}
                </div>
              </div>
            </form>

            {/* Footer - 固定在底部 */}
            <div className="border-t-4 border-black bg-white p-6 shrink-0">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={submitting || uploadingImage}
                  className="flex-1 px-6 py-4 bg-yellow-400 text-black font-black text-lg border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="animate-spin" size={20} />
                      {editMode ? '更新中...' : '发布中...'}
                    </span>
                  ) : (
                    editMode ? '✅ 更新商品' : '🚀 立即发布'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-6 py-4 bg-white text-black font-black text-lg border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
