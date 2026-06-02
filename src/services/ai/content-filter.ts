/**
 * Content Filter for Facebook Posts
 * Validates content and checks for duplicates
 *
 * Adapted from CatPawVote with Facebook-specific rules
 */

import type { GeneratedPost } from './post-generator.js';
import { getDatabase } from '../../db.js';

// Political and sensitive keywords to block
const BLOCKED_KEYWORDS = [
  // Politics
  '選舉', '投票', '政黨', '候選人', '總統', '主席', '議員',
  '民主', '獨裁', '政府', '政策', '抗議', '示威',
  // Controversial
  '戰爭', '武器', '暴力', '死亡', '自殺',
  // Spam-like
  '點擊這裡', '免費領取', '限時優惠',
];

// Inappropriate content patterns
const BLOCKED_PATTERNS = [
  /賺\d+萬/,
  /月入\d+/,
  /私訊我/,
  /加我(微信|line)/i,
];

export interface ValidationResult {
  passed: boolean;
  reason?: string;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity percentage between two strings
 */
function calculateSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100;
}

/**
 * Check if content contains blocked keywords
 */
function containsBlockedKeywords(content: string): string | null {
  const lowerContent = content.toLowerCase();

  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      return keyword;
    }
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return `Pattern: ${pattern.source}`;
    }
  }

  return null;
}

/**
 * Check if a similar post was already created recently
 */
export async function checkDuplicateContent(content: string, daysBack: number = 7): Promise<boolean> {
  try {
    const db = getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const recentPosts = db.prepare(`
      SELECT content FROM posts
      WHERE created_at > ?
      ORDER BY created_at DESC
      LIMIT 100
    `).all(cutoffDate.toISOString()) as { content: string }[];

    for (const post of recentPosts) {
      const similarity = calculateSimilarity(content, post.content);
      if (similarity > 80) {
        console.log(`[ContentFilter] Found similar post (${similarity.toFixed(1)}% similar)`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[ContentFilter] Error checking duplicates:', error);
    return false; // Allow on error
  }
}

/**
 * Check if a topic was already used recently
 */
export async function checkTopicUsed(topic: string, daysBack: number = 7): Promise<boolean> {
  try {
    const db = getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const result = db.prepare(`
      SELECT COUNT(*) as count FROM topics_used
      WHERE topic = ? AND used_at > ?
    `).get(topic, cutoffDate.toISOString()) as { count: number };

    return result.count > 0;
  } catch (error) {
    console.error('[ContentFilter] Error checking topic usage:', error);
    return false;
  }
}

/**
 * Mark a topic as used
 */
export function markTopicUsed(topic: string): void {
  try {
    const db = getDatabase();
    db.prepare('INSERT INTO topics_used (topic) VALUES (?)').run(topic);
  } catch (error) {
    console.error('[ContentFilter] Error marking topic used:', error);
  }
}

/**
 * Validate a generated post
 */
export async function validatePost(post: GeneratedPost): Promise<ValidationResult> {
  // Check for blocked keywords
  const blockedKeyword = containsBlockedKeywords(post.content);
  if (blockedKeyword) {
    return { passed: false, reason: `Contains blocked keyword: ${blockedKeyword}` };
  }

  // Check content length
  if (post.content.length < 50) {
    return { passed: false, reason: 'Content too short' };
  }

  if (post.content.length > 500) {
    return { passed: false, reason: 'Content too long' };
  }

  // Check for duplicates
  const isDuplicate = await checkDuplicateContent(post.content);
  if (isDuplicate) {
    return { passed: false, reason: 'Similar content already posted recently' };
  }

  return { passed: true };
}
