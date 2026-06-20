import { neon } from '@neondatabase/serverless'
import type { Adapter, AdapterUser, AdapterAccount } from 'next-auth/adapters'

export function NeonAdapter(): Adapter {
  const sql = neon(process.env.DATABASE_URL_UNPOOLED!)

  return {
    async createUser(user: Omit<AdapterUser, 'id'> & { id?: string }) {
      const rows = await sql`
        INSERT INTO users (id, name, email, "emailVerified", image)
        VALUES (
          COALESCE(${user.id ?? null}, gen_random_uuid()::TEXT),
          ${user.name ?? null},
          ${user.email},
          ${user.emailVerified ?? null},
          ${user.image ?? null}
        )
        RETURNING *
      `
      return rows[0] as AdapterUser
    },

    async getUser(id: string) {
      const rows = await sql`SELECT * FROM users WHERE id = ${id}`
      return (rows[0] as AdapterUser) ?? null
    },

    async getUserByEmail(email: string) {
      const rows = await sql`SELECT * FROM users WHERE email = ${email}`
      return (rows[0] as AdapterUser) ?? null
    },

    async getUserByAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
      const rows = await sql`
        SELECT u.* FROM users u
        JOIN accounts a ON a."userId" = u.id
        WHERE a.provider = ${provider} AND a."providerAccountId" = ${providerAccountId}
      `
      return (rows[0] as AdapterUser) ?? null
    },

    async updateUser(user: Partial<AdapterUser> & { id: string }) {
      const rows = await sql`
        UPDATE users
        SET
          name           = COALESCE(${user.name ?? null}, name),
          email          = COALESCE(${user.email ?? null}, email),
          "emailVerified" = COALESCE(${user.emailVerified ?? null}, "emailVerified"),
          image          = COALESCE(${user.image ?? null}, image)
        WHERE id = ${user.id}
        RETURNING *
      `
      return rows[0] as AdapterUser
    },

    async linkAccount(account: AdapterAccount) {
      await sql`
        INSERT INTO accounts (
          id, "userId", type, provider, "providerAccountId",
          refresh_token, access_token, expires_at,
          token_type, scope, id_token, session_state
        ) VALUES (
          gen_random_uuid()::TEXT,
          ${account.userId},
          ${account.type},
          ${account.provider},
          ${account.providerAccountId},
          ${account.refresh_token ?? null},
          ${account.access_token ?? null},
          ${account.expires_at ?? null},
          ${account.token_type ?? null},
          ${account.scope ?? null},
          ${account.id_token ?? null},
          ${account.session_state ?? null}
        )
      `
      return account
    },

    // JWT strategy — session table methods not used
    async createSession(session) { return session as never },
    async getSessionAndUser(_sessionToken) { return null },
    async updateSession(_session) { return null },
    async deleteSession(_sessionToken) {},
  }
}
