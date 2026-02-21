/**
 * 测试订单创建
 * 
 * 用途：直接测试创建订单，诊断字段问题
 * 运行：npx tsx scripts/test-order-creation.ts
 */

import { Client, Databases, ID } from 'node-appwrite';
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

async function testOrderCreation() {
  console.log('🔬 测试订单创建...\n');

  try {
    // 1. 获取集合的字段配置
    console.log('📋 获取 orders 集合字段配置...');
    const ordersCollection = await databases.getCollection(databaseId, ordersCollectionId);
    console.log('\norders 集合字段:');
    ordersCollection.attributes.forEach((attr: any) => {
      console.log(`  - ${attr.key}: ${attr.type}${attr.required ? ' (必填)' : ''}`);
    });

    console.log('\n📋 获取 order_items 集合字段配置...');
    const orderItemsCollection = await databases.getCollection(databaseId, orderItemsCollectionId);
    console.log('\norder_items 集合字段:');
    orderItemsCollection.attributes.forEach((attr: any) => {
      console.log(`  - ${attr.key}: ${attr.type}${attr.required ? ' (必填)' : ''}`);
    });

    // 2. 测试创建订单
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 尝试创建测试订单...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const testOrderData = {
      orderId: `TEST-${Date.now()}`,
      userId: 'test-user-id',
      status: 'pending',
      totalAmount: 99.99,
      paymentMethod: 'wechat',
      remark: '测试订单',
      shippingContactName: '测试用户',
      shippingContactPhone: '13800138000',
      shippingFullAddress: '测试省 测试市 测试区 测试街道 测试详细地址',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('测试订单数据:', JSON.stringify(testOrderData, null, 2));
    console.log('\n尝试创建...');

    const testOrder = await databases.createDocument(
      databaseId,
      ordersCollectionId,
      ID.unique(),
      testOrderData
    );

    console.log('\n✅ 订单创建成功！');
    console.log('订单 ID:', testOrder.$id);
    console.log('订单号:', testOrder.orderId);

    // 3. 测试创建订单项
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 尝试创建测试订单项...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const testItemData = {
      orderId: testOrder.$id,
      productId: 'test-product-id',
      productName: '测试商品',
      productImage: 'https://example.com/test.jpg',
      variantName: '默认规格',
      price: 99.99,
      quantity: 1,
      createdAt: new Date().toISOString(),
    };

    console.log('测试订单项数据:', JSON.stringify(testItemData, null, 2));
    console.log('\n尝试创建...');

    const testItem = await databases.createDocument(
      databaseId,
      orderItemsCollectionId,
      ID.unique(),
      testItemData
    );

    console.log('\n✅ 订单项创建成功！');
    console.log('订单项 ID:', testItem.$id);

    // 4. 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await databases.deleteDocument(databaseId, orderItemsCollectionId, testItem.$id);
    await databases.deleteDocument(databaseId, ordersCollectionId, testOrder.$id);
    console.log('✅ 测试数据已清理\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 测试成功！集合配置正常');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 如果前端仍然无法创建订单，请检查：');
    console.log('1. 浏览器控制台的详细错误信息');
    console.log('2. 用户是否正确登录（user.$id 不能为空）');
    console.log('3. cartItems 数据结构是否正确');
    console.log('4. 所有字段类型是否匹配\n');

  } catch (error: any) {
    console.error('\n❌ 测试失败！');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误代码:', error.code);
    
    if (error.response) {
      console.error('\n完整错误响应:');
      console.error(JSON.stringify(error.response, null, 2));
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 常见错误解决方案：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (error.code === 400) {
      console.log('⚠️  400 错误 - 字段验证失败');
      console.log('可能原因：');
      console.log('  1. 字段类型不匹配（例如：totalAmount 必须是 double，不能是 string）');
      console.log('  2. 必填字段缺失');
      console.log('  3. 字段名称拼写错误（检查大小写）\n');
      console.log('建议：对比上面显示的集合字段配置，确保所有字段匹配\n');
    } else if (error.code === 401) {
      console.log('⚠️  401 错误 - 认证失败');
      console.log('检查 APPWRITE_API_KEY 是否正确\n');
    } else if (error.code === 404) {
      console.log('⚠️  404 错误 - 集合不存在');
      console.log('检查 .env.local 中的 COLLECTION_ID 是否正确\n');
    }

    process.exit(1);
  }
}

// 运行测试
testOrderCreation();
