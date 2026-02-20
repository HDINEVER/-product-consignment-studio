/**
 * 修复 Storage Bucket 权限问题
 * 将所有已上传文件的权限改为公开读取
 * 运行：npx tsx fix-storage-permissions.ts
 */
import { Client, Storage, Query, Permission, Role } from 'appwrite';

const apiKey = process.env.APPWRITE_API_KEY;
if (!apiKey) {
  console.error('❌ 错误: 需要 APPWRITE_API_KEY 环境变量');
  console.error('请在 Appwrite Console → Settings → API Keys 创建一个 API Key');
  console.error('然后在 .env.local 中添加: APPWRITE_API_KEY=你的API密钥');
  process.exit(1);
}

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || 'hdinever0428';
const storageBucketId = process.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'product-images';

console.log('🔧 开始修复 Storage 权限...\n');
console.log('📋 配置信息:');
console.log('  Endpoint:', endpoint);
console.log('  Project ID:', projectId);
console.log('  Storage Bucket:', storageBucketId);
console.log('');

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const storage = new Storage(client);

async function fixPermissions() {
  try {
    // 获取所有文件
    console.log('📁 获取所有文件...');
    const files = await storage.listFiles(storageBucketId);
    console.log(`   找到 ${files.total} 个文件\n`);

    if (files.total === 0) {
      console.log('✅ 没有文件需要修复');
      return;
    }

    // 修复每个文件的权限
    let successCount = 0;
    let errorCount = 0;

    for (const file of files.files) {
      try {
        console.log(`   处理: ${file.name} (${file.$id})`);
        
        // 更新文件权限为公开读取
        await storage.updateFile(
          storageBucketId,
          file.$id,
          file.name,
          [
            Permission.read(Role.any()),
            Permission.update(Role.team('6996cdfd000d548e392d')), // Admin team
            Permission.delete(Role.team('6996cdfd000d548e392d'))
          ]
        );
        
        console.log(`   ✅ 成功更新权限\n`);
        successCount++;
      } catch (error: any) {
        console.error(`   ❌ 失败: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('='.repeat(60));
    console.log('📊 修复完成！');
    console.log('='.repeat(60));
    console.log(`✅ 成功: ${successCount} 个文件`);
    if (errorCount > 0) {
      console.log(`❌ 失败: ${errorCount} 个文件`);
    }
    console.log('');
    console.log('🎉 现在刷新网页，图片应该可以正常显示了！');
    console.log('');

  } catch (error: any) {
    console.error('❌ 修复过程出错:', error.message);
    console.error(error);
  }
}

fixPermissions();
