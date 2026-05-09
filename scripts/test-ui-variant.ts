import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT!;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID!;
const teamId = process.env.VITE_APPWRITE_ADMIN_TEAM_ID!;

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function test() {
  try {
    const variantData = {
      productId: 'test_pid',
      name: 'Test Variant',
      price: 100,
      imageUrl: 'http://example.com/img.jpg',
      stockQuantity: 10,
      sortOrder: 1,
      isActive: true,
      tag: 'test'
    };

    const doc = await databases.createDocument(
      databaseId,
      'product_variants',
      ID.unique(),
      variantData,
      [
        Permission.read('any'),
        Permission.update(Role.team(teamId)),
        Permission.delete(Role.team(teamId))
      ]
    );
    console.log('Success:', doc.$id);
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

test();
