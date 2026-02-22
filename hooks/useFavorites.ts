import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';

interface AppwriteFavorite {
  $id: string;
  userId: string;
  productId: string;
  $createdAt: string;
  $updatedAt: string;
}

interface FavoriteItem extends Product {
  favoriteId: string; // Appwrite 文档 ID，用于删除
}

export function useFavorites() {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // 获取用户收藏列表
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated || !user?.$id) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    try {
      setLoading(true);
      
      // 1. 查询用户的收藏记录
      const favoritesResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FAVORITES || 'favouritechart',
        [Query.equal('userId', user.$id), Query.orderDesc('$createdAt')]
      );

      const favoriteRecords = favoritesResponse.documents as unknown as AppwriteFavorite[];
      const productIds = favoriteRecords.map(f => f.productId);
      
      // 更新收藏ID集合（用于快速判断是否收藏）
      setFavoriteIds(new Set(productIds));

      if (productIds.length === 0) {
        setFavorites([]);
        return;
      }

      // 2. 批量查询产品详情
      const productsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [Query.equal('$id', productIds), Query.limit(100)]
      );

      // 2.5 批量查询标签信息
      const docs = productsResponse.documents as any[];
      
      // 收集所有唯一的 categoryId 和 ipId
      const categoryIds = [...new Set(docs.map(doc => doc.categoryId).filter(id => id && id.trim()))];
      const ipIds = [...new Set(docs.map(doc => doc.ipId).filter(id => id && id.trim()))];
      
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
      const categoryMap: { [id: string]: string } = {};
      categoriesData.documents.forEach((doc: any) => {
        categoryMap[doc.$id] = doc.name;
      });
      
      const ipMap: { [id: string]: string } = {};
      ipsData.documents.forEach((doc: any) => {
        ipMap[doc.$id] = doc.name;
      });

      // 3. 组合数据
      const favoriteItems: FavoriteItem[] = productsResponse.documents.map((doc: any) => {
        const favoriteRecord = favoriteRecords.find(f => f.productId === doc.$id);
        return {
          id: doc.$id,
          favoriteId: favoriteRecord?.$id || '',
          title: doc.name || '',           // ✅ 修复：使用 name 字段
          ip: ipMap[doc.ipId] || '未分类',  // ✅ 修复：通过映射表获取IP名称
          category: categoryMap[doc.categoryId] || '未分类',  // ✅ 修复：通过映射表获取分类名称
          image: doc.imageUrl || '',       // ✅ 修复：使用 imageUrl 字段
          description: doc.description || '',
          basePrice: doc.price || 0,       // ✅ 修复：使用 price 字段
          stockQuantity: doc.stockQuantity,
          materialType: doc.materialType,
          variants: doc.variants || [],
          productAttribute: doc.productAttribute || null,
        };
      });

      setFavorites(favoriteItems);
    } catch (error: any) {
      console.error('❌ 获取收藏列表失败:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.$id]);

  // 添加到收藏
  const addToFavorites = useCallback(async (productId: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.$id) {
      alert('请先登录后再收藏');
      return false;
    }

    try {
      // 检查是否已收藏
      if (favoriteIds.has(productId)) {
        console.log('⚠️ 该商品已在收藏夹中');
        return false;
      }

      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FAVORITES || 'favouritechart',
        ID.unique(),
        {
          userId: user.$id,
          productId: productId,
        }
      );

      console.log('✅ 添加收藏成功');
      await fetchFavorites();
      return true;
    } catch (error: any) {
      console.error('❌ 添加收藏失败:', error);
      alert('添加收藏失败，请重试');
      return false;
    }
  }, [isAuthenticated, user?.$id, favoriteIds, fetchFavorites]);

  // 从收藏中移除
  const removeFromFavorites = useCallback(async (favoriteId: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.$id) {
      return false;
    }

    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.FAVORITES || 'favouritechart',
        favoriteId
      );

      console.log('✅ 移除收藏成功');
      await fetchFavorites();
      return true;
    } catch (error: any) {
      console.error('❌ 移除收藏失败:', error);
      alert('移除收藏失败，请重试');
      return false;
    }
  }, [isAuthenticated, user?.$id, fetchFavorites]);

  // 通过产品ID移除收藏
  const removeByProductId = useCallback(async (productId: string): Promise<boolean> => {
    const favoriteItem = favorites.find(f => f.id === productId);
    if (favoriteItem) {
      return await removeFromFavorites(favoriteItem.favoriteId);
    }
    return false;
  }, [favorites, removeFromFavorites]);

  // 检查商品是否已收藏
  const isFavorited = useCallback((productId: string): boolean => {
    return favoriteIds.has(productId);
  }, [favoriteIds]);

  // 切换收藏状态
  const toggleFavorite = useCallback(async (productId: string): Promise<boolean> => {
    if (isFavorited(productId)) {
      return await removeByProductId(productId);
    } else {
      return await addToFavorites(productId);
    }
  }, [isFavorited, removeByProductId, addToFavorites]);

  // 初始加载
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    favoriteCount: favorites.length,
    loading,
    isFavorited,
    addToFavorites,
    removeFromFavorites,
    removeByProductId,
    toggleFavorite,
    refreshFavorites: fetchFavorites,
  };
}
