import { Client, Teams } from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT!;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const teams = new Teams(client);

async function checkTeams() {
  try {
    const list = await teams.list();
    console.log('Teams:', JSON.stringify(list.teams, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTeams();
