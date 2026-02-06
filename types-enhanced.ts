// ===================================================================
// Enhanced Type Definitions - Based on BeikeShop Architecture
// 完整电商系统类型定义
// ===================================================================

// ===================================================================
// 1. User Types
// ===================================================================

export type UserRole = 'admin' | 'seller' | 'customer';
export type UserStatus = 'active' | 'banned' | 'pending';

export interface User {
  id: number;
  email: string;
  password_hash?: string;  // 不返回给前端
  name?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

// ===================================================================
// 2. Category Types
// ===================================================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: Category[];  // For tree structure
  parent?: Category;
}

// ===================================================================
// 3. Product Types
// ===================================================================

export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category_id?: number;
  brand?: string;
  ip_category?: string;  // 兼容原有IP分类
  material_type?: string;
  status: ProductStatus;
  is_featured: boolean;
  seller_id?: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  category?: Category;
  seller?: User;
  skus?: ProductSku[];
  images?: ProductImage[];
  default_sku?: ProductSku;
  reviews?: Review[];
  avg_rating?: number;
  review_count?: number;
}

export interface ProductSku {
  id: number;
  product_id: number;
  sku_code: string;
  variant_name: string;
  price: number;
  compare_price?: number;
  cost?: number;
  stock_quantity: number;
  low_stock_threshold: number;
  weight?: number;
  image_url?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  
  // Computed
  is_low_stock?: boolean;
  discount_percentage?: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

// ===================================================================
// 4. Cart Types
// ===================================================================

export interface CartItem {
  id: number;
  user_id?: number;
  session_id?: string;
  sku_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  sku?: ProductSku;
  product?: Product;
  
  // Computed
  subtotal?: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  total_items: number;
}

// ===================================================================
// 5. Order Types
// ===================================================================

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partial';

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  
  // Status
  status: OrderStatus;
  payment_status: PaymentStatus;
  
  // Payment & Shipping
  payment_method?: string;
  shipping_method?: string;
  tracking_number?: string;
  
  // Amounts
  subtotal: number;
  shipping_cost: number;
  tax: number;
  discount: number;
  total: number;
  
  // Customer Info
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  
  // Address
  shipping_address?: string;
  shipping_province?: string;
  shipping_city?: string;
  shipping_district?: string;
  shipping_postal_code?: string;
  
  // Notes
  notes?: string;
  admin_notes?: string;
  
  // Timestamps
  paid_at?: string;
  shipped_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: User;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  sku_id: number;
  product_name: string;
  variant_name?: string;
  sku_code?: string;
  price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
  
  // Relations
  product?: Product;
  sku?: ProductSku;
}

export interface CreateOrderRequest {
  items: {
    sku_id: number;
    quantity: number;
  }[];
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address_id?: number;
  shipping_address?: {
    province: string;
    city: string;
    district?: string;
    address: string;
    postal_code?: string;
  };
  payment_method: string;
  notes?: string;
}

// ===================================================================
// 6. Review Types
// ===================================================================

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  order_id?: number;
  rating: number;
  comment?: string;
  images?: string[];
  status: ReviewStatus;
  admin_reply?: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: UserProfile;
  product?: Product;
  order?: Order;
}

// ===================================================================
// 7. Address Types
// ===================================================================

export interface Address {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district?: string;
  address: string;
  postal_code?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ===================================================================
// 8. Stock Log Types
// ===================================================================

export type StockLogType = 'purchase' | 'sale' | 'return' | 'adjust' | 'damaged';

export interface StockLog {
  id: number;
  sku_id: number;
  change_quantity: number;
  before_quantity: number;
  after_quantity: number;
  type: StockLogType;
  reference_id?: number;
  notes?: string;
  operator_id?: number;
  created_at: string;
  
  // Relations
  sku?: ProductSku;
  operator?: User;
}

// ===================================================================
// 9. System Settings Types
// ===================================================================

export type SettingType = 'string' | 'number' | 'boolean' | 'json';

export interface Setting {
  id: number;
  key: string;
  value: string;
  type: SettingType;
  description?: string;
  updated_at: string;
}

// ===================================================================
// 10. Activity Log Types
// ===================================================================

export interface ActivityLog {
  id: number;
  user_id?: number;
  action: string;
  model?: string;
  model_id?: number;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  
  // Relations
  user?: UserProfile;
}

// ===================================================================
// 11. API Response Types
// ===================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationMeta;
    [key: string]: any;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ListResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ===================================================================
// 12. Query & Filter Types
// ===================================================================

export interface ProductFilters {
  category_id?: number;
  ip_category?: string;
  status?: ProductStatus;
  is_featured?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
  seller_id?: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;  // order_number or customer_name
}

export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  direction: SortDirection;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: SortOptions;
  filters?: Record<string, any>;
}

// ===================================================================
// 13. Admin Dashboard Types
// ===================================================================

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  low_stock_products: number;
  new_customers: number;
  total_products: number;
  today_orders: number;
  today_revenue: number;
  
  // Charts data
  revenue_chart?: {
    labels: string[];
    values: number[];
  };
  order_status_chart?: {
    [key in OrderStatus]?: number;
  };
  top_products?: {
    product_name: string;
    sales: number;
    revenue: number;
  }[];
  recent_orders?: Order[];
}

// ===================================================================
// 14. 兼容原有系统的类型（逐步废弃）
// ===================================================================

// 保留以支持现有代码
export type Category_Legacy = 
  | '全部'
  | '纸制品' 
  | '3D打印制品' 
  | '角色手办定制' 
  | '吧唧制品' 
  | '雪弗板定制' 
  | 'Cos道具/3D代打';

export const CATEGORIES_LEGACY: Category_Legacy[] = [
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

// ===================================================================
// 15. Utility Types
// ===================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
