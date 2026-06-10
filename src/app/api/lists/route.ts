import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const lists = await prisma.list.findMany({
    where: { isPublic: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      user: { select: { username: true, name: true, image: true } },
      _count: { select: { items: true } },
    },
  });
  return NextResponse.json(lists);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { name, description, isPublic } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const list = await prisma.list.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      isPublic: isPublic !== false,
    },
  });

  return NextResponse.json(list, { status: 201 });
}
