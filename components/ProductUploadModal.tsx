import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Loader, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { databases, storage, DATABASE_ID, COLLECTIONS, STORAGE_BUCKET_ID, ID, Permission, Role } from '../lib/appwrite';
import { useAuth } from '../contexts/AuthContext';
import { useTags } from '../hooks/useTags';

// 管理员团队 ID（从环境变量读取，默认为 'admins'）
const ADMIN_TEAM_ID = import.meta.env.VITE_APPWRITE_ADMIN_TEAM_ID || 'admins';

// ========== 表单数据类型 ==========
interface ProductFormData {
  name: string;
  description: string;
  ip_tag: string;
  category: string;
  price: number;
  stock: number;
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
  
  // 从数据库获取动态分类和IP列表（排除"全部"和"未分类"）
  const CATEGORIES = tags.categories.map(t => t.name);
  const IP_TAGS = tags.ips.map(t => t.name);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormData>({
    defaultValues: initialData || {
      name: '',
      description: '',
      ip_tag: '',
      category: '',
      price: 0,
      stock: 0,
    },
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

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

      // 准备商品数据（匹配数据库字段）
      const productData = {
        name: data.name,
        description: data.description,
        ip: data.ip_tag,  // ip_tag -> ip
        category: data.category,
        price: Number(data.price),
        stockQuantity: Number(data.stock),      // ✅ 驼峰命名
        imageUrl: uploadedImages[0],            // 使用第一张图片作为主图
        condition: 'new',                       // 默认新品
        sellerId: user.$id,                     // ✅ 驼峰命名
        sellerName: user.name || user.email,    // ✅ 驼峰命名
        status: 'active',
        createdAt: new Date().toISOString(),   // ✅ 驼峰命名
        updatedAt: new Date().toISOString(),   // ✅ 驼峰命名
      };

      if (editMode && initialData?.$id) {
        // 更新商品
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          initialData.$id,
          {
            ...productData,
            updatedAt: new Date().toISOString(),  // ✅ 驼峰命名
          }
        );
        console.log('✅ 商品更新成功');
      } else {
        // 创建新商品（公开可读，仅管理员可编辑）
        await databases.createDocument(
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
        console.log('✅ 商品创建成功');
      }

      // 重置表单
      reset();
      setUploadedImages([]);
      
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
                className="p-2 bg-red-400 border-2 border-black rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
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
                        <Loader className="animate-spin mb-3" size={48} />
                        <p className="font-bold">上传中...</p>
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
                          className="absolute top-2 right-2 p-1 bg-red-400 border-2 border-black rounded-lg hover:bg-red-500 transition-colors"
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
                      <Loader className="animate-spin" size={20} />
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
