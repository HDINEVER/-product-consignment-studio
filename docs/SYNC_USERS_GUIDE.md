# 🔄 用户同步工具使用指南

## 问题描述

**症状：** Appwrite Auth Users 中有用户（如 test1），但 Database users 集合中没有对应记录。

**原因：** 注册时创建 Auth User 成功，但创建 Database User 失败（可能是权限配置问题导致）。

**影响：** 用户可以登录，但获取用户资料时会报错。

---

## 🛠️ 修复步骤

### 1️⃣ 确保有 API Key

如果还没有创建 API Key：

1. 打开 Appwrite Console
2. Settings → API Keys
3. 点击 **Create API key**
4. 名称：`sync-users-tool`
5. Scopes：
   - ✅ `users.read`（读取用户）
   - ✅ `databases.read`（读取数据库）
   - ✅ `databases.write`（写入数据库）
6. 复制生成的 API Key

### 2️⃣ 配置 API Key 到 .env.local

编辑 `.env.local` 文件，添加：

```bash
# API Key（用于管理脚本）
APPWRITE_API_KEY=你的API密钥
```

**注意：** 已有的环境变量保持不变，只需添加这一行。

### 3️⃣ 运行同步脚本

```bash
npm run sync-users
```

### 4️⃣ 查看输出

**正常输出：**
```
🔄 开始同步 Auth Users 到 Database Users...

📋 获取 Auth Users...
✅ 找到 2 个 Auth Users

📋 获取 Database Users...
✅ 找到 1 个 Database Users

🔍 发现 1 个用户需要同步：
  - test1 (hdinever2@gmail.com) [ID: 69992e760023db62d14f]

📝 同步用户: test1 (hdinever2@gmail.com)
  ✅ 同步成功

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 同步结果：
  ✅ 成功: 1 个
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 验证同步结果...
✅ Database Users 数量: 2 (Auth) = 2 (Database)

🎉 所有用户已完全同步！
```

---

## 🔍 验证修复

### 方法 1：Appwrite Console

1. **Auth → Users** - 记录数量（如 2 个）
2. **Databases → product_consignment_db → users** - 应该也是 2 个
3. 对比 User ID 是否一致

### 方法 2：登录测试

```bash
# 1. 启动开发服务器
npm run dev

# 2. 浏览器访问 http://localhost:5173

# 3. 使用 test1 账号登录
#    - 邮箱: hdinever2@gmail.com
#    - 密码: （你注册时设置的）

# 4. 检查是否报错
```

**预期结果：**
- ✅ 登录成功
- ✅ 可以看到用户信息
- ✅ 不再报错「找不到用户文档」

---

## 📊 脚本工作原理

```typescript
// 1. 获取所有 Auth Users
const authUsers = await users.list();

// 2. 获取所有 Database Users
const dbUsers = await databases.listDocuments(...);

// 3. 找出缺失的用户（在 Auth 中有，但在 Database 中没有）
const missingUsers = authUsers.filter(user => !dbUserIds.has(user.$id));

// 4. 为每个缺失的用户创建 Database 记录
for (const user of missingUsers) {
  await databases.createDocument(
    databaseId,
    usersCollectionId,
    user.$id,  // ✅ 使用相同的 ID
    {
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      role: 'user',
      createdAt: user.$createdAt,
      updatedAt: new Date().toISOString(),
    },
    [
      Permission.read(Role.user(user.$id)),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id)),
    ]
  );
}
```

---

## ⚠️ 常见问题

### Q1: 没有 API Key 怎么办？

**A:** 按照步骤 1 创建一个。**注意不要提交到 Git！**（`.env.local` 已在 `.gitignore` 中）

### Q2: 运行后还是不同步？

**A:** 检查输出的错误信息。常见原因：
- ❌ API Key 权限不足（需要 users.read + databases.write）
- ❌ Collection ID 配置错误
- ❌ 网络问题

### Q3: 可以重复运行吗？

**A:** 可以！脚本会自动检测已存在的用户，不会重复创建。

### Q4: 会影响现有数据吗？

**A:** 不会！脚本只会**添加**缺失的用户，不会修改或删除现有数据。

### Q5: 以后还会出现不同步的情况吗？

**A:** 不会！注册权限问题已修复（见 [PERMISSION_FIX.md](./PERMISSION_FIX.md)），新用户注册时会自动同步。

---

## 🔐 安全提示

### API Key 安全

- ✅ 只保存在本地 `.env.local`
- ✅ 不要提交到 Git
- ✅ 不要分享给他人
- ✅ 用完可以删除（在 Appwrite Console）

### 脚本安全

- ✅ 只读取 Auth Users
- ✅ 只在 Database Users 中添加记录
- ✅ 不会修改或删除现有数据
- ✅ 使用与注册相同的权限配置

---

## 📋 手动修复（备选方案）

如果不想用脚本，也可以手动创建：

1. 打开 Appwrite Console
2. Databases → product_consignment_db → users
3. 点击 **Create Document**
4. 填写字段：
   ```json
   {
     "$id": "69992e760023db62d14f",  // ← 从 Auth Users 复制
     "email": "hdinever2@gmail.com",
     "name": "test1",
     "phone": "",
     "role": "user",
     "createdAt": "2026-02-21T10:00:00.000Z",
     "updatedAt": "2026-02-21T10:00:00.000Z"
   }
   ```
5. Permissions：
   ```
   Read: user:69992e760023db62d14f
   Update: user:69992e760023db62d14f
   Delete: user:69992e760023db62d14f
   ```
6. Create

---

## ✅ 总结

| 步骤 | 操作 | 状态 |
|------|------|------|
| 1 | 创建 API Key | ⭐ |
| 2 | 配置到 .env.local | ⭐ |
| 3 | 运行 `npm run sync-users` | ⭐ |
| 4 | 验证同步结果 | ⭐ |
| 5 | 测试登录 | ⭐ |

**完成后：**
- ✅ Auth Users 和 Database Users 数据一致
- ✅ 所有用户可以正常登录
- ✅ 用户资料获取正常
- ✅ 不再出现找不到文档的错误

---

## 📚 相关文档

- [USER_SYSTEM_ARCHITECTURE.md](./USER_SYSTEM_ARCHITECTURE.md) - 用户系统架构说明
- [PERMISSION_FIX.md](./PERMISSION_FIX.md) - 注册权限问题修复
- [API_CALL_FIX.md](./API_CALL_FIX.md) - API 调用失败修复
