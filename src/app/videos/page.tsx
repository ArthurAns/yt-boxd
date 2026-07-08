import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import VideoCard from "@/components/VideoCard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Videos" };

const PAGE_SIZE = 30;

const SORTS = [
  { key: "logged", label: "Most logged" },
  { key: "recent", label: "Recently added" },
  { key: "rating", label: "Top rated" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

function pageHref(sort: SortKey, page: number) {
  const params = new URLSearchParams();
  if (sort !== "logged") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/videos?${query}` : "/videos";
}

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { sort: sortParam, page: pageParam } = await searchParams;
  const sort: SortKey =
    sortParam === "recent" || sortParam === "rating" ? sortParam : "logged";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  type VideoCard = {
    youtubeId: string;
    title: string;
    thumbnailUrl: string | null;
    channelName: string | null;
    duration: string | null;
    watches: number;
    avgRating: number | null;
  };

  let videos: VideoCard[];
  let totalPages: number;

  if (sort === "rating") {
    // Average rating lives on diary entries, so rank via groupBy then fetch.
    const grouped = await prisma.diaryEntry.groupBy({
      by: ["videoId"],
      where: { rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    grouped.sort(
      (a, b) =>
        (b._avg.rating ?? 0) - (a._avg.rating ?? 0) ||
        b._count.rating - a._count.rating
    );
    totalPages = Math.max(1, Math.ceil(grouped.length / PAGE_SIZE));
    const pageSlice = grouped.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const found = await prisma.video.findMany({
      where: { id: { in: pageSlice.map((g) => g.videoId) } },
      include: { _count: { select: { diaryEntries: true } } },
    });
    const byId = new Map(found.map((v) => [v.id, v]));
    videos = pageSlice.flatMap((g) => {
      const video = byId.get(g.videoId);
      if (!video) return [];
      return [
        {
          youtubeId: video.youtubeId,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          channelName: video.channelName,
          duration: video.duration,
          watches: video._count.diaryEntries,
          avgRating: g._avg.rating,
        },
      ];
    });
  } else {
    const [found, totalCount] = await Promise.all([
      prisma.video.findMany({
        orderBy:
          sort === "recent"
            ? { createdAt: "desc" }
            : { diaryEntries: { _count: "desc" } },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { _count: { select: { diaryEntries: true } } },
      }),
      prisma.video.count(),
    ]);
    totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    videos = found.map((video) => ({
      youtubeId: video.youtubeId,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      channelName: video.channelName,
      duration: video.duration,
      watches: video._count.diaryEntries,
      avgRating: null,
    }));
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 pt-10 pb-6">
        <div className="space-y-1.5">
          <h1 className="font-display text-3xl font-bold tracking-tight">Videos</h1>
          <p className="text-sm text-muted">Everything logged on ytboxd</p>
        </div>
        <div
          className="flex gap-1 rounded-xl border border-border bg-card p-1"
          role="group"
          aria-label="Sort videos"
        >
          {SORTS.map(({ key, label }) => (
            <Link
              key={key}
              href={pageHref(key, 1)}
              aria-current={sort === key ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                sort === key
                  ? "bg-white/[0.09] text-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-10">
        {videos.length === 0 ? (
          <div className="py-20 text-center text-faint">
            <p>No videos here yet.</p>
            <Link
              href="/log"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Be the first to log one →
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {videos.map((video) => (
                <VideoCard
                  key={video.youtubeId}
                  youtubeId={video.youtubeId}
                  title={video.title}
                  thumbnailUrl={video.thumbnailUrl}
                  channelName={video.channelName}
                  duration={video.duration}
                  footer={
                    <p className="mt-0.5 text-xs text-muted">
                      {video.avgRating !== null && (
                        <span className="text-star">
                          {video.avgRating.toFixed(1)}★ ·{" "}
                        </span>
                      )}
                      {video.watches} {video.watches === 1 ? "watch" : "watches"}
                    </p>
                  }
                />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                className="mt-10 flex items-center justify-center gap-4 text-sm"
                aria-label="Pagination"
              >
                {page > 1 ? (
                  <Link
                    href={pageHref(sort, page - 1)}
                    className="rounded-lg border border-border-strong px-3 py-1.5 text-muted transition-colors hover:border-white/30 hover:text-foreground"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="select-none rounded-lg border border-border px-3 py-1.5 text-faint/60">
                    ← Previous
                  </span>
                )}
                <span className="text-xs text-muted">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={pageHref(sort, page + 1)}
                    className="rounded-lg border border-border-strong px-3 py-1.5 text-muted transition-colors hover:border-white/30 hover:text-foreground"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="select-none rounded-lg border border-border px-3 py-1.5 text-faint/60">
                    Next →
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
