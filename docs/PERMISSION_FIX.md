# 🔐 注册权限问题修复

## ❌ 问题描述

用户注册时遇到错误：
```
Missing "create" permission for role "team:6996cdfd000d548e392d". 
Only ["any","guests"]" scopes are allowed and 
["users","team:6996cdfd000d548e392d"]" was given.
```

**原因：** 创建用户文档时没有指定权限参数，Appwrite 使用了错误的默认权限配置。

---

## ✅ 修复内容

### 修改的文件

1. **contexts/AuthContext.tsx** - `register` 函数
2. **utils/api.ts** - `authAPI.register` 函数

### 修复前（错误）

```typescript
await databases.createDocument(
  DATABASE_ID,
  COLLECTIONS.USERS,
  newUser.$id,
  {
    email: email,
    name: name,
    phone: '',
    role: 'user',
  }
  // ❌ 缺少权限参数！
);
```

### 修复后（正确）

```typescript
await databases.createDocument(
  DATABASE_ID,
  COLLECTIONS.USERS,
  newUser.$id,
  {
    email: email,
    name: name,
    phone: '',
    role: 'user',
  },
  [
    Permission.read(Role.user(newUser.$id)),    // ✅ 只有该用户自己可读
    Permission.update(Role.user(newUser.$id)),  // ✅ 只有该用户自己可更新
    Permission.delete(Role.user(newUser.$id)),  // ✅ 只有该用户自己可删除
  ]
);
```

---

## 🎯 权限说明

### 用户文档权限策略

- **读取权限**: `Permission.read(Role.user(userId))` - 只有用户自己可以读取
- **更新权限**: `Permission.update(Role.user(userId))` - 只有用户自己可以更新
- **删除权限**: `Permission.delete(Role.user(userId))` - 只有用户自己可以删除

### 为什么需要明确指定权限？

1. **安全性** - 防止其他用户访问敏感信息
2. **隐私保护** - 每个用户只能看到自己的数据
3. **Appwrite 要求** - 某些集合配置要求明确权限

---

## 🧪 测试验证

### 注册流程测试

```bash
# 1. 启动开发服务器
npm run dev

# 2. 打开浏览器访问 http://localhost:5173

# 3. 点击注册，填写信息：
#    - 姓名: test1
#    - 邮箱: test@example.com
#    - 密码: test1234

# 4. 提交注册
```

**预期结果：**
- ✅ 注册成功
- ✅ 自动登录
- ✅ 用户文档创建成功
- ✅ 不再出现权限错误

---

## 📋 相关权限配置

### 商品文档权限（对比）

```typescript
// 商品：所有人可读，只有管理员可编辑
[
  Permission.read('any'),                    // 所有人可读
  Permission.update(Role.team(ADMIN_TEAM_ID)), // 管理员可更新
  Permission.delete(Role.team(ADMIN_TEAM_ID)), // 管理员可删除
]
```

### 用户文档权限

```typescript
// 用户：只有自己可访问
[
  Permission.read(Role.user(userId)),    // 只有自己可读
  Permission.update(Role.user(userId)),  // 只有自己可更新
  Permission.delete(Role.user(userId)),  // 只有自己可删除
]
```

### 购物车权限

```typescript
// 购物车：只有自己可访问
[
  Permission.read(Role.user(userId)),    // 只有自己可读
  Permission.update(Role.user(userId)),  // 只有自己可更新
  Permission.delete(Role.user(userId)),  // 只有自己可删除
]
```

---

## 🔍 其他可能的权限错误

### 1. 集合级别权限未配置

**解决方案：** 在 Appwrite Console → Database → Collection → Settings → Permissions

确保配置了正确的集合级别权限：
- ✅ Create: `any` 或 `guests`（允许注册）
- ✅ Read: `any`（允许所有人读取商品）
- ✅ Update: `users`（允许已登录用户更新）
- ✅ Delete: `users`（允许已登录用户删除）

### 2. 文档级别权限冲突

**症状：** 创建文档成功，但无法读取

**解决方案：** 检查 `createDocument` 的权限参数是否正确

---

## ✅ 提交修复

```bash
git add .
git commit -m "fix: 修复注册时的权限配置问题"
git push
```

---

## 📖 参考文档

- [Appwrite Permissions](https://appwrite.io/docs/permissions)
- [Appwrite Roles](https://appwrite.io/docs/roles)
- [API_CALL_FIX.md](./API_CALL_FIX.md) - API 调用失败修复
