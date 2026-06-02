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
