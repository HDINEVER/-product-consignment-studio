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

async function checkDocs() {
  try {
    const docs = await databases.listDocuments(databaseId, 'product_variants');
    console.log('Total documents:', docs.total);
    if (docs.documents.length > 0) {
      console.log('First doc id:', docs.documents[0].$id);
      console.log('Doc permissions:', JSON.stringify(docs.documents[0].$permissions, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDocs();
