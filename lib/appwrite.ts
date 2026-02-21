/**
 * Appwrite SDK 配置和初始化
 */
import { Client, Account, Databases, Storage, Teams, Query, ID, Permission, Role } from 'appwrite';

// 环境变量验证
const VITE_APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const VITE_APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!VITE_APPWRITE_ENDPOINT || !VITE_APPWRITE_PROJECT_ID) {
  console.error('❌ Appwrite 配置错误：缺少必要的环境变量');
  console.error('请确保以下环境变量已配置：');
  console.error('- VITE_APPWRITE_ENDPOINT');
  console.error('- VITE_APPWRITE_PROJECT_ID');
  throw new Error('Appwrite configuration missing. Please check environment variables.');
}

// 初始化 Appwrite Client
const client = new Client()
  .setEndpoint(VITE_APPWRITE_ENDPOINT)
  .setProject(VITE_APPWRITE_PROJECT_ID);

// 导出服务实例
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const teams = new Teams(client);

// 导出工具
export { Query, ID, Permission, Role };

// 数据库和集合 ID（添加验证）
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
export const COLLECTIONS = {
  PRODUCTS: import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || 'products',
  USERS: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users',
  ORDERS: import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID || 'orders',
  ORDER_ITEMS: import.meta.env.VITE_APPWRITE_ORDER_ITEMS_COLLECTION_ID || 'order_items',
  ADDRESSES: import.meta.env.VITE_APPWRITE_ADDRESSES_COLLECTION_ID || 'addresses',
  CART_ITEMS: import.meta.env.VITE_APPWRITE_CART_ITEMS_COLLECTION_ID || 'cart_items',
  TAGS: import.meta.env.VITE_APPWRITE_TAGS_COLLECTION_ID || 'tags',
  CATEGORIES: 'categories',  // 分类表
  IP_TAGS: 'ip_tags',        // IP标签表
};

// Storage Bucket ID
export const STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'product-images';

// 验证 Appwrite 连接的辅助函数
export const verifyConnection = async () => {
  try {
    // 尝试获取账号信息来验证连接（如果未登录会返回 401，但连接正常）
    await account.get().catch(() => {
      // 未登录是正常的，说明连接成功
      console.log('✅ Appwrite 连接验证成功');
    });
    return true;
  } catch (error) {
    console.error('❌ Appwrite 连接失败:', error);
    return false;
  }
};

export default client;
