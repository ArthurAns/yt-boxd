import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseYouTubeId, fetchVideoMetadata } from "@/lib/youtube";

type Action = "watch" | "unwatch" | "like" | "unlike" | "rate" | "unrate";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const { youtubeId, action, rating }: { youtubeId: string; action: Action; rating?: number } = body;

  if (!youtubeId || !action) {
    return NextResponse.json({ error: "youtubeId and action required" }, { status: 400 });
  }

  // Resolve or create the video record (same pattern as /api/log)
  let video = await prisma.video.findUnique({ where: { youtubeId } });
  if (!video) {
    const parsed = parseYouTubeId(youtubeId);
    if (!parsed) return NextResponse.json({ error: "Invalid YouTube ID" }, { status: 400 });
    const meta = await fetchVideoMetadata(parsed);
    video = await prisma.video.create({
      data: {
        youtubeId: parsed,
        title: meta.title,
        thumbnailUrl: meta.thumbnailUrl,
        channelName: meta.authorName ?? meta.channelName,
        channelId: meta.channelId,
        description: meta.description,
        duration: meta.duration,
        publishedAt: meta.publishedAt ? new Date(meta.publishedAt) : null,
        viewCount: meta.viewCount ? BigInt(meta.viewCount) : null,
        tags: meta.tags ?? [],
        enriched: meta.enriched,
        enrichedAt: meta.enriched ? new Date() : null,
      },
    });
  }

  // Find the user's existing undated entry for this video (if any)
  const existing = await prisma.diaryEntry.findFirst({
    where: { userId, videoId: video.id, watchedDate: null },
  });

  // ── Handle each action ────────────────────────────────────────────────────

  if (action === "watch") {
    if (existing) return NextResponse.json({ entry: existing });
    const entry = await prisma.diaryEntry.create({
      data: { userId, videoId: video.id, watchedDate: null },
    });
    return NextResponse.json({ entry });
  }

  if (action === "unwatch") {
    if (!existing) return NextResponse.json({ entry: null });
    // Delete the whole undated entry (rating/like go with it)
    await prisma.diaryEntry.delete({ where: { id: existing.id } });
    return NextResponse.json({ entry: null });
  }

  if (action === "like") {
    if (existing) {
      const entry = await prisma.diaryEntry.update({
        where: { id: existing.id },
        data: { liked: true },
      });
      return NextResponse.json({ entry });
    }
    const entry = await prisma.diaryEntry.create({
      data: { userId, videoId: video.id, watchedDate: null, liked: true },
    });
    return NextResponse.json({ entry });
  }

  if (action === "unlike") {
    if (!existing) return NextResponse.json({ entry: null });
    if (!existing.rating) {
      await prisma.diaryEntry.delete({ where: { id: existing.id } });
      return NextResponse.json({ entry: null });
    }
    const entry = await prisma.diaryEntry.update({
      where: { id: existing.id },
      data: { liked: false },
    });
    return NextResponse.json({ entry });
  }

  if (action === "rate") {
    const ratingValue = rating !== undefined ? parseFloat(String(rating)) : null;
    if (ratingValue === null || isNaN(ratingValue) || ratingValue < 0.5 || ratingValue > 5) {
      return NextResponse.json({ error: "Rating must be 0.5–5" }, { status: 400 });
    }
    if (existing) {
      const entry = await prisma.diaryEntry.update({
        where: { id: existing.id },
        data: { rating: ratingValue },
      });
      return NextResponse.json({ entry });
    }
    const entry = await prisma.diaryEntry.create({
      data: { userId, videoId: video.id, watchedDate: null, rating: ratingValue },
    });
    return NextResponse.json({ entry });
  }

  if (action === "unrate") {
    if (!existing) return NextResponse.json({ entry: null });
    if (!existing.liked) {
      await prisma.diaryEntry.delete({ where: { id: existing.id } });
      return NextResponse.json({ entry: null });
    }
    const entry = await prisma.diaryEntry.update({
      where: { id: existing.id },
      data: { rating: null },
    });
    return NextResponse.json({ entry });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
