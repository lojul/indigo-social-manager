/**
 * Generate Posts Route
 * POST /api/generate-posts - Generate and optionally post to Facebook
 */

import { Router, Request, Response } from 'express';
import { fetchMultiRegionTopics } from '../services/trends/tavily.js';
import { generatePostsFromTopics } from '../services/ai/post-generator.js';
import { validatePost, checkTopicUsed, markTopicUsed } from '../services/ai/content-filter.js';
import { postToFacebook } from '../services/facebook/buffer.js';
import { savePost, updatePostStatus } from '../db.js';

export const generateRoute = Router();

const CRON_SECRET = process.env.CRON_SECRET;
const POSTS_PER_RUN = parseInt(process.env.POSTS_PER_RUN || '3', 10);
const REGIONS = (process.env.REGIONS || 'HK,TW').split(',');
const DRY_RUN = process.env.DRY_RUN === 'true';

/**
 * Middleware to verify cron secret
 */
function requireAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;

  if (!CRON_SECRET) {
    console.error('[Generate] CRON_SECRET not configured');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  if (token !== CRON_SECRET) {
    res.status(403).json({ error: 'Invalid authorization token' });
    return;
  }

  next();
}

/**
 * POST /api/generate-posts
 * Main endpoint to generate and post content
 */
generateRoute.post('/generate-posts', requireAuth, async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log('[Generate] Starting post generation...');

  const results = {
    success: true,
    dryRun: DRY_RUN,
    topicsFetched: 0,
    postsGenerated: 0,
    postsPublished: 0,
    postsFiltered: 0,
    errors: [] as string[],
    posts: [] as Array<{
      topic: string;
      content: string;
      hashtags?: string[];
      facebookPostId?: string;
      status: string;
    }>,
  };

  try {
    // Step 1: Fetch trending topics
    console.log(`[Generate] Fetching topics from regions: ${REGIONS.join(', ')}`);
    const topics = await fetchMultiRegionTopics(REGIONS, POSTS_PER_RUN * 2);
    results.topicsFetched = topics.length;

    if (topics.length === 0) {
      results.errors.push('No trending topics found');
      res.status(200).json(results);
      return;
    }

    console.log(`[Generate] Found ${topics.length} topics`);

    // Step 2: Filter out already-used topics
    const unusedTopics = [];
    for (const topic of topics) {
      const used = await checkTopicUsed(topic.title);
      if (!used) {
        unusedTopics.push(topic);
      } else {
        console.log(`[Generate] Skipping used topic: ${topic.title}`);
      }
    }

    if (unusedTopics.length === 0) {
      results.errors.push('All topics have been used recently');
      res.status(200).json(results);
      return;
    }

    // Step 3: Generate posts
    console.log('[Generate] Generating posts...');
    const generatedPosts = await generatePostsFromTopics(unusedTopics, POSTS_PER_RUN + 2);
    results.postsGenerated = generatedPosts.length;

    if (generatedPosts.length === 0) {
      results.errors.push('Failed to generate any posts');
      res.status(200).json(results);
      return;
    }

    // Step 4: Validate and publish posts
    console.log('[Generate] Validating and publishing...');
    for (const { topic, post } of generatedPosts) {
      if (results.postsPublished >= POSTS_PER_RUN) break;

      // Validate content
      const validation = await validatePost(post);
      if (!validation.passed) {
        console.log(`[Generate] Filtered out: ${validation.reason}`);
        results.postsFiltered++;
        continue;
      }

      // Combine content with hashtags
      const fullContent = post.hashtags && post.hashtags.length > 0
        ? `${post.content}\n\n${post.hashtags.map(t => `#${t}`).join(' ')}`
        : post.content;

      // Save to database
      const postId = savePost(topic.title, fullContent, post.hashtags);

      if (DRY_RUN) {
        console.log(`[Generate] DRY RUN - Would post: ${fullContent.substring(0, 100)}...`);
        results.posts.push({
          topic: topic.title,
          content: fullContent,
          hashtags: post.hashtags,
          status: 'dry_run',
        });
        results.postsPublished++;
        markTopicUsed(topic.title);
        continue;
      }

      // Post to Facebook
      try {
        const fbResult = await postToFacebook(fullContent);

        if (fbResult.success) {
          updatePostStatus(postId, 'posted', fbResult.postId);
          markTopicUsed(topic.title);
          results.postsPublished++;
          results.posts.push({
            topic: topic.title,
            content: fullContent,
            hashtags: post.hashtags,
            facebookPostId: fbResult.postId,
            status: 'posted',
          });
          console.log(`[Generate] Posted: ${post.content.substring(0, 50)}...`);
        } else {
          updatePostStatus(postId, 'failed');
          results.errors.push(`Failed to post: ${fbResult.error}`);
        }
      } catch (error: any) {
        updatePostStatus(postId, 'failed');
        results.errors.push(`Post error: ${error.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Generate] Completed in ${duration}ms. Published ${results.postsPublished} posts.`);

    res.status(200).json(results);
  } catch (error) {
    console.error('[Generate] Error:', error);
    results.success = false;
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json(results);
  }
});

/**
 * GET /api/status
 * Check service configuration status
 */
generateRoute.get('/status', requireAuth, async (req: Request, res: Response) => {
  const status = {
    configured: true,
    serpApiConfigured: !!process.env.SERPAPI_API_KEY,
    openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
    facebookConfigured: !!(process.env.BUFFER_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN),
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
    postsPerRun: POSTS_PER_RUN,
    regions: REGIONS,
    dryRun: DRY_RUN,
  };

  res.json(status);
});
