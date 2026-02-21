# 🧪 Phase 1 完成 - API测试指南

## ✅ 已完成的功能

### 1. 工具函数库
- ✅ JWT认证（生成、验证、中间件）
- ✅ 密码哈希和验证
- ✅ 数据验证工具
- ✅ 分页工具
- ✅ 统一的API响应格式

### 2. 完整的REST API
- ✅ 用户认证（注册、登录、获取当前用户）
- ✅ 商品管理（CRUD + SKU支持）
- ✅ 购物车（添加、更新、删除、清空）
- ✅ 订单系统（创建、查询、取消）
- ✅ 管理后台（统计、订单管理）

## 🚀 部署步骤

### Step 1: 迁移数据库

```bash
# 1. 备份现有数据（重要！）
wrangler d1 backup create hdin-consignment-studio

# 2. 执行新的数据库Schema
wrangler d1 execute hdin-consignment-studio --remote --file=src/worker/schema-enhanced.sql

# 3. （可选）如果有旧数据，执行迁移
wrangler d1 execute hdin-consignment-studio --remote --file=src/worker/migration.sql

# 4. 验证数据库
wrangler d1 studio hdin-consignment-studio
```

### Step 2: 设置环境变量

编辑 `wrangler.toml`，确保JWT_SECRET设置为强密钥：

```toml
[vars]
JWT_SECRET = "your-very-long-secret-key-at-least-32-characters-long"
```

**注意：生产环境应使用 Secret 而不是 vars：**
```bash
# 生产环境设置Secret
wrangler secret put JWT_SECRET
# 然后输入你的密钥
```

### Step 3: 测试Worker API

```bash
# 启动本地开发服务器
npm run worker:dev

# 在另一个终端测试API
curl http://localhost:8787/api/health
```

### Step 4: 部署到Cloudflare

```bash
# 部署Worker
npm run worker:deploy

# 确认部署成功
curl https://your-worker.workers.dev/api/health
```

## 📡 API端点测试

### 1. 健康检查
```bash
curl http://localhost:8787/api/health
```

### 2. 用户注册
```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "测试用户"
  }'
```

响应：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "test@example.com",
      "name": "测试用户",
      "role": "customer"
    },
    "token": "eyJhbGc..."
  }
}
```

### 3. 用户登录
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. 获取商品列表（支持分页和筛选）
```bash
# 基本查询
curl "http://localhost:8787/api/products?page=1&limit=20"

# 按分类筛选
curl "http://localhost:8787/api/products?category_id=1"

# 按IP筛选
curl "http://localhost:8787/api/products?ip_category=原神"

# 搜索
curl "http://localhost:8787/api/products?search=明信片"

# 组合查询
curl "http://localhost:8787/api/products?page=1&limit=10&category_id=1&ip_category=原神"
```

### 5. 创建商品（需要管理员权限）
```bash
# 先登录获取token
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:8787/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "流萤 - 全息明信片",
    "slug": "firefly-holographic-postcard",
    "description": "高克重珠光纸，全息镭射效果",
    "category_id": 1,
    "ip_category": "崩坏：星穹铁道",
    "material_type": "珠光纸",
    "status": "active",
    "default_sku": {
      "sku_code": "SKU-FIREFLY-001",
      "variant_name": "单张",
      "price": 15,
      "stock_quantity": 100
    }
  }'
```

### 6. 添加商品到购物车
```bash
# 未登录用户需要提供Session ID
curl -X POST http://localhost:8787/api/cart/items \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: session-123456" \
  -d '{
    "sku_id": 1,
    "quantity": 2
  }'

# 已登录用户使用Token
curl -X POST http://localhost:8787/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "sku_id": 1,
    "quantity": 2
  }'
```

### 7. 获取购物车
```bash
# 未登录
curl -H "X-Session-ID: session-123456" \
  http://localhost:8787/api/cart

# 已登录
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8787/api/cart
```

### 8. 创建订单
```bash
curl -X POST http://localhost:8787/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {"sku_id": 1, "quantity": 2}
    ],
    "customer_name": "张三",
    "customer_email": "zhangsan@example.com",
    "customer_phone": "13800138000",
    "shipping_address": {
      "province": "北京",
      "city": "北京市",
      "district": "朝阳区",
      "address": "某某街道123号",
      "postal_code": "100000"
    },
    "payment_method": "wechat",
    "notes": "请尽快发货"
  }'
```

### 9. 获取用户订单列表
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8787/api/orders?page=1&limit=10"
```

### 10. 管理后台 - 获取统计数据（需要管理员权限）
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8787/api/admin/dashboard
```

## 🔧 常见问题

### Q: 如何创建管理员账户？

执行以下SQL（在 wrangler d1 studio 中）：

```sql
-- 创建管理员账户（密码: admin123）
INSERT INTO users (email, password_hash, name, role, status) VALUES
('admin@example.com', 
 '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
 'Admin',
 'admin',
 'active');
```

然后登录获取管理员Token：
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### Q: 数据库Schema执行失败怎么办？

```bash
# 查看数据库当前表
wrangler d1 execute hdin-consignment-studio --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table'"

# 如果需要重置，删除所有表（危险操作！）
wrangler d1 execute hdin-consignment-studio --remote \
  --file=src/worker/reset-db.sql
```

### Q: JWT Token过期时间？

默认是7天。可以在 `src/worker/utils/auth.ts` 的 `generateToken` 函数中修改。

### Q: 如何查看Worker日志？

```bash
# 实时查看日志
wrangler tail

# 或在Cloudflare Dashboard查看
```

## 📊 数据库管理

### 查看所有商品
```bash
wrangler d1 execute hdin-consignment-studio --remote \
  --command="SELECT p.id, p.name, ps.price, ps.stock_quantity 
             FROM products p 
             JOIN product_skus ps ON p.id = ps.product_id"
```

### 查看所有订单
```bash
wrangler d1 execute hdin-consignment-studio --remote \
  --command="SELECT order_number, customer_name, total, status, created_at 
             FROM orders 
             ORDER BY created_at DESC 
             LIMIT 10"
```

### 更新订单状态
```bash
wrangler d1 execute hdin-consignment-studio --remote \
  --command="UPDATE orders SET status = 'paid', payment_status = 'paid' WHERE id = 1"
```

## 🎯 下一步：Phase 2 - 前端功能

现在后端API已经完全就绪，我们可以开始实现前端功能：

1. 更新 `useProducts` hook 使用新API
2. 创建商品详情页（带SKU选择器）
3. 实现完整的购物车页面
4. 实现结算流程
5. 实现订单列表和详情页
6. 实现用户中心

准备好继续到Phase 2了吗？

## 📝 API文档

完整的API文档已内置在代码中。每个端点都有详细的注释和类型定义。

你也可以使用Postman或Hoppscotch导入以下集合：
- 所有端点都支持CORS
- 响应格式统一
- 错误处理完善
- 支持JWT认证

---

**恭喜！Phase 1 已完成！** 🎉

你现在拥有一个功能完整、可扩展的电商后端API系统。
