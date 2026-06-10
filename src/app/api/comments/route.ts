import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { diaryEntryId, body } = await req.json();
  if (!diaryEntryId || !body?.trim()) {
    return NextResponse.json({ error: "diaryEntryId and body are required" }, { status: 400 });
  }
  if (body.trim().length > 1000) {
    return NextResponse.json({ error: "Comment too long (max 1000 chars)" }, { status: 400 });
  }

  const entry = await prisma.diaryEntry.findUnique({ where: { id: diaryEntryId } });
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { userId: session.user.id, diaryEntryId, body: body.trim() },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
