# 动态标签系统使用指南

## 📋 系统说明

现在商品管理系统已经完全支持动态标签，管理员可以：
1. **添加新的分类和IP标签**
2. **删除不需要的标签**
3. **商品自动按照标签筛选**

## 🗄️ 数据库结构

### 1. **categories** 表（分类表）
```
字段：
- $id (string): 主键
- name (string, required): 分类名称（如"纸制品"、"3D打印制品"）
- $createdAt (datetime): 创建时间
- $updatedAt (datetime): 更新时间
```

### 2. **ip_tags** 表（IP标签表）
```
字段：
- $id (string): 主键
- name (string): IP名称（如"原神"、"崩坏3"）
- $createdAt (datetime): 创建时间
- $updatedAt (datetime): 更新时间
```

### 3. **products** 表（商品表）
```
关键字段：
- categoryId (string, size: 64): 分类外键 → 指向 categories.$id
- ip_id (string, size: 100): IP外键 → 指向 ip_tags.$id
```

## ✅ 功能说明

### 1. 管理员添加标签

#### **添加分类**
1. 以管理员身份登录
2. 在主页顶部分类栏，点击 **✏️ 编辑** 按钮
3. 点击 **➕ 添加分类** 虚线按钮
4. 输入新分类名称（如"手办定制"）
5. 点击 ✅ 确认
6. 新分类立即显示在列表中

#### **添加IP标签**
1. 在主页左侧边栏，点击 **✏️ 编辑** 按钮
2. 点击 **➕ 添加IP** 虚线按钮
3. 输入新IP名称（如"明日方舟"）
4. 点击 ✅ 确认
5. 新IP标签立即显示在列表中

### 2. 用户筛选商品

#### **按分类筛选**
1. 点击顶部分类按钮（如"纸制品"）
2. 系统自动：
   - 找到"纸制品"分类的ID
   - 查询 `products` 表中 `categoryId` = 该ID 的所有商品
   - 显示筛选结果

#### **按IP筛选**
1. 点击左侧IP按钮（如"原神"）
2. 系统自动：
   - 找到"原神"IP标签的ID
   - 查询 `products` 表中 `ip_id` = 该ID 的所有商品
   - 显示筛选结果

#### **组合筛选**
- 可以同时选择分类和IP
- 例如：选择"纸制品" + "原神" = 所有原神相关的纸制品

### 3. 管理员删除标签

⚠️ **重要提示**：删除标签会影响已发布的商品！

#### **删除流程**
1. 点击 **✏️ 编辑** 按钮进入编辑模式
2. 标签上会显示 **🗑️ 删除** 按钮
3. 点击删除按钮
4. 系统会提示：
   - "有 X 个商品使用了该标签"
   - "删除后这些商品的分类/IP将被清空"
5. 确认后：
   - 系统自动清空相关商品的外键
   - 删除标签文档
   - 刷新列表

## 🔄 工作流程

### 完整示例：添加新商品分类

**场景**：需要添加"周边饰品"分类

1. **管理员操作**：
   ```
   主页 → 顶部分类栏 → ✏️ 编辑 → ➕ 添加分类 → 输入"周边饰品" → ✅ 确认
   ```

2. **系统操作**：
   ```sql
   -- 在 categories 表创建新文档
   INSERT INTO categories (name) VALUES ("周边饰品")
   -- 返回 $id = "65f9a1b2c3d4e5f6"
   ```

3. **发布商品时**：
   ```typescript
   // 商品表单的分类下拉菜单自动包含"周边饰品"
   const product = {
     categoryId: "65f9a1b2c3d4e5f6",  // ← 存储的是ID，不是名称
     // ... 其他字段
   }
   ```

4. **用户点击"周边饰品"按钮**：
   ```typescript
   // 系统查询流程：
   // 1. 用户点击：selectedCategory = "周边饰品"
   // 2. 转换ID：getTagIdByName('category', '周边饰品') → "65f9a1b2c3d4e5f6"
   // 3. 查询商品：Query.equal('categoryId', '65f9a1b2c3d4e5f6')
   // 4. 返回结果：所有 categoryId = "65f9a1b2c3d4e5f6" 的商品
   ```

## 🎯 核心技术实现

