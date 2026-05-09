import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite';

export type TagType = 'category' | 'ip' | 'subCategory';

export interface Tag {
  $id: string;
  name: string;
  categoryId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface TagsData {
  categories: Tag[];
  ips: Tag[];
  subCategories: Tag[];
}

/**
 * useTags Hook
 * 管理商品分类和IP标签的动态读取、添加、删除
 * 适配两个独立的表: categories 和 ip_tags
 */
export const useTags = () => {
  const [tags, setTags] = useState<TagsData>({ categories: [], ips: [], subCategories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  /**
   * 从两个独立的表获取所有标签
   */
  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // 并发查询标签表
      const [categoriesResponse, ipsResponse, subCategoriesResponse] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.CATEGORIES, [Query.limit(100)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.IP_TAGS, [Query.limit(100)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.SUB_CATEGORIES, [
          Query.equal('isActive', true),
          Query.orderAsc('sortOrder'),
          Query.limit(200),
        ]),
      ]);

      const categories: Tag[] = categoriesResponse.documents.map((doc: any) => ({
        $id: doc.$id,
        name: doc.name,
      }));

      const ips: Tag[] = ipsResponse.documents.map((doc: any) => ({
        $id: doc.$id,
        name: doc.name,
      }));

      const subCategories: Tag[] = subCategoriesResponse.documents.map((doc: any) => ({
        $id: doc.$id,
        name: doc.name,
        categoryId: doc.categoryId,
        sortOrder: doc.sortOrder,
        isActive: doc.isActive,
      }));

      setTags({ categories, ips, subCategories });
      console.log(`✅ 加载标签: ${categories.length} 个分类, ${ips.length} 个IP, ${subCategories.length} 个子分类`);
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
  const addTag = async (type: TagType, name: string, categoryId?: string): Promise<boolean> => {
    try {
      setError('');
      
      // 检查是否已存在同名标签
      const existing = type === 'category'
        ? tags.categories.find(t => t.name === name)
        : type === 'ip'
          ? tags.ips.find(t => t.name === name)
          : tags.subCategories.find(t => t.name === name && t.categoryId === categoryId);
      
      if (existing) {
        setError('该标签已存在');
        return false;
      }

      if (type === 'subCategory' && !categoryId) {
        setError('请先选择父分类');
        return false;
      }

      // 选择正确的集合
      const collectionId = type === 'category'
        ? COLLECTIONS.CATEGORIES
        : type === 'ip'
          ? COLLECTIONS.IP_TAGS
          : COLLECTIONS.SUB_CATEGORIES;

      // 创建新标签
      await databases.createDocument(
        DATABASE_ID,
        collectionId,
        ID.unique(),
        type === 'subCategory'
          ? { name, categoryId, sortOrder: tags.subCategories.length + 1, isActive: true }
          : { name }
      );

      console.log(`✅ 添加${type === 'category' ? '分类' : type === 'ip' ? 'IP' : '子分类'}: ${name}`);

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
      const field = type === 'category' ? 'categoryId' : type === 'ip' ? 'ipId' : 'subCategoryId';
      const productsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [Query.equal(field, tagId), Query.limit(1000)]
      );

      if (productsResponse.documents.length > 0) {
        const confirmDelete = window.confirm(
          `有 ${productsResponse.documents.length} 个商品使用了"${tagName}"标签。\n删除后这些商品的${type === 'category' ? '分类' : type === 'ip' ? 'IP' : '子分类'}将被清空。\n确定要删除吗？`
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
        console.log(`✅ 已清空 ${productsResponse.documents.length} 个商品的${type === 'category' ? '分类' : type === 'ip' ? 'IP' : '子分类'}引用`);
      }

      // 3. 删除标签文档
      const collectionId = type === 'category'
        ? COLLECTIONS.CATEGORIES
        : type === 'ip'
          ? COLLECTIONS.IP_TAGS
          : COLLECTIONS.SUB_CATEGORIES;
      await databases.deleteDocument(DATABASE_ID, collectionId, tagId);

      console.log(`✅ 已删除${type === 'category' ? '分类' : type === 'ip' ? 'IP' : '子分类'}: ${tagName}`);

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
    const tagList = type === 'category' ? tags.categories : type === 'ip' ? tags.ips : tags.subCategories;
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
    return ['全部', ...tags.categories.map(t => t.name), '其他'];
  }, [tags.categories]);

  /**
   * 获取IP名称数组（用于兼容现有UI）
   */
  const getIPNames = useCallback((): string[] => {
    return ['全部', ...tags.ips.map(t => t.name), '其他'];
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
