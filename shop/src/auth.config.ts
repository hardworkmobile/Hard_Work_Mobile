import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn  = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname === "/login";

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      if (!isLoggedIn && !isLoginPage) {
        return Response.redirect(new URL("/login", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) token.role = (user as { role: string }).role;
      return token;
    },
    session({ session, token }) {
      if (session.user) (session.user as { role?: string }).role = token.role as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
