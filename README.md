# Facebook Trending Posts

Automatically generate and post engaging Facebook content from trending topics.

## Features

- 🔥 Fetch trending topics from Google Trends (HK/TW regions)
- 🤖 AI-generated posts in Traditional Chinese
- 🛡️ Content filtering (politics, duplicates, inappropriate content)
- 📊 SQLite logging for tracking posts
- ⏰ Scheduled posting via GitHub Actions

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in:

```env
# Required
SERPAPI_API_KEY=your_key
OPENROUTER_API_KEY=sk-or-v1-...

# Choose one:
AYRSHARE_API_KEY=your_key          # Recommended - no FB app review needed
# OR
FACEBOOK_PAGE_ACCESS_TOKEN=EAAG... # Requires Meta App Review

# Security
CRON_SECRET=generate_a_random_secret
```

### 3. Test Generation

```bash
npm run generate
```

This will:
1. Fetch trending topics
2. Generate sample posts
3. Show preview (no posting)

### 4. Run Server

```bash
npm run dev
```

### 5. Trigger Posting

```bash
curl -X POST http://localhost:3000/api/generate-posts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTS_PER_RUN` | Posts to generate per run | 3 |
| `REGIONS` | Trend regions | HK,TW |
| `DRY_RUN` | Preview without posting | false |
| `OPENROUTER_MODEL` | AI model | anthropic/claude-3-haiku |

## Facebook Integration Options

### Option A: Ayrshare (Recommended)

- No Facebook app review required
- Simple API key setup
- $49/month for unlimited posts

1. Sign up at [ayrshare.com](https://www.ayrshare.com)
2. Connect your Facebook Page
3. Copy API key to `AYRSHARE_API_KEY`

### Option B: Direct Facebook Graph API

- Free, but requires Meta App Review (2-8 weeks)
- More complex token management

1. Create app at [developers.facebook.com](https://developers.facebook.com)
2. Add Facebook Login product
3. Generate Page Access Token
4. Submit for App Review
5. Set `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN`

## GitHub Actions Setup

Add these secrets to your repository:

- `API_URL`: Your deployed server URL
- `CRON_SECRET`: Same as your .env

The workflow runs 3 times daily at peak engagement times (HKT):
- 9:00 AM
- 1:00 PM
- 7:00 PM

## Project Structure

```
src/
├── index.ts                 # Express server
├── db.ts                    # SQLite database
├── routes/
│   └── generate.ts          # POST /api/generate-posts
├── services/
│   ├── trends/
│   │   └── serpapi.ts       # Google Trends
│   ├── ai/
│   │   ├── post-generator.ts    # OpenRouter AI
│   │   └── content-filter.ts    # Moderation
│   └── facebook/
│       ├── ayrshare.ts      # Ayrshare API
│       └── graph-api.ts     # Direct FB API
└── cli/
    └── generate.ts          # Manual testing
```

## License

MIT
