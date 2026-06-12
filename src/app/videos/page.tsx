import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

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
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Videos</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Everything logged on YTBoxd
            </p>
          </div>
          <div className="flex gap-2" role="group" aria-label="Sort videos">
            {SORTS.map(({ key, label }) => (
              <Link
                key={key}
                href={pageHref(key, 1)}
                aria-current={sort === key ? "page" : undefined}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  sort === key
                    ? "border-[var(--accent-green)] text-[var(--accent-green)] bg-[var(--accent-green)]/10"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:border-white/30"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {videos.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-dim)]">
            <p>No videos here yet.</p>
            <Link
              href="/log"
              className="mt-4 inline-block text-[var(--accent-green)] hover:underline text-sm"
            >
              Be the first to log one →
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {videos.map((video) => (
                <Link
                  key={video.youtubeId}
                  href={`/video/${video.youtubeId}`}
                  className="group space-y-2"
                >
                  <div className="relative aspect-video bg-[var(--bg-card)] rounded-md overflow-hidden">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[var(--text-dim)] text-xs">
                        No thumbnail
                      </div>
                    )}
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded-md">
                        {video.duration}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-[var(--accent-green)] transition-colors leading-snug">
                      {video.title}
                    </p>
                    {video.channelName && (
                      <p className="text-xs text-[var(--text-dim)] mt-0.5 truncate">
                        {video.channelName}
                      </p>
                    )}
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {video.avgRating !== null && (
                        <span className="text-[var(--star-color)]">
                          {video.avgRating.toFixed(1)}★ ·{" "}
                        </span>
                      )}
                      {video.watches} {video.watches === 1 ? "watch" : "watches"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-4 mt-10 text-sm"
                aria-label="Pagination"
              >
                {page > 1 ? (
                  <Link
                    href={pageHref(sort, page - 1)}
                    className="text-[var(--text-muted)] hover:text-white border border-[var(--border)] hover:border-white/30 rounded-md px-3 py-1.5 transition-colors"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="text-[var(--text-dim)]/50 border border-[var(--border)]/50 rounded-md px-3 py-1.5 select-none">
                    ← Previous
                  </span>
                )}
                <span className="text-xs text-[var(--text-muted)]">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={pageHref(sort, page + 1)}
                    className="text-[var(--text-muted)] hover:text-white border border-[var(--border)] hover:border-white/30 rounded-md px-3 py-1.5 transition-colors"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="text-[var(--text-dim)]/50 border border-[var(--border)]/50 rounded-md px-3 py-1.5 select-none">
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
