import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      name: string;
      role: "ADMIN" | "CLIENT";
      clientId: string | null;
    };
  }
  interface User {
    id: string;
    username: string;
    name: string;
    role: "ADMIN" | "CLIENT";
    clientId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: "ADMIN" | "CLIENT";
    clientId: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) return null;
        const user = await db.user.findUnique({
          where: { username: credentials.username.toLowerCase().trim() },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          clientId: user.clientId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.clientId = user.clientId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      session.user.clientId = token.clientId;
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}

/** Sesión admin o tira (para server actions / route handlers del admin). */
export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/** Sesión de cliente (portal / Cauce OS). Devuelve clientId garantizado. */
export async function requireClient() {
  const session = await auth();
  if (!session || !session.user.clientId) {
    throw new Error("UNAUTHORIZED");
  }
  return { session, clientId: session.user.clientId };
}
