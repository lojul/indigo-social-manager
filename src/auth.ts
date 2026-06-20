import NextAuth from 'next-auth'
import { NeonAdapter } from './lib/authAdapter'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: NeonAdapter(),
  session: { strategy: 'jwt' },
  callbacks: {
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
