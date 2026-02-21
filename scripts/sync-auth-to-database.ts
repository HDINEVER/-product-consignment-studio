/**
 * 同步 Auth Users 到 Database Users
 * 
 * 用途：修复 Auth Users 存在但 Database Users 缺失的情况
 * 运行：npx tsx scripts/sync-auth-to-database.ts
 */

import { Client, Users, Databases, Query } from 'node-appwrite';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 配置
const endpoint = process.env.VITE_APPWRITE_ENDPOINT!;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID!;
const usersCollectionId = process.env.VITE_APPWRITE_USERS_COLLECTION_ID!;

if (!apiKey) {
  console.error('❌ 缺少 APPWRITE_API_KEY 环境变量');
  console.error('请在 .env.local 中添加：APPWRITE_API_KEY=你的API密钥');
  console.error('在 Appwrite Console → Settings → API Keys 创建');
  process.exit(1);
}

// 初始化客户端（需要 API Key 才能访问 Users API）
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const users = new Users(client);
const databases = new Databases(client);

async function syncUsers() {
  console.log('🔄 开始同步 Auth Users 到 Database Users...\n');

  try {
    // 1. 获取所有 Auth Users
    console.log('📋 获取 Auth Users...');
    const authUsers = await users.list();
    console.log(`✅ 找到 ${authUsers.total} 个 Auth Users\n`);

    // 2. 获取所有 Database Users
    console.log('📋 获取 Database Users...');
    const dbUsers = await databases.listDocuments(databaseId, usersCollectionId);
    const dbUserIds = new Set(dbUsers.documents.map(doc => doc.$id));
    console.log(`✅ 找到 ${dbUsers.total} 个 Database Users\n`);

    // 3. 找出缺失的用户
    const missingUsers = authUsers.users.filter(user => !dbUserIds.has(user.$id));
    
    if (missingUsers.length === 0) {
      console.log('✅ 所有用户已同步，无需操作！\n');
      return;
    }

    console.log(`🔍 发现 ${missingUsers.length} 个用户需要同步：`);
    missingUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) [ID: ${user.$id}]`);
    });
    console.log('');

    // 4. 同步缺失的用户
    let successCount = 0;
    let failCount = 0;

    for (const user of missingUsers) {
      try {
        console.log(`📝 同步用户: ${user.name} (${user.email})`);
        
        await databases.createDocument(
          databaseId,
          usersCollectionId,
          user.$id, // 使用相同的 ID
          {
            email: user.email,
            name: user.name,
            phone: user.phone || '',
            role: 'user', // 默认角色
            createdAt: user.$createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          // 不指定权限参数，使用集合的默认权限配置
        );
        
        console.log(`  ✅ 同步成功\n`);
        successCount++;
      } catch (error: any) {
        console.error(`  ❌ 同步失败: ${error.message}\n`);
        failCount++;
      }
    }

    // 5. 输出结果
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 同步结果：');
    console.log(`  ✅ 成功: ${successCount} 个`);
    if (failCount > 0) {
      console.log(`  ❌ 失败: ${failCount} 个`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 6. 验证
    console.log('🔍 验证同步结果...');
    const updatedDbUsers = await databases.listDocuments(databaseId, usersCollectionId);
    console.log(`✅ Database Users 数量: ${authUsers.total} (Auth) = ${updatedDbUsers.total} (Database)\n`);

    if (authUsers.total === updatedDbUsers.total) {
      console.log('🎉 所有用户已完全同步！\n');
    } else {
      console.log('⚠️  数量不匹配，可能有部分用户同步失败\n');
    }

  } catch (error: any) {
    console.error('❌ 同步过程出错:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 运行同步
syncUsers();
