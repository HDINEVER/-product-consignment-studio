import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT!;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID!;

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function checkProductsAttributes() {
  try {
    const col = await databases.getCollection(databaseId, 'products');
    console.log(col.attributes.map((a: any) => a.key).join(', '));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProductsAttributes();
