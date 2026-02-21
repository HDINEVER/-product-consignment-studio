/**
 * 检查 Appwrite 集合权限配置
 * 
 * 用途：诊断 orders 和 order_items 集合权限问题
 * 运行：npx tsx scripts/check-permissions.ts
 */

import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 配置
const endpoint = process.env.VITE_APPWRITE_ENDPOINT!;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID!;
const ordersCollectionId = process.env.VITE_APPWRITE_ORDERS_COLLECTION_ID!;
const orderItemsCollectionId = process.env.VITE_APPWRITE_ORDER_ITEMS_COLLECTION_ID!;

if (!apiKey) {
  console.error('❌ 缺少 APPWRITE_API_KEY 环境变量');
  process.exit(1);
}

// 初始化客户端
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function checkPermissions() {
  console.log('🔍 检查 Appwrite 集合权限配置...\n');

  try {
    // 检查 orders 集合
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 检查 orders 集合');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const ordersCollection = await databases.getCollection(databaseId, ordersCollectionId);
    console.log('集合 ID:', ordersCollection.$id);
    console.log('集合名称:', ordersCollection.name);
    console.log('权限配置:', JSON.stringify(ordersCollection.$permissions, null, 2));
    console.log('文档安全性:', ordersCollection.documentSecurity ? '✅ 启用（推荐）' : '❌ 禁用');
    console.log('');

    // 检查 order_items 集合
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 检查 order_items 集合');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const orderItemsCollection = await databases.getCollection(databaseId, orderItemsCollectionId);
    console.log('集合 ID:', orderItemsCollection.$id);
    console.log('集合名称:', orderItemsCollection.name);
    console.log('权限配置:', JSON.stringify(orderItemsCollection.$permissions, null, 2));
    console.log('文档安全性:', orderItemsCollection.documentSecurity ? '✅ 启用（推荐）' : '❌ 禁用');
    console.log('');

    // 分析权限
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 权限分析');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 检查 orders 权限
    const ordersPerms = ordersCollection.$permissions || [];
    const hasOrdersCreate = ordersPerms.some((p: string) => 
      p.includes('create') && (p.includes('users') || p.includes('any'))
    );
    const hasOrdersRead = ordersPerms.some((p: string) => 
      p.includes('read') && (p.includes('users') || p.includes('any'))
    );

    console.log('orders 集合:');
    console.log('  - Create 权限:', hasOrdersCreate ? '✅ 有' : '❌ 缺失 (需要添加 users 角色)');
    console.log('  - Read 权限:', hasOrdersRead ? '✅ 有' : '❌ 缺失');
    console.log('');

    // 检查 order_items 权限
    const itemsPerms = orderItemsCollection.$permissions || [];
    const hasItemsCreate = itemsPerms.some((p: string) => 
      p.includes('create') && (p.includes('users') || p.includes('any'))
    );
    const hasItemsRead = itemsPerms.some((p: string) => 
      p.includes('read') && (p.includes('users') || p.includes('any'))
    );

    console.log('order_items 集合:');
    console.log('  - Create 权限:', hasItemsCreate ? '✅ 有' : '❌ 缺失 (需要添加 users 角色)');
    console.log('  - Read 权限:', hasItemsRead ? '✅ 有' : '❌ 缺失');
    console.log('');

    // 建议
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 修复建议');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!hasOrdersCreate || !hasItemsCreate) {
      console.log('⚠️  检测到权限缺失！\n');
      console.log('请在 Appwrite Console 中配置以下权限：\n');
      
      if (!hasOrdersCreate) {
        console.log('1️⃣ orders 集合权限设置：');
        console.log('   URL: https://cloud.appwrite.io/console/project-' + projectId + '/databases/' + databaseId + '/collection-' + ordersCollectionId + '/settings');
        console.log('   Settings → Permissions → Collection Permissions');
        console.log('   添加权限：');
        console.log('   ✅ Create: Role: users (Any authenticated user)');
        console.log('   ✅ Read: Role: users');
        console.log('');
      }

      if (!hasItemsCreate) {
        console.log('2️⃣ order_items 集合权限设置：');
        console.log('   URL: https://cloud.appwrite.io/console/project-' + projectId + '/databases/' + databaseId + '/collection-' + orderItemsCollectionId + '/settings');
        console.log('   Settings → Permissions → Collection Permissions');
        console.log('   添加权限：');
        console.log('   ✅ Create: Role: users (Any authenticated user)');
        console.log('   ✅ Read: Role: users');
        console.log('');
      }

      console.log('⚡ 或者使用自动修复脚本（开发中）\n');
    } else {
      console.log('✅ 权限配置正确！\n');
      console.log('如果仍然无法创建订单，请检查：');
      console.log('1. 用户是否已登录（检查浏览器控制台 user.$id）');
      console.log('2. 字段类型是否匹配（特别是 totalAmount 必须是 number）');
      console.log('3. 必填字段是否都有值');
      console.log('4. 浏览器控制台的详细错误信息\n');
    }

  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 运行检查
checkPermissions();
