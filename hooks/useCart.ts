import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, Query, ID, Permission, Role } from '../lib/appwrite';
import { useAuth } from '../contexts/AuthContext';
import { CartItem, AppwriteCartItem } from '../types';
import { 
  getGuestCart, 
  addToGuestCart, 
  updateGuestCartItem, 
  removeFromGuestCart, 
  clearGuestCart,
  GuestCartItem 
} from '../utils/guestCart';

// ========== 扩展 CartItem 添加 ID ==========
export interface CartItemWithId extends CartItem {
  id: string;  // 购物车项 ID（数据库 ID 或本地生成）
}

export function useCart() {
  const { user, isGuest, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========== 获取购物车 ==========
  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isGuest) {
        // 游客：从 sessionStorage 读取
        const guestItems = getGuestCart();
        const mapped: CartItemWithId[] = guestItems.map((item, index) => ({
          id: `guest-${index}`,
          productId: item.productId,           // ✅ 驼峰命名
          productTitle: item.productName,      // ✅ 驼峰命名
          image: item.image || '/placeholder-product.jpg',
          variantName: item.variantName || '', // ✅ 驼峰命名
          price: item.price,
          quantity: item.quantity,
        }));
        setCartItems(mapped);
        console.log('🛒 游客购物车:', mapped.length, '件商品');
      } else if (user) {
        // 登录用户：从 Appwrite 读取
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CART_ITEMS,
          [
            Query.equal('userId', user.$id),      // ✅ 使用驼峰命名
            Query.orderDesc('createdAt'),          // ✅ 使用驼峰命名
          ]
        );

        // 获取商品详情来补充购物车信息
        const items: CartItemWithId[] = await Promise.all(
          response.documents.map(async (doc) => {
            const cartDoc = doc as unknown as AppwriteCartItem;
            
            // 尝试获取商品信息
            let productName = '商品已下架';
            let productImage = '/placeholder-product.jpg';
            let price = 0;
            
            try {
              const product = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                cartDoc.productId                  // ✅ 使用驼峰命名
              );
              productName = product.name as string;
              productImage = (product.imageUrl as string) || '/placeholder-product.jpg';
              price = product.price as number;
            } catch {
              // 商品可能已被删除
            }

            return {
              id: cartDoc.$id,
              productId: cartDoc.productId,        // ✅ 使用驼峰命名
              productTitle: productName,
              image: productImage,
              variantName: '',  // 可以从购物车文档扩展
              price: price,
              quantity: cartDoc.quantity,
            };
          })
        );

        setCartItems(items);
        console.log('🛒 用户购物车:', items.length, '件商品');
      }
    } catch (err: any) {
      console.error('❌ 获取购物车失败:', err);
      setError(err.message || '获取购物车失败');
    } finally {
      setLoading(false);
    }
  }, [isGuest, user]);

  // 初始加载
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ========== 添加到购物车 ==========
  const addToCart = async (item: {
    productId: string;          // ✅ 驼峰命名
    productName: string;        // ✅ 驼峰命名 
    productImage: string;       // ✅ 驼峰命名
    variantName?: string;       // ✅ 驼峰命名
    price: number;
    quantity: number;
  }) => {
    try {
      if (isGuest) {
        // 游客：存入 sessionStorage（注意字段映射：productImage -> image）
        addToGuestCart({
          productId: item.productId,       // ✅ 驼峰命名
          productName: item.productName,   // ✅ 驼峰命名
          image: item.productImage,         // GuestCartItem 使用 image 字段
          variantName: item.variantName,   // ✅ 驼峰命名
          price: item.price,
          quantity: item.quantity,
        });
        console.log('🛒 [游客] 已添加到购物车');
      } else if (user) {
        // 登录用户：写入 Appwrite（带行级安全权限）
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.CART_ITEMS,
          ID.unique(),
          {
            userId: user.$id,                      // ✅ 使用驼峰命名
            productId: item.productId,             // ✅ 使用驼峰命名
            quantity: item.quantity,
            createdAt: new Date().toISOString(),   // ✅ 使用驼峰命名
            isActive: true,                        // ✅ 添加必填字段
          },
          [
            // 行级安全：只有该用户可以读取、更新、删除
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ]
        );
        console.log('🛒 [用户] 已添加到购物车');
      }

      // 刷新购物车
      await fetchCart();
      return true;
    } catch (err: any) {
      console.error('❌ 添加购物车失败:', err);
      setError(err.message || '添加购物车失败');
      return false;
    }
  };

  // ========== 更新购物车数量 ==========
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      return removeFromCart(itemId);
    }

    try {
      if (isGuest) {
        // 游客：更新 sessionStorage
        const item = cartItems.find((i: CartItemWithId) => i.id === itemId);
        if (item) {
          updateGuestCartItem(item.productId, quantity);
        }
      } else {
        // 登录用户：更新 Appwrite
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.CART_ITEMS,
          itemId,
          { quantity }
        );
      }

      await fetchCart();
      return true;
    } catch (err: any) {
      console.error('❌ 更新购物车失败:', err);
      setError(err.message || '更新购物车失败');
      return false;
    }
  };

  // ========== 从购物车移除 ==========
  const removeFromCart = async (itemId: string) => {
    try {
      if (isGuest) {
        // 游客：从 sessionStorage 移除
        const item = cartItems.find((i: CartItemWithId) => i.id === itemId);
        if (item) {
          removeFromGuestCart(item.productId);
        }
      } else {
        // 登录用户：从 Appwrite 删除
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.CART_ITEMS,
          itemId
        );
      }

      await fetchCart();
      return true;
    } catch (err: any) {
      console.error('❌ 移除购物车失败:', err);
      setError(err.message || '移除购物车失败');
      return false;
    }
  };

  // ========== 清空购物车 ==========
  const clearCart = async () => {
    try {
      if (isGuest) {
        clearGuestCart();
      } else if (user) {
        // 删除用户所有购物车项
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CART_ITEMS,
          [Query.equal('userId', user.$id)]  // ✅ 使用驼峰命名
        );

        await Promise.all(
          response.documents.map(doc =>
            databases.deleteDocument(DATABASE_ID, COLLECTIONS.CART_ITEMS, doc.$id)
          )
        );
      }

      await fetchCart();
      return true;
    } catch (err: any) {
      console.error('❌ 清空购物车失败:', err);
      setError(err.message || '清空购物车失败');
      return false;
    }
  };

  // ========== 计算统计 ==========
  const cartCount = cartItems.reduce((sum: number, item: CartItemWithId) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum: number, item: CartItemWithId) => sum + item.price * item.quantity, 0);

  return {
    cartItems,
    loading,
    error,
    cartCount,
    cartTotal,
    refetch: fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
}
