import React, { useState, useMemo, useEffect } from 'react';
import { Menu, X, LayoutGrid, Layers, Package, User as UserIcon, AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Product, CartItem } from '../types';
import AtroposCard from './AtroposCard';
import ProductModal from './ProductModal';
import CartDrawer from './CartDrawer';
import FloatingCartButton from './FloatingCartButton';
import FavoritesDrawer from './FavoritesDrawer';
import FloatingFavoritesButton from './FloatingFavoritesButton';
import AuthModal from './AuthModal';
import AnimatedButton from './AnimatedButton';
import SidebarFilterButton from './SidebarFilterButton';
import ProductUploadModal from './ProductUploadModal';
import ProductDetailModal from './ProductDetailModal';
import TagManager from './TagManager';
import SearchBar from './SearchBar';
import PriceRangeFilter from './PriceRangeFilter';
import BentoProductGrid from './BentoProductGrid';
import Loader from './ui/loader';
import { useProducts, ProductFilters } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';
import { useTags } from '../hooks/useTags';
import { hasGuestCartItems } from '../utils/guestCart';

const Shop = () => {
    const navigate = useNavigate();
    
    // 使用重构后的 hooks
    const { 
      products, 
      loading: productsLoading, 
      error: productsError, 
      total,
      hasMore,
      fetchProducts,
      loadMore,
      deleteProduct,
      updateProduct,
      getProduct
    } = useProducts();
    const { cartItems, cartCount, addToCart, removeFromCart, updateQuantity, clearCart, loading: cartLoading } = useCart();
    const { favorites, favoriteCount, isFavorited, addToFavorites, removeFromFavorites, toggleFavorite } = useFavorites();
    const { user, isAuthenticated, isGuest, isAdmin, hasGuestCart } = useAuth();
    const { tags, loading: tagsLoading, addTag, deleteTag, getCategoryNames, getIPNames, getTagIdByName } = useTags();


    // 动态获取分类和IP列表
    const CATEGORIES = getCategoryNames();
    const IPS = getIPNames();

    // Shop State
    const [selectedCategory, setSelectedCategory] = useState<string>('全部');
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>('全部');
    const [selectedIP, setSelectedIP] = useState<string>('全部');
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
    const [viewProduct, setViewProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
    
    // Auth Modal State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalWarning, setAuthModalWarning] = useState(false);

    // Product Upload Modal State (Admin)
    const [showProductUploadModal, setShowProductUploadModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProductRect, setSelectedProductRect] = useState<DOMRect | null>(null);

    const selectedCategoryId = selectedCategory !== '全部' && selectedCategory !== '其他'
      ? getTagIdByName('category', selectedCategory)
      : null;
    const selectedSubCategoryTags = selectedCategoryId
      ? tags.subCategories.filter(tag => tag.categoryId === selectedCategoryId)
      : [];
    const SUB_CATEGORIES = selectedCategoryId
      ? ['全部', ...selectedSubCategoryTags.map(tag => tag.name)]
      : [];

    // 标签管理状态 (Admin)
    const [isEditCategoryMode, setIsEditCategoryMode] = useState(false);
    const [isEditIPMode, setIsEditIPMode] = useState(false);
    const [isEditSubCategoryMode, setIsEditSubCategoryMode] = useState(false);
    const [editingTag, setEditingTag] = useState<{ productId: string, type: 'category' | 'ip' } | null>(null);

    // 当前筛选条件（用于加载更多时传递）
    const [currentFilters, setCurrentFilters] = useState<ProductFilters>({});

    // 搜索防抖状态
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // 搜索防抖：用户停止输入 500ms 后才执行搜索
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearchQuery(searchQuery);
      }, 500);

      return () => clearTimeout(timer);
    }, [searchQuery]);

    // 当筛选条件变化时重新获取商品
    useEffect(() => {
      const filters: ProductFilters = {};
      
      // 将分类名称转换为ID
      if (selectedSubCategory !== '全部' && !selectedCategoryId) {
        setSelectedSubCategory('全部');
      }

      if (selectedCategory !== '全部' && selectedCategory !== '其他') {
        const categoryId = getTagIdByName('category', selectedCategory);
        console.log('🏷️ 分类筛选:', selectedCategory, '→ ID:', categoryId);
        if (categoryId) {
          filters.category = categoryId;
        }
      } else if (selectedCategory === '其他') {
        filters.category = '其他';
      }
      
      // 将子分类名称转换为ID
      if (selectedSubCategory !== '全部') {
        const subCategoryId = getTagIdByName('subCategory', selectedSubCategory);
        console.log('🏷️ 子分类筛选:', selectedSubCategory, '→ ID:', subCategoryId);
        if (subCategoryId) {
          filters.subCategory = subCategoryId;
        }
      }

      // 将IP名称转换为ID
      if (selectedIP !== '全部' && selectedIP !== '其他') {
        const ipId = getTagIdByName('ip', selectedIP);
        console.log('🎮 IP筛选:', selectedIP, '→ ID:', ipId);
        if (ipId) {
          filters.ip = ipId;
        }
      } else if (selectedIP === '其他') {
        filters.ip = '其他';
      }
      
      // 搜索关键词（使用防抖后的值）
      if (debouncedSearchQuery.trim()) {
        filters.search = debouncedSearchQuery.trim();
        console.log('🔍 执行搜索:', debouncedSearchQuery);
      }
      
      // 价格范围筛选
      if (priceRange[0] > 0 || priceRange[1] < 2000) {
        filters.minPrice = priceRange[0];
        filters.maxPrice = priceRange[1];
      }
      
      // 保存当前筛选条件（用于加载更多）
      setCurrentFilters(filters);
      
      console.log('📊 执行筛选，filters:', filters);
      fetchProducts(filters);
    }, [selectedCategory, selectedCategoryId, selectedSubCategory, selectedIP, debouncedSearchQuery, priceRange, fetchProducts, getTagIdByName]);

    // Handlers - 使用 useCart hook
    const handleAddToCart = async (product: Product, variantName: string, price: number, quantity: number) => {
        const success = await addToCart({
          productId: String(product.id),      // ✅ 驼峰命名
          productName: product.title,         // ✅ 驼峰命名
          productImage: product.image,        // ✅ 驼峰命名
          variantName: variantName,           // ✅ 驼峰命名
          price: price,
          quantity: quantity,
        });
        if (success) {
          setIsCartOpen(true);
          // 游客模式下显示提示
          if (isGuest) {
            showGuestToast('购物车数据保存在本地，登录后可同步到云端');
          }
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

    const handleClearCart = async () => {
        await clearCart();
    };

    // 收藏相关处理函数
    const handleRemoveFavorite = async (favoriteId: string) => {
        await removeFromFavorites(favoriteId);
    };

    const handleAddFavoriteToCart = async (product: Product) => {
        setSelectedProduct(product);
        setSelectedProductRect(null);
        setIsFavoritesOpen(false);
    };
    
    // 管理员: 删除商品
    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('确认下架该商品?商品将对用户不可见，但历史订单仍可查询。')) return;
        const success = await deleteProduct(productId);
        if (success) {
          alert('商品已下架');
          fetchProducts(currentFilters);
        }
    };

    // 加载更多商品
    const handleLoadMore = () => {
      loadMore(currentFilters);
    };

    // 更新商品标签
    const handleUpdateTag = async (productId: string, tagType: 'category' | 'ip', tagName: string) => {
      try {
        const tagId = getTagIdByName(tagType, tagName);
        if (!tagId && tagName !== '其他') {
          alert('标签不存在');
          return;
        }
        
        const updates: any = {
          [tagType]: tagName,  // 更新名称字段
          [tagType === 'category' ? 'categoryId' : 'ipId']: tagId || '',  // ✅ 驼峰命名
        };
        
        await updateProduct(productId, updates);
        setEditingTag(null);
        fetchProducts();
        console.log(`✅ 商品标签已更新: ${tagType} = ${tagName}`);
      } catch (err) {
        console.error('❌ 更新标签失败:', err);
        alert('更新标签失败');
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

    // 游客加入购物车提示弹窗状态
    const [showGuestCartToast, setShowGuestCartToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // 显示游客购物车提示
    const showGuestToast = (message: string) => {
      setToastMessage(message);
      setShowGuestCartToast(true);
      setTimeout(() => setShowGuestCartToast(false), 4000);
    };

    return (
        <div className="min-h-screen bg-brutal-bg text-gray-900 font-sans selection:bg-brutal-yellow selection:text-black">

        {/* Top Navigation Bar */}
        <header className="fixed left-0 right-0 top-0 h-16 sm:h-[72px] lg:h-20 bg-white border-b border-gray-200 z-30 flex items-center px-3 sm:px-5 lg:px-6 justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
            <AnimatedButton 
                variant="ghost"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 sm:p-2.5"
                aria-label={isSidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
            >
                {isSidebarOpen ? (
                  <X size={20} className="sm:w-6 sm:h-6" />
                ) : (
                  <Menu size={20} className="sm:w-6 sm:h-6" />
                )}
            </AnimatedButton>
            <div className="flex items-center gap-3">
                <img src="/assets/logo.webp" alt="工作室Logo" className="w-12 h-12 border-2 border-black shadow-brutal rounded-xl object-cover" />
                <h1 className="font-black text-lg sm:text-xl hidden md:block tracking-tight">hdin-studio 制品小站</h1>
            </div>
            </div>

            {/* 搜索栏 + 筛选器 - 响应式 */}
            <div className="flex-1 flex items-center gap-3 max-w-sm sm:max-w-lg lg:max-w-2xl mx-3 sm:mx-6">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜索商品..."
                className="flex-1"
              />
              {/* 价格筛选 - 在所有屏幕尺寸显示 */}
              <div className="shrink-0">
                <PriceRangeFilter
                  min={0}
                  max={2000}
                  defaultMin={priceRange[0]}
                  defaultMax={priceRange[1]}
                  onApply={(min, max) => setPriceRange([min, max])}
                />
              </div>
            </div>

            {/* PC/Tablet Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3 sm:gap-4">
            
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
        <div className="flex h-screen overflow-hidden pt-16 sm:pt-[72px] lg:pt-20">
            
            {/* Sidebar Overlay - 手机端点击关闭 */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/30 z-20 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
            
            {/* Sidebar (IP Selector) */}
            <aside 
            className={`fixed lg:relative bg-white border-r-2 border-black overflow-y-auto transition-all duration-300 ease-in-out flex flex-col z-30 h-full ${
                isSidebarOpen 
                  ? 'w-64 sm:w-72 lg:w-64 xl:w-80 translate-x-0' 
                  : 'w-0 -translate-x-full lg:-translate-x-full opacity-0'
            }`}
            >
            {/* 手机端专用登录与用户功能栏 */}
            <div className="p-6 border-b-2 border-gray-100 lg:hidden">
              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="text-sm font-bold">
                    <div className="text-gray-500">欢迎回来</div>
                    <div className="mt-1 break-all">
                      {user?.name || user?.email}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/profile" onClick={() => setIsSidebarOpen(false)} className="flex-1">
                      <AnimatedButton variant="outline" className="w-full text-sm justify-center py-2 h-auto flex items-center gap-2">
                        <UserIcon size={16} /> 个人中心
                      </AnimatedButton>
                    </Link>
                    <Link to="/orders" onClick={() => setIsSidebarOpen(false)} className="flex-1">
                      <AnimatedButton variant="outline" className="w-full text-sm justify-center py-2 h-auto flex items-center gap-2">
                        <Package size={16} /> 我的订单
                      </AnimatedButton>
                    </Link>
                  </div>
                </div>
              ) : (
                <AnimatedButton
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    handleLoginClick();
                    setIsSidebarOpen(false);
                  }}
                >
                  <UserIcon size={18} />
                  登录 / 注册
                </AnimatedButton>
              )}
            </div>

            <div className="p-6">
                <h3 className="font-black text-lg mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Layers size={18} /> IP 筛选
                </h3>

                {/* 管理员: IP标签管理 */}
                {isAdmin ? (
                  <TagManager
                    tags={tags.ips}
                    type="ip"
                    typeName="IP"
                    onAdd={async (name) => await addTag('ip', name)}
                    onDelete={async (tagId, tagName) => await deleteTag(tagId, 'ip', tagName)}
                    isEditMode={isEditIPMode}
                    onToggleEditMode={() => setIsEditIPMode(!isEditIPMode)}
                    selectedTag={selectedIP}
                    onSelectTag={(tagName) => setSelectedIP(tagName)}
                    vertical={true}
                  />
                ) : (
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
                )}
            </div>
            
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-[#f3f3f3] p-4 sm:p-5 md:p-6 lg:p-8 relative">
            
            {/* Category Tabs (Like Browser Tabs) */}
            <div className="mb-5">
                {/* 管理员: 分类标签管理 */}
                {isAdmin ? (
                  <div className="mb-4">
                    <TagManager
                      tags={tags.categories}
                      type="category"
                      typeName="分类"
                      onAdd={async (name) => await addTag('category', name)}
                      onDelete={async (tagId, tagName) => await deleteTag(tagId, 'category', tagName)}
                      isEditMode={isEditCategoryMode}
                      onToggleEditMode={() => setIsEditCategoryMode(!isEditCategoryMode)}
                      selectedTag={selectedCategory}
                      onSelectTag={(tagName) => {
                        setSelectedCategory(tagName);
                        setSelectedSubCategory('全部');
                      }}
                    />
                  </div>
                ) : null}

                {/* 分类按钮 */}
                <div className="overflow-x-auto pb-4 pt-1">
                  <div className="flex gap-1.5 min-w-max items-center px-1">
                    {CATEGORIES.map(cat => (
                      <AnimatedButton
                        key={cat}
                        variant={selectedCategory === cat ? 'primary' : 'outline'}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setSelectedSubCategory('全部');
                        }}
                        className={`px-4 py-1.5 rounded-xl whitespace-nowrap ${
                          selectedCategory === cat
                            ? ''
                            : 'text-gray-500 hover:text-black'
                        }`}
                      >
                        {cat}
                      </AnimatedButton>
                    ))}
                    
                    {/* 管理员: 发布新商品按钮（纯图标） */}
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setEditingProduct(null);
                          setShowProductUploadModal(true);
                        }}
                        className="ml-auto mr-4 w-9 h-9 rounded-full flex items-center justify-center bg-brutal-black text-brutal-yellow font-black border-[3px] border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] transition-all"
                        title="发布新商品"
                      >
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>

                {SUB_CATEGORIES.length > 1 && (
                  <div className="overflow-x-auto pb-2 pt-1">
                    <div className="flex gap-1.5 min-w-max items-center px-1">
                      {SUB_CATEGORIES.map(subCategory => (
                        <AnimatedButton
                          key={subCategory}
                          variant={selectedSubCategory === subCategory ? 'primary' : 'outline'}
                          onClick={() => setSelectedSubCategory(subCategory)}
                          className={`px-3 py-1 rounded-lg whitespace-nowrap text-sm ${
                            selectedSubCategory === subCategory
                              ? ''
                              : 'text-gray-500 hover:text-black'
                          }`}
                        >
                          {subCategory === '全部' ? '全部细分' : subCategory}
                        </AnimatedButton>
                      ))}
                    </div>
                  </div>
                )}

                {isAdmin && selectedCategoryId && (
                  <div className="mt-3 p-3 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0_0_#000]">
                    <div className="mb-2 text-sm font-black text-gray-700">细分类别管理</div>
                    <TagManager
                      tags={selectedSubCategoryTags}
                      type="subCategory"
                      typeName="细分"
                      onAdd={async (name) => await addTag('subCategory', name, selectedCategoryId)}
                      onDelete={async (tagId, tagName) => await deleteTag(tagId, 'subCategory', tagName)}
                      isEditMode={isEditSubCategoryMode}
                      onToggleEditMode={() => setIsEditSubCategoryMode(!isEditSubCategoryMode)}
                      selectedTag={selectedSubCategory}
                      onSelectTag={(tagName) => setSelectedSubCategory(tagName)}
                    />
                  </div>
                )}
            </div>

            {/* Loading 状态 */}
            {productsLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader size="md" text="加载中..." />
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

            {/* Products Grid - 使用新的 BentoProductGrid */}
            {!productsLoading && !productsError && (
              <BentoProductGrid
                products={products}
                isAdmin={isAdmin}
                isFavorited={isFavorited}
                onToggleFavorite={toggleFavorite}
                onProductSelect={(product, element) => {
                  if (!editingTag) {
                    setSelectedProduct(product);
                    setSelectedProductRect(element ? element.getBoundingClientRect() : null);
                  }
                }}
                onAddToCart={(product) => {
                  setSelectedProduct(product);
                  setSelectedProductRect(null);
                }}
                onEdit={(productId) => {
                  const product = products.find(item => item.id === productId);
                  if (!product) return;
                  setEditingProduct(product);
                  setShowProductUploadModal(true);
                }}
                onDelete={(productId) => handleDeleteProduct(productId)}
                onEditCategory={(productId) => setEditingTag({ productId, type: 'category' })}
                onEditIP={(productId) => setEditingTag({ productId, type: 'ip' })}
                editingTag={editingTag}
                categories={CATEGORIES}
                ips={IPS}
                onCategoryChange={(productId, value) => handleUpdateTag(productId, 'category', value)}
                onIPChange={(productId, value) => handleUpdateTag(productId, 'ip', value)}
                onTagBlur={() => setEditingTag(null)}
                emptyMessage={
                  selectedCategory !== '全部' || selectedSubCategory !== '全部' || selectedIP !== '全部' || searchQuery || priceRange[0] > 0 || priceRange[1] < 2000
                    ? '试试调整筛选条件吧' 
                    : isAdmin ? '点击右上角 ➕ 发布第一个商品' : '敬请期待...'
                }
              />
            )}

            {/* 🔥 技巧B: 加载更多按钮 */}
            {!productsLoading && !productsError && products.length > 0 && (
              <div className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 z-30 flex flex-col items-start gap-1.5">
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                  已加载 {products.length} / {total} 个商品
                </p>
                {hasMore ? (
                  <AnimatedButton
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={productsLoading}
                    className="min-w-[120px] text-xs px-3 py-1.5"
                  >
                    {productsLoading ? '加载中...' : '加载更多'}
                  </AnimatedButton>
                ) : (
                  <p className="text-[11px] sm:text-xs text-gray-400">已加载全部商品 🎉</p>
                )}
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
            onClearCart={handleClearCart}
            onProductClick={async (productId: string) => {
              // 在当前列表中查找
              let product = products.find(p => p.id === productId);
              if (!product) {
                // 如果当前页没加载到，去后端查询详情
                product = await getProduct(productId);
              }
              if (product) {
                setSelectedProduct(product);
                setSelectedProductRect(null); // 从购物车打开时，默认居中显示
              } else {
                alert('商品信息加载失败或已下架');
              }
            }}
        />

        {/* 收藏抽屉 */}
        <FavoritesDrawer
            isOpen={isFavoritesOpen}
            onClose={() => setIsFavoritesOpen(false)}
            favorites={favorites}
            onRemoveItem={handleRemoveFavorite}
            onAddToCart={handleAddFavoriteToCart}
            onProductClick={(product) => {
              // ✅ 新增：点击收藏夹中的产品时打开产品详情Modal
              setSelectedProduct(product);
              setSelectedProductRect(null); // 从收藏夹打开时显示居中弹窗
            }}
        />

        {/* 悬浮购物车按钮 - 右下角 */}
        <FloatingCartButton
            cartCount={cartCount}
            onClick={() => setIsCartOpen(true)}
            isCartOpen={isCartOpen}
        />

        {/* 悬浮收藏按钮 - 购物车上方 */}
        <FloatingFavoritesButton
            favoriteCount={favoriteCount}
            onClick={() => setIsFavoritesOpen(true)}
            isFavoritesOpen={isFavoritesOpen}
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
            onClose={() => {
              setShowProductUploadModal(false);
              setEditingProduct(null);
            }}
            onSuccess={() => {
              fetchProducts(); // 刷新商品列表
            }}
            editMode={!!editingProduct}
            initialData={editingProduct}
          />
        )}

        {/* Product Detail Modal */}
        <ProductDetailModal
          isOpen={selectedProduct !== null}
          onClose={() => {
            setSelectedProduct(null);
            setTimeout(() => setSelectedProductRect(null), 300); // Wait for exit animation
          }}
          product={selectedProduct}
          triggerRect={selectedProductRect}
        />

        {/* 游客购物车底部弹窗提示 */}
        <div 
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
            showGuestCartToast 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3 px-5 py-3 bg-white border-3 border-black rounded-xl shadow-brutal">
            <AlertTriangle size={18} className="text-brutal-orange shrink-0" />
            <span className="text-sm font-bold text-gray-800">{toastMessage}</span>
            <button
              onClick={handleLoginClick}
              className="ml-2 px-3 py-1 text-xs font-black bg-brutal-yellow border-2 border-black rounded-lg hover:bg-brutal-orange transition-colors"
            >
              登录
            </button>
          </div>
        </div>

        </div>
    );
};

export default Shop;
