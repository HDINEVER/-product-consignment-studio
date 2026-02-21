# Cloudflare Pages 部署指南

## 🚨 重要：解决白屏问题

### 问题原因
白屏的主要原因是 **Cloudflare Pages 缺少环境变量配置**，导致 Appwrite SDK 初始化失败。

### 修复步骤

#### 1. 在 Cloudflare Pages Dashboard 配置环境变量

登录 Cloudflare Dashboard → Pages → 你的项目 → Settings → Environment Variables

添加以下环境变量（**必须全部配置**）：

```bash
# Appwrite 配置
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=hdinever0428

# Appwrite 数据库配置
VITE_APPWRITE_DATABASE_ID=product_consignment_db
VITE_APPWRITE_PRODUCTS_COLLECTION_ID=products
VITE_APPWRITE_USERS_COLLECTION_ID=users
VITE_APPWRITE_ORDERS_COLLECTION_ID=orders
VITE_APPWRITE_ORDER_ITEMS_COLLECTION_ID=order_items
VITE_APPWRITE_ADDRESSES_COLLECTION_ID=addresses
VITE_APPWRITE_CART_ITEMS_COLLECTION_ID=cart_items
VITE_APPWRITE_TAGS_COLLECTION_ID=tags

# Appwrite Storage
VITE_APPWRITE_STORAGE_BUCKET_ID=product-images

# Appwrite 管理员团队 ID
VITE_APPWRITE_ADMIN_TEAM_ID=6996cdfd000d548e392d

# 管理员密码
VITE_ADMIN_PASSWORD=admin123
```

**⚠️ 注意事项：**
- **所有环境变量必须以 `VITE_` 开头**（Vite 要求）
- **Production 和 Preview 环境都需要配置**
- 配置完成后需要 **重新部署**

#### 2. SPA 路由配置

已创建 `public/_redirects` 文件，确保所有路由请求都返回 `index.html`（React Router 需要）。

#### 3. 构建配置

确保 `package.json` 中的构建命令正确：

```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

Cloudflare Pages 会自动识别并运行 `npm run build`。

#### 4. 输出目录

Vite 默认输出到 `dist/` 目录，Cloudflare Pages 需要设置：

- **Build command**: `npm run build`
- **Build output directory**: `dist`

---

## 🔧 本地测试生产构建

在推送到 Cloudflare 之前，先本地测试：

```bash
# 使用生产环境变量构建
npm run build

# 预览生产构建
npm run preview
```

如果本地预览正常，说明配置正确。

---

## 📋 部署检查清单

- [ ] Cloudflare Pages 环境变量已全部配置
- [ ] `public/_redirects` 文件已创建
- [ ] 本地生产构建测试通过
- [ ] 推送代码到 Git 仓库
- [ ] Cloudflare Pages 自动部署
- [ ] 检查部署日志（无错误）
- [ ] 访问部署的 URL，确认页面正常

---

## 🐛 调试白屏问题

如果配置后仍然白屏：

### 1. 检查 Console 错误

打开浏览器开发者工具（F12） → Console，查看错误信息：

```javascript
// 常见错误
❌ "Cannot read property 'setEndpoint' of undefined"  → Appwrite 环境变量缺失
❌ "Failed to fetch" → 网络请求失败或 CORS 问题
❌ "404 Not Found" → SPA 路由配置问题
```

### 2. 检查网络请求

开发者工具 → Network：
- 确认 `index.html` 加载成功（200）
- 确认 JS/CSS 资源加载成功
- 确认 Appwrite API 请求成功（检查 Request URL）

### 3. 验证环境变量

在浏览器 Console 中运行：

```javascript
console.log(import.meta.env.VITE_APPWRITE_ENDPOINT);
// 应该输出：https://sgp.cloud.appwrite.io/v1
// 如果是 undefined，说明环境变量未正确配置
```

### 4. 检查 Appwrite CORS 设置

登录 Appwrite Console → Settings → Platforms：

添加 Web 平台：
- **Name**: Cloudflare Pages Production
- **Hostname**: `你的部署域名.pages.dev`（不要加 `https://`）

---

## 🚀 快速重新部署

如果已经配置环境变量，但需要重新构建：

1. Cloudflare Dashboard → Pages → 你的项目
2. 点击 **Deployments** 标签
3. 点击最新部署旁边的 **⋮** → **Retry deployment**

或者推送一个空 commit 触发重新部署：

```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

---

## 📝 环境变量管理最佳实践

- `.env.local` - 本地开发（不提交到 Git）
- `.env.production` - 生产环境默认值（可提交，但不包含敏感信息）
- Cloudflare Dashboard - 实际生产环境变量（覆盖 `.env.production`）

---

## ✅ 确认部署成功

访问你的 Cloudflare Pages URL，确认：

1. ✅ 首页正常显示（商品列表）
2. ✅ 可以点击商品查看详情
3. ✅ 可以添加购物车
4. ✅ 可以登录/注册
5. ✅ 管理员功能正常（如果需要）

---

如果按照以上步骤操作后仍有问题，请提供：
- 浏览器 Console 的完整错误信息
- Cloudflare Pages 部署日志
- 访问的 URL

这样可以更精准地定位问题！
