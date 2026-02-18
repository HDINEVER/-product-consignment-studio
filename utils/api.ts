/**
 * API 工具函数 - 使用 Appwrite SDK 封装所有后端 API 调用
 */
import { account, databases, storage, Query, ID, DATABASE_ID, COLLECTIONS, STORAGE_BUCKET_ID } from '../lib/appwrite';
import type { Models } from 'appwrite';

// ============ 认证相关 ============
export const authAPI = {
  // 注册
  register: async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => {
    try {
      // 创建 Appwrite 账号
      const user = await account.create(
        ID.unique(),
        data.email,
        data.password,
        data.name
      );

      // 在用户集合中创建用户文档（存储额外信息）
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        user.$id,
        {
          email: data.email,
          name: data.name,
          phone: data.phone || '',
          role: 'user',
          created_at: new Date().toISOString(),
        }
      );

      // 自动登录
      await account.createEmailPasswordSession(data.email, data.password);

      return {
        success: true,
        data: { user },
      };
    } catch (error: any) {
      throw new Error(error.message || '注册失败');
    }
  },

  // 登录
  login: async (data: { email: string; password: string }) => {
    try {
      // 创建会话（登录）
      const session = await account.createEmailPasswordSession(
        data.email,
        data.password
      );

      // 获取用户信息
      const user = await account.get();

      // 获取用户详细信息（从数据库）
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        user.$id
      );

      return {
        success: true,
        data: {
          token: session.$id, // session ID 作为 token
          user: {
            ...user,
            ...userDoc,
          },
        },
      };
    } catch (error: any) {
      throw new Error(error.message || '登录失败');
    }
  },

  // 登出
  logout: async () => {
    try {
      await account.deleteSession('current');
      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || '登出失败');
    }
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    try {
      const user = await account.get();
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        user.$id
      );

      return {
        success: true,
        data: {
          ...user,
          ...userDoc,
        },
      };
    } catch (error: any) {
      throw new Error(error.message || '获取用户信息失败');
    }
  },
};

// ============ 商品相关 ============
export const productAPI = {
  // 获取商品列表（带分页和过滤）
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    category_id?: number;
    keyword?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const offset = (page - 1) * limit;

      // 构建查询条件
      const queries: string[] = [];

      if (params?.keyword) {
        queries.push(Query.search('name', params.keyword));
      }

      if (params?.category_id) {
        queries.push(Query.equal('category_id', params.category_id));
      }

      if (params?.min_price) {
        queries.push(Query.greaterThanEqual('price', params.min_price));
      }

      if (params?.max_price) {
        queries.push(Query.lessThanEqual('price', params.max_price));
      }

      // 分页
      queries.push(Query.limit(limit));
      queries.push(Query.offset(offset));

      // 排序
      if (params?.sort_by) {
        const order = params.sort_order === 'desc' ? Query.orderDesc : Query.orderAsc;
        queries.push(order(params.sort_by));
      } else {
        queries.push(Query.orderDesc('$createdAt'));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        queries
      );

      return {
        success: true,
        data: response.documents,
        total: response.total,
        page,
        limit,
      };
    } catch (error: any) {
      throw new Error(error.message || '获取商品列表失败');
    }
  },

  // 获取单个商品详情
  getProduct: async (id: string) => {
    try {
      const product = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        id
      );

      return {
        success: true,
        data: product,
      };
    } catch (error: any) {
      throw new Error(error.message || '获取商品详情失败');
    }
  },

  // 创建商品（管理员）
  createProduct: async (data: {
    name: string;
    slug?: string;
    description?: string;
    category_id?: number;
    brand?: string;
    model?: string;
    price: number;
    cost_price?: number;
    stock_quantity: number;
    images?: string[];
    video_url?: string;
    is_featured?: boolean;
  }) => {
    try {
      const product = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        ID.unique(),
        {
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );

      return {
        success: true,
        data: product,
      };
    } catch (error: any) {
      throw new Error(error.message || '创建商品失败');
    }
  },

  // 更新商品（管理员）
  updateProduct: async (id: string, data: any) => {
    try {
      const product = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        id,
        {
          ...data,
          updated_at: new Date().toISOString(),
        }
      );

      return {
        success: true,
        data: product,
      };
    } catch (error: any) {
      throw new Error(error.message || '更新商品失败');
    }
  },

  // 删除商品（管理员）
  deleteProduct: async (id: string) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        id
      );

      return {
        success: true,
      };
    } catch (error: any) {
      throw new Error(error.message || '删除商品失败');
    }
  },

  // 上传商品图片
  uploadImage: async (file: File) => {
    try {
      const response = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        file
      );

      // 获取文件 URL
      const fileUrl = storage.getFileView(STORAGE_BUCKET_ID, response.$id);

      return {
        success: true,
        data: {
          fileId: response.$id,
          url: fileUrl.toString(),
        },
      };
    } catch (error: any) {
      throw new Error(error.message || '上传图片失败');
    }
  },
};

