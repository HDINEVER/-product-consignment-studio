/**
 * Appwrite 连接测试组件
 * 用于验证 Appwrite 配置是否正确
 */
import React, { useState, useEffect } from 'react';
import { account } from '../lib/appwrite';

const AppwriteTest: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('正在测试 Appwrite 连接...');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('loading');
      setMessage('正在连接 Appwrite...');

      // 测试 1: 尝试获取账号信息（如果未登录会返回 401，但说明连接成功）
      try {
        const user = await account.get();
        setStatus('success');
        setMessage('✅ Appwrite 连接成功！你已登录');
        setDetails({
          userId: user.$id,
          email: user.email,
          name: user.name,
        });
      } catch (error: any) {
        // 401 错误是正常的（表示未登录，但连接成功）
        if (error.code === 401) {
          setStatus('success');
          setMessage('✅ Appwrite 连接成功！（未登录状态）');
          setDetails({
            endpoint: 'https://sgp.cloud.appwrite.io/v1',
            projectId: 'hdinever0428',
            note: '连接正常，可以注册或登录',
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      setStatus('error');
      setMessage('❌ Appwrite 连接失败');
      setDetails({
        error: error.message || '未知错误',
        code: error.code,
        type: error.type,
      });
      console.error('Appwrite 连接测试失败：', error);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: status === 'success' ? '#d4edda' : status === 'error' ? '#f8d7da' : '#fff3cd',
      border: `2px solid ${status === 'success' ? '#28a745' : status === 'error' ? '#dc3545' : '#ffc107'}`,
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '400px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 9999,
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
        🔍 Appwrite 连接测试
      </h3>
      
      <p style={{ margin: '10px 0', fontSize: '14px' }}>
        {message}
      </p>

      {details && (
        <div style={{
          background: 'rgba(0,0,0,0.05)',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px',
          marginTop: '10px',
        }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}

      <button
        onClick={testConnection}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        🔄 重新测试
      </button>

      {status === 'success' && (
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#155724' }}>
          <p style={{ margin: '5px 0' }}><strong>✅ 配置正确！</strong></p>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>Appwrite SDK 已正确配置</li>
            <li>可以进行注册/登录操作</li>
            <li>可以使用所有 Appwrite 功能</li>
          </ul>
        </div>
      )}

      {status === 'error' && (
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#721c24' }}>
          <p style={{ margin: '5px 0' }}><strong>❌ 需要检查：</strong></p>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>检查 .env.local 配置</li>
            <li>确认 Appwrite 项目 ID 正确</li>
            <li>确认网络连接正常</li>
            <li>在 Appwrite 控制台添加 localhost:5173 平台</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AppwriteTest;

**索引：**
- `user_id`
- `order_number`（唯一索引）
- `status`
- `created_at`

---

##### **5. order_items 集合**

| 字段名 | 类型 | 大小 | 必填 | 说明 |
|--------|------|------|------|------|
| order_id | String | 50 | ✅ | 订单 ID |
| product_id | String | 50 | ✅ | 商品 ID |
| quantity | Integer | - | ✅ | 数量 |
| price | Float | - | ✅ | 单价 |
| subtotal | Float | - | ✅ | 小计 |

**权限设置：**
- Read: Same as parent order
- Create: Administrators only
- Update: Administrators only
- Delete: Administrators only

**索引：**
- `order_id`
- `product_id`

---

##### **6. addresses 集合**

| 字段名 | 类型 | 大小 | 必填 | 说明 |
|--------|------|------|------|------|
| user_id | String | 50 | ✅ | 用户 ID |
| contact_name | String | 100 | ✅ | 联系人 |
| contact_phone | String | 20 | ✅ | 联系电话 |
| province | String | 50 | ✅ | 省份 |
| city | String | 50 | ✅ | 城市 |
| district | String | 50 | ✅ | 区/县 |
| address | String | 200 | ✅ | 详细地址 |
| zipcode | String | 10 | ❌ | 邮编 |
| is_default | Boolean | - | ❌ | 是否默认 |
| created_at | String | 50 | ✅ | 创建时间 |

**权限设置：**
- Read: `user(user_id)`
- Create: `user(user_id)`
- Update: `user(user_id)`
- Delete: `user(user_id)`

**索引：**
- `user_id`

---

### 4. 创建 Storage Bucket（商品图片存储）

1. 在 Appwrite 控制台，进入 "Storage"
2. 点击 "Create Bucket"
3. 命名为 `product-images`
4. 复制 Bucket ID 到 `.env.local` 的 `VITE_APPWRITE_STORAGE_BUCKET_ID`
5. 设置权限：
   - Read: All users
   - Create: Administrators only
   - Update: Administrators only
   - Delete: Administrators only

### 5. 配置认证（Authentication）

1. 在 Appwrite 控制台，进入 "Auth"
2. 启用以下认证方法：
   - Email/Password（必须）
   - Google OAuth（可选）
   - GitHub OAuth（可选）

### 6. 安装依赖并运行

```bash
# 安装依赖（会安装 appwrite SDK）
npm install

# 启动开发服务器
npm run dev
```

## 📚 数据库架构说明

### 订单状态流转

```
pending（待处理）
  ↓
processing（处理中）
  ↓
shipped（已发货）
  ↓
completed（已完成）

可以随时：
  ↓
cancelled（已取消）
```

### 支付状态

- `unpaid` - 未支付
- `paid` - 已支付
- `refunded` - 已退款

### 用户角色

- `user` - 普通用户
- `admin` - 管理员

## 🔒 权限管理

Appwrite 使用基于角色的访问控制（RBAC）：

1. **普通用户**：
   - 可以查看所有商品
   - 只能管理自己的购物车、订单、地址
   - 可以创建订单

2. **管理员**：
   - 可以管理所有商品
   - 可以查看和管理所有订单
   - 可以查看所有用户信息

## 🎯 下一步

1. 在 Appwrite 控制台创建第一个管理员账号
2. 手动在 `users` 集合中将该用户的 `role` 设置为 `admin`
3. 使用管理员账号登录并添加商品
4. 测试完整的购物流程

## 📖 相关文档

- [Appwrite 官方文档](https://appwrite.io/docs)
- [Appwrite React SDK](https://appwrite.io/docs/sdks#client)
- [Appwrite Database 文档](https://appwrite.io/docs/products/databases)
- [Appwrite Storage 文档](https://appwrite.io/docs/products/storage)

## 🆘 常见问题

### Q: 如何创建管理员账号？

A: 
1. 先通过前端注册一个普通账号
2. 在 Appwrite 控制台的 `users` 集合中找到该用户
3. 编辑该用户，将 `role` 字段改为 `admin`

### Q: 图片上传失败？

A: 检查 Storage Bucket 的权限设置，确保管理员有创建文件的权限。

### Q: 查询商品时返回空？

A: 检查 `products` 集合的读取权限是否设置为 "All users"。

## 🎨 项目结构

```
/
├── lib/
│   └── appwrite.ts          # Appwrite SDK 配置
├── utils/
│   └── api.ts               # API 封装（使用 Appwrite SDK）
├── components/              # React 组件
├── contexts/                # React Context
└── .env.local              # 环境变量配置
```