### 1. 标签名称 → ID 转换
```typescript
// hooks/useTags.ts
const getTagIdByName = (type: 'category' | 'ip', name: string): string | null => {
  const tagList = type === 'category' ? tags.categories : tags.ips;
  const tag = tagList.find(t => t.name === name);
  return tag?.$id || null;
};
```

### 2. 商品筛选查询
```typescript
// components/Shop.tsx
useEffect(() => {
  const filters = {};
  
  // 用户点击"原神"按钮
  if (selectedIP === "原神") {
    // 转换为ID：找到"原神"的 $id
    const ipId = getTagIdByName('ip', '原神');  // → "65abc123..."
    
    // 用ID查询
    filters.ip = ipId;  
    
    // 最终查询：Query.equal('ip_id', '65abc123...')
  }
  
  fetchProducts(filters);
}, [selectedIP]);
```

### 3. 商品查询逻辑
```typescript
// hooks/useProducts.ts
const queries = [];

if (filters.ip && filters.ip !== '全部') {
  queries.push(Query.equal('ip_id', filters.ip));  // ← 使用ID查询
}

if (filters.category && filters.category !== '全部') {
  queries.push(Query.equal('categoryId', filters.category));  // ← 使用ID查询
}
```

## 🚀 快速测试流程

### 第一步：添加测试数据

1. **添加分类**：
   - "手办模型"
   - "卡贴周边"

2. **添加IP**：
   - "明日方舟"
   - "碧蓝档案"

### 第二步：验证标签显示

- 刷新页面
- 检查顶部分类栏是否显示新分类
- 检查左侧边栏是否显示新IP

### 第三步：发布测试商品

1. 点击右上角 ➕ 发布商品
2. 在分类下拉菜单中，应该能看到：
   - "手办模型"
   - "卡贴周边"
3. 在IP下拉菜单中，应该能看到：
   - "明日方舟"
   - "碧蓝档案"
4. 选择后保存商品

### 第四步：测试筛选功能

1. 点击"手办模型"分类按钮
2. 应该只显示该分类的商品
3. 点击"明日方舟"IP按钮
4. 应该只显示该IP的商品
5. 同时选择两个标签，应该显示交集结果

## ⚠️ 常见问题

### 问题1：点击标签后没有显示商品

**原因**：商品的外键可能是空的或错误的

**解决方案**：
1. 打开 Appwrite Console → products 表
2. 检查商品的 `categoryId` 和 `ip_id` 字段
3. 确保这些字段存储的是有效的标签ID（不是名称）

### 问题2：添加标签后没有显示

**原因1**：数据库权限问题

**解决方案**：
- 检查 categories 和 ip_tags 表的权限设置
- 确保有 `Any` 角色的 `Read` 权限

**原因2**：集合ID配置错误

**解决方案**：
- 检查 `lib/appwrite.ts` 中的集合ID
- 确保 `COLLECTIONS.CATEGORIES = 'categories'` 和 `COLLECTIONS.IP_TAGS = 'ip_tags'`

### 问题3：删除标签后商品还显示在该分类下

**原因**：商品的外键没有被清空

**解决方案**：
- 手动检查数据库，确认商品的 categoryId/ip_id 已被清空
- 如果没有清空，手动更新为空字符串

## 📊 数据流程图

```
用户点击"原神"按钮
    ↓
Shop.tsx: selectedIP = "原神"
    ↓
useTags.getTagIdByName('ip', '原神')
    ↓
查找 tags.ips 数组找到匹配的 tag
    ↓
返回 tag.$id = "65abc123..."
    ↓
useProducts.fetchProducts({ ip: "65abc123..." })
    ↓
构建查询: Query.equal('ip_id', '65abc123...')
    ↓
Appwrite 查询 products 表
    ↓
返回所有 ip_id = "65abc123..." 的商品
    ↓
页面显示筛选结果 ✅
```

## ✅ 总结

**核心改进**：
1. ✅ 支持两个独立的表（categories 和 ip_tags）
2. ✅ 管理员可以动态添加/删除标签
3. ✅ 商品使用外键（ID）关联标签，而不是存储名称
4. ✅ 筛选时自动将名称转换为ID进行查询
5. ✅ 删除标签时自动处理关联商品

**下一步**：
1. 在发布商品表单中使用动态标签下拉菜单
2. 测试完整的添加→筛选→删除流程
3. 确保所有商品数据使用正确的外键格式
