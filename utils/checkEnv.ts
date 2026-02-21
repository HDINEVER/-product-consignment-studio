/**
 * 环境变量检查工具 - 在浏览器 Console 中检查配置
 * 
 * 使用方法：
 * 1. 打开浏览器开发者工具（F12）
 * 2. 在 Console 中输入：window.checkEnv()
 */

export function checkEnvironmentVariables() {
  console.log('🔍 检查 Appwrite 环境变量配置\n');
  
  const requiredEnvVars = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID',
    'VITE_APPWRITE_PRODUCTS_COLLECTION_ID',
    'VITE_APPWRITE_USERS_COLLECTION_ID',
    'VITE_APPWRITE_ORDERS_COLLECTION_ID',
    'VITE_APPWRITE_ORDER_ITEMS_COLLECTION_ID',
    'VITE_APPWRITE_ADDRESSES_COLLECTION_ID',
    'VITE_APPWRITE_CART_ITEMS_COLLECTION_ID',
    'VITE_APPWRITE_TAGS_COLLECTION_ID',
    'VITE_APPWRITE_STORAGE_BUCKET_ID',
    'VITE_APPWRITE_ADMIN_TEAM_ID',
  ];

  const optionalEnvVars = [
    'VITE_ADMIN_PASSWORD',
  ];

  let hasErrors = false;
  let results: any = {};

  console.log('📋 必要的环境变量 (Required):\n');
  requiredEnvVars.forEach((key) => {
    const value = import.meta.env[key];
    const exists = value !== undefined && value !== '';
    results[key] = value;
    
    if (exists) {
      console.log(`✅ ${key}: ${value}`);
    } else {
      console.error(`❌ ${key}: 未配置或为空`);
      hasErrors = true;
    }
  });

  console.log('\n📋 可选的环境变量 (Optional):\n');
  optionalEnvVars.forEach((key) => {
    const value = import.meta.env[key];
    results[key] = value;
    
    if (value) {
      console.log(`✅ ${key}: ${value}`);
    } else {
      console.warn(`⚠️  ${key}: 未配置`);
    }
  });

  console.log('\n📦 完整配置对象:\n', results);

  if (hasErrors) {
    console.error('\n❌ 检测到配置错误！');
    console.error('请确保在以下位置配置环境变量：');
    console.error('- 本地开发：.env.local 文件');
    console.error('- Cloudflare 部署：Dashboard → Settings → Environment Variables');
    console.error('\n详细部署指南：docs/CLOUDFLARE_DEPLOYMENT.md\n');
    return false;
  } else {
    console.log('\n✅ 所有必要的环境变量配置正确！\n');
    return true;
  }
}

// 暴露到 window 对象，方便在浏览器 Console 调用
if (typeof window !== 'undefined') {
  (window as any).checkEnv = checkEnvironmentVariables;
  console.log('💡 提示：在 Console 中输入 window.checkEnv() 可检查环境变量配置');
}

export default checkEnvironmentVariables;