// ============ 购物车相关 ============
export const cartAPI = {
  // 获取购物车
  getCart: async () => {
    try {
      const user = await account.get();
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CART_ITEMS,
        [
          Query.equal('user_id', user.$id),
        ]
      );

      return {
        success: true,
        data: response.documents,
      };
    } catch (error: any) {
      throw new Error(error.message || '获取购物车失败');
    }
  },

  // 添加商品到购物车
  addToCart: async (data: { product_id: string; quantity: number }) => {
    try {
      const user = await account.get();

      // 检查是否已存在
      const existing = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CART_ITEMS,
        [
          Query.equal('user_id', user.$id),
          Query.equal('product_id', data.product_id),
        ]
      );

      if (existing.documents.length > 0) {
        // 更新数量
        const item = existing.documents[0];
        const updated = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.CART_ITEMS,
          item.$id,
          {
            quantity: (item.quantity as number) + data.quantity,
          }
        );

        return {
          success: true,
          data: updated,
        };
      } else {
        // 创建新项
        const cartItem = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.CART_ITEMS,
          ID.unique(),
          {
            user_id: user.$id,
            product_id: data.product_id,
            quantity: data.quantity,
            created_at: new Date().toISOString(),
          }
        );

        return {
          success: true,
          data: cartItem,
        };
      }
    } catch (error: any) {
      throw new Error(error.message || '添加到购物车失败');
    }
  },

  // 更新购物车商品数量
  updateCartItem: async (itemId: string, quantity: number) => {
    try {
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CART_ITEMS,
        itemId,
        { quantity }
      );

      return {
        success: true,
        data: updated,
      };
    } catch (error: any) {
      throw new Error(error.message || '更新购物车失败');
    }
  },

  // 删除购物车商品
  deleteCartItem: async (itemId: string) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.CART_ITEMS,
        itemId
      );

      return {
        success: true,
      };
    } catch (error: any) {
      throw new Error(error.message || '删除购物车商品失败');
    }
  },

  // 清空购物车
  clearCart: async () => {
    try {
      const user = await account.get();
      const cartItems = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CART_ITEMS,
        [Query.equal('user_id', user.$id)]
      );

      // 删除所有购物车项
      await Promise.all(
        cartItems.documents.map((item) =>
          databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.CART_ITEMS,
            item.$id
          )
        )
      );

      return {
        success: true,
      };
    } catch (error: any) {
      throw new Error(error.message || '清空购物车失败');
    }
  },
};

