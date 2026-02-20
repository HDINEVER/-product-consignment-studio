import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, Query, ID, storage, STORAGE_BUCKET_ID } from '../lib/appwrite';
import { Product, Category } from '../types';

// ========== Appwrite 文档到 Product 的映射 ==========
interface AppwriteProduct {
  $id: string;
  name: string;
  description: string;
  price: number;
  category: string;  // 分类名称（用于显示）
  categoryId?: string;  // 分类外键（用于筛选）
  ip: string;  // IP名称（用于显示）
  ip_id?: string;  // IP外键（用于筛选）
  condition: string;
  image_url?: string;
  stock_quantity?: number;
  material_type?: string;
  seller_id: string;
  seller_name: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

// 将 Appwrite 文档转换为前端 Product 类型
const mapToProduct = (doc: AppwriteProduct): Product => ({
  id: doc.$id,
  title: doc.name,
  description: doc.description,
  basePrice: doc.price,
  category: doc.category as Category,
  ip: doc.ip,
  image: doc.image_url || '/placeholder-product.jpg',
  stockQuantity: doc.stock_quantity,
  materialType: doc.material_type,
  variants: [], // TODO: 支持变体
});

// ========== 筛选参数类型 ==========
export interface ProductFilters {
  category?: string;  // 分类ID或名称 - 改为string以支持动态分类
  ip?: string;
  search?: string;
  status?: 'active' | 'sold' | 'draft';
  minPrice?: number;
  maxPrice?: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // ========== 获取商品列表 ==========
  const fetchProducts = useCallback(async (filters?: ProductFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      // 构建查询条件
      const queries: string[] = [];
      
      // IP 筛选（使用 ip_id 字段）
      if (filters?.ip && filters.ip !== '全部' && filters.ip !== '未分类') {
        queries.push(Query.equal('ip_id', filters.ip));
      } else if (filters?.ip === '未分类') {
        // 查询 ip_id 为空的商品
        queries.push(Query.equal('ip_id', ''));
      }
      
      // 分类筛选（使用 categoryId 字段）
      if (filters?.category && filters.category !== '全部' && filters.category !== '未分类') {
        queries.push(Query.equal('categoryId', filters.category));
      } else if (filters?.category === '未分类') {
        // 查询 categoryId 为空的商品
        queries.push(Query.equal('categoryId', ''));
      }
      
      // 搜索（需要在Appwrite创建全文索引）
      if (filters?.search) {
        queries.push(Query.search('name', filters.search));
      }
      
      // 价格范围筛选
      if (filters?.minPrice !== undefined && filters?.minPrice > 0) {
        queries.push(Query.greaterThanEqual('price', filters.minPrice));
      }
      if (filters?.maxPrice !== undefined && filters?.maxPrice < 2000) {
        queries.push(Query.lessThanEqual('price', filters.maxPrice));
      }
      
      // 限制返回数量
      queries.push(Query.limit(100));
      queries.push(Query.orderDesc('$createdAt'));
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        queries
      );
      
      const mappedProducts = response.documents.map((doc) => 
        mapToProduct(doc as unknown as AppwriteProduct)
      );
      
      setProducts(mappedProducts);
      setTotal(response.total);
      setError(''); // 清除之前的错误
      console.log(`📦 获取到 ${mappedProducts.length} 个商品`, filters);
    } catch (err: any) {
      console.error('❌ 获取商品失败:', err);
      // 如果是查询错误但不是致命错误，显示空列表而不是错误
      // 例如：查询不存在的分类不应该显示为错误
      const isQueryError = err.type === 'general_query_invalid' || err.code === 400;
      if (isQueryError) {
        console.log('⚠️ 查询条件无结果，显示空列表');
        setProducts([]);
        setError(''); // 不显示错误，只显示空状态
      } else {
        setError(err.message || '获取商品失败');
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ========== 添加商品（管理员） ==========
  const addProduct = async (productData: {
    name: string;
    description: string;
    price: number;
    category: string;
    ip: string;
    condition: string;
    image_url?: string;
    stock_quantity?: number;
    material_type?: string;
    seller_id: string;
    seller_name: string;
  }) => {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        ID.unique(),
        {
          ...productData,
          status: 'active',
          created_at: new Date().toISOString(),
        }
      );
      
      // 刷新列表
      await fetchProducts();
      console.log('✅ 商品创建成功:', doc.$id);
      return doc;
    } catch (err: any) {
      console.error('❌ 创建商品失败:', err);
      throw new Error(err.message || '创建商品失败');
    }
  };

  // ========== 更新商品（管理员） ==========
  const updateProduct = async (id: string, updates: Partial<AppwriteProduct>) => {
    try {
      const doc = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        id,
        {
          ...updates,
          updated_at: new Date().toISOString(),
        }
      );
      
      // 刷新列表
      await fetchProducts();
      console.log('✅ 商品更新成功:', id);
      return doc;
    } catch (err: any) {
      console.error('❌ 更新商品失败:', err);
      throw new Error(err.message || '更新商品失败');
    }
  };

  // ========== 删除/下架商品（管理员） ==========
  const deleteProduct = async (id: string, hardDelete = false): Promise<boolean> => {
    try {
      if (hardDelete) {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id);
        console.log('✅ 商品永久删除:', id);
      } else {
        // 软删除：改为下架状态
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id, {
          status: 'draft',
          updated_at: new Date().toISOString(),
        });
        console.log('✅ 商品已下架:', id);
      }
      
      // 刷新列表
      await fetchProducts();
      return true;
    } catch (err: any) {
      console.error('❌ 删除商品失败:', err);
      throw new Error(err.message || '删除商品失败');
    }
  };

  // ========== 获取单个商品详情 ==========
  const getProduct = async (id: string): Promise<Product | null> => {
    try {
      const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        id
      );
      return mapToProduct(doc as unknown as AppwriteProduct);
    } catch (err: any) {
      console.error('❌ 获取商品详情失败:', err);
      return null;
    }
  };

  // ========== 上传商品图片 ==========
  const uploadProductImage = async (file: File): Promise<string> => {
    try {
      const response = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        file
      );
      
      // 获取图片预览 URL
      const url = storage.getFilePreview(
        STORAGE_BUCKET_ID,
        response.$id,
        800, // 宽度
        800, // 高度
        'center', // 裁剪位置
        100 // 质量
      );
      
      console.log('✅ 图片上传成功:', url);
      return url.toString();
    } catch (err: any) {
      console.error('❌ 图片上传失败:', err);
      throw new Error(err.message || '图片上传失败');
    }
  };

  return {
    products,
    loading,
    error,
    total,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    uploadProductImage,
  };
}
