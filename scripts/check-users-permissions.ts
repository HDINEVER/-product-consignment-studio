/**
 * 检查 users 集合权限
 */

import { Client, Databases } from 'node-appwrite';
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

const databases = new Databases(client);

async function checkUsersCollectionPermissions() {
  console.log('🔍 检查 users 集合权限...\n');

  try {
    const collection = await databases.getCollection(databaseId, usersCollectionId);
    
    console.log('📋 users 集合信息:');
    console.log(`  ID: ${collection.$id}`);
    console.log(`  名称: ${collection.name}`);
    console.log(`  文档安全性: ${collection.documentSecurity ? '✅ 启用' : '❌ 禁用'}`);
    console.log('');
    
    console.log('🔐 集合级别权限:');
    const permissions = collection.$permissions || [];
    if (permissions.length === 0) {
      console.log('  ⚠️  没有配置任何权限！\n');
    } else {
      permissions.forEach((perm: string) => {
        console.log(`  - ${perm}`);
      });
      console.log('');
    }

    // 分析权限
    const hasUsersRead = permissions.some((p: string) => 
      p.includes('read') && p.includes('users')
    );
    const hasUsersCreate = permissions.some((p: string) => 
      p.includes('create') && p.includes('users')
    );

    console.log('📊 权限分析:');
    console.log(`  Read (users): ${hasUsersRead ? '✅ 有' : '❌ 缺失'}`);
    console.log(`  Create (users): ${hasUsersCreate ? '✅ 有' : '❌ 缺失'}`);
    console.log('');

    if (!hasUsersRead) {
      console.log('❌ 问题：users 集合缺少 read("users") 权限！');
      console.log('');
      console.log('💡 解决方案：');
      console.log('1. 打开 Appwrite Console');
      console.log(`2. 访问: https://cloud.appwrite.io/console/project-${projectId}/databases/${databaseId}/collection-${usersCollectionId}/settings`);
      console.log('3. 点击 Settings → Permissions');
      console.log('4. 在 Collection Permissions 中添加：');
      console.log('   ✅ Read: Role: users (Any authenticated user)');
      console.log('   ✅ Create: Role: users');
      console.log('');
      console.log('⚠️  这样所有登录用户才能读取用户信息！\n');
    } else {
      console.log('✅ users 集合权限配置正确！\n');
    }

  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkUsersCollectionPermissions();
