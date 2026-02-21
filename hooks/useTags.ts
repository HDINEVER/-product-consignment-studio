import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite';

export type TagType = 'category' | 'ip';

export interface Tag {
  $id: string;
  name: string;
}

export interface TagsData {
  categories: Tag[];
  ips: Tag[];
}

/**
 * useTags Hook
 * 管理商品分类和IP标签的动态读取、添加、删除
 * 适配两个独立的表: categories 和 ip_tags
 */
export const useTags = () => {
  const [tags, setTags] = useState<TagsData>({ categories: [], ips: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  /**
   * 从两个独立的表获取所有标签
   */
  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // 并发查询两个表
      const [categoriesResponse, ipsResponse] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.CATEGORIES, [Query.limit(100)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.IP_TAGS, [Query.limit(100)]),
      ]);

      const categories: Tag[] = categoriesResponse.documents.map((doc: any) => ({
        $id: doc.$id,
        name: doc.name,
      }));

      const ips: Tag[] = ipsResponse.documents.map((doc: any) => ({
        $id: doc.$id,
        name: doc.name,
      }));

      setTags({ categories, ips });
      console.log(`✅ 加载标签: ${categories.length} 个分类, ${ips.length} 个IP`);
    } catch (err: any) {
      console.error('❌ 获取标签失败:', err);
      setError(err.message || '获取标签失败');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 添加新标签到对应的表
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

      // 选择正确的集合
      const collectionId = type === 'category' ? COLLECTIONS.CATEGORIES : COLLECTIONS.IP_TAGS;

      // 创建新标签
      await databases.createDocument(
        DATABASE_ID,
        collectionId,
        ID.unique(),
        { name }
      );

      console.log(`✅ 添加${type === 'category' ? '分类' : 'IP'}: ${name}`);

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
   * 同时将使用该标签的商品的外键清空
   */
  const deleteTag = async (tagId: string, type: TagType, tagName: string): Promise<boolean> => {
    try {
      setError('');

      // 1. 查找使用该标签的商品（通过外键 ID）
      const field = type === 'category' ? 'categoryId' : 'ipId';  // ✅ 驼峰命名
      const productsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [Query.equal(field, tagId), Query.limit(1000)]
      );

      if (productsResponse.documents.length > 0) {
        const confirmDelete = window.confirm(
          `有 ${productsResponse.documents.length} 个商品使用了"${tagName}"标签。\n删除后这些商品的${type === 'category' ? '分类' : 'IP'}将被清空。\n确定要删除吗？`
        );
        
        if (!confirmDelete) {
          return false;
        }

        // 2. 清空这些商品的外键
        const updatePromises = productsResponse.documents.map(product =>
          databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            product.$id,
            { [field]: '' }
          )
        );

        await Promise.all(updatePromises);
        console.log(`✅ 已清空 ${productsResponse.documents.length} 个商品的${type === 'category' ? '分类' : 'IP'}引用`);
      }

      // 3. 删除标签文档
      const collectionId = type === 'category' ? COLLECTIONS.CATEGORIES : COLLECTIONS.IP_TAGS;
      await databases.deleteDocument(DATABASE_ID, collectionId, tagId);

      console.log(`✅ 已删除${type === 'category' ? '分类' : 'IP'}: ${tagName}`);

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
   * 根据名称获取标签ID（用于查询商品）
   */
  const getTagIdByName = useCallback((type: TagType, name: string): string | null => {
    const tagList = type === 'category' ? tags.categories : tags.ips;
    const tag = tagList.find(t => t.name === name);
    console.log(`🔍 getTagIdByName(${type}, "${name}"):`, {
      tagList: tagList.map(t => t.name),
      found: tag,
      result: tag?.$id || null
    });
    return tag?.$id || null;
  }, [tags]);

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
    getTagIdByName,  // 新增：根据名称查找ID
    getCategoryNames,
    getIPNames,
  };
};
