import NextAuth from 'next-auth'
import PostgresAdapter from '@auth/pg-adapter'
import { Pool } from 'pg'
import { authConfig } from './auth.config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PostgresAdapter(pool),
  session: { strategy: 'jwt' },
  callbacks: {
    signIn({ profile }) {
      const allowed = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) ?? []
      return allowed.length === 0 || allowed.includes(profile?.email ?? '')
    },
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user && token?.id) session.user.id = token.id as string
      return session
    },
  },
})
