# 🚀 产品寄售平台 - 升级指南

## 📋 概述

本项目已完成从简单寄售系统到完整电商平台的架构升级，借鉴了成熟的 BeikeShop (Laravel电商系统) 的数据库设计和功能模块，但**完全保留了原有的 Neobrutalism UI 风格**。

### ✨ 主要改进

- **🗄️ 企业级数据库设计**：13张核心表，支持完整的电商业务流程
- **👥 用户系统**：注册、登录、权限管理
- **🛍️ 商品管理**：支持SKU/变体、多图片、分类、品牌
- **🛒 购物车**：支持未登录用户和已登录用户
- **📦 订单系统**：完整的订单流程和状态管理
- **💬 评价系统**：商品评价、评分、图片上传
- **📍 地址管理**：多收货地址管理
- **📊 库存管理**：实时库存、库存日志、低库存预警
- **⚙️ 系统配置**：灵活的系统设置
- **📝 操作日志**：完整的审计追踪

## 🎯 快速开始

### 1. 数据库迁移

#### Option A: 全新安装（推荐用于新项目）

```bash
# 1. 执行新的数据库Schema
wrangler d1 execute hdin-consignment-studio --remote --file=src/worker/schema-enhanced.sql

# 2. 验证表结构
wrangler d1 studio hdin-consignment-studio
```

#### Option B: 从旧数据迁移（用于已有数据的项目）

```bash
# 1. 先备份现有数据（重要！）
wrangler d1 backup create hdin-consignment-studio

# 2. 执行新Schema（会创建新表）
wrangler d1 execute hdin-consignment-studio --remote --file=src/worker/schema-enhanced.sql

# 3. 执行数据迁移（从旧表导入数据）
wrangler d1 execute hdin-consignment-studio --remote --file=src/worker/migration.sql

# 4. 验证迁移结果
wrangler d1 studio hdin-consignment-studio
```

### 2. 更新环境变量

创建或更新 `.env` 文件：

```env
VITE_API_URL=http://localhost:8787
VITE_ADMIN_PASSWORD=your_secure_password_here
JWT_SECRET=your_jwt_secret_here_min_32_chars
```

### 3. 安装依赖

```bash
npm install
```

### 4. 启动开发环境

```bash
# 启动前端开发服务器
npm run dev

# 在另一个终端启动Worker开发服务器
npm run worker:dev
```

## 📊 新的数据库结构

### 核心表说明

| 表名 | 说明 | 主要字段 |
|------|------|---------|
| `users` | 用户表 | email, password_hash, role, status |
| `categories` | 分类表（树形结构） | name, slug, parent_id |
| `products` | 商品主表 | name, description, category_id, ip_category |
| `product_skus` | 商品SKU/变体 | sku_code, variant_name, price, stock_quantity |
| `product_images` | 商品图片 | product_id, image_url, is_primary |
| `carts` | 购物车 | user_id/session_id, sku_id, quantity |
| `orders` | 订单主表 | order_number, status, total, customer_name |
| `order_items` | 订单明细 | order_id, sku_id, price, quantity |
| `reviews` | 商品评价 | product_id, rating, comment, status |
| `addresses` | 收货地址 | user_id, name, phone, address |
| `stock_logs` | 库存变动日志 | sku_id, change_quantity, type |
| `settings` | 系统配置 | key, value, type |
| `activity_logs` | 操作日志 | user_id, action, model |

### 关系图

```
users
  ├── products (seller_id)
  ├── orders (user_id)
  ├── carts (user_id)
  ├── reviews (user_id)
  ├── addresses (user_id)
  └── activity_logs (user_id)

products
  ├── product_skus (product_id)
  ├── product_images (product_id)
  ├── reviews (product_id)
  └── categories (category_id)

orders
  └── order_items (order_id)
      └── product_skus (sku_id)
```

## 🔌 新的API端点

详细的API文档将在 `src/worker/index-enhanced.ts` 中实现。主要端点包括：

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 商品
- `GET /api/products` - 获取商品列表（支持分页、筛选）
- `GET /api/products/:id` - 获取商品详情
- `POST /api/products` - 创建商品（管理员）
- `PUT /api/products/:id` - 更新商品
- `DELETE /api/products/:id` - 删除商品

### 购物车
- `GET /api/cart` - 获取购物车
- `POST /api/cart/items` - 添加商品到购物车
- `PUT /api/cart/items/:id` - 更新数量
- `DELETE /api/cart/items/:id` - 移除商品

### 订单
- `POST /api/orders` - 创建订单
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `PUT /api/orders/:id/cancel` - 取消订单

### 管理后台
- `GET /api/admin/dashboard` - 仪表板统计
- `GET /api/admin/orders` - 订单管理
- `PUT /api/admin/orders/:id/status` - 更新订单状态
- `GET /api/admin/users` - 用户管理

## 🎨 UI组件风格

所有新增组件都遵循现有的 Neobrutalism 设计风格：

