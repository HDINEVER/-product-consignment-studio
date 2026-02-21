export interface ProductVariant {
  name: string;
  price: number;
}

export interface Product {
  id: string;
  title: string;
  ip: string;
  category: Category;
  image: string;
  description: string;
  basePrice: number;
  stockQuantity?: number;
  materialType?: string;
  variants: ProductVariant[];
  productAttribute?: 'new' | 'hot' | 'discount' | null;  // ✅ 产品属性标签
}

export interface CartItem {
  productId: string;
  productTitle: string;
  variantName: string;
  price: number;
  quantity: number;
  image: string;
}

// ========== Appwrite 数据库类型定义 (驼峰命名法) ==========

// 1. Users 集合
export interface AppwriteUser {
  $id: string;
  name: string;
  phone?: string;
  role: 'guest' | 'user' | 'admin';
  dateOfBirth?: string;  // ISO datetime
  createdAt: string;     // ISO datetime
  updatedAt: string;     // ISO datetime
  email: string;
}

// 2. Cart Items 集合
export interface AppwriteCartItem {
  $id: string;
  userId: string;        // 用户ID
  productId: string;     // 商品ID
  quantity: number;      // 数量 (1-1000)
  createdAt: string;     // ISO datetime
  updatedAt?: string;    // ISO datetime
  isActive: boolean;     // 是否活跃
}

// 3. Addresses 集合
export interface AppwriteAddress {
  $id: string;
  userId: string;        // ⚠️ 必须字段 - 用户ID，关联到 users 表
  contactName: string;   // 联系人姓名
  contactPhone: string;  // 联系电话
  province: string;      // 省份
  city: string;          // 城市
  district: string;      // 区县
  village: string;       // 乡镇/街道
  streetAddress: string; // 详细地址
  isDefault?: boolean;   // 是否为默认地址
  label?: string;        // 地址标签（如"家"、"公司"）
  $createdAt: string;    // Appwrite 自动字段
  $updatedAt: string;    // Appwrite 自动字段
}

// 4. Orders 集合
export interface AppwriteOrder {
  $id: string;
  orderId: string;       // 订单编号
  userId: string;        // 用户ID
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  paymentMethod: 'alipay' | 'wechat' | 'cod';  // 支付方式
  totalAmount: number;   // 总金额
  remark?: string;       // 订单备注
  
  // ✅ 收货地址快照（简化版 - 3个字段）
  shippingContactName: string;     // 收货人姓名
  shippingContactPhone: string;    // 收货人电话
  shippingFullAddress: string;     // 完整地址（省市区村+详细地址）
  
  createdAt: string;     // ISO datetime
  updatedAt: string;     // ISO datetime
  $createdAt: string;    // Appwrite 自动字段
  $updatedAt: string;    // Appwrite 自动字段
}

// 5. Order Items 集合
export interface AppwriteOrderItem {
  $id: string;
  orderId: string;       // 订单ID
  productId: string;     // 商品ID
  productName: string;   // 商品名称（快照）✅ 驼峰命名
  productImage: string;  // 商品图片（快照）✅ 驼峰命名
  variantName?: string;  // 规格名称（快照）✅ 驼峰命名
  quantity: number;      // 数量
  price: number;         // 单价（快照）
  subtotal?: number;     // 小计
  discount?: number;     // 折扣
  taxAmount?: number;    // 税额
  createdAt: string;     // ISO datetime ✅ 驼峰命名
  $createdAt: string;    // Appwrite 自动字段
  $updatedAt: string;    // Appwrite 自动字段
}

// 6. Products 集合
export interface AppwriteProduct {
  $id: string;
  name: string;          // 商品名称
  slug: string;          // URL slug
  description: string;   // 商品描述
  price: number;         // 价格
  stockQuantity: number; // 库存数量
  imageUrl: string;      // 商品图片URL
  categoryId: string;    // 分类ID
  ipId: string;          // ✅ IP标签ID (驼峰命名)
  isActive: boolean;     // 是否上架
  condition?: string;    // 商品状态 (new/used/refurbished)
  materialType?: string; // 材质类型
  sellerId?: string;     // 卖家ID
  sellerName?: string;   // 卖家名称
  productAttribute?: 'new' | 'hot' | 'discount' | null;  // ✅ 产品属性标签 (new/hot/discount)
  createdAt: string;     // ISO datetime
  updatedAt: string;     // ISO datetime
  $createdAt: string;    // Appwrite 自动字段
  $updatedAt: string;    // Appwrite 自动字段
}

// ========== 前端使用的简化类型 ==========

// 前端简化版 User 类型
export interface User {
  $id: string;
  email: string;
  name: string;
  phone?: string;
  role?: 'guest' | 'user' | 'admin';
  dateOfBirth?: string;
}

export type Category = 
  | '全部'
  | '纸制品' 
  | '3D打印制品' 
  | '角色手办定制' 
  | '吧唧制品' 
  | '雪弗板定制' 
  | 'Cos道具/3D代打';

export const CATEGORIES: Category[] = [
  '全部',
  '纸制品',
  '3D打印制品',
  '角色手办定制',
  '吧唧制品',
  '雪弗板定制',
  'Cos道具/3D代打'
];

export const IPS = [
  '全部',
  '原神',
  '崩坏：星穹铁道',
  '初音未来',
  '明日方舟',
  '排球少年',
  '蓝色监狱',
  '原创/其他'
];
