import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite';

export type TagType = 'category' | 'ip';

export interface Tag {
  $id: string;
  type: TagType;
  name: string;
  order: number;
}

export interface TagsData {
  categories: Tag[];
  ips: Tag[];
}

/**
 * useTags Hook
 * 管理商品分类和IP标签的动态读取、添加、删除
 */
export const useTags = () => {
  const [tags, setTags] = useState<TagsData>({ categories: [], ips: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  /**
   * 从数据库获取所有标签
   */
  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TAGS,
        [Query.limit(100)]
      );

      const categories: Tag[] = [];
      const ips: Tag[] = [];

      response.documents.forEach((doc: any) => {
        const tag: Tag = {
          $id: doc.$id,
          type: doc.type,
          name: doc.name,
          order: doc.order || 0,
        };

        if (tag.type === 'category') {
          categories.push(tag);
        } else if (tag.type === 'ip') {
          ips.push(tag);
        }
      });

      // 按 order 排序
      categories.sort((a, b) => a.order - b.order);
      ips.sort((a, b) => a.order - b.order);

      setTags({ categories, ips });
    } catch (err: any) {
      console.error('❌ 获取标签失败:', err);
      setError(err.message || '获取标签失败');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 添加新标签
   */
  const addTag = async (type: TagType, name: string): Promise<boolean> => {
    try {
      setError('');
      
      // 检查是否已存在同名标签
      const existing = type === 'category' 
        ? tags.categories.find(t => t.name === name)
        : tags.ips.find(t => t.name === name);
      
      if (existing) {
        setError('该标签已存在');
        return false;
      }

      // 获取当前最大order值
      const currentTags = type === 'category' ? tags.categories : tags.ips;
      const maxOrder = currentTags.length > 0 
        ? Math.max(...currentTags.map(t => t.order)) 
        : 0;

      // 创建新标签
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.TAGS,
        ID.unique(),
        {
          type,
          name,
          order: maxOrder + 1,
        }
      );

      // 刷新标签列表
      await fetchTags();
      return true;
    } catch (err: any) {
      console.error('❌ 添加标签失败:', err);
      setError(err.message || '添加标签失败');
      return false;
    }
  };

  /**
   * 删除标签
   * 同时将使用该标签的商品归类为"未分类"
   */
  const deleteTag = async (tagId: string, type: TagType, tagName: string): Promise<boolean> => {
    try {
      setError('');

      // 1. 查找使用该标签的商品
      const field = type === 'category' ? 'category' : 'ip';
      const productsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [Query.equal(field, tagName), Query.limit(1000)]
      );

      // 2. 将这些商品更新为"未分类"
      const updatePromises = productsResponse.documents.map(product =>
        databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          product.$id,
          { [field]: '未分类' }
        )
      );

      await Promise.all(updatePromises);
      console.log(`✅ 已将 ${productsResponse.documents.length} 个商品归类为"未分类"`);

      // 3. 删除标签
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.TAGS,
        tagId
      );

      // 4. 刷新标签列表
      await fetchTags();
      return true;
    } catch (err: any) {
      console.error('❌ 删除标签失败:', err);
      setError(err.message || '删除标签失败');
      return false;
    }
  };

  /**
   * 获取分类名称数组（用于兼容现有UI）
   */
  const getCategoryNames = useCallback((): string[] => {
    return ['全部', ...tags.categories.map(t => t.name), '未分类'];
  }, [tags.categories]);

  /**
   * 获取IP名称数组（用于兼容现有UI）
   */
  const getIPNames = useCallback((): string[] => {
    return ['全部', ...tags.ips.map(t => t.name), '未分类'];
  }, [tags.ips]);

  // 初始加载
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    loading,
    error,
    fetchTags,
    addTag,
    deleteTag,
    getCategoryNames,
    getIPNames,
  };
};
