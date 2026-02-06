/**
 * API 工具函数 - 封装所有后端 API 调用
 */

const API_BASE_URL = 'http://localhost:8788/api';

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge with any existing headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// ============ 认证相关 ============
export const authAPI = {
  // 注册
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 登录
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 获取当前用户信息
  getCurrentUser: () => request('/auth/me', { method: 'GET' }),
};

// ============ 商品相关 ============
export const productAPI = {
  // 获取商品列表（带分页和过滤）
  getProducts: (params?: {
    page?: number;
    limit?: number;
    category_id?: number;
    keyword?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return request(`/products${queryString}`, { method: 'GET' });
  },

  // 获取单个商品详情
  getProduct: (id: number) =>
    request(`/products/${id}`, { method: 'GET' }),

  // 创建商品（管理员）
  createProduct: (data: {
    name: string;
    slug?: string;
    description?: string;
    category_id?: number;
    brand?: string;
    model?: string;
    video_url?: string;
    is_featured?: boolean;
    skus: Array<{
      sku_code: string;
      price: number;
      cost_price?: number;
      stock_quantity: number;
      variant_values?: Record<string, string>;
      images?: string[];
    }>;
  }) =>
    request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 更新商品（管理员）
  updateProduct: (id: number, data: any) =>
    request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // 删除商品（管理员）
  deleteProduct: (id: number) =>
    request(`/products/${id}`, { method: 'DELETE' }),
};

// ============ 购物车相关 ============
export const cartAPI = {
  // 获取购物车
  getCart: () => request('/cart', { method: 'GET' }),

  // 添加商品到购物车
  addToCart: (data: { sku_id: number; quantity: number }) =>
    request('/cart/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 更新购物车商品数量
  updateCartItem: (itemId: number, quantity: number) =>
    request(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  // 删除购物车商品
  deleteCartItem: (itemId: number) =>
    request(`/cart/items/${itemId}`, { method: 'DELETE' }),

  // 清空购物车
  clearCart: () => request('/cart', { method: 'DELETE' }),
};

// ============ 订单相关 ============
export const orderAPI = {
  // 创建订单
  createOrder: (data: {
    items: Array<{ sku_id: number; quantity: number; price: number }>;
    shipping_address: {
      contact_name: string;
      contact_phone: string;
      province: string;
      city: string;
      district: string;
      address: string;
      zipcode?: string;
    };
    remark?: string;
    payment_method?: string;
  }) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 获取订单列表
  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return request(`/orders${queryString}`, { method: 'GET' });
  },

  // 获取单个订单详情
  getOrder: (id: number) => request(`/orders/${id}`, { method: 'GET' }),

  // 取消订单
  cancelOrder: (id: number) =>
    request(`/orders/${id}/cancel`, { method: 'POST' }),
};

// ============ 管理员相关 ============
export const adminAPI = {
  // 获取仪表板统计
  getDashboard: () => request('/admin/dashboard', { method: 'GET' }),

  // 获取所有订单（管理员）
  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return request(`/admin/orders${queryString}`, { method: 'GET' });
  },

  // 更新订单状态（管理员）
  updateOrderStatus: (id: number, status: string) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// 导出便捷函数
export default {
  auth: authAPI,
  product: productAPI,
  cart: cartAPI,
  order: orderAPI,
  admin: adminAPI,
};
