import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 配置
const endpoint = process.env.VITE_APPWRITE_ENDPOINT!;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID!;

if (!apiKey) {
  console.error('❌ 缺少 APPWRITE_API_KEY 环境变量');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function checkVariants() {
  try {
    const collection = await databases.getCollection(databaseId, 'product_variants');
    console.log('Attributes:', JSON.stringify(collection.attributes, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkVariants();
