import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { databases, storage, DATABASE_ID, COLLECTIONS, STORAGE_BUCKET_ID, ID, Permission, Role, Query } from '../lib/appwrite';
import { useAuth } from '../contexts/AuthContext';
import { useTags } from '../hooks/useTags';
import Loader from './ui/loader';

// 管理员团队 ID（从环境变量读取，默认为 'admins'）
const ADMIN_TEAM_ID = import.meta.env.VITE_APPWRITE_ADMIN_TEAM_ID || 'admins';

// ========== 表单数据类型 ==========
interface ProductFormData {
  name: string;
  description: string;
  ip_tag: string;
  category: string;
  subCategoryId?: string;
  price: number;
  stock: number;
  productAttribute?: 'new' | 'hot' | 'discount' | '';  // ✅ 添加产品属性字段
}

interface VariantDraft {
  id?: string;
  name: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  tag: string;
}

interface ProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editMode?: boolean;
  initialData?: any;
}

export default function ProductUploadModal({
  isOpen,
  onClose,
  onSuccess,
  editMode = false,
  initialData,
}: ProductUploadModalProps) {
  const { user } = useAuth();
  const { tags } = useTags();

  // 从数据库获取动态分类和IP列表（排除“全部”和“其他”）
  const CATEGORIES = tags.categories.map(t => t.name);
  const IP_TAGS = tags.ips.map(t => t.name);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      description: '',
      ip_tag: '',
      category: '',
      subCategoryId: '',
      price: 0,
      stock: 0,
      productAttribute: '',
    },
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const selectedCategoryName = watch('category');
  const selectedCategory = tags.categories.find(tag => tag.name === selectedCategoryName);
  const filteredSubCategories = useMemo(
    () => selectedCategory
      ? tags.subCategories.filter(tag => tag.categoryId === selectedCategory.$id)
      : [],
    [selectedCategory, tags.subCategories]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (!editMode || !initialData) {
      reset({
        name: '',
        description: '',
        ip_tag: '',
        category: '',
        subCategoryId: '',
        price: 0,
        stock: 0,
        productAttribute: '',
      });
      setUploadedImages([]);
      setVariants([]);
      setError('');
      return;
    }

    reset({
      name: initialData.title || initialData.name || '',
      description: initialData.description || '',
      ip_tag: initialData.ip || '',
      category: initialData.category || '',
      subCategoryId: initialData.subCategoryId || '',
      price: initialData.basePrice ?? initialData.price ?? 0,
      stock: initialData.stockQuantity ?? initialData.stock ?? 0,
      productAttribute: initialData.productAttribute || '',
    });
    setUploadedImages(initialData.image ? [initialData.image] : []);
    setError('');

    const loadVariants = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PRODUCT_VARIANTS,
          [
            Query.equal('productId', initialData.id || initialData.$id),
            Query.orderAsc('sortOrder'),
            Query.limit(100),
          ]
        );

        setVariants(response.documents.filter((doc: any) => doc.isActive !== false).map((doc: any) => ({
          id: doc.$id,
          name: doc.name || '',
          price: Number(doc.price || 0),
          stockQuantity: Number(doc.stockQuantity || 0),
          imageUrl: doc.imageUrl || '',
          tag: doc.tag || '',
        })));
      } catch (err: any) {
        console.error('❌ 加载商品规格失败:', err);
        setError(err.message || '加载商品规格失败');
      }
    };

    loadVariants();
  }, [editMode, initialData, isOpen, reset]);

  // ========== 图片上传到 Appwrite Storage ==========
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setError('');

    try {
      const file = files[0];

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        throw new Error('请上传图片文件');
      }

      // 验证文件大小 (最大 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('图片大小不能超过 5MB');
      }

      // 上传到 Appwrite Storage
      console.log('📤 开始上传图片到 Appwrite Storage...');
      const uploadedFile = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        file
      );

      // 获取预览 URL
      const imageUrl = storage.getFilePreview(
        STORAGE_BUCKET_ID,
        uploadedFile.$id,
        400, // width
        400, // height
        undefined, // gravity
        100 // quality
      ).toString();

      console.log('✅ 图片上传成功:', imageUrl);
      setUploadedImages((prev) => [...prev, imageUrl]);
    } catch (err: any) {
      console.error('❌ 图片上传失败:', err);
      setError(err.message || '图片上传失败');
    } finally {
      setUploadingImage(false);
    }
  };

  // ========== 删除已上传的图片 ==========
  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    setVariants(prev => [
      ...prev,
      { name: '', price: 0, stockQuantity: 0, imageUrl: '', tag: '' },
    ]);
  };

  const updateVariant = (index: number, patch: Partial<VariantDraft>) => {
    setVariants(prev => prev.map((variant, i) => i === index ? { ...variant, ...patch } : variant));
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  // ========== 提交表单 ==========
  const onSubmit = async (data: ProductFormData) => {
    if (uploadedImages.length === 0) {
      setError('请至少上传一张商品图片');
      return;
    }

    if (!user) {
      setError('请先登录');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('📝 正在创建商品...', data);

      const invalidVariant = variants.find(variant =>
        !variant.name.trim()
        || Number(variant.price) < 0
        || Number(variant.price) > 10000
        || Number(variant.stockQuantity) < 0
        || Number(variant.stockQuantity) > 9999
      );
      if (invalidVariant) {
        throw new Error('请完整填写规格名称、价格和库存，价格不能超过 10000，库存不能超过 9999');
      }

      const categoryId = tags.categories.find(tag => tag.name === data.category)?.$id || data.category;
      const ipId = tags.ips.find(tag => tag.name === data.ip_tag)?.$id || data.ip_tag;

      // 准备商品数据（匹配数据库字段）
      const productData = {
        name: data.name,
        description: data.description,
        ipId,
        categoryId,
        subCategoryId: data.subCategoryId || null,
        price: Number(data.price),
        stockQuantity: Number(data.stock),      // ✅ 驼峰命名
        imageUrl: uploadedImages[0],            // 使用第一张图片作为主图
        isActive: true,
        productAttribute: data.productAttribute || null,  // ✅ 产品属性标签
      };

      let productId = initialData?.id || initialData?.$id;

      if (editMode && productId) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          productId,
          productData
        );
        console.log('✅ 商品更新成功');
      } else {
        // 创建新商品（公开可读，仅管理员可编辑）
        const productDoc = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          ID.unique(),
          productData,
          [
            Permission.read('any'), // 所有人可读
            Permission.update(Role.team(ADMIN_TEAM_ID)),
            Permission.delete(Role.team(ADMIN_TEAM_ID)),
          ]
        );
        productId = productDoc.$id;
        console.log('✅ 商品创建成功');
      }

      if (productId) {
        const existingVariantIds = new Set<string>();

        if (editMode) {
          const existingVariants = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PRODUCT_VARIANTS,
            [Query.equal('productId', productId), Query.limit(100)]
          );
          existingVariants.documents.forEach((doc: any) => existingVariantIds.add(doc.$id));
        }

        await Promise.all(
          variants.map((variant, index) => {
            const variantData = {
              productId,
              name: variant.name.trim(),
              price: Number(variant.price),
              imageUrl: variant.imageUrl.trim() || uploadedImages[0],
              stockQuantity: Number(variant.stockQuantity),
              sortOrder: index + 1,
              isActive: true,
              tag: variant.tag.trim() || '',
            };

            if (editMode && variant.id) {
              existingVariantIds.delete(variant.id);
              return databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCT_VARIANTS,
                variant.id,
                variantData
              );
            }

            return databases.createDocument(
              DATABASE_ID,
              COLLECTIONS.PRODUCT_VARIANTS,
              ID.unique(),
              variantData,
              [
                Permission.read('any'),
                Permission.update(Role.team(ADMIN_TEAM_ID)),
                Permission.delete(Role.team(ADMIN_TEAM_ID)),
              ]
            );
          })
        );

        if (editMode && existingVariantIds.size > 0) {
          await Promise.all(
            Array.from(existingVariantIds).map(variantId =>
              databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCT_VARIANTS,
                variantId,
                { isActive: false }
              )
            )
          );
        }
      }

      // 重置表单
      reset();
      setUploadedImages([]);
      setVariants([]);
      
      // 回调成功
      if (onSuccess) {
        onSuccess();
      }
      
      // 关闭弹窗
      onClose();
    } catch (err: any) {
      console.error('❌ 提交失败:', err);
      setError(err.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== 关闭弹窗 ==========
  const handleClose = () => {
    if (submitting) return;
    reset();
    setUploadedImages([]);
    setVariants([]);
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 - 点击可关闭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={handleClose}
          />
          
          {/* 右侧滑出面板 - 上下充满屏幕 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-1/2 bg-yellow-50 border-l-4 border-black shadow-[-8px_0_0_0_rgba(0,0,0,1)] z-50 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - 固定在顶部 */}
            <div className="bg-yellow-400 border-b-4 border-black p-6 flex items-center justify-between shrink-0">
              <h2 className="text-3xl font-black flex items-center gap-3">
                <div className="p-2 bg-white border-2 border-black rounded-xl">
                  <Upload size={28} />
                </div>
                {editMode ? '编辑商品' : '发布新商品'}
              </h2>
              <button
                onClick={handleClose}
                disabled={submitting}
                className="p-2 bg-red-400 border-[3px] border-black rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[3px_3px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                aria-label="关闭"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form - 可滚动区域 */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 错误提示 */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-400 border-4 border-black rounded-xl p-4 flex items-center gap-3"
                >
                  <AlertCircle size={24} />
                  <p className="font-bold">{error}</p>
                </motion.div>
              )}

              {/* 图片上传区 */}
              <div>
                <label className="block text-lg font-black mb-3">商品图片 *</label>
                
                {/* 上传按钮 */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage || submitting}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`
                      flex flex-col items-center justify-center
                      border-4 border-dashed border-black rounded-xl bg-white
                      p-8 cursor-pointer hover:bg-yellow-50 transition-colors
                      ${(uploadingImage || submitting) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader size="lg" text="上传中..." />
                      </>
                    ) : (
                      <>
                        <ImageIcon size={48} className="mb-3" />
                        <p className="font-bold text-lg">点击或拖拽上传图片</p>
                        <p className="text-sm text-gray-600 mt-2">支持 JPG、PNG，最大 5MB</p>
                      </>
                    )}
                  </label>
                </div>

                {/* 已上传图片预览 */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {uploadedImages.map((url, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative border-4 border-black rounded-xl bg-white overflow-hidden"
                      >
                        <img
                          src={url}
                          alt={`商品图片 ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          disabled={submitting}
                          className="absolute top-2 right-2 p-1 bg-red-400 border-[3px] border-black rounded-lg hover:bg-red-500 transition-colors"
                          aria-label="删除图片"
                        >
                          <X size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* 商品名称 */}
              <div>
                <label className="block text-lg font-black mb-3">商品名称 *</label>
                <input
                  type="text"
                  {...register('name', { required: '请输入商品名称' })}
                  disabled={submitting}
                  className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none focus:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="例如：明日方舟 阿米娅 GK手办"
                />
                {errors.name && (
                  <p className="mt-2 text-red-600 font-bold">{errors.name.message}</p>
                )}
              </div>

              {/* 商品描述 */}
              <div>
                <label className="block text-lg font-black mb-3">商品描述 *</label>
                <textarea
                  {...register('description', { required: '请输入商品描述' })}
                  disabled={submitting}
                  rows={4}
                  className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none focus:bg-yellow-50 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="详细描述商品的特点、材质、尺寸等..."
                />
                {errors.description && (
                  <p className="mt-2 text-red-600 font-bold">{errors.description.message}</p>
                )}
              </div>

              {/* IP 标签 和 商品分类 - 并排 */}
              <div className="grid grid-cols-2 gap-4">
                {/* IP 标签 */}
                <div>
                  <label className="block text-lg font-black mb-3">所属 IP *</label>
                  <select
                    {...register('ip_tag', { required: '请选择 IP 标签' })}
                    disabled={submitting}
                    className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none focus:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- 选择 IP --</option>
                    {IP_TAGS.map((ip) => (
                      <option key={ip} value={ip}>
                        {ip}
                      </option>
                    ))}
                  </select>
                  {errors.ip_tag && (
                    <p className="mt-2 text-red-600 font-bold">{errors.ip_tag.message}</p>
                  )}
                </div>

                {/* 商品分类 */}
                <div>
                  <label className="block text-lg font-black mb-3">商品分类 *</label>
                  <select
                    {...register('category', { required: '请选择商品分类' })}
                    disabled={submitting}
                    className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none focus:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- 选择分类 --</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-2 text-red-600 font-bold">{errors.category.message}</p>
                  )}
                </div>
              </div>

              {/* 子分类 */}
              <div>
                <label className="block text-lg font-black mb-3">细分类别 <span className="text-sm text-gray-500">(可选)</span></label>
                <select
                  {...register('subCategoryId')}
                  disabled={submitting || !selectedCategory || filteredSubCategories.length === 0}
                  className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none focus:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{selectedCategory ? '-- 不选择细分类别 --' : '请先选择商品分类'}</option>
                  {filteredSubCategories.map((subCategory) => (
                    <option key={subCategory.$id} value={subCategory.$id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-600">
                  细分类别用于前台筛选，不影响商品规格选择
                </p>
              </div>

              {/* ✅ 产品属性标签 (NEW/HOT/DISCOUNT) */}
              <div>
                <label className="block text-lg font-black mb-3">产品标签 <span className="text-sm text-gray-500">(可选)</span></label>
                <select
                  {...register('productAttribute')}
                  disabled={submitting}
                  className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none focus:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- 无标签 --</option>
                  <option value="new">🆕 NEW (新品)</option>
                  <option value="hot">🔥 HOT (热门)</option>
                  <option value="discount">💰 SALE (折扣)</option>
                </select>
                <p className="mt-2 text-sm text-gray-600">
                  选择后将在商品卡片上显示对应的标签
                </p>
              </div>

              {/* 商品规格 */}
              <div className="bg-white border-4 border-black rounded-xl p-4 shadow-[4px_4px_0_0_#000]">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <label className="block text-lg font-black">商品规格 <span className="text-sm text-gray-500">(可选)</span></label>
                    <p className="text-sm text-gray-600 mt-1">有规格时，前台会要求用户选择具体规格后再加入购物车</p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    disabled={submitting}
                    className="shrink-0 flex items-center gap-2 px-4 py-2 bg-yellow-400 border-[3px] border-black rounded-xl font-black shadow-[3px_3px_0_0_#000] hover:bg-yellow-500 disabled:opacity-50"
                  >
                    <Plus size={18} />
                    添加规格
                  </button>
                </div>

                {variants.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl text-sm font-bold text-gray-500 bg-gray-50">
                    不添加规格时，商品使用下方基础价格和库存。
                  </div>
                ) : (
                  <div className="space-y-3">
                    {variants.map((variant, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-yellow-50 border-2 border-black rounded-xl">
                        <label className="md:col-span-3">
                          <span className="block mb-1 text-xs font-black text-gray-600">规格名称</span>
                          <input
                            type="text"
                            value={variant.name}
                            onChange={(e) => updateVariant(index, { name: e.target.value })}
                            disabled={submitting}
                            className="w-full px-3 py-2 border-2 border-black rounded-lg font-bold focus:outline-none"
                            placeholder="如：利刃行动"
                          />
                        </label>
                        <label className="md:col-span-2">
                          <span className="block mb-1 text-xs font-black text-gray-600">规格价格</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10000"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, { price: Number(e.target.value) })}
                            disabled={submitting}
                            className="w-full px-3 py-2 border-2 border-black rounded-lg font-bold focus:outline-none"
                            placeholder="0.00"
                          />
                        </label>
                        <label className="md:col-span-2">
                          <span className="block mb-1 text-xs font-black text-gray-600">规格库存</span>
                          <input
                            type="number"
                            min="0"
                            max="9999"
                            value={variant.stockQuantity}
                            onChange={(e) => updateVariant(index, { stockQuantity: Number(e.target.value) })}
                            disabled={submitting}
                            className="w-full px-3 py-2 border-2 border-black rounded-lg font-bold focus:outline-none"
                            placeholder="0"
                          />
                        </label>
                        <label className="md:col-span-3">
                          <span className="block mb-1 text-xs font-black text-gray-600">规格图片 URL</span>
                          <input
                            type="url"
                            value={variant.imageUrl}
                            onChange={(e) => updateVariant(index, { imageUrl: e.target.value })}
                            disabled={submitting}
                            className="w-full px-3 py-2 border-2 border-black rounded-lg font-bold focus:outline-none"
                            placeholder="留空使用商品主图"
                          />
                        </label>
                        <label className="md:col-span-1">
                          <span className="block mb-1 text-xs font-black text-gray-600">角标</span>
                          <input
                            type="text"
                            maxLength={20}
                            value={variant.tag}
                            onChange={(e) => updateVariant(index, { tag: e.target.value })}
                            disabled={submitting}
                            className="w-full px-3 py-2 border-2 border-black rounded-lg font-bold focus:outline-none"
                            placeholder="选填"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          disabled={submitting}
                          className="md:col-span-1 self-end flex items-center justify-center p-2 bg-red-400 border-2 border-black rounded-lg hover:bg-red-500 disabled:opacity-50"
                          aria-label="删除规格"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 价格 和 库存 - 并排 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 价格 */}
                <div>
                  <label className="block text-lg font-black mb-3">价格 (¥) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price', {
                      required: '请输入价格',
                      min: { value: 0, message: '价格不能为负数' },
                    })}
                    disabled={submitting}
                    className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none focus:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="mt-2 text-red-600 font-bold">{errors.price.message}</p>
                  )}
                </div>

                {/* 库存数量 */}
                <div>
                  <label className="block text-lg font-black mb-3">库存数量 *</label>
                  <input
                    type="number"
                    min="0"
                    {...register('stock', {
                      required: '请输入库存数量',
                      min: { value: 0, message: '库存不能为负数' },
                    })}
                    disabled={submitting}
                    className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none focus:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                  {errors.stock && (
                    <p className="mt-2 text-red-600 font-bold">{errors.stock.message}</p>
                  )}
                </div>
              </div>
            </form>

            {/* Footer - 固定在底部 */}
            <div className="border-t-4 border-black bg-white p-6 shrink-0">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={submitting || uploadingImage}
                  className="flex-1 px-6 py-4 bg-yellow-400 text-black font-black text-lg border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader size="sm" />
                      {editMode ? '更新中...' : '发布中...'}
                    </span>
                  ) : (
                    editMode ? '✅ 更新商品' : '🚀 立即发布'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-6 py-4 bg-white text-black font-black text-lg border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
