/**
 * 检查所有集合的权限配置
 */

import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT!;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID!;

const collections = {
  users: process.env.VITE_APPWRITE_USERS_COLLECTION_ID!,
  products: process.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID!,
  orders: process.env.VITE_APPWRITE_ORDERS_COLLECTION_ID!,
  order_items: process.env.VITE_APPWRITE_ORDER_ITEMS_COLLECTION_ID!,
  addresses: process.env.VITE_APPWRITE_ADDRESSES_COLLECTION_ID!,
  cart_items: process.env.VITE_APPWRITE_CART_ITEMS_COLLECTION_ID!,
  tags: process.env.VITE_APPWRITE_TAGS_COLLECTION_ID!,
};

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function checkAllPermissions() {
  console.log('🔍 检查所有集合权限配置...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results: any = {};

  for (const [name, id] of Object.entries(collections)) {
    try {
      const collection = await databases.getCollection(databaseId, id);
      const permissions = collection.$permissions || [];
      
      const hasUsersRead = permissions.some((p: string) => 
        p.includes('read') && p.includes('users')
      );
      const hasUsersCreate = permissions.some((p: string) => 
        p.includes('create') && p.includes('users')
      );
      const hasUsersUpdate = permissions.some((p: string) => 
        p.includes('update') && p.includes('users')
      );
      const hasUsersDelete = permissions.some((p: string) => 
        p.includes('delete') && p.includes('users')
      );

      results[name] = {
        read: hasUsersRead,
        create: hasUsersCreate,
        update: hasUsersUpdate,
        delete: hasUsersDelete,
        permissions: permissions,
        documentSecurity: collection.documentSecurity
      };

      console.log(`📦 ${name.toUpperCase()} 集合`);
      console.log(`   文档安全: ${collection.documentSecurity ? '✅ 启用' : '❌ 禁用'}`);
      console.log(`   Read (users):   ${hasUsersRead ? '✅' : '❌'}`);
      console.log(`   Create (users): ${hasUsersCreate ? '✅' : '❌'}`);
      console.log(`   Update (users): ${hasUsersUpdate ? '✅' : '❌'}`);
      console.log(`   Delete (users): ${hasUsersDelete ? '✅' : '❌'}`);
      console.log('');

    } catch (error: any) {
      console.log(`❌ ${name}: 检查失败 - ${error.message}\n`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 权限分析报告\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const needsRead: string[] = [];
  const needsCreate: string[] = [];

  Object.entries(results).forEach(([name, perms]: [string, any]) => {
    if (!perms.read) needsRead.push(name);
    if (!perms.create && !['products', 'tags'].includes(name)) {
      needsCreate.push(name);
    }
  });

  if (needsRead.length > 0) {
    console.log('⚠️  以下集合缺少 Read (users) 权限：');
    needsRead.forEach(name => {
      console.log(`   ❌ ${name}`);
    });
    console.log('');
    console.log('💡 影响：用户无法查看自己的数据（如订单、地址等）\n');
  }

  if (needsCreate.length > 0) {
    console.log('⚠️  以下集合缺少 Create (users) 权限：');
    needsCreate.forEach(name => {
      console.log(`   ❌ ${name}`);
    });
    console.log('');
    console.log('💡 影响：用户无法创建数据\n');
  }

  if (needsRead.length === 0 && needsCreate.length === 0) {
    console.log('✅ 所有关键权限配置正确！\n');
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔧 修复建议\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('访问以下链接添加权限：\n');
    
    needsRead.forEach(name => {
      const collectionId = collections[name as keyof typeof collections];
      console.log(`${name.toUpperCase()}:`);
      console.log(`https://cloud.appwrite.io/console/project-${projectId}/databases/${databaseId}/collection-${collectionId}/settings`);
      console.log('  → Settings → Permissions → Add Role');
      console.log('  → Permission: Read, Role: users (Any authenticated user)');
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  // 推荐的权限配置
  console.log('📋 推荐的权限配置：\n');
  console.log('users:       Read ✓  Create ✓  Update ❌  Delete ❌  (用户只读自己)');
  console.log('products:    Read ✓  Create ❌  Update ❌  Delete ❌  (公开只读)');
  console.log('orders:      Read ✓  Create ✓  Update ❌  Delete ❌  (用户创建后只读)');
  console.log('order_items: Read ✓  Create ✓  Update ❌  Delete ❌  (订单明细只读)');
  console.log('addresses:   Read ✓  Create ✓  Update ✓  Delete ✓  (用户完全控制)');
  console.log('cart_items:  Read ✓  Create ✓  Update ✓  Delete ✓  (购物车完全控制)');
  console.log('tags:        Read ✓  Create ❌  Update ❌  Delete ❌  (公开只读)');
  console.log('');
  console.log('⚠️  注意：文档安全性(Document Security)应该启用，配合文档级权限使用\n');
}

checkAllPermissions();
