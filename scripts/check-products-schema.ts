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

async function checkProducts() {
  try {
    const collection = await databases.getCollection(databaseId, 'products');
    const attr = collection.attributes.find((a: any) => a.key === 'productAttribute');
    console.log('productAttribute:', JSON.stringify(attr, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProducts();
