import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { username, bio } = await req.json();

  // Validate username
  if (username !== undefined) {
    if (typeof username !== "string" || !/^[a-z0-9_]{1,30}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 1–30 characters: lowercase letters, numbers, underscores only." },
        { status: 400 }
      );
    }
    const conflict = await prisma.user.findUnique({ where: { username } });
    if (conflict && conflict.id !== session.user.id) {
      return NextResponse.json({ error: "Username already taken." }, { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(username !== undefined ? { username } : {}),
      ...(bio !== undefined ? { bio: bio || null } : {}),
    },
    select: { username: true, bio: true },
  });

  return NextResponse.json(user);
}
