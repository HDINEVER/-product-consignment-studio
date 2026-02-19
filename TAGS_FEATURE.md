# 动态分类标签管理功能

## 📋 功能概述

实现了完全动态的商品分类和IP标签管理系统，取代了之前硬编码在代码中的分类列表。

### 主要特性

✅ **动态分类管理**: 从数据库读取分类标签，无需修改代码
✅ **管理员控制**: 管理员可以实时添加/删除分类
✅ **未分类归档**: 删除分类时自动将相关商品归为"未分类"
✅ **用户友好UI**: 编辑模式、删除确认、添加输入框等
✅ **权限隔离**: 仅管理员可见编辑功能

## 🏗️ 技术架构

### 1. 数据库结构

**Collection**: `tags`

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | `category` (分类) 或 `ip` (IP标签) |
| name | string | 标签名称，如"纸制品"、"原神" |
| order | integer | 排序顺序 |

### 2. 核心文件

```
hooks/
  └── useTags.ts           # 标签管理 Hook (CRUD操作)
components/
  ├── TagManager.tsx       # 标签管理UI组件
  ├── Shop.tsx             # 主页面（使用动态分类）
  └── ProductUploadModal.tsx  # 商品上传（使用动态分类）
scripts/
  └── init-tags.ts         # 初始化脚本
```

### 3. 代码变更

#### useTags Hook
```typescript
// 提供的功能
- fetchTags()        // 获取所有标签
- addTag()           // 添加新标签
- deleteTag()        // 删除标签（自动处理商品归类）
- getCategoryNames() // 获取分类名称数组
- getIPNames()       // 获取IP名称数组
```

#### Shop.tsx
```typescript
// 使用动态分类
const { tags, addTag, deleteTag, getCategoryNames, getIPNames } = useTags();
const CATEGORIES = getCategoryNames(); // ['全部', ...动态分类, '未分类']
const IPS = getIPNames();               // ['全部', ...动态IP, '未分类']
```

## 🚀 使用指南

### 第一步: 设置 Appwrite Collection

1. 访问 Appwrite Console
2. 创建 `tags` collection
3. 添加属性: `type`, `name`, `order`
4. 设置权限（详见 [TAGS_SETUP.md](./TAGS_SETUP.md)）

### 第二步: 添加 API Key

在 `.env.local` 中添加：
```env
# 用于服务端脚本（从 Appwrite Console > Settings > API Keys 获取）
APPWRITE_API_KEY=your_api_key_here
```

### 第三步: 初始化数据

```bash
npm run init-tags
```

这将自动创建初始的分类和IP标签。

### 第四步: 验证功能

1. **访问主页面**: http://localhost:5175
2. **以管理员身份登录**
3. **查看分类标签**: 顶部横排按钮（"全部"、"纸制品"等）
4. **查看IP标签**: 左侧边栏（"全部"、"原神"等）
5. **编辑模式**: 点击"编辑"按钮进入编辑模式
6. **删除标签**: 点击标签右上角的 ✕ 
7. **添加标签**: 点击"添加分类"或"添加IP"按钮

## 🎨 UI/UX 设计

### 普通用户视图
- 显示所有分类/IP按钮
- 可点击筛选商品
- 无编辑功能

### 管理员视图

#### 分类管理（顶部）
```
[全部] [纸制品] [3D打印制品] ... [+添加分类] [✏️编辑]
```

**编辑模式**:
```
[纸制品 ✕] [3D打印制品 ✕] [角色手办定制 ✕] [➕添加分类] [✕完成编辑]
```

#### IP管理（侧边栏）
```
IP 筛选
━━━━━━━━━━━━━━━━
[全部]
[原神]
[崩坏：星穹铁道]
...
[+添加IP] [✏️编辑]
```

## ⚙️ 工作流程

### 添加新分类
1. Admin点击"添加分类"
2. 输入新分类名称（如"手办模型"）
3. 点击"确认"
4. 系统写入数据库
5. 列表自动刷新，新分类出现

### 删除分类
1. Admin点击"编辑"按钮
2. 标签右上角出现 ✕ 按钮
3. 点击 ✕ 
4. 弹出确认对话框
5. 确认后：
   - 查找使用该分类的所有商品
   - 将这些商品的分类改为"未分类"
   - 删除该分类标签
   - 刷新列表

### 商品上传时选择分类
```typescript
// ProductUploadModal.tsx
const { tags } = useTags();
const CATEGORIES = tags.categories.map(t => t.name);
const IP_TAGS = tags.ips.map(t => t.name);

// 下拉菜单自动使用最新的分类
<select name="category">
  {CATEGORIES.map(cat => <option>{cat}</option>)}
</select>
```

## 🔒 权限控制

### 数据库权限
- **Read**: Any (所有人可读)
- **Create/Update/Delete**: Team:Admins (仅管理员)

### UI权限
```typescript
// Shop.tsx
{isAdmin && (
  <TagManager ... />
)}
```

## 🐛 故障排除

### 问题: 分类不显示
**解决方案**:
1. 检查 tags collection 是否创建
2. 运行 `npm run init-tags` 初始化数据
3. 检查浏览器控制台是否有错误

### 问题: 权限错误 (403)
**解决方案**:
1. 检查 Collection 权限设置
2. 确认用户是否在 Admin 团队中
3. 检查 VITE_APPWRITE_ADMIN_TEAM_ID 环境变量

### 问题: 删除分类后商品丢失
**解释**: 商品没有丢失，而是被归类为"未分类"
**查看**: 点击"未分类"按钮查看这些商品

## 📈 未来扩展

可能的增强功能：
- [ ] 支持拖拽排序标签
- [ ] 批量导入/导出标签
- [ ] 标签使用统计（显示每个分类下的商品数量）
- [ ] 标签颜色自定义
- [ ] 标签图标/emoji支持

## 🎯 数据流程图

```
┌─────────────┐
│ Appwrite DB │
│   (tags)    │
└──────┬──────┘
       │
       ├─ Read ────► useTags Hook ────► Shop.tsx
       │                                   │
       │                                   ├─► Category Buttons
       │                                   └─► IP Sidebar
       │
       ├─ Create ──┐
       │           │
       └─ Delete ──┴─► Admin Actions ──► TagManager.tsx
                           │
                           └─► Update Products (删除时)
```

## 📝 注意事项

1. **"全部"和"未分类"**: 这两个特殊选项不存在于数据库中，而是代码中硬编码的
2. **删除操作不可逆**: 删除标签后无法恢复
3. **初始化会清空数据**: `npm run init-tags` 会删除现有标签
4. **需要 API Key**: 初始化脚本需要 API Key 才能运行
