/**
 * 图片显示问题诊断脚本
 * 运行：npx tsx diagnose-images.ts
 */
import { Client, Storage, Databases, Query } from 'appwrite';

// 从环境变量加载配置
const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || 'hdinever0428';
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'product_consignment_db';
const productsCollectionId = process.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || 'products';
const storageBucketId = process.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'product-images';

console.log('🔍 开始诊断图片显示问题...\n');

console.log('📋 配置信息:');
console.log('  Endpoint:', endpoint);
console.log('  Project ID:', projectId);
console.log('  Database ID:', databaseId);
console.log('  Products Collection:', productsCollectionId);
console.log('  Storage Bucket:', storageBucketId);
console.log('');

// 初始化客户端
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

const storage = new Storage(client);
const databases = new Databases(client);

async function diagnose() {
  try {
    // 1. 检查是否能连接到 Appwrite
    console.log('1️⃣ 测试 Appwrite 连接...');
    try {
      // 尝试列出文件来验证连接
      await storage.listFiles(storageBucketId, [Query.limit(1)]);
      console.log('   ✅ Appwrite 连接成功\n');
    } catch (error: any) {
      console.error('   ❌ Appwrite 连接失败:', error.message);
      console.error('   请检查 .env.local 中的配置是否正确\n');
      return;
    }

    // 2. 检查 Storage Bucket
    console.log('2️⃣ 检查 Storage Bucket...');
    try {
      const files = await storage.listFiles(storageBucketId);
      console.log(`   ✅ Storage Bucket 存在，共有 ${files.total} 个文件\n`);
      
      if (files.total > 0) {
        console.log('   📁 文件列表:');
        files.files.slice(0, 3).forEach((file, idx) => {
          console.log(`      ${idx + 1}. ${file.name} (ID: ${file.$id})`);
        });
        console.log('');
        
        // 3. 测试图片 URL 生成
        console.log('3️⃣ 测试图片 URL 生成...');
        const testFile = files.files[0];
        
        // 使用 getFileView
        const viewUrl = storage.getFileView(storageBucketId, testFile.$id);
        console.log('   📸 使用 getFileView():');
        console.log('      ' + viewUrl.toString());
        console.log('');
        
        // 使用 getFilePreview
        const previewUrl = storage.getFilePreview(
          storageBucketId,
          testFile.$id,
          800,
          800,
          'center',
          100
        );
        console.log('   📸 使用 getFilePreview():');
        console.log('      ' + previewUrl.toString());
        console.log('');
        
        // 4. 检查权限
        console.log('4️⃣ 检查文件权限...');
        try {
          const fileDetails = await storage.getFile(storageBucketId, testFile.$id);
          console.log('   文件详细信息:');
          console.log('      名称:', fileDetails.name);
          console.log('      大小:', (fileDetails.sizeOriginal / 1024).toFixed(2), 'KB');
          console.log('      权限:', JSON.stringify(fileDetails.$permissions, null, 2));
          console.log('');
        } catch (error: any) {
          console.error('   ⚠️  无法获取文件详情:', error.message);
        }
      } else {
        console.log('   ⚠️  Storage Bucket 中没有文件');
        console.log('   请先上传一些商品图片\n');
      }
    } catch (error: any) {
      console.error('   ❌ 无法访问 Storage Bucket:', error.message);
      console.error('   可能原因:');
      console.error('      - Bucket ID 不正确');
      console.error('      - Bucket 不存在');
      console.error('      - 权限配置有误\n');
    }

    // 5. 检查产品数据
    console.log('5️⃣ 检查产品数据...');
    try {
      const products = await databases.listDocuments(
        databaseId,
        productsCollectionId,
        [Query.limit(3)]
      );
      
      console.log(`   ✅ 找到 ${products.total} 个产品\n`);
      
      if (products.documents.length > 0) {
        console.log('   📦 产品图片 URL 示例:');
        products.documents.forEach((product: any, idx) => {
          console.log(`      ${idx + 1}. ${product.title}`);
          console.log(`         图片: ${product.imageUrl || product.image || '未设置'}`);
        });
        console.log('');
      }
    } catch (error: any) {
      console.error('   ⚠️  无法读取产品数据:', error.message);
    }

    // 6. 提供修复建议
    console.log('\n' + '='.repeat(60));
    console.log('💡 修复建议:');
    console.log('='.repeat(60));
    console.log('');
    console.log('如果图片无法显示，请按以下步骤检查：');
    console.log('');
    console.log('1. 检查 Appwrite Storage Bucket 权限:');
    console.log('   - 访问: https://cloud.appwrite.io/console');
    console.log('   - 进入你的项目 → Storage → product-images');
    console.log('   - 点击 Settings → Permissions');
    console.log('   - 确保添加了以下权限:');
    console.log('      ✓ Read: Any');
    console.log('      ✓ Create: Users (或 Team:Admins)');
    console.log('      ✓ Delete: Users (或 Team:Admins)');
    console.log('');
    console.log('2. 检查图片 URL 格式:');
    console.log('   - 打开浏览器开发者工具 (F12)');
    console.log('   - 查看 Console 是否有 404 或 CORS 错误');
    console.log('   - 检查 Network 标签中的图片请求状态');
    console.log('');
    console.log('3. 检查 CORS 配置:');
    console.log('   - 在 Appwrite Console → Settings → Platforms');
    console.log('   - 确认添加了你的前端域名（如 localhost:5173）');
    console.log('');
    console.log('4. 重新生成图片 URL:');
    console.log('   - 如果之前图片 URL 格式不正确');
    console.log('   - 可以运行脚本重新生成所有图片的 URL');
    console.log('');
    
  } catch (error: any) {
    console.error('❌ 诊断过程出错:', error.message);
    console.error(error);
  }
}

diagnose();
