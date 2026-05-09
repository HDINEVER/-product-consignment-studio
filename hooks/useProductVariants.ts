import { useCallback, useEffect, useState } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';
import { AppwriteProductVariant, ProductVariant } from '../types';

const mapToVariant = (doc: AppwriteProductVariant): ProductVariant => ({
  id: doc.$id,
  productId: doc.productId,
  name: doc.name,
  price: doc.price,
  imageUrl: doc.imageUrl || undefined,
  stockQuantity: doc.stockQuantity ?? 0,
  sortOrder: doc.sortOrder ?? 0,
  isActive: doc.isActive,
  tag: doc.tag || undefined,
});

export function useProductVariants(productId?: string) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVariants = useCallback(async () => {
    if (!productId) {
      setVariants([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCT_VARIANTS,
        [
          Query.equal('productId', productId),
          Query.orderAsc('sortOrder'),
          Query.limit(100),
        ]
      );

      const mapped = (response.documents as unknown as AppwriteProductVariant[])
        .filter(doc => doc.isActive !== false)
        .map(mapToVariant);
      setVariants(mapped);
      return mapped;
    } catch (err: any) {
      console.error('❌ 获取商品规格失败:', err);
      setError(err.message || '获取商品规格失败');
      setVariants([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  return {
    variants,
    loading,
    error,
    refetch: fetchVariants,
  };
}
