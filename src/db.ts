/**
 * SQLite Database for logging posts and tracking topics
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'posts.db');

let db: Database.Database | null = null;

/**
 * Initialize the database with schema
 */
export function initDatabase(): Database.Database {
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(DB_PATH);

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      content TEXT NOT NULL,
      hashtags TEXT,
      facebook_post_id TEXT,
      status TEXT DEFAULT 'pending',
      posted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      engagement_likes INTEGER DEFAULT 0,
      engagement_comments INTEGER DEFAULT 0,
      engagement_shares INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS topics_used (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      used_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
    CREATE INDEX IF NOT EXISTS idx_topics_used_topic ON topics_used(topic);
    CREATE INDEX IF NOT EXISTS idx_topics_used_at ON topics_used(used_at);
  `);

  console.log('[DB] Database initialized at', DB_PATH);
  return db;
}

/**
 * Get the database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Save a generated post to the database
 */
export function savePost(
  topic: string,
  content: string,
  hashtags?: string[]
): number {
  const db = getDatabase();
  const result = db.prepare(`
    INSERT INTO posts (topic, content, hashtags, status)
    VALUES (?, ?, ?, 'pending')
  `).run(topic, content, hashtags?.join(',') || null);

  return result.lastInsertRowid as number;
}

/**
 * Update post status after Facebook posting
 */
export function updatePostStatus(
  postId: number,
  status: 'posted' | 'failed',
  facebookPostId?: string
): void {
  const db = getDatabase();
  db.prepare(`
    UPDATE posts
    SET status = ?, facebook_post_id = ?, posted_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, facebookPostId || null, postId);
}

/**
 * Get recent posts for review
 */
export function getRecentPosts(limit: number = 20): any[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM posts
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
