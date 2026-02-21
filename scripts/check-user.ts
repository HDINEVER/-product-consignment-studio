/**
 * 检查特定用户是否存在
 */

import { Client, Users, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT!;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID!;
const usersCollectionId = process.env.VITE_APPWRITE_USERS_COLLECTION_ID!;

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const users = new Users(client);
const databases = new Databases(client);

async function checkUser() {
  const userId = '6999356d003b0fa70810';
  
  console.log(`🔍 检查用户 ${userId}...\n`);

  // 检查 Auth
  try {
    const authUser = await users.get(userId);
    console.log('✅ Auth 用户存在:');
    console.log(`  - ID: ${authUser.$id}`);
    console.log(`  - 名称: ${authUser.name}`);
    console.log(`  - 邮箱: ${authUser.email}`);
    console.log('');
  } catch (err: any) {
    console.log('❌ Auth 用户不存在');
    console.log(`  错误: ${err.message}\n`);
    return;
  }

  // 检查 Database
  try {
    const dbUser = await databases.getDocument(databaseId, usersCollectionId, userId);
    console.log('✅ Database 用户存在:');
    console.log(`  - ID: ${dbUser.$id}`);
    console.log(`  - 名称: ${dbUser.name}`);
    console.log(`  - 邮箱: ${dbUser.email}`);
    console.log('');
  } catch (err: any) {
    console.log('❌ Database 用户不存在');
    console.log(`  错误: ${err.message}\n`);
    
    // 尝试创建
    console.log('🔧 尝试创建 Database 用户文档...');
    try {
      const authUser = await users.get(userId);
      await databases.createDocument(
        databaseId,
        usersCollectionId,
        userId,
        {
          email: authUser.email,
          name: authUser.name,
          phone: authUser.phone || '',
          role: 'user',
          createdAt: authUser.$createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      console.log('✅ 创建成功！\n');
    } catch (createErr: any) {
      console.log(`❌ 创建失败: ${createErr.message}\n`);
    }
  }
}

checkUser();
