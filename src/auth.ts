import NextAuth from 'next-auth'
import { NeonAdapter } from './lib/authAdapter'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: NeonAdapter(),
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
