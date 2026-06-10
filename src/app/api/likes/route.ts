import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { diaryEntryId } = await req.json();
  if (!diaryEntryId) {
    return NextResponse.json({ error: "diaryEntryId required" }, { status: 400 });
  }

  const entry = await prisma.diaryEntry.findUnique({ where: { id: diaryEntryId } });
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  await prisma.like.create({
    data: { userId: session.user.id, diaryEntryId },
  }).catch(() => {}); // ignore duplicate

  const count = await prisma.like.count({ where: { diaryEntryId } });
  return NextResponse.json({ liked: true, count });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { diaryEntryId } = await req.json();
  if (!diaryEntryId) {
    return NextResponse.json({ error: "diaryEntryId required" }, { status: 400 });
  }

  await prisma.like.deleteMany({
    where: { userId: session.user.id, diaryEntryId },
  });

  const count = await prisma.like.count({ where: { diaryEntryId } });
  return NextResponse.json({ liked: false, count });
}
