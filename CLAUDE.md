# Indigo Admin Portal — CLAUDE.md

## What this project is

Internal admin portal for Indigo Tech Foundry, hosted at **https://admin.indigofoundry.app**.  
Built with Next.js 14 (App Router), Tailwind CSS, deployed on Vercel (project: `indigo-admin`, org: `lojuls-projects`).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router |
| Styling | Tailwind CSS |
| Database | Neon Postgres (`@neondatabase/serverless`) |
| Auth | Cookie-based (`admin_session` httpOnly cookie) |
| CMS | Sanity v3 (`next-sanity@^7`) embedded at `/studio` |
| Social scheduling | Buffer GraphQL API |
| Image hosting | imgbb API |
| AI generation | Azure OpenAI (`gpt-image-1-mini`) + OpenRouter (text: Llama / Qwen) |
| Trend search | Tavily |
| Deployment | Vercel (`vercel --prod`) |

## Routes

| Path | Purpose |
|---|---|
| `/` | Admin dashboard — card grid linking to all tools |
| `/login` | Login page (username + password) |
| `/social` | Social Media Manager — company list |
| `/social/company/[id]` | Post generator for a company |
| `/social/company/new` | Add a new company |
| `/studio` | Sanity CMS (embedded via `NextStudio`) |
| `/api/auth/login` | POST — validates credentials, sets cookie |
| `/api/auth/logout` | POST — clears cookie |
| `/api/buffer/channel` | GET — fetch all Buffer channels (cached in memory) |
| `/api/buffer/post` | POST — publish to Buffer queue |
| `/api/companies` | GET/POST — list or create companies |
| `/api/companies/[id]` | GET/PUT — get or update a company |
| `/api/generate` | POST — AI post copy generation |
| `/api/generate-image` | POST — AI image generation |
| `/api/imgbb` | POST — upload image to imgbb |
| `/api/search` | POST — Tavily trend search |
| `/api/translate` | POST — translate post text |

## Auth

Middleware (`src/middleware.ts`) protects all routes except `/login` and `/api/auth/*`.  
Session validated by comparing `admin_session` cookie value to `ADMIN_SESSION_SECRET` env var.

