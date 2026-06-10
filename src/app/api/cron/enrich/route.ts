import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchApiEnrichmentResult } from "@/lib/youtube";

/**
 * GET /api/cron/enrich
 *
 * Enriches videos that were created with oEmbed-only data (enriched=false),
 * typically because the YouTube Data API quota was exceeded at log time.
 *
 * Secured via CRON_SECRET — Vercel injects this automatically for cron jobs.
 * Also callable manually with `Authorization: Bearer <CRON_SECRET>`.
 *
 * Processes up to BATCH_SIZE videos per run. If quota is hit mid-batch,
 * stops and returns — the next scheduled run will continue.
 * Videos that no longer exist on YouTube are marked enriched=true so they
 * are not retried.
 */

const BATCH_SIZE = 20;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY not configured" }, { status: 503 });
  }

  const videos = await prisma.video.findMany({
    where: { enriched: false },
    orderBy: { createdAt: "asc" }, // oldest pending first
    take: BATCH_SIZE,
    select: { id: true, youtubeId: true },
  });

  if (videos.length === 0) {
    return NextResponse.json({ message: "Nothing to enrich", enriched: 0 });
  }

  let enrichedCount = 0;
  let skippedCount = 0;
  let stoppedDueToQuota = false;

  for (const video of videos) {
    let result;
    try {
      result = await fetchApiEnrichmentResult(video.youtubeId);
    } catch (err) {
      console.error(`Enrichment error for ${video.youtubeId}:`, err);
      skippedCount++;
      continue;
    }

    if (result.status === "quota_exceeded") {
      stoppedDueToQuota = true;
      break;
    }

    if (result.status === "not_found") {
      // Video deleted or unavailable — mark enriched to stop retrying
      await prisma.video.update({
        where: { id: video.id },
        data: { enriched: true, enrichedAt: new Date() },
      });
      skippedCount++;
      continue;
    }

    if (result.status === "ok") {
      const d = result.data;
      await prisma.video.update({
        where: { id: video.id },
        data: {
          channelId: d.channelId,
          channelName: d.channelName,
          description: d.description,
          duration: d.duration,
          publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
          viewCount: BigInt(d.viewCount),
          tags: d.tags,
          enriched: true,
          enrichedAt: new Date(),
        },
      });
      enrichedCount++;
    }
  }

  const remaining = await prisma.video.count({ where: { enriched: false } });

  return NextResponse.json({
    enriched: enrichedCount,
    skipped: skippedCount,
    remaining,
    stoppedDueToQuota,
  });
}
