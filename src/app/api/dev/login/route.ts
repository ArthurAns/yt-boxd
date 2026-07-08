import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";

/**
 * Dev-only login: signs you in as a seeded user without OAuth.
 *
 *   GET /api/dev/login?u=<username>   (defaults to marcuswebb)
 *
 * Disabled unless NODE_ENV !== "production" AND ALLOW_DEV_LOGIN=1.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEV_LOGIN !== "1") {
    return new NextResponse("Not found", { status: 404 });
  }

  const username = req.nextUrl.searchParams.get("u") ?? "marcuswebb";
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return new NextResponse(`No user "${username}" — run the seed first.`, { status: 404 });
  }

  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { sessionToken, userId: user.id, expires } });

  const res = NextResponse.redirect(new URL("/", req.url));
  // NextAuth reads a __Secure- prefixed cookie when the request arrives over
  // HTTPS (e.g. a forwarding proxy), so set both variants.
  res.cookies.set("authjs.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
  res.cookies.set("__Secure-authjs.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: true,
    expires,
  });
  return res;
}
