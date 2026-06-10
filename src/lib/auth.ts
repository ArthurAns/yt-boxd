import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/** Derive a URL-safe username from an email or display name, ensuring uniqueness. */
async function generateUsername(base: string): Promise<string> {
  // Strip domain if it's an email, lowercase, keep only alphanumeric + underscore
  const slug = base
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  const candidate = slug || "user";

  // Check for collisions and append a suffix if needed
  let username = candidate;
  let i = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${candidate}${i++}`;
  }
  return username;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.readonly",
        },
      },
    }),
  ],
  events: {
    /** Auto-assign a username the first time a user signs in. */
    async createUser({ user }) {
      if (!user.id) return;
      const base = user.email ?? user.name ?? "user";
      const username = await generateUsername(base);
      await prisma.user.update({ where: { id: user.id }, data: { username } });
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true },
        });
        (session.user as typeof session.user & { username: string | null }).username =
          dbUser?.username ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
