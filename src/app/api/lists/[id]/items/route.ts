import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchOEmbed } from "@/lib/youtube";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const list = await prisma.list.findUnique({ where: { id } });
  if (!list || list.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { youtubeId, note } = await req.json();
  if (!youtubeId) {
    return NextResponse.json({ error: "youtubeId required" }, { status: 400 });
  }

  // Create the video record if it hasn't been logged yet
  let video = await prisma.video.findUnique({ where: { youtubeId } });
  if (!video) {
    try {
      const meta = await fetchOEmbed(youtubeId);
      video = await prisma.video.create({
        data: {
          youtubeId,
          title: meta.title,
          thumbnailUrl: meta.thumbnailUrl,
          channelName: meta.authorName,
          enriched: false,
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Could not find that video on YouTube" },
        { status: 404 }
      );
    }
  }

  // Check not already in list
  const existing = await prisma.listItem.findUnique({
    where: { listId_videoId: { listId: id, videoId: video.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already in list" }, { status: 409 });
  }

  const count = await prisma.listItem.count({ where: { listId: id } });

  const item = await prisma.listItem.create({
    data: {
      listId: id,
      videoId: video.id,
      position: count + 1,
      note: note?.trim() || null,
    },
  });

  await prisma.list.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const list = await prisma.list.findUnique({ where: { id } });
  if (!list || list.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { youtubeId } = await req.json();
  const video = await prisma.video.findUnique({ where: { youtubeId } });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  await prisma.listItem.deleteMany({
    where: { listId: id, videoId: video.id },
  });

  // Re-number positions to keep them contiguous
  const remaining = await prisma.listItem.findMany({
    where: { listId: id },
    orderBy: { position: "asc" },
  });
  await Promise.all(
    remaining.map((item, i) =>
      prisma.listItem.update({ where: { id: item.id }, data: { position: i + 1 } })
    )
  );

  return new NextResponse(null, { status: 204 });
}
