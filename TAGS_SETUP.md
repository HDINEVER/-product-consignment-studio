# Tags Collection 设置指南

## 1. 在 Appwrite Console 创建 Tags Collection

1. 访问 Appwrite Console: https://cloud.appwrite.io/
2. 进入项目 `hdinever0428`
3. 进入数据库 `product_consignment_db`
4. 点击 **Create Collection**
5. 输入以下信息：
   - **Collection ID**: `tags`
   - **Collection Name**: `Tags`

## 2. 创建属性 (Attributes)

为 `tags` collection 创建以下属性：

### 2.1 type (类型: category | ip)
- **Attribute Key**: `type`
- **Type**: String
- **Size**: 50
- **Required**: Yes
- **Array**: No

### 2.2 name (标签名称)
- **Attribute Key**: `name`
- **Type**: String
- **Size**: 100
- **Required**: Yes
- **Array**: No

### 2.3 order (排序顺序)
- **Attribute Key**: `order`
- **Type**: Integer
- **Min**: 0
- **Max**: 10000
- **Required**: No
- **Default**: 0

## 3. 设置权限 (Permissions)

在 **Settings > Permissions** 中设置：

### Read Access (读取权限)
- ✅ **Any** (所有人可读)

### Create Access (创建权限)
- ✅ **Team: Admins** (仅管理员团队可创建)

### Update Access (更新权限)
- ✅ **Team: Admins** (仅管理员团队可更新)

### Delete Access (删除权限)
- ✅ **Team: Admins** (仅管理员团队可删除)

## 4. 创建索引 (Indexes) - 可选但推荐

为了优化查询性能，创建以下索引：

### 索引 1: type_index
- **Type**: Key
- **Attributes**: `type` (ASC)

### 索引 2: order_index
- **Type**: Key
- **Attributes**: `order` (ASC)

## 5. 初始化数据

### 方法1: 手动添加 (推荐)

在 Appwrite Console 中手动添加初始标签：

#### 分类标签 (Categories)
点击 "Add Document"，依次添加：
```json
{ "type": "category", "name": "纸制品", "order": 1 }
{ "type": "category", "name": "3D打印制品", "order": 2 }
{ "type": "category", "name": "角色手办定制", "order": 3 }
{ "type": "category", "name": "吧唧制品", "order": 4 }
{ "type": "category", "name": "雪弗板定制", "order": 5 }
{ "type": "category", "name": "Cos道具/3D代打", "order": 6 }
```

#### IP标签 (IPs)
```json
{ "type": "ip", "name": "原神", "order": 1 }
{ "type": "ip", "name": "崩坏：星穹铁道", "order": 2 }
{ "type": "ip", "name": "初音未来", "order": 3 }
{ "type": "ip", "name": "明日方舟", "order": 4 }
{ "type": "ip", "name": "排球少年", "order": 5 }
{ "type": "ip", "name": "蓝色监狱", "order": 6 }
{ "type": "ip", "name": "原创/其他", "order": 7 }
```

### 方法2: 使用脚本 (需要服务端SDK)
```bash
npm run init-tags
```

注意：目前项目使用浏览器端SDK，脚本方法暂不可用。推荐使用方法1手动添加。

## 6. 验证设置

访问主页面，确认：
- ✅ 分类标签正确显示
- ✅ IP标签正确显示
- ✅ 管理员可以看到"编辑"按钮
- ✅ 管理员可以添加/删除标签

## 数据结构示例

```json
{
  "$id": "unique_id_1",
  "type": "category",
  "name": "纸制品",
  "order": 1
}
```

```json
{
  "$id": "unique_id_2",
  "type": "ip",
  "name": "原神",
  "order": 1
}
```

## 注意事项

⚠️ **删除标签时**，该标签下的所有商品会自动归类为"未分类"

⚠️ **"全部"和"未分类"** 选项是代码中内置的，无需在数据库中创建
