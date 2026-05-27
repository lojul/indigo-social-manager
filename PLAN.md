# Facebook Auto-Posting from Trending Topics

## Overview

Automatically generate and post engaging Facebook content based on trending topics from Google Trends, similar to the AI poll generation system in CatPawVote.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ GitHub Actions (cron: configurable, e.g., 3x daily)             │
│   └─ POST /api/generate-posts (Bearer CRON_SECRET)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Fetch Trending Topics                                   │
│   └─ SerpAPI Google Trends (HK/TW/US regions)                   │
│   └─ Fetch news headlines for context                           │
│   └─ Filter inappropriate categories                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Generate Post Content                                   │
│   └─ OpenRouter API (Claude/GPT/Llama)                          │
│   └─ Generate engaging caption with emojis                      │
│   └─ Optional: Generate image prompt for AI image               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Content Moderation                                      │
│   └─ Block political/sensitive content                          │
│   └─ Check for duplicate topics (last 7 days)                   │
│   └─ Validate post length and format                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Post to Facebook                                        │
│   └─ Facebook Graph API (direct) OR Ayrshare (managed)          │
│   └─ Schedule or publish immediately                            │
│   └─ Log post ID and status                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Facebook Posting Options

### Option A: Direct Facebook Graph API (Recommended for Cost)

**Pros:**
- Free (no API costs)
- Full control
- Direct integration

**Cons:**
- Requires Meta App Review (can take 2-8 weeks)
- Need to maintain Page Access Token (expires, needs refresh)
- More complex setup

**Required Permissions:**
- `pages_manage_posts` - Create/edit posts
- `pages_read_engagement` - Read page data
- `pages_manage_engagement` - Manage comments

**Setup Steps:**
1. Create Meta Developer App at developers.facebook.com
2. Add Facebook Login product
3. Generate Page Access Token via Graph API Explorer
4. Submit for App Review (demonstrate use case)
5. Convert to long-lived token (60 days) or implement token refresh

### Option B: Ayrshare (Recommended for Speed)

**Pros:**
- No Facebook app review needed
- Handles token management
- Multi-platform (can add Instagram, Twitter, LinkedIn later)
- Simple REST API

**Cons:**
- $49-99/month
- Third-party dependency

**Pricing:**
| Plan | Cost | Posts/Month | Features |
|------|------|-------------|----------|
| Free | $0 | 20 | Testing only |
| Starter | $49/mo | Unlimited | 1 profile |
| Premium | $99/mo | Unlimited | 3 profiles, analytics |

### Option C: Make.com / Zapier (No-Code)

**Pros:**
- Visual workflow builder
- No coding required
- Quick setup

**Cons:**
- Per-operation pricing adds up
- Less flexibility
- Harder to integrate custom AI

## Recommended Approach

**Phase 1: MVP with Ayrshare** ($49/mo)
- Fastest to market
- Focus on content generation quality
- Test engagement metrics

**Phase 2: Migrate to Direct API** (if volume justifies)
- Apply for Meta App Review
- Implement token refresh logic
- Remove Ayrshare dependency

## Project Structure

```
facebook-posting/
├── src/
│   ├── index.ts              # Express server
│   ├── routes/
│   │   └── generate.ts       # POST /api/generate-posts
│   ├── services/
│   │   ├── trends/
│   │   │   └── serpapi.ts    # Google Trends (reuse from CatPawVote)
│   │   ├── ai/
│   │   │   ├── post-generator.ts   # Generate post content
│   │   │   └── content-filter.ts   # Moderation (reuse)
│   │   └── facebook/
│   │       ├── graph-api.ts        # Direct FB API
│   │       └── ayrshare.ts         # Ayrshare wrapper
│   └── db.ts                 # SQLite/PostgreSQL for logging
├── .github/
│   └── workflows/
│       └── auto-post.yml     # Cron trigger
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Environment Variables

```env
# Trends
SERPAPI_API_KEY=your_serpapi_key