### 设计规范
```tsx
// 边框和阴影
className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"

// 按钮（保留原有AnimatedButton）
<AnimatedButton variant="primary" hasShimmer>
  Click Me
</AnimatedButton>

// 卡片
<div className="bg-white rounded-xl border-2 border-black p-6 
                shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
                transition-all">
  {/* 内容 */}
</div>

// 强调色（黄色）
className="bg-yellow-400 text-black border-2 border-black"

// 3D按压效果
className="active:translate-y-[4px] active:shadow-none"
```

### 新组件示例

```tsx
// OrderCard.tsx - 订单卡片
<div className="bg-white rounded-xl border-2 border-black 
                shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
  <div className="p-6">
    <div className="flex justify-between items-center mb-4">
      <span className="font-black text-lg">订单 #{order.order_number}</span>
      <span className="px-3 py-1 bg-yellow-400 border-2 border-black rounded-full font-bold">
        {order.status}
      </span>
    </div>
    {/* 更多内容 */}
  </div>
</div>

// CheckoutForm.tsx - 结算表单
<form className="space-y-6">
  <div>
    <label className="block font-bold mb-2 uppercase text-sm tracking-wider">
      收货人姓名
    </label>
    <input 
      className="w-full border-2 border-black p-3 rounded-lg
                 focus:ring-4 focus:ring-yellow-400 outline-none
                 font-medium"
      placeholder="请输入姓名"
    />
  </div>
  {/* 更多字段 */}
</form>
```

## 📁 新的文件结构

```
/src
  /worker
    schema.sql              # 旧的数据库（将废弃）
    schema-enhanced.sql     # ✅ 新的完整数据库
    migration.sql           # ✅ 数据迁移脚本
    index.ts               # 旧的API
    index-enhanced.ts      # ⏳ 新的完整API（待实现）
    /utils
      auth.ts              # ⏳ JWT认证工具
      validation.ts        # ⏳ 数据验证
      pagination.ts        # ⏳ 分页工具

/components
  /product
    ProductDetail.tsx      # ⏳ 商品详情页
    SKUSelector.tsx        # ⏳ SKU选择器
  /cart
    CartPage.tsx           # ⏳ 购物车页面
    MiniCart.tsx           # ⏳ 迷你购物车
  /checkout
    CheckoutPage.tsx       # ⏳ 结算页面
    AddressSelector.tsx    # ⏳ 地址选择
  /order
    OrderList.tsx          # ⏳ 订单列表
    OrderDetail.tsx        # ⏳ 订单详情
  /account
    ProfilePage.tsx        # ⏳ 用户中心
    AddressManagement.tsx  # ⏳ 地址管理

/types-enhanced.ts         # ✅ 新的完整类型定义
/UPGRADE_PLAN.md           # ✅ 升级计划文档
```

## 🚀 下一步开发计划

### Phase 1: 后端API实现 ⏳
- [ ] 实现 JWT 认证中间件
- [ ] 实现完整的产品CRUD API
- [ ] 实现购物车API
- [ ] 实现订单创建和管理API
- [ ] 实现用户认证API

### Phase 2: 前端功能实现 ⏳
- [ ] 商品详情页（带SKU选择器）
- [ ] 购物车页面
- [ ] 结算流程
- [ ] 订单列表和详情
- [ ] 用户中心

### Phase 3: 后台功能增强 ⏳
- [ ] 订单管理界面
- [ ] 用户管理界面
- [ ] 库存管理和预警
- [ ] 统计面板优化

### Phase 4: 高级功能 ⏳
- [ ] 商品评价系统
- [ ] 支付集成（Stripe/支付宝）
- [ ] 邮件通知
- [ ] 图片上传（Cloudflare Images）

## 🔧 开发技巧

### 数据库调试

```bash
# 打开数据库管理界面
wrangler d1 studio hdin-consignment-studio

# 执行SQL查询
wrangler d1 execute hdin-consignment-studio --remote --command="SELECT * FROM products LIMIT 10"

# 查看表结构
wrangler d1 execute hdin-consignment-studio --remote --command="PRAGMA table_info(products)"
```

### API测试

推荐使用 [Hoppscotch](https://hoppscotch.io/) 或 Postman 测试API。

示例请求：
```bash
# 获取商品列表
curl http://localhost:8787/api/products?page=1&limit=10

# 创建订单
curl -X POST http://localhost:8787/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [{"sku_id": 1, "quantity": 2}],
    "customer_name": "张三",
    "customer_email": "test@example.com"
  }'
```

## 📚 参考资源

- [BeikeShop 官方文档](https://docs.beikeshop.com/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [TailwindCSS Neobrutalism](https://tailwindcomponents.com/component/neobrutalism-design)

## 🤝 贡献

如果你在使用过程中发现问题或有改进建议，欢迎提Issue或PR。

## 📄 许可

MIT License

---

**注意：** 本升级方案完全保留了原有的 Neobrutalism UI 风格，所有新增组件都会遵循相同的设计语言。数据库和API的改进不会影响现有的视觉呈现。
