# 🤖 Agent 开发提示词 - 产品寄售站数据库映射规范

## 📋 总览
本文档定义了前端代码与 Appwrite 数据库之间的**严格映射规则**，确保所有商品、分类、IP 标签的增删改查操作都能正确对接数据库字段。

---

## 🗄️ 1. 数据库表结构 (Appwrite Collections)

### 1.1 **products** 表（商品表）

| 列名 (Column Name) | 类型 (Type) | 必填 | 说明 |
|-------------------|------------|------|------|
| `$id` | string | ✅ | 主键（Appwrite 自动生成） |
| `name` | string (200) | ✅ | 商品名称 |
| `slug` | string (200) | ❌ | URL 友好的别名 |
| `description` | string (2000) | ❌ | 商品描述 |
| `price` | double | ✅ | 价格（单位：元） |
| `stockQuantity` | integer | ✅ | 库存数量 (0-10000) |
| `imageUrl` | string (2048) | ✅ | 图片完整 URL（上传到 Storage 后获取） |
| `categoryId` | string (64) | ✅ | 分类外键（对应 `categories` 表的 `$id`） |
| `ip_id` | string (100) | ✅ | IP 外键（对应 `ip_tags` 表的 `$id`） |
| `$createdAt` | datetime | 自动 | 创建时间 |

**⚠️ 注意事项：**
- `imageUrl` 必须是完整的可访问 URL（通过 `storage.getFilePreview()` 或 `storage.getFileView()` 获取）
- `categoryId` 和 `ip_id` 必须是有效的外键，指向对应表的真实文档 ID
- `price` 使用 `double` 类型，支持小数（如 99.99）
- `stockQuantity` 使用 `integer` 类型，范围 0-10000

---

### 1.2 **categories** 表（商品分类表）

| 列名 (Column Name) | 类型 (Type) | 必填 | 说明 |
|-------------------|------------|------|------|
| `$id` | string | ✅ | 主键（Appwrite 自动生成） |
| `name` | string (100) | ✅ | 分类名称（如 "纸制品"） |
| `$createdAt` | datetime | 自动 | 创建时间 |
| `$updatedAt` | datetime | 自动 | 更新时间 |

**⚠️ 注意事项：**
- 删除分类前，需要将所有使用该分类的商品迁移到"未分类"或其他分类
- 分类名称应保持唯一性（前端校验）

---

### 1.3 **ip_tags** 表（IP 标签表）

| 列名 (Column Name) | 类型 (Type) | 必填 | 说明 |
|-------------------|------------|------|------|
| `$id` | string | ✅ | 主键（Appwrite 自动生成） |
| `name` | string (100) | ❌ | IP 名称（如 "原神", "崩坏3"） |
| `$createdAt` | datetime | 自动 | 创建时间 |
| `$updatedAt` | datetime | 自动 | 更新时间 |

**⚠️ 注意事项：**
- IP 标签允许为空（`name` 字段不是 required）
- 删除 IP 前，需要将所有使用该 IP 的商品的 `ip_id` 清空或迁移

---

### 1.4 **cart_items** 表（购物车表）

| 列名 (Column Name) | 类型 (Type) | 必填 | 说明 |
|-------------------|------------|------|------|
| `$id` | string | ✅ | 主键（Appwrite 自动生成） |
| `user_id` | string | ✅ | 用户 ID（外键） |
| `product_id` | string | ✅ | 商品 ID（外键指向 `products.$id`） |
| `quantity` | integer | ✅ | 数量（1-stockQuantity） |
| `created_at` | datetime | 自动 | 添加时间 |

---

## 🔄 2. 前端与数据库字段映射

### 2.1 **Product 类型定义（TypeScript）**

**旧类型（types.ts）：**
```typescript
export interface Product {
  id: string;           // 对应数据库 $id
  title: string;        // ⚠️ 旧字段名，应改为 name
  ip: string;           // ⚠️ 应改为 ip_id（外键）
  category: Category;   // ⚠️ 应改为 categoryId（外键）
  image: string;        // ⚠️ 应改为 imageUrl
  description: string;
  basePrice: number;    // ⚠️ 应改为 price
  stockQuantity?: number;
  materialType?: string;
  variants: ProductVariant[];  // ⚠️ 当前未使用
}
```

**新类型（需要更新）：**
```typescript
export interface Product {
  id: string;              // 对应 $id
  name: string;            // ✅ 对应 name
  description: string;     // ✅ 对应 description
  price: number;           // ✅ 对应 price
  stockQuantity: number;   // ✅ 对应 stockQuantity
  imageUrl: string;        // ✅ 对应 imageUrl
  categoryId: string;      // ✅ 对应 categoryId
  ip_id: string;           // ✅ 对应 ip_id
  
  // 用于前端显示的辅助字段（通过关联查询填充）
  categoryName?: string;   // 从 categories 表查询
  ipName?: string;         // 从 ip_tags 表查询
}
```

---

### 2.2 **数据库操作映射规则**

#### **⚠️ 严格规则：所有数据库写入操作（createDocument）必须使用以下确切字段名：**