**Credentials (set in Vercel production env vars):**
- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD=WsxEdc1234%`
- `ADMIN_SESSION_SECRET=<hex string>`

**Important:** When setting env vars via CLI, use `printf 'value'` (not `echo`) to avoid trailing newlines — a trailing newline in `ADMIN_USERNAME` was a past bug that caused "invalid credentials".

## Environment variables

All secrets live in `.env.local` (git-ignored) locally and in Vercel production env vars.

```
DATABASE_URL=                    # Neon pooled connection
DATABASE_URL_UNPOOLED=           # Neon direct connection (used in db.ts)
ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
TAVILY_API_KEY=                  # Tavily trend search
IMGBB_API_KEY=                   # imgbb image hosting (permanent URLs)
BUFFER_API_TOKEN=                # Token for admin@indigofoundry.app Buffer account
OPENROUTER_API_KEY=              # OpenRouter text models (prompt engineering)
AZURE_OPENAI_IMAGE_KEY=          # Azure OpenAI API key (Sweden Central)
AZURE_OPENAI_IMAGE_ENDPOINT=     # Full URL: https://swedencentral.api.cognitive.microsoft.com/openai/deployments/gpt-image-1-mini/images/generations?api-version=2025-04-01-preview
```

To add/update a var:
```bash
printf 'value' | vercel env add VAR_NAME production --yes
```

To verify what's stored:
```bash
vercel env pull /tmp/check.env --environment=production --yes && cat /tmp/check.env
```

## Database

Neon Postgres. Schema auto-initialised in `src/lib/db.ts` via `ensureSchema()`.

Tables:
- `companies` — company profiles (name, description, tone, topics, etc.)
- `search_cache` — cached Tavily search results (keyed by query)

## Sanity CMS

- Project ID: `9dj937o9`, dataset: `production`
- Config: `src/sanity/sanity.config.ts`
- Studio page: `src/app/studio/[[...tool]]/page.tsx`
- CORS origin `https://admin.indigofoundry.app` must be added in Sanity dashboard
- Uses `sanity@^3.99.0` + `next-sanity@^7.1.4` (v5 requires React 19 — don't upgrade)

## Buffer integration

- GraphQL endpoint: `https://api.buffer.com/rpc`
- Token: for `admin@indigofoundry.app` (not `julian_lau@hotmail.com`)
- All channels are fetched once and cached in memory (cleared on server restart)
- `GET /api/buffer/channel` returns `{ channels: [{ id, name, service }] }` — always plural
- `POST /api/buffer/post` accepts `{ channelIds: [{id, name, service}], text, imageUrl }` and posts to all channels in parallel via `Promise.allSettled`
- `createPost` mutation requires: `channelId`, `text`, `schedulingType: "automatic"`, `mode: "addToQueue"`, `assets` (for images), `metadata`
- Facebook metadata: `{ facebook: { type: "post" } }`
- Instagram metadata: `{ instagram: { type: "post", shouldShareToFeed: true } }` — `shouldShareToFeed` is required (Boolean!), omitting it causes a GraphQL error
- Post result must include `post.id` to confirm queuing — any other result shape is treated as failure

## Image generation

Pipeline in `src/app/api/generate-image/route.ts`:

1. **Prompt engineering** (OpenRouter, free text models) — two sequential calls:
   - Step A: Generate a 35-word visual scene prompt (photorealistic, dark bottom-third for text overlay)
   - Step B: AI designs a text overlay — returns JSON `{ headline, subtext, placement, style }`
2. **Image generation** (Azure OpenAI `gpt-image-1-mini`, Sweden Central) — POST `{ prompt, n: 1, size: "1024x1024" }`, returns `data[0].b64_json`
3. **Upload** (imgbb) — uploads base64 image to get a permanent public URL

Key notes:
- Do NOT pass `response_format` to Azure OpenAI — `gpt-image-1-mini` always returns `b64_json`, it does not support that parameter
- API version: `2025-04-01-preview`
- Timeout: `AbortSignal.timeout(55000)` to stay within Vercel's 60s function limit (`maxDuration = 60`)
- OpenRouter free model fallback list: `llama-3.3-70b`, `qwen3-next-80b`, `gpt-oss-120b`, `gemma-4-31b`

## Dashboard tool cards

Defined in `src/app/page.tsx` as a `TOOLS` array. To add a new tool:
- Internal route: `{ href: '/path', title, description, icon, status: 'live', external: false }`
- External link: `{ href: 'https://...', title, description, icon, status: 'live', external: true }` — renders as `<a target="_blank">` with an external link icon

Current tools:
1. **Social Media Manager** → `/social`
2. **Content Studio** → `/studio`
3. **Document Processor** → `https://property-intelligence.streamlit.app/` (external)

## Deployment

```bash
# Deploy to production
vercel --prod

# Check recent deployments
vercel ls indigo-admin

# Check env vars
vercel env ls production
```

GitHub repo: `github.com/lojul/indigo-social-manager`  
Vercel project ID: `prj_SwZvOqSuDwqq3ig8uDKn37Do5gS5`

## Key files

```
src/
  app/
    page.tsx                        # Admin dashboard (tool cards)
    login/page.tsx                  # Login form
    social/                         # Social Media Manager
    studio/[[...tool]]/page.tsx     # Sanity Studio
    api/
      auth/login/route.ts           # Auth: validate + set cookie
      auth/logout/route.ts          # Auth: clear cookie
      buffer/post/route.ts          # Post to Buffer queue
      buffer/channel/route.ts       # Fetch/cache Buffer channel
      companies/route.ts            # Company CRUD
      generate/route.ts             # AI copy generation
  components/SocialManager/         # Multi-step post builder UI
  lib/db.ts                         # Neon Postgres helpers
  middleware.ts                     # Route protection
  sanity/sanity.config.ts           # Sanity config
vercel.json                         # { "framework": "nextjs" }
.npmrc                              # legacy-peer-deps=true (Sanity peer deps)
```
