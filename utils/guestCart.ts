/**
 * 游客购物车工具函数
 * 使用 sessionStorage 存储游客的购物车数据
 * 关闭页面后自动清空
 */

export interface GuestCartItem {
  productId: string;      // ✅ 驼峰命名
  productName: string;    // ✅ 驼峰命名
  price: number;
  quantity: number;
  image?: string;
  variantName?: string;   // ✅ 驼峰命名
  addedAt: string;        // ✅ 驼峰命名
}

const GUEST_CART_KEY = 'guest_cart_items';

/**
 * 获取游客购物车数据
 */
export const getGuestCart = (): GuestCartItem[] => {
  try {
    const data = sessionStorage.getItem(GUEST_CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('读取游客购物车失败:', error);
    return [];
  }
};

/**
 * 保存游客购物车数据
 */
export const saveGuestCart = (items: GuestCartItem[]): void => {
  try {
    sessionStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('保存游客购物车失败:', error);
  }
};

/**
 * 添加商品到游客购物车
 */
export const addToGuestCart = (item: Omit<GuestCartItem, 'addedAt'>): GuestCartItem[] => {
  const cart = getGuestCart();
  
  // 检查是否已存在相同商品
  const existingIndex = cart.findIndex(
    (i) => i.productId === item.productId && i.variantName === item.variantName
  );

  if (existingIndex > -1) {
    // 更新数量
    cart[existingIndex].quantity += item.quantity;
  } else {
    // 添加新项
    cart.push({
      ...item,
      addedAt: new Date().toISOString(),  // ✅ 驼峰命名
    });
  }

  saveGuestCart(cart);
  return cart;
};

/**
 * 更新游客购物车商品数量
 */
export const updateGuestCartItem = (productId: string, quantity: number, variantName?: string): GuestCartItem[] => {
  const cart = getGuestCart();
  
  const index = cart.findIndex(
    (i) => i.productId === productId && i.variantName === variantName  // ✅ 驼峰命名
  );

  if (index > -1) {
    if (quantity <= 0) {
      // 数量为0，删除项目
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
    }
  }

  saveGuestCart(cart);
  return cart;
};

/**
 * 从游客购物车移除商品
 */
export const removeFromGuestCart = (productId: string, variantName?: string): GuestCartItem[] => {
  const cart = getGuestCart();
  
  const filtered = cart.filter(
    (i) => !(i.productId === productId && i.variantName === variantName)  // ✅ 驼峰命名
  );

  saveGuestCart(filtered);
  return filtered;
};

/**
 * 清空游客购物车
 */
export const clearGuestCart = (): void => {
  sessionStorage.removeItem(GUEST_CART_KEY);
};

/**
 * 获取游客购物车商品总数
 */
export const getGuestCartCount = (): number => {
  const cart = getGuestCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
};

/**
 * 获取游客购物车总金额
 */
export const getGuestCartTotal = (): number => {
  const cart = getGuestCart();
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

/**
 * 检查是否有游客购物车数据
 */
export const hasGuestCartItems = (): boolean => {
  return getGuestCart().length > 0;
};
