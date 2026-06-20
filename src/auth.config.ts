import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

export const authConfig = {
  providers: [Google({ allowDangerousEmailAccountLinking: true })],
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      if (pathname.startsWith('/api/auth') || pathname === '/login') return true
return !!auth?.user
    },
  },
} satisfies NextAuthConfig
