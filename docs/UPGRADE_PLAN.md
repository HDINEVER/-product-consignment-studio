# 🚀 项目优化计划 - 基于 BeikeShop 架构

## 目标
借鉴 BeikeShop (Laravel 电商系统) 的完整功能，优化当前项目，但**完全保留现有的 Neobrutalism UI 风格**。

## 一、数据库架构优化（参考 BeikeShop）

### 1.1 核心表设计

#### `users` - 用户表
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK(role IN ('admin', 'seller', 'customer')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'banned', 'pending')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `products` - 商品主表
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id INTEGER,
  brand TEXT,
  ip_category TEXT,
  material_type TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'out_of_stock')),
  is_featured BOOLEAN DEFAULT 0,
  seller_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
```

#### `product_skus` - 商品SKU表（支持变体）
```sql
CREATE TABLE product_skus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  sku_code TEXT UNIQUE NOT NULL,
  variant_name TEXT,
  price REAL NOT NULL,
  compare_price REAL,
  cost REAL,
  stock_quantity INTEGER DEFAULT 0,
  weight REAL,
  image_url TEXT,
  is_default BOOLEAN DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

#### `categories` - 分类表（支持树形结构）
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id INTEGER,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);
```

#### `orders` - 订单主表
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'refunded', 'partial')),
  payment_method TEXT,
  shipping_method TEXT,
  subtotal REAL NOT NULL,
  shipping_cost REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### `order_items` - 订单明细表
```sql
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  sku_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (sku_id) REFERENCES product_skus(id)
);
```

#### `carts` - 购物车表
```sql
CREATE TABLE carts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT,
  sku_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE CASCADE
);
```

#### `product_images` - 商品图片表
```sql
CREATE TABLE product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

#### `reviews` - 商品评价表
```sql
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  order_id INTEGER,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT, -- JSON array
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### 1.2 索引优化
```sql
-- Products
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_ip_category ON products(ip_category);

-- SKUs
CREATE INDEX idx_skus_product ON product_skus(product_id);
CREATE INDEX idx_skus_code ON product_skus(sku_code);

-- Orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Carts
CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_session ON carts(session_id);
```

## 二、API 架构优化

### 2.1 RESTful API 设计（参考 BeikeShop）

#### 商品相关
- `GET /api/products` - 获取商品列表（支持分页、筛选、排序）
- `GET /api/products/:id` - 获取商品详情
- `POST /api/products` - 创建商品（管理员）
- `PUT /api/products/:id` - 更新商品（管理员）
- `DELETE /api/products/:id` - 删除商品（管理员）
- `GET /api/products/:id/skus` - 获取商品SKU列表

#### 分类相关
- `GET /api/categories` - 获取分类树
- `GET /api/categories/:id/products` - 获取分类下的商品

#### 购物车相关
- `GET /api/cart` - 获取购物车
- `POST /api/cart/items` - 添加商品到购物车
- `PUT /api/cart/items/:id` - 更新购物车商品数量
- `DELETE /api/cart/items/:id` - 移除购物车商品
- `DELETE /api/cart` - 清空购物车

#### 订单相关
- `POST /api/orders` - 创建订单
- `GET /api/orders` - 获取用户订单列表
- `GET /api/orders/:id` - 获取订单详情
- `PUT /api/orders/:id/cancel` - 取消订单
- `POST /api/orders/:id/pay` - 支付订单

#### 用户相关
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户信息

#### 管理后台相关
- `GET /api/admin/dashboard/stats` - 获取统计数据
- `GET /api/admin/orders` - 获取所有订单
- `PUT /api/admin/orders/:id/status` - 更新订单状态
- `GET /api/admin/products` - 获取所有商品
- `GET /api/admin/users` - 获取用户列表

### 2.2 错误处理和响应格式
```typescript
// 统一响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}
```

## 三、前端架构优化

### 3.1 状态管理重构
```
/src/stores/
  - useAuthStore.ts     # 用户认证状态
  - useCartStore.ts     # 购物车状态
  - useProductStore.ts  # 商品状态
  - useOrderStore.ts    # 订单状态
```

### 3.2 新增页面和组件

#### 页面
- `/` - 商品列表（现有，增强）
- `/products/:id` - 商品详情页
- `/cart` - 购物车页面
- `/checkout` - 结算页面
- `/orders` - 订单列表
- `/orders/:id` - 订单详情
- `/account` - 用户中心
- `/admin` - 后台管理（现有，增强）
- `/admin/orders` - 订单管理
- `/admin/products` - 商品管理（现有，增强）
- `/admin/categories` - 分类管理
- `/admin/users` - 用户管理

#### 新增组件（保持Neobrutalism风格）
```
/components/
  /product/
    - ProductCard.tsx          # 商品卡片（已有AtroposCard）
    - ProductDetail.tsx        # 商品详情
    - ProductVariantSelector.tsx # SKU选择器
    - ProductImageGallery.tsx  # 图片画廊
    
  /cart/
    - CartItem.tsx             # 购物车项
    - CartSummary.tsx          # 购物车汇总
    - MiniCart.tsx             # 迷你购物车
    
  /checkout/
    - CheckoutForm.tsx         # 结算表单
    - ShippingAddress.tsx      # 收货地址
    - PaymentMethod.tsx        # 支付方式
    
  /order/
    - OrderCard.tsx            # 订单卡片
    - OrderTimeline.tsx        # 订单时间线
    - OrderDetail.tsx          # 订单详情
    
  /admin/
    - OrderTable.tsx           # 订单表格
    - UserTable.tsx            # 用户表格
    - CategoryTree.tsx         # 分类树
    - StatsCard.tsx            # 统计卡片
```

## 四、实施优先级

### Phase 1 - 数据库和基础API（1-2天）
✅ 重构数据库Schema
✅ 实现基础的Product/SKU CRUD
✅ 实现分类管理
✅ 更新Worker API

### Phase 2 - 购物车和订单（2-3天）
✅ 实现购物车功能
✅ 实现订单创建流程
✅ 实现订单管理API

### Phase 3 - 用户系统（1-2天）
✅ 实现用户注册/登录
✅ 实现JWT认证
✅ 实现权限控制

### Phase 4 - 前端增强（3-4天）
✅ 商品详情页
✅ 购物车页面
✅ 结算流程
✅ 订单管理页面
✅ 用户中心

### Phase 5 - 后台优化（2-3天）
✅ 订单管理界面
✅ 用户管理界面
✅ 分类管理界面
✅ 统计面板

### Phase 6 - 高级功能（可选）
✅ 商品评价系统
✅ 支付集成（Stripe/支付宝）
✅ 邮件通知
✅ 库存预警

## 五、UI 风格保持

### 设计系统延续
- ✅ 保持黑色粗边框（border-2 border-black）
- ✅ 保持阴影效果（shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]）
- ✅ 保持黄色强调色（bg-yellow-400）
- ✅ 保持Neubrutalism按钮样式
- ✅ 保持Atropos 3D卡片效果
- ✅ 保持AnimatedButton组件
- ✅ 使用TailwindCSS保持一致性

### 新组件设计规范
所有新组件必须遵循：
1. 使用粗黑边框
2. 使用明亮的强调色
3. 使用3D阴影效果
4. 使用大胆的字体
5. 使用Framer Motion动画

## 六、技术栈保持不变
- Frontend: React 19 + TypeScript + Vite
- Backend: Cloudflare Worker + D1
- Styling: TailwindCSS
- Animation: Framer Motion
- Routing: React Router
- Table: TanStack Table
