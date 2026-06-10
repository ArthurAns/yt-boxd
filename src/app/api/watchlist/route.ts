import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseYouTubeId } from "@/lib/youtube";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { youtubeId } = await req.json();
  if (!youtubeId) {
    return NextResponse.json({ error: "youtubeId required" }, { status: 400 });
  }

  const video = await prisma.video.findUnique({ where: { youtubeId } });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const item = await prisma.watchlistItem.upsert({
    where: { userId_videoId: { userId: session.user.id, videoId: video.id } },
    create: { userId: session.user.id, videoId: video.id },
    update: {},
  });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { youtubeId } = await req.json();
  if (!youtubeId) {
    return NextResponse.json({ error: "youtubeId required" }, { status: 400 });
  }

  const video = await prisma.video.findUnique({ where: { youtubeId } });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  await prisma.watchlistItem.deleteMany({
    where: { userId: session.user.id, videoId: video.id },
  });

  return new NextResponse(null, { status: 204 });
}
