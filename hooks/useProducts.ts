import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, Query, ID, storage, STORAGE_BUCKET_ID } from '../lib/appwrite';
import { Product, Category, AppwriteProduct } from '../types';

// 标签映射表类型
interface TagsMap {
  [id: string]: string;  // ID -> 标签名称
}

// 将 Appwrite 文档转换为前端 Product 类型
const mapToProduct = (doc: AppwriteProduct, categoryMap: TagsMap = {}, ipMap: TagsMap = {}): Product => ({
  id: doc.$id,
  title: doc.name,                                    // ✅ 使用 name
  description: doc.description,
  basePrice: doc.price,                               // ✅ 使用 price
  category: (categoryMap[doc.categoryId] || '未分类') as Category,  // ✅ 从映射表获取分类名称
  ip: ipMap[doc.ipId] || '未分类',                    // ✅ 从映射表获取IP名称
  image: doc.imageUrl || '/placeholder-product.jpg',  // ✅ 使用 imageUrl
  stockQuantity: doc.stockQuantity,                   // ✅ 使用 stockQuantity
  materialType: undefined,
  variants: [],
});

// ========== 筛选参数类型 ==========
export interface ProductFilters {
  category?: string;  // 分类ID或名称 - 改为string以支持动态分类
  ip?: string;
  search?: string;
  status?: 'active' | 'sold' | 'draft';
  minPrice?: number;
  maxPrice?: number;
  limit?: number;      // 每页数量，默认20
  offset?: number;     // 偏移量，默认0
  includeInactive?: boolean;  // 是否包含已下架商品（管理员用）
}

