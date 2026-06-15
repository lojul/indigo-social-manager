import { neon } from '@neondatabase/serverless';

function getDb() {
  return neon(process.env.DATABASE_URL_UNPOOLED!);
}

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS companies (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      tagline     TEXT DEFAULT '',
      theme       TEXT DEFAULT 'indigo',
      size        TEXT DEFAULT '',
      category    TEXT DEFAULT '',
      url         TEXT DEFAULT '',
      description TEXT DEFAULT '',
      language    TEXT DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS search_cache (
      query     TEXT PRIMARY KEY,
      results   TEXT NOT NULL,
      cached_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS custom_searches TEXT DEFAULT '[]'`;

  await sql`
    CREATE TABLE IF NOT EXISTS generation_logs (
      id          SERIAL PRIMARY KEY,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      company_id  INT REFERENCES companies(id) ON DELETE SET NULL,
      type        TEXT NOT NULL,
      model       TEXT NOT NULL,
      cost_usd    NUMERIC(10, 6) DEFAULT 0,
      meta        JSONB DEFAULT '{}'
    )
  `;

  const rows = await sql`SELECT COUNT(*) AS c FROM companies`;
  if (parseInt(rows[0].c) === 0) {
    await sql`
      INSERT INTO companies (name, tagline, theme)
      VALUES ('Indigo Tech Foundry', 'AI-powered social media solutions', 'indigo')
    `;
  }

  schemaReady = true;
}

export interface Company {
  id: number;
  name: string;
  tagline: string;
  theme: string;
  size: string;
  category: string;
  url: string;
  description: string;
  language: string;
  custom_searches: string;
  created_at: string;
}

export async function getAllCompanies(): Promise<Company[]> {
  await ensureSchema();
  const sql = getDb();
  const rows = await sql`SELECT * FROM companies ORDER BY created_at ASC`;
  return rows as Company[];
}

export async function getCompanyById(id: number): Promise<Company | undefined> {
  await ensureSchema();
  const sql = getDb();
  const rows = await sql`SELECT * FROM companies WHERE id = ${id}`;
  return rows[0] as Company | undefined;
}

export async function createCompany(
  fields: Pick<Company, 'name' | 'tagline' | 'theme' | 'size' | 'category' | 'url' | 'description' | 'language'>
): Promise<Company> {
  await ensureSchema();
  const sql = getDb();
  const rows = await sql`
    INSERT INTO companies (name, tagline, theme, size, category, url, description, language)
    VALUES (${fields.name}, ${fields.tagline}, ${fields.theme}, ${fields.size},
            ${fields.category}, ${fields.url}, ${fields.description}, ${fields.language})
    RETURNING *
  `;
  return rows[0] as Company;
}

export async function updateCompany(
  id: number,
  fields: Partial<Pick<Company, 'name' | 'tagline' | 'theme' | 'size' | 'category' | 'url' | 'description' | 'language'>>
): Promise<Company | undefined> {
  await ensureSchema();
  const current = await getCompanyById(id);
  if (!current) return undefined;
  const m = { ...current, ...fields };
  const sql = getDb();
  await sql`
    UPDATE companies SET
      name        = ${m.name},
      tagline     = ${m.tagline},
      theme       = ${m.theme},
      size        = ${m.size},
      category    = ${m.category},
      url         = ${m.url},
      description = ${m.description},
      language    = ${m.language}
    WHERE id = ${id}
  `;
  return getCompanyById(id);
}

export async function getCachedSearch(query: string, maxAgeHours = 24): Promise<object[] | null> {
  await ensureSchema();
  const sql = getDb();
  const rows = await sql`SELECT * FROM search_cache WHERE query = ${query}`;
  if (!rows[0]) return null;
  const ageMs = Date.now() - new Date(rows[0].cached_at).getTime();
  if (ageMs > maxAgeHours * 3_600_000) return null;
  try { return JSON.parse(rows[0].results); } catch { return null; }
}

export async function setCachedSearch(query: string, results: object[]): Promise<void> {
  await ensureSchema();
  const sql = getDb();
  await sql`
    INSERT INTO search_cache (query, results, cached_at)
    VALUES (${query}, ${JSON.stringify(results)}, NOW())
    ON CONFLICT (query) DO UPDATE
      SET results = EXCLUDED.results, cached_at = EXCLUDED.cached_at
  `;
}

export async function clearSearchCache(): Promise<void> {
  await ensureSchema();
  const sql = getDb();
  await sql`DELETE FROM search_cache`;
}

export async function getCompanySearches(id: number): Promise<string[]> {
  await ensureSchema();
  const sql = getDb();
  const rows = await sql`SELECT custom_searches FROM companies WHERE id = ${id}`;
  if (!rows[0]) return [];
  try { return JSON.parse(rows[0].custom_searches || '[]'); } catch { return []; }
}

export async function saveCompanySearch(id: number, query: string, max = 8): Promise<string[]> {
  await ensureSchema();
  const sql = getDb();
  const current = await getCompanySearches(id);
  const updated = [query, ...current.filter(q => q !== query)].slice(0, max);
  await sql`UPDATE companies SET custom_searches = ${JSON.stringify(updated)} WHERE id = ${id}`;
  return updated;
}

export async function removeCompanySearch(id: number, query: string): Promise<string[]> {
  await ensureSchema();
  const sql = getDb();
  const current = await getCompanySearches(id);
  const updated = current.filter(q => q !== query);
  await sql`UPDATE companies SET custom_searches = ${JSON.stringify(updated)} WHERE id = ${id}`;
  return updated;
}

export async function logGeneration(
  type: string,
  model: string,
  costUsd: number,
  companyId?: number | null,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await ensureSchema();
    const sql = getDb();
    await sql`
      INSERT INTO generation_logs (type, model, cost_usd, company_id, meta)
      VALUES (${type}, ${model}, ${costUsd}, ${companyId ?? null}, ${JSON.stringify(meta ?? {})})
    `;
  } catch (err) {
    console.error('logGeneration failed (non-fatal):', err);
  }
}

export interface BillingMonth {
  month: string;
  total_usd: number;
  image_usd: number;
  video_usd: number;
  image_count: number;
  video_count: number;
}

export interface BillingCompany {
  company_id: number | null;
  company_name: string;
  total_usd: number;
  image_count: number;
  video_count: number;
}

export async function getBillingStats(months = 3): Promise<{
  monthly: BillingMonth[];
  by_company: BillingCompany[];
  total_usd: number;
}> {
  await ensureSchema();
  const sql = getDb();

  const monthly = await sql`
    SELECT
      TO_CHAR(created_at, 'YYYY-MM') AS month,
      ROUND(SUM(cost_usd)::numeric, 4) AS total_usd,
      ROUND(SUM(CASE WHEN type = 'image' THEN cost_usd ELSE 0 END)::numeric, 4) AS image_usd,
      ROUND(SUM(CASE WHEN type = 'video' THEN cost_usd ELSE 0 END)::numeric, 4) AS video_usd,
      COUNT(CASE WHEN type = 'image' THEN 1 END)::int AS image_count,
      COUNT(CASE WHEN type = 'video' THEN 1 END)::int AS video_count
    FROM generation_logs
    WHERE created_at >= NOW() - (${months} || ' months')::interval
    GROUP BY month
    ORDER BY month DESC
  `;

  const by_company = await sql`
    SELECT
      g.company_id,
      COALESCE(c.name, 'Unknown') AS company_name,
      ROUND(SUM(g.cost_usd)::numeric, 4) AS total_usd,
      COUNT(CASE WHEN g.type = 'image' THEN 1 END)::int AS image_count,
      COUNT(CASE WHEN g.type = 'video' THEN 1 END)::int AS video_count
    FROM generation_logs g
    LEFT JOIN companies c ON c.id = g.company_id
    WHERE g.created_at >= NOW() - (${months} || ' months')::interval
    GROUP BY g.company_id, c.name
    ORDER BY total_usd DESC
  `;

  const totals = await sql`
    SELECT ROUND(SUM(cost_usd)::numeric, 4) AS total_usd
    FROM generation_logs
    WHERE created_at >= NOW() - (${months} || ' months')::interval
  `;

  return {
    monthly: monthly as BillingMonth[],
    by_company: by_company as BillingCompany[],
    total_usd: Number(totals[0]?.total_usd ?? 0),
  };
}
