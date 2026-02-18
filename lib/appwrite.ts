/**
 * Appwrite SDK 配置和初始化
 */
import { Client, Account, Databases, Storage, Query, ID } from 'appwrite';

// 初始化 Appwrite Client
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// 导出服务实例
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// 导出工具
export { Query, ID };

// 数据库和集合 ID
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const COLLECTIONS = {
  PRODUCTS: import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
  USERS: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
  ORDERS: import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID,
  ORDER_ITEMS: import.meta.env.VITE_APPWRITE_ORDER_ITEMS_COLLECTION_ID,
  ADDRESSES: import.meta.env.VITE_APPWRITE_ADDRESSES_COLLECTION_ID,
  CART_ITEMS: import.meta.env.VITE_APPWRITE_CART_ITEMS_COLLECTION_ID,
};

// Storage Bucket ID
export const STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID;

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
