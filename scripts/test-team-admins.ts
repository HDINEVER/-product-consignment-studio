import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
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

async function testTeamAdmins() {
  try {
    const doc = await databases.createDocument(
      databaseId,
      'product_variants',
      ID.unique(),
      {
        productId: 'test',
        name: 'test',
        price: 1,
        isActive: true
      },
      [
        Permission.read('any'),
        Permission.update(Role.team('admins')),
        Permission.delete(Role.team('admins'))
      ]
    );
    console.log('Success!', doc.$id);
    await databases.deleteDocument(databaseId, 'product_variants', doc.$id);
  } catch (err: any) {
    console.error('Failed:', err.message);
  }
}

testTeamAdmins();
