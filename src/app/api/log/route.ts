import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseYouTubeId, fetchVideoMetadata } from "@/lib/youtube";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { url, watchedDate, rating, liked, rewatch, review } = body;

  // ── Parse YouTube ID ──────────────────────────────────────────────────────
  const youtubeId = parseYouTubeId(url ?? "");
  if (!youtubeId) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  // ── Upsert Video record ───────────────────────────────────────────────────
  let video = await prisma.video.findUnique({ where: { youtubeId } });
  let quotaExceeded = false;

  if (!video) {
    // Fetch metadata (oEmbed always runs; API enrichment is best-effort)
    const meta = await fetchVideoMetadata(youtubeId);
    quotaExceeded = meta.quotaExceeded ?? false;

    video = await prisma.video.create({
      data: {
        youtubeId,
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

  // ── Parse watchedDate ─────────────────────────────────────────────────────
  const parsed = new Date(watchedDate);
  if (isNaN(parsed.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  // ── Validate rating ───────────────────────────────────────────────────────
  const ratingValue: number | null =
    rating !== null && rating !== undefined ? parseFloat(rating) : null;
  if (
    ratingValue !== null &&
    (isNaN(ratingValue) || ratingValue < 0.5 || ratingValue > 5)
  ) {
    return NextResponse.json({ error: "Rating must be 0.5–5" }, { status: 400 });
  }

  // ── Create or update DiaryEntry ───────────────────────────────────────────
  const entry = await prisma.diaryEntry.upsert({
    where: {
      userId_videoId_watchedDate: {
        userId: session.user.id,
        videoId: video.id,
        watchedDate: parsed,
      },
    },
    create: {
      userId: session.user.id,
      videoId: video.id,
      watchedDate: parsed,
      rating: ratingValue,
      liked: liked ?? false,
      rewatch: rewatch ?? false,
      review: review ?? null,
    },
    update: {
      rating: ratingValue,
      liked: liked ?? false,
      rewatch: rewatch ?? false,
      review: review ?? null,
    },
  });

  return NextResponse.json({
    entry,
    video: { youtubeId: video.youtubeId, title: video.title, thumbnailUrl: video.thumbnailUrl },
    quotaExceeded,
  });
}