```typescript
// ✅ 正确示例：创建商品
const newProduct = await databases.createDocument(
  DATABASE_ID,
  COLLECTIONS.PRODUCTS,
  ID.unique(),
  {
    name: "商品名称",              // ✅ 不是 title
    description: "商品描述",       // ✅
    price: 99.99,                  // ✅ 不是 basePrice
    stockQuantity: 10,             // ✅ 驼峰命名
    imageUrl: "https://...",       // ✅ 不是 image
    categoryId: "category_doc_id", // ✅ 不是 category
    ip_id: "ip_tag_doc_id",        // ✅ 下划线命名
  }
);

// ❌ 错误示例：使用旧字段名（会导致字段不存在错误）
const wrongProduct = await databases.createDocument(
  DATABASE_ID,
  COLLECTIONS.PRODUCTS,
  ID.unique(),
  {
    title: "商品名称",        // ❌ 数据库中不存在此字段
    basePrice: 99.99,         // ❌ 数据库中不存在此字段
    category: "纸制品",       // ❌ 应该是 categoryId（外键）
    ip: "原神",               // ❌ 应该是 ip_id（外键）
    image: "https://...",     // ❌ 应该是 imageUrl
  }
);
```

---

## 📤 3. 发布商品表单实现规范

### 3.1 **表单流程（两步走）**

```typescript
// 步骤 1: 上传图片到 Storage
const uploadImage = async (file: File): Promise<string> => {
  try {
    // 1.1 上传文件
    const response = await storage.createFile(
      STORAGE_BUCKET_ID,
      ID.unique(),
      file
    );
    
    // 1.2 获取可访问的 URL（选择一种方式）
    // 方式 A: 预览 URL（带尺寸限制，适合展示）
    const imageUrl = storage.getFilePreview(
      STORAGE_BUCKET_ID,
      response.$id,
      2000,  // 宽度
      0,     // 高度（0=自动）
      'center',
      100    // 质量
    ).href;
    
    // 方式 B: 查看 URL（原图，适合下载）
    // const imageUrl = storage.getFileView(STORAGE_BUCKET_ID, response.$id).href;
    
    return imageUrl;
  } catch (error) {
    console.error('图片上传失败:', error);
    throw error;
  }
};

// 步骤 2: 创建商品文档
const publishProduct = async (formData: ProductFormData) => {
  try {
    // 2.1 先上传图片
    const imageUrl = await uploadImage(formData.imageFile);
    
    // 2.2 创建商品文档（使用正确的字段名）
    const product = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      ID.unique(),
      {
        name: formData.name,                    // ✅
        description: formData.description,      // ✅
        price: parseFloat(formData.price),      // ✅ 转换为 number
        stockQuantity: parseInt(formData.stock),// ✅ 转换为 integer
        imageUrl: imageUrl,                     // ✅ 完整 URL
        categoryId: formData.selectedCategory,  // ✅ 外键（$id）
        ip_id: formData.selectedIP,             // ✅ 外键（$id）
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(currentUserId)),
        Permission.delete(Role.user(currentUserId)),
      ]
    );
    
    console.log('✅ 商品发布成功:', product.$id);
    return product;
  } catch (error) {
    console.error('❌ 商品发布失败:', error);
    throw error;
  }
};
```

---

### 3.2 **表单 Select 动态加载**

```typescript
// ✅ 正确示例：从数据库动态加载分类和 IP
const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
const [ipTags, setIpTags] = useState<{ id: string, name: string }[]>([]);

useEffect(() => {
  // 加载分类
  const fetchCategories = async () => {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CATEGORIES
    );
    setCategories(response.documents.map(doc => ({
      id: doc.$id,
      name: doc.name as string
    })));
  };
  
  // 加载 IP 标签
  const fetchIPTags = async () => {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.IP_TAGS  // 假设常量已定义
    );
    setIpTags(response.documents.map(doc => ({
      id: doc.$id,
      name: doc.name as string
    })));
  };
  
  fetchCategories();
  fetchIPTags();
}, []);

// 表单中的 Select
<select name="categoryId" required>
  <option value="">-- 选择分类 --</option>
  {categories.map(cat => (
    <option key={cat.id} value={cat.id}>{cat.name}</option>
  ))}
</select>

<select name="ip_id" required>
  <option value="">-- 选择 IP --</option>
  {ipTags.map(ip => (
    <option key={ip.id} value={ip.id}>{ip.name}</option>
  ))}
</select>
```

---

## 🛍️ 4. 商品详情弹窗规范

### 4.1 **设计要求（Neo-brutalism 风格）**

- **背景遮罩**: `bg-black/20 backdrop-blur-sm`
- **弹窗容器**: 
  - 白色或淡黄色底 `bg-brutal-bg`
  - 极粗黑边框 `border-4 border-black`
  - 硬实心阴影 `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`
  - 直角或小圆角 `rounded-xl`
- **关闭按钮**: 右上角 X 按钮，明显可点击

---

### 4.2 **弹窗内容布局**

