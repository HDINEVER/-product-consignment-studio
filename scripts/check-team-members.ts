import { Client, Teams } from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT!;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;
const teamId = process.env.VITE_APPWRITE_ADMIN_TEAM_ID!;

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const teams = new Teams(client);

async function checkMembers() {
  try {
    const list = await teams.listMemberships(teamId);
    console.log('Members:', list.memberships.map(m => ({ email: m.userEmail, role: m.roles })));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMembers();
