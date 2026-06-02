#!/usr/bin/env tsx
/**
 * CLI tool to manually generate posts
 * Usage: npm run generate
 */

import 'dotenv/config';
import { fetchMultiRegionTopics } from '../services/trends/tavily.js';
import { generatePostsFromTopics } from '../services/ai/post-generator.js';
import { validatePost, checkTopicUsed } from '../services/ai/content-filter.js';
import { initDatabase } from '../db.js';

async function main() {
  console.log('🚀 Facebook Trending Posts Generator\n');

  // Initialize database
  initDatabase();

  const regions = (process.env.REGIONS || 'HK,TW').split(',');
  const postsPerRun = parseInt(process.env.POSTS_PER_RUN || '3', 10);

  // Step 1: Fetch topics
  console.log(`📊 Fetching trending topics from: ${regions.join(', ')}\n`);
  const topics = await fetchMultiRegionTopics(regions, postsPerRun * 2);

  if (topics.length === 0) {
    console.log('❌ No topics found');
    process.exit(1);
  }

  console.log(`Found ${topics.length} topics:\n`);
  for (const topic of topics) {
    const used = await checkTopicUsed(topic.title);
    console.log(`  ${used ? '⏭️' : '✅'} ${topic.title} (${topic.region})`);
    if (topic.newsHeadlines[0]) {
      console.log(`     └─ ${topic.newsHeadlines[0].substring(0, 60)}...`);
    }
  }

  // Filter unused topics
  const unusedTopics = [];
  for (const topic of topics) {
    const used = await checkTopicUsed(topic.title);
    if (!used) {
      unusedTopics.push(topic);
    }
  }

  if (unusedTopics.length === 0) {
    console.log('\n❌ All topics have been used recently');
    process.exit(1);
  }

  // Step 2: Generate posts
  console.log(`\n✨ Generating ${postsPerRun} posts...\n`);
  const generatedPosts = await generatePostsFromTopics(unusedTopics, postsPerRun);

  if (generatedPosts.length === 0) {
    console.log('❌ Failed to generate any posts');
    process.exit(1);
  }

  // Step 3: Show results
  console.log(`\n📝 Generated ${generatedPosts.length} posts:\n`);
  console.log('─'.repeat(60));

  for (const { topic, post } of generatedPosts) {
    const validation = await validatePost(post);

    console.log(`\n🏷️  Topic: ${topic.title}`);
    console.log(`📍 Status: ${validation.passed ? '✅ Valid' : `❌ ${validation.reason}`}`);
    console.log(`\n${post.content}`);

    if (post.hashtags && post.hashtags.length > 0) {
      console.log(`\n${post.hashtags.map(t => `#${t}`).join(' ')}`);
    }

    console.log('\n' + '─'.repeat(60));
  }

  console.log('\n✅ Generation complete!');
  console.log('\nTo publish these posts:');
  console.log('  1. Set up BUFFER_ACCESS_TOKEN and BUFFER_PROFILE_ID');
  console.log('     (Run: npm run buffer:profiles to find your profile ID)');
  console.log('  2. Run: npm start');
  console.log('  3. Call: POST /api/generate-posts with Authorization header\n');
}

main().catch(console.error);