```tsx
<div className="flex gap-6 p-6">
  {/* 左侧：商品大图 */}
  <div className="flex-1">
    <img 
      src={product.imageUrl}  // ✅ 使用 imageUrl
      alt={product.name}      // ✅ 使用 name
      className="w-full h-auto border-2 border-black shadow-brutal"
    />
  </div>
  
  {/* 右侧：商品信息 */}
  <div className="flex-1 flex flex-col gap-4">
    <h2 className="font-black text-3xl">{product.name}</h2>
    <div className="text-2xl font-bold text-brutal-blue">
      ¥{product.price.toFixed(2)}
    </div>
    <div className="text-gray-600 whitespace-pre-wrap">
      {product.description}
    </div>
    
    {/* 数量选择器 */}
    <div className="flex items-center gap-4">
      <button onClick={decreaseQty}>-</button>
      <span>{quantity}</span>
      <button onClick={increaseQty}>+</button>
      <span className="text-sm text-gray-500">
        库存: {product.stockQuantity}
      </span>
    </div>
    
    {/* 加入购物车按钮 */}
    <button 
      onClick={handleAddToCart}
      className="w-full py-4 bg-brutal-black text-brutal-yellow font-black text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
    >
      加入购物车
    </button>
  </div>
</div>
```

---

### 4.3 **加入购物车逻辑**

```typescript
const handleAddToCart = async () => {
  try {
    if (isGuest) {
      // 游客：存入 sessionStorage
      addToGuestCart({
        product_id: product.id,
        product_name: product.name,
        image: product.imageUrl,
        price: product.price,
        quantity: selectedQuantity,
        variant_name: '',
      });
      toast.success('已加入购物车！');
    } else {
      // 登录用户：写入 Appwrite cart_items 表
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CART_ITEMS,
        ID.unique(),
        {
          user_id: user.$id,
          product_id: product.id,
          quantity: selectedQuantity,
        },
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );
      toast.success('已加入购物车！');
    }
    
    // 关闭弹窗
    onClose();
  } catch (error) {
    console.error('加入购物车失败:', error);
    toast.error('加入购物车失败，请重试');
  }
};
```

---

## ✅ 5. 核心检查清单

在实现任何商品相关功能前，请确保：

- [ ] **字段名严格匹配**：`name`、`price`、`imageUrl`、`categoryId`、`ip_id`、`stockQuantity`
- [ ] **外键正确**：`categoryId` 和 `ip_id` 必须是真实存在的文档 ID
- [ ] **图片 URL 完整**：通过 `storage.getFilePreview()` 或 `storage.getFileView()` 获取
- [ ] **类型转换正确**：`price` → `number`，`stockQuantity` → `integer`
- [ ] **Select 动态加载**：从 `categories` 和 `ip_tags` 表拉取最新数据
- [ ] **权限设置正确**：使用 `Permission` 和 `Role` 控制访问

---

## 🚨 常见错误排查

### 错误 1: `Document missing required attribute: name`
**原因**: 使用了旧字段名 `title` 而不是 `name`  
**解决**: 检查 `createDocument` 的 payload，确保使用 `name: "商品名称"`

### 错误 2: `Invalid document structure: Unknown attribute: "category"`
**原因**: 传递了分类名称字符串，而不是分类 ID（外键）  
**解决**: 使用 `categoryId: "6793abc..."` 而不是 `category: "纸制品"`

### 错误 3: 商品图片无法显示
**原因**: `imageUrl` 不是完整的可访问 URL  
**解决**: 确保调用 `storage.getFilePreview().href` 获取完整 URL

### 错误 4: 库存数量验证失败
**原因**: `stockQuantity` 传递了字符串而不是整数  
**解决**: 使用 `parseInt(formData.stock)` 转换为整数

---

## 🔗 相关文件速查

| 文件路径 | 作用 | 关键字段 |
|---------|------|---------|
| `lib/appwrite.ts` | Appwrite 配置 | `COLLECTIONS.PRODUCTS`, `DATABASE_ID` |
| `hooks/useProducts.ts` | 商品 CRUD hook | `fetchProducts`, `createProduct`, `deleteProduct` |
| `components/ProductUploadModal.tsx` | 发布商品表单 | `handleSubmit`, `uploadImage` |
| `components/ProductDetailModal.tsx` | 商品详情弹窗 | `addToCart`, `quantity` |
| `types.ts` | TypeScript 类型定义 | `Product`, `Category` |
| `.env.local` | 环境变量 | `VITE_APPWRITE_PRODUCTS_COLLECTION_ID` |

---

## 📝 总结

**记住这 7 个字段名，永不出错：**

1. `name` （商品名称）
2. `description` （商品描述）
3. `price` （价格）
4. `stockQuantity` （库存）
5. `imageUrl` （图片 URL）
6. `categoryId` （分类 ID）
7. `ip_id` （IP ID）

**开发任何功能前，先问自己：**
> "我使用的字段名是否与数据库表结构完全一致？"

如果答案是"是"，那么恭喜你，代码将正确运行！🎉