// ============ 订单相关 ============
export const orderAPI = {
  // 创建订单
  createOrder: async (data: {
    items: Array<{ product_id: string; quantity: number; price: number }>;
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
  }) => {
    try {
      const user = await account.get();

      // 计算总金额
      const total_amount = data.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // 创建订单
      const order = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        ID.unique(),
        {
          user_id: user.$id,
          order_number: `ORD${Date.now()}`,
          total_amount,
          status: 'pending',
          payment_status: 'unpaid',
          payment_method: data.payment_method || 'cod',
          shipping_address: JSON.stringify(data.shipping_address),
          remark: data.remark || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );

      // 创建订单项
      await Promise.all(
        data.items.map((item) =>
          databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.ORDER_ITEMS,
            ID.unique(),
            {
              order_id: order.$id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
            }
          )
        )
      );

      return {
        success: true,
        data: order,
      };
    } catch (error: any) {
      throw new Error(error.message || '创建订单失败');
    }
  },

  // 获取订单列表
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    try {
      const user = await account.get();
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const offset = (page - 1) * limit;

      const queries = [
        Query.equal('user_id', user.$id),
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt'),
      ];

      if (params?.status) {
        queries.push(Query.equal('status', params.status));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        queries
      );

      return {
        success: true,
        data: response.documents,
        total: response.total,
        page,
        limit,
      };
    } catch (error: any) {
      throw new Error(error.message || '获取订单列表失败');
    }
  },

  // 获取单个订单详情
  getOrder: async (id: string) => {
    try {
      const order = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        id
      );

      // 获取订单项
      const orderItems = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDER_ITEMS,
        [Query.equal('order_id', id)]
      );

      return {
        success: true,
        data: {
          ...order,
          items: orderItems.documents,
        },
      };
    } catch (error: any) {
      throw new Error(error.message || '获取订单详情失败');
    }
  },

  // 取消订单
  cancelOrder: async (id: string) => {
    try {
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        id,
        {
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        }
      );

      return {
        success: true,
        data: updated,
      };
    } catch (error: any) {
      throw new Error(error.message || '取消订单失败');
    }
  },
};

// ============ 管理员相关 ============
export const adminAPI = {
  // 获取仪表板统计
  getDashboard: async () => {
    try {
      // 获取统计数据
      const [products, orders, users] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [Query.limit(1)]),
      ]);

      // 获取最近的订单
      const recentOrders = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        [Query.limit(5), Query.orderDesc('$createdAt')]
      );

      // 计算总销售额
      const allOrders = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        [Query.equal('status', 'completed')]
      );

      const totalRevenue = allOrders.documents.reduce(
        (sum, order) => sum + ((order.total_amount as number) || 0),
        0
      );

      return {
        success: true,
        data: {
          stats: {
            totalProducts: products.total,
            totalOrders: orders.total,
            totalUsers: users.total,
            totalRevenue,
          },
          recentOrders: recentOrders.documents,
        },
      };
    } catch (error: any) {
      throw new Error(error.message || '获取仪表板数据失败');
    }
  },

  // 获取所有订单（管理员）
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const offset = (page - 1) * limit;

      const queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt'),
      ];

      if (params?.status) {
        queries.push(Query.equal('status', params.status));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        queries
      );

      return {
        success: true,
        data: response.documents,
        total: response.total,
        page,
        limit,
      };
    } catch (error: any) {
      throw new Error(error.message || '获取订单列表失败');
    }
  },

  // 更新订单状态（管理员）
  updateOrderStatus: async (id: string, status: string) => {
    try {
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        id,
        {
          status,
          updated_at: new Date().toISOString(),
        }
      );

      return {
        success: true,
        data: updated,
      };
    } catch (error: any) {
      throw new Error(error.message || '更新订单状态失败');
    }
  },

  // 获取所有用户（管理员）
  getUsers: async (params?: {
    page?: number;
    limit?: number;
  }) => {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const offset = (page - 1) * limit;

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [
          Query.limit(limit),
          Query.offset(offset),
          Query.orderDesc('$createdAt'),
        ]
      );

      return {
        success: true,
        data: response.documents,
        total: response.total,
        page,
        limit,
      };
    } catch (error: any) {
      throw new Error(error.message || '获取用户列表失败');
    }
  },
};

// 导出便捷函数
export default {
  auth: authAPI,
  product: productAPI,
  cart: cartAPI,
  order: orderAPI,
  admin: adminAPI,
};
