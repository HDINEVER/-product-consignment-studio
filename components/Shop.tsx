import React, { useState, useMemo } from 'react';
import { Menu, Search, ShoppingCart, LayoutGrid, Filter } from 'lucide-react';
import { CATEGORIES, IPS, Product, CartItem, User, Category } from '../types';
import AtroposCard from './AtroposCard';
import ProductModal from './ProductModal';
import CartDrawer from './CartDrawer';
import AuthModal from './AuthModal';
import AnimatedButton from './AnimatedButton';
import SidebarFilterButton from './SidebarFilterButton';
import { useProducts } from '../hooks/useProducts';

const Shop = () => {
    const { products } = useProducts();
    const [user, setUser] = useState<User | null>(null);

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

    if (!user) {
        return <AuthModal onLogin={handleLogin} />;
    }

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
            
            <div className="hidden md:block text-xs font-bold text-right group relative cursor-pointer">
                <div className="text-gray-500">Welcome</div>
                <div className="flex items-center gap-1">
                {user.email}
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
};

export default Shop;
