#!/usr/bin/env tsx
/**
 * List connected Buffer profiles to find your BUFFER_PROFILE_ID
 * Usage: npm run buffer:profiles
 */

import 'dotenv/config';
import { getProfiles } from '../services/facebook/buffer.js';

async function main() {
  console.log('🔍 Fetching Buffer profiles...\n');

  if (!process.env.BUFFER_ACCESS_TOKEN) {
    console.error('❌ BUFFER_ACCESS_TOKEN not set in .env');
    console.log('\nTo get your access token:');
    console.log('  1. Go to https://buffer.com/developers/apps');
    console.log('  2. Create an app or use existing one');
    console.log('  3. Get the access token\n');
    process.exit(1);
  }

  const profiles = await getProfiles();

  if (profiles.length === 0) {
    console.log('❌ No profiles found');
    console.log('\nMake sure you have connected a Facebook Page to Buffer:');
    console.log('  1. Go to https://buffer.com');
    console.log('  2. Connect your Facebook Page\n');
    process.exit(1);
  }

  console.log('Connected profiles:\n');
  for (const profile of profiles) {
    console.log(`  📱 ${profile.formatted_username}`);
    console.log(`     Service: ${profile.service}`);
    console.log(`     ID: ${profile.id}`);
    console.log('');
  }

  const fbProfile = profiles.find(p => p.service === 'facebook');
  if (fbProfile) {
    console.log('─'.repeat(50));
    console.log(`\n✅ Add this to your .env file:\n`);
    console.log(`BUFFER_PROFILE_ID=${fbProfile.id}\n`);
  }
}

main().catch(console.error);
