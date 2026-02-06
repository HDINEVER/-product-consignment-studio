-- ===================================================================
-- Enhanced Database Schema - Based on BeikeShop Architecture
-- 完整电商系统数据库设计，保留现有功能同时扩展企业级特性
-- ===================================================================

-- ===================================================================
-- 1. 用户系统 (Users System)
-- ===================================================================

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK(role IN ('admin', 'seller', 'customer')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'banned', 'pending')),
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ===================================================================
-- 2. 分类系统 (Categories System) - 支持树形结构
-- ===================================================================

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id INTEGER,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- 初始化分类数据（兼容现有系统）
INSERT OR IGNORE INTO categories (name, slug, sort_order) VALUES
('纸制品', 'paper-goods', 1),
('3D打印制品', '3d-prints', 2),
('角色手办定制', 'figure-custom', 3),
('吧唧制品', 'badge-goods', 4),
('雪弗板定制', 'chevron-board', 5),
('Cos道具/3D代打', 'cosplay-props', 6);

-- ===================================================================
-- 3. 商品主表 (Products Table)
-- ===================================================================

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id INTEGER,
  brand TEXT,
  ip_category TEXT,  -- 保留原有IP分类字段
  material_type TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'out_of_stock')),
  is_featured BOOLEAN DEFAULT 0,
  seller_id INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_ip_category ON products(ip_category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- ===================================================================
-- 4. 商品SKU表 (Product SKUs) - 支持多变体
-- ===================================================================

CREATE TABLE IF NOT EXISTS product_skus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  sku_code TEXT UNIQUE NOT NULL,
  variant_name TEXT NOT NULL,  -- e.g., "单张", "一套(3张)"
  price REAL NOT NULL,
  compare_price REAL,  -- 划线价
  cost REAL,  -- 成本价（仅管理员可见）
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  weight REAL,  -- 重量（克）
  image_url TEXT,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_skus_product ON product_skus(product_id);
CREATE INDEX IF NOT EXISTS idx_skus_code ON product_skus(sku_code);
CREATE INDEX IF NOT EXISTS idx_skus_stock ON product_skus(stock_quantity);

-- ===================================================================
-- 5. 商品图片表 (Product Images)
-- ===================================================================

CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_primary ON product_images(is_primary);

-- ===================================================================
-- 6. 购物车表 (Shopping Cart)
-- ===================================================================

CREATE TABLE IF NOT EXISTS carts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT,  -- 用于未登录用户
  sku_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE CASCADE,
  UNIQUE(user_id, sku_id),
  UNIQUE(session_id, sku_id)
);

CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_sku ON carts(sku_id);

-- ===================================================================
-- 7. 订单主表 (Orders)
-- ===================================================================

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  
  -- 订单状态
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'refunded', 'partial')),
  
  -- 支付和配送
  payment_method TEXT,
  shipping_method TEXT,
  tracking_number TEXT,
  
  -- 金额
  subtotal REAL NOT NULL,
  shipping_cost REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL NOT NULL,
  
  -- 客户信息
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- 地址信息
  shipping_address TEXT,
  shipping_province TEXT,
  shipping_city TEXT,
  shipping_district TEXT,
  shipping_postal_code TEXT,
  
  -- 备注
  notes TEXT,
  admin_notes TEXT,
  
  -- 时间戳
  paid_at DATETIME,
  shipped_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ===================================================================
-- 8. 订单明细表 (Order Items)
-- ===================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  sku_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  sku_code TEXT,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (sku_id) REFERENCES product_skus(id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ===================================================================
-- 9. 商品评价表 (Product Reviews)
-- ===================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  order_id INTEGER,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT,  -- JSON array of image URLs
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  admin_reply TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- ===================================================================
-- 10. 收货地址表 (Shipping Addresses)
-- ===================================================================

CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  address TEXT NOT NULL,
  postal_code TEXT,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(is_default);

-- ===================================================================
-- 11. 库存变动记录表 (Stock Logs)
-- ===================================================================

CREATE TABLE IF NOT EXISTS stock_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku_id INTEGER NOT NULL,
  change_quantity INTEGER NOT NULL,  -- 正数为入库，负数为出库
  before_quantity INTEGER NOT NULL,
  after_quantity INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('purchase', 'sale', 'return', 'adjust', 'damaged')),
  reference_id INTEGER,  -- 关联订单ID等
  notes TEXT,
  operator_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sku_id) REFERENCES product_skus(id),
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_stock_logs_sku ON stock_logs(sku_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_type ON stock_logs(type);
CREATE INDEX IF NOT EXISTS idx_stock_logs_created ON stock_logs(created_at DESC);

-- ===================================================================
-- 12. 系统配置表 (System Settings)
-- ===================================================================

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  type TEXT DEFAULT 'string' CHECK(type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- 初始化系统配置
INSERT OR IGNORE INTO settings (key, value, type, description) VALUES
('site_name', 'COMIC HUB', 'string', '站点名称'),
('site_description', '二次元周边寄售平台', 'string', '站点描述'),
('default_currency', 'CNY', 'string', '默认货币'),
('low_stock_threshold', '5', 'number', '低库存阈值'),
('enable_reviews', '1', 'boolean', '是否启用评价功能'),
('contact_qq', '123456789', 'string', '联系QQ'),
('shipping_cost', '10', 'number', '默认运费');

-- ===================================================================
-- 13. 操作日志表 (Activity Logs)
-- ===================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  model TEXT,  -- e.g., 'product', 'order', 'user'
  model_id INTEGER,
  changes TEXT,  -- JSON
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_model ON activity_logs(model, model_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at DESC);

-- ===================================================================
-- 数据迁移：从旧表导入数据
-- ===================================================================

-- 注意：执行前请确保已备份 consignment_items 表的数据
-- 此脚本将旧表数据迁移到新的 products 和 product_skus 表

-- 步骤1：迁移商品到 products 表
-- 步骤2：为每个商品创建默认SKU
-- 步骤3：迁移图片到 product_images 表

-- TODO: 数据迁移需要根据实际情况编写
-- 建议在生产环境谨慎操作