# AI Generation
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=anthropic/claude-3-haiku

# Facebook (Option A - Direct)
FACEBOOK_PAGE_ID=123456789
FACEBOOK_PAGE_ACCESS_TOKEN=EAAG...

# Facebook (Option B - Ayrshare)
AYRSHARE_API_KEY=your_ayrshare_key

# Security
CRON_SECRET=your_secret

# Config
POSTS_PER_RUN=3
POST_LANGUAGE=zh-TW
```

## AI Prompt for Post Generation

```
你是一個專業的社交媒體內容創作者，專為香港和台灣Facebook用戶設計。

根據提供的新聞標題，創建吸引人的Facebook貼文。

要求：
1. 貼文長度：100-200字
2. 使用繁體中文
3. 包含2-4個相關emoji
4. 語氣親切、有趣、引發討論
5. 結尾加入互動問題或行動呼籲
6. 可以加入相關hashtag（2-3個）

避免：
- 政治敏感話題
- 爭議性觀點
- 虛假或未經證實的資訊

新聞標題：{headlines}
話題：{topic}

請生成一則Facebook貼文。
```

## Database Schema (SQLite for simplicity)

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  facebook_post_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, posted, failed
  posted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  engagement_likes INTEGER DEFAULT 0,
  engagement_comments INTEGER DEFAULT 0,
  engagement_shares INTEGER DEFAULT 0
);

CREATE TABLE topics_used (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Set up Node.js/TypeScript project
- [ ] Copy and adapt SerpAPI service from CatPawVote
- [ ] Copy and adapt content filter from CatPawVote
- [ ] Create post generator with Facebook-optimized prompts

### Week 2: Facebook Integration
- [ ] Sign up for Ayrshare (or create Meta Developer App)
- [ ] Implement posting service
- [ ] Add SQLite logging
- [ ] Create GitHub Actions workflow

### Week 3: Testing & Refinement
- [ ] Test with real Facebook Page
- [ ] Refine AI prompts based on output quality
- [ ] Add error handling and retry logic
- [ ] Monitor engagement metrics

## Code to Reuse from CatPawVote

| File | Reuse Level | Notes |
|------|-------------|-------|
| `api/src/services/trends/serpapi.ts` | 90% | Change regions if needed |
| `api/src/services/ai/content-filter.ts` | 80% | Adjust keywords for FB |
| `api/src/services/ai/poll-generator.ts` | 50% | Change prompt for posts |
| `.github/workflows/ai-polls.yml` | 90% | Change endpoint and schedule |

## Monitoring

- **Success Rate**: % of posts successfully published
- **Engagement Rate**: (likes + comments + shares) / reach
- **Topic Diversity**: Avoid repeating similar topics
- **Error Alerts**: Notify on API failures

## Cost Estimate

| Service | Monthly Cost |
|---------|--------------|
| SerpAPI | $0-50 (100 free/month) |
| OpenRouter | $0-10 (depends on model) |
| Ayrshare | $49 (Starter) |
| Hosting | $0-5 (Railway/Vercel) |
| **Total** | **~$50-115/month** |

## Next Steps

1. **Decision**: Choose Ayrshare (fast) or Direct API (free but slow setup)
2. **Create Facebook Page** (if not existing)
3. **Set up project** with `npm init`
4. **Copy services** from CatPawVote
5. **Implement** post generator and Facebook client
6. **Test** with a single manual post
7. **Enable** cron automation

## References

- [Facebook Pages API - Posts](https://developers.facebook.com/docs/pages-api/posts/)
- [Meta App Review Process](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review)
- [Ayrshare API Documentation](https://www.ayrshare.com/docs/)
- [fbgraph npm package](https://www.npmjs.com/package/fbgraph)
- [Node.js Facebook posting guide](https://daily-dev-tips.com/posts/posting-with-the-facebook-api-via-node-js/)
