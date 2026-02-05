import React, { useState, useMemo } from 'react';
import { Menu, Search, ShoppingCart, LayoutGrid, Filter, Database, LogOut } from 'lucide-react';
import { CATEGORIES, IPS, Product, CartItem, User, Category } from './types';
import { MOCK_PRODUCTS } from './constants';
import AtroposCard from './components/AtroposCard';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import AnimatedButton from './components/AnimatedButton';
import SidebarFilterButton from './components/SidebarFilterButton';

function App() {
  const [user, setUser] = useState<User | null>(null);
  
  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

  // App State
  // Initialize with empty array, fetch from API
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'shop' | 'admin'>('shop');
  
  // Fetch Products
  React.useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/items`);
      const data = await res.json();
      // Map API data to Product type if needed, or if API returns correct shape
      // Data from D1 is flat. We need to adapting mapping if needed.
      // Current Worker API returns: 
      // { id, name, description, price, stock_quantity, image_url, ip_category, material_type, status, ... }
      // Frontend expects: Product interface
      
      const mappedProducts: Product[] = Array.isArray(data) ? data.map((item: any) => ({
        id: item.id.toString(),
        title: item.name,
        ip: item.ip_category || '其他',
        category: '全部', // You might want to map this or store it in DB (material_type vs category)
        // Let's assume 'material_type' maps to 'category' for now, or we keep category static.
        // Actually, the user asked for "Product Category" (IP) and "Material Type".
        // Let's map material_type -> category if it matches, or default.
        image: item.image_url || 'https://via.placeholder.com/400',
        description: item.description || '',
        basePrice: item.price,
        stockQuantity: item.stock_quantity,
        materialType: item.material_type,
        // Construct variants from single price/stock
        variants: [{ name: '默认', price: item.price }]
      })) : [];
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };
  
  // Shop State
  const [selectedCategory, setSelectedCategory] = useState<Category>('全部');
  const [selectedIP, setSelectedIP] = useState<string>('全部');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const catMatch = selectedCategory === '全部' || product.category === selectedCategory;
      const ipMatch = selectedIP === '全部' || product.ip === selectedIP;
      return catMatch && ipMatch;
    });
  }, [products, selectedCategory, selectedIP]);

  // Handlers
  const handleLogin = (email: string) => {
    setUser({ email, isLoggedIn: true });
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setViewMode('shop');
  };

  const addToCart = (product: Product, variantName: string, price: number, quantity: number) => {
    setCart(prev => [...prev, {
      productId: product.id,
      productTitle: product.title,
      variantName,
      price,
      quantity,
      image: product.image
    }]);
    setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Admin Handlers
  // Admin Handlers - Now Async
  const handleAddProduct = async (newProduct: Product) => {
    try {
      const payload = {
        name: newProduct.title,
        description: newProduct.description,
        price: newProduct.basePrice,
        stock_quantity: newProduct.stockQuantity || 0,
        image_url: newProduct.image,
        ip_category: newProduct.ip,
        material_type: newProduct.materialType || newProduct.category, // Map category/material
        status: 'approved'
      };
      
      const res = await fetch(`${API_BASE_URL}/api/items`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchProducts(); // Refresh list
      }
    } catch (e) {
      console.error(e);
      alert('添加失败');
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      const payload = {
        name: updatedProduct.title,
        description: updatedProduct.description,
        price: updatedProduct.basePrice,
        stock_quantity: updatedProduct.stockQuantity || 0,
        image_url: updatedProduct.image,
        ip_category: updatedProduct.ip,
        material_type: updatedProduct.category, 
        status: 'approved'
      };

      const res = await fetch(`${API_BASE_URL}/api/items/${updatedProduct.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
      alert('更新失败');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/items/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
      alert('删除失败');
    }
  };

  // Grid Layout Helper
  const isBentoLayout = selectedCategory === '全部';
  
  const getGridConfig = (index: number) => {
    // If not in "All" mode, return standard uniform layout
    if (!isBentoLayout) {
      return { 
        span: 'col-span-1', 
        intensity: 'normal' as const 
      };
    }

    // Bento Logic for "All" view
    // 0: Large (2x2) - Low intensity
    // 5: Wide (2x1) - Low intensity
    // 8: Tall (1x2) - Normal intensity
    const pattern = index % 10;
    
    if (pattern === 0) return { span: 'md:col-span-2 md:row-span-2', intensity: 'low' as const };
    if (pattern === 5) return { span: 'md:col-span-2', intensity: 'low' as const };
    if (pattern === 8) return { span: 'md:row-span-2', intensity: 'normal' as const };
    
    return { span: 'col-span-1 row-span-1', intensity: 'normal' as const };
  };

  if (!user) {
    return <AuthModal onLogin={handleLogin} />;
  }

  // Admin View Render
  if (viewMode === 'admin') {
    return (
      <AdminDashboard 
        products={products}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onExit={() => setViewMode('shop')}
      />
    );
  }

  // Shop View Render
  return (
    <div className="min-h-screen bg-[#f3f3f3] text-gray-900 font-sans selection:bg-yellow-400 selection:text-black">
      
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b-2 border-black z-30 flex items-center px-4 justify-between">
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
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-lg rounded-md rotate-3">C</div>
            <h1 className="font-black text-xl hidden sm:block tracking-tighter">COMIC HUB</h1>
          </div>
        </div>

        <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 border-2 border-transparent hover:border-black transition-all w-96">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索制品..." 
            className="bg-transparent border-none outline-none ml-2 w-full font-medium" 
          />
        </div>

        <div className="flex items-center gap-4">
          
          <AnimatedButton
            variant="outline"
            onClick={() => setViewMode('admin')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs"
            title="Manage Database"
          >
            <Database size={14} />
            <span>后台管理</span>
          </AnimatedButton>

          <div className="hidden md:block text-xs font-bold text-right group relative cursor-pointer">
             <div className="text-gray-500">Welcome</div>
             <div className="flex items-center gap-1">
               {user.email}
             </div>
             {/* Simple Logout Dropdown */}
             <div className="absolute top-full right-0 pt-2 hidden group-hover:block">
                <button onClick={handleLogout} className="bg-white border-2 border-black px-4 py-2 shadow-lg whitespace-nowrap flex items-center gap-2 hover:bg-red-50 rounded">
                  <LogOut size={12}/> 退出
                </button>
             </div>
          </div>

          <AnimatedButton 
            variant="icon"
            onClick={() => setIsCartOpen(true)}
            className="relative p-3"
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-black z-20">
                {cart.length}
              </span>
            )}
          </AnimatedButton>
        </div>
      </header>

      {/* Main Layout */}
      <div className="pt-16 flex h-screen overflow-hidden">
        
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
            {/* Mobile Admin Button */}
            <AnimatedButton
              variant="outline"
              onClick={() => setViewMode('admin')}
              className="md:hidden w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 text-xs"
            >
              <Database size={14} />
              <span>后台管理</span>
            </AnimatedButton>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#f3f3f3] p-4 md:p-8 relative">
          
          {/* Category Tabs (Like Browser Tabs) */}
          <div className="mb-8 overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
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
            </div>
          </div>

          {/* Products Grid - Conditional Layout */}
          <div className={`grid gap-6 pb-24 ${
            isBentoLayout 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[280px] grid-flow-dense' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {filteredProducts.map((product, idx) => {
              const { span, intensity } = getGridConfig(idx);
              
              return (
                <AtroposCard 
                  key={product.id} 
                  className={`
                    h-full 
                    ${span} 
                    ${!isBentoLayout ? 'aspect-[3/4]' : ''}
                  `} 
                  onClick={() => setViewProduct(product)}
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
                      <div className="absolute top-2 left-2 bg-yellow-400 px-2 py-1 text-xs font-black border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
                        <button className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors">
                          <ShoppingCart size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </AtroposCard>
              );
            })}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="text-6xl mb-4">👻</div>
              <p className="font-bold text-xl">这里什么都没有...</p>
              <button 
                onClick={() => {setSelectedCategory('全部'); setSelectedIP('全部');}}
                className="mt-4 px-6 py-2 bg-black text-white font-bold rounded hover:bg-gray-800"
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
        onAddToCart={addToCart}
      />
      
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart}
        onRemoveItem={removeFromCart}
      />

    </div>
  );
}

export default App;