// 分页常量
const DEFAULT_PAGE_SIZE = 20;

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);  // 是否还有更多数据
  const [currentOffset, setCurrentOffset] = useState(0);  // 当前偏移量

  // ========== 获取商品列表 ==========
  const fetchProducts = useCallback(async (filters?: ProductFilters, append = false) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 fetchProducts 被调用，filters:', JSON.stringify(filters, null, 2));
      // 构建查询条件
      const queries: string[] = [];
      
      // 🔥 技巧A: 软删除 - 默认只查询 isActive=true 的商品
      // 除非明确需要查看已下架商品（管理员场景）
      if (!filters?.includeInactive) {
        queries.push(Query.equal('isActive', true));
      }
      
      // IP 筛选（使用 ipId 字段）✅
      if (filters?.ip && filters.ip !== '全部' && filters.ip !== '未分类') {
        queries.push(Query.equal('ipId', filters.ip));
      } else if (filters?.ip === '未分类') {
        // 查询 ipId 为空的商品
        queries.push(Query.equal('ipId', ''));
      }
      
      // 分类筛选（使用 categoryId 字段）
      if (filters?.category && filters.category !== '全部' && filters.category !== '未分类') {
        queries.push(Query.equal('categoryId', filters.category));
      } else if (filters?.category === '未分类') {
        // 查询 categoryId 为空的商品
        queries.push(Query.equal('categoryId', ''));
      }
      
      // 搜索 - 临时使用模糊搜索（contains）
      // 注意：等待 Appwrite index_search 全文索引构建完成后，可以改回 Query.search()
      if (filters?.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        console.log('🔍 搜索关键词:', searchTerm);
        
        // 临时方案：使用 contains 进行模糊搜索 name 字段
        // 全文索引就绪后可以改回: Query.search('name', searchTerm)
        queries.push(Query.contains('name', searchTerm));
        console.log('📝 添加模糊搜索: name contains', searchTerm);
      }
      
      // 价格范围筛选
      if (filters?.minPrice !== undefined && filters?.minPrice > 0) {
        queries.push(Query.greaterThanEqual('price', filters.minPrice));
      }
      if (filters?.maxPrice !== undefined && filters?.maxPrice < 2000) {
        queries.push(Query.lessThanEqual('price', filters.maxPrice));
      }
      
      // 🔥 技巧B: 分页获取
      const limit = filters?.limit ?? DEFAULT_PAGE_SIZE;
      const offset = filters?.offset ?? 0;
      queries.push(Query.limit(limit));
      queries.push(Query.offset(offset));
      queries.push(Query.orderDesc('$createdAt'));
      
      console.log('📊 最终查询条件:', queries.length, '个');
      queries.forEach((q, i) => console.log(`  ${i + 1}.`, typeof q === 'string' ? q : JSON.stringify(q)));
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        queries
      );
      
      console.log('📦 Appwrite 返回:', {
        total: response.total,
        documents: response.documents.length,
        搜索结果: response.documents.map((d: any) => ({ id: d.$id, name: d.name }))
      });
      
      // ========== ✅ 批量查询标签信息 ==========
      const docs = response.documents as unknown as AppwriteProduct[];
      
      // 收集所有唯一的 categoryId 和 ipId
      const categoryIds = [...new Set(docs.map(doc => doc.categoryId).filter(id => id && id.trim()))];
      const ipIds = [...new Set(docs.map(doc => doc.ipId).filter(id => id && id.trim()))];
      
      console.log('🏷️ 需要查询的标签:', { categoryIds, ipIds });
      
      // 批量查询分类和IP标签
      const [categoriesData, ipsData] = await Promise.all([
        categoryIds.length > 0 
          ? databases.listDocuments(DATABASE_ID, COLLECTIONS.CATEGORIES, [
              Query.equal('$id', categoryIds),
              Query.limit(100)
            ])
          : Promise.resolve({ documents: [] }),
        ipIds.length > 0
          ? databases.listDocuments(DATABASE_ID, COLLECTIONS.IP_TAGS, [
              Query.equal('$id', ipIds),
              Query.limit(100)
            ])
          : Promise.resolve({ documents: [] }),
      ]);
      
      // 构建 ID -> 名称 的映射表
      const categoryMap: TagsMap = {};
      categoriesData.documents.forEach((doc: any) => {
        categoryMap[doc.$id] = doc.name;
      });
      
      const ipMap: TagsMap = {};
      ipsData.documents.forEach((doc: any) => {
        ipMap[doc.$id] = doc.name;
      });
      
      console.log('✅ 标签映射表:', { categoryMap, ipMap });
      
      // 映射产品数据（传入标签映射表）
      const mappedProducts = docs.map((doc) => 
        mapToProduct(doc, categoryMap, ipMap)
      );
      
      // 分页逻辑：追加模式或替换模式
      if (append) {
        setProducts(prev => [...prev, ...mappedProducts]);
      } else {
        setProducts(mappedProducts);
      }
      
      setTotal(response.total);
      setCurrentOffset(offset + mappedProducts.length);
      setHasMore(offset + mappedProducts.length < response.total);
      setError(null); // 清除之前的错误
      
      // 如果搜索无结果，记录日志但不显示错误
      if (mappedProducts.length === 0 && filters?.search) {
        console.log('⚠️ 搜索无结果，关键词:', filters.search);
      }
      
      console.log(`📦 最终映射 ${mappedProducts.length} 个商品 (总共 ${response.total})`);
    } catch (err: any) {
      console.error('❌ 获取商品失败:', err);
      
      // 区分不同类型的错误
      const isQueryError = err.type === 'general_query_invalid' || err.code === 400;
      const isSearchError = filters?.search && err.message?.includes('search');
      
      if (isQueryError || isSearchError) {
        // 查询语法错误或搜索错误：显示空列表，不显示错误消息
        console.log('⚠️ 查询条件无结果或搜索语法错误，显示空列表');
        setProducts([]);
        setTotal(0);
        setError(null); // 不显示错误，提供更好的用户体验
      } else {
        // 其他错误（网络错误等）：显示错误消息
        setError(err.message || '获取商品失败');
        // 保持之前的产品列表，不清空（更好的用户体验）
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
    categoryId: string;    // ✅ 驿c峰命名
    ipId: string;          // ✅ 驼峰命名
    condition: string;
    imageUrl?: string;     // ✅ 驻c峰命名
    stockQuantity?: number; // ✅ 驻c峰命名
    materialType?: string;  // ✅ 驻c峰命名
    sellerId?: string;      // ✅ 驻c峰命名
    sellerName?: string;    // ✅ 驻c峰命名
  }) => {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        ID.unique(),
        {
          ...productData,
          isActive: true,        // ✅ 驻c峰命名
          slug: productData.name.toLowerCase().replace(/\s+/g, '-'),
          createdAt: new Date().toISOString(),  // ✅ 驻c峰命名
          updatedAt: new Date().toISOString(),  // ✅ 驻c峰命名
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
          updatedAt: new Date().toISOString(),  // ✅ 驻c峰命名
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
  // 🔥 技巧A: 软删除 - 使用 isActive 字段而不是真正删除
  const deleteProduct = async (id: string, hardDelete = false): Promise<boolean> => {
    try {
      if (hardDelete) {
        // 硬删除：慎用！会导致历史订单找不到商品信息
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id);
        console.log('⚠️ 商品永久删除:', id);
      } else {
        // 软删除：设置 isActive = false
        // 商品对用户不可见，但历史订单仍可查询
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id, {
          isActive: false,
          updatedAt: new Date().toISOString(),  // ✅ 驻c峰命名
        });
        console.log('✅ 商品已下架 (软删除):', id);
      }
      
      // 刷新列表
      await fetchProducts();
      return true;
    } catch (err: any) {
      console.error('❌ 删除商品失败:', err);
      throw new Error(err.message || '删除商品失败');
    }
  };

  // ========== 重新上架商品（管理员） ==========
  const reactivateProduct = async (id: string): Promise<boolean> => {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id, {
        isActive: true,
        updatedAt: new Date().toISOString(),  // ✅ 驻c峰命名
      });
      console.log('✅ 商品已重新上架:', id);
      await fetchProducts();
      return true;
    } catch (err: any) {
      console.error('❌ 重新上架失败:', err);
      throw new Error(err.message || '重新上架失败');
    }
  };

  // ========== 加载更多商品 ==========
  const loadMore = useCallback(async (filters?: ProductFilters) => {
    if (!hasMore || loading) return;
    
    await fetchProducts(
      { ...filters, offset: currentOffset },
      true  // append = true，追加到现有列表
    );
  }, [hasMore, loading, currentOffset, fetchProducts]);

  // ========== 获取单个商品详情 ==========
  const getProduct = async (id: string): Promise<Product | null> => {
    try {
      const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        id
      ) as unknown as AppwriteProduct;
      
      // 查询该商品的分类和IP标签
      const [categoryData, ipData] = await Promise.all([
        doc.categoryId && doc.categoryId.trim()
          ? databases.getDocument(DATABASE_ID, COLLECTIONS.CATEGORIES, doc.categoryId).catch(() => null)
          : Promise.resolve(null),
        doc.ipId && doc.ipId.trim()
          ? databases.getDocument(DATABASE_ID, COLLECTIONS.IP_TAGS, doc.ipId).catch(() => null)
          : Promise.resolve(null),
      ]);
      
      // 构建映射表
      const categoryMap: TagsMap = categoryData ? { [doc.categoryId]: (categoryData as any).name } : {};
      const ipMap: TagsMap = ipData ? { [doc.ipId]: (ipData as any).name } : {};
      
      return mapToProduct(doc, categoryMap, ipMap);
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
    hasMore,       // 是否还有更多数据
    currentOffset, // 当前偏移量
    fetchProducts,
    loadMore,      // 加载更多
    addProduct,
    updateProduct,
    deleteProduct,
    reactivateProduct, // 重新上架
    getProduct,
    uploadProductImage,
  };
}
