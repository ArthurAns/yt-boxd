import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import VideoEmbed from "@/components/VideoEmbed";
import WatchlistButton from "@/components/WatchlistButton";
import VideoQuickActions from "@/components/VideoQuickActions";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";
import StarDisplay from "@/components/StarDisplay";
import Avatar from "@/components/Avatar";
import { formatDate } from "@/lib/format";

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ youtubeId: string }>;
}): Promise<Metadata> {
  const { youtubeId } = await params;
  const video = await prisma.video.findUnique({ where: { youtubeId } });
  if (!video) return { title: "Video not found" };
  return {
    title: video.title,
    description: video.description?.slice(0, 160) ?? undefined,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCount(n: bigint | number | null) {
  if (n == null) return null;
  const num = typeof n === "bigint" ? Number(n) : n;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toString();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VideoPage({
  params,
}: {
  params: Promise<{ youtubeId: string }>;
}) {
  const { youtubeId } = await params;

  const video = await prisma.video.findUnique({ where: { youtubeId } });
  if (!video) notFound();

  const [entries, session] = await Promise.all([
    prisma.diaryEntry.findMany({
      where: { videoId: video.id },
      orderBy: [{ watchedDate: "desc" }, { createdAt: "desc" }],
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        likes: { select: { userId: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true, username: true, image: true } } },
        },
      },
    }),
    auth(),
  ]);

  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  // ── Per-user state ───────────────────────────────────────────────────────
  const [inWatchlist, undatedEntry] = await Promise.all([
    currentUserId
      ? prisma.watchlistItem.findUnique({
          where: { userId_videoId: { userId: currentUserId, videoId: video.id } },
        }).then(Boolean)
      : Promise.resolve(false),
    currentUserId
      ? prisma.diaryEntry.findFirst({
          where: { userId: currentUserId, videoId: video.id, watchedDate: null },
          select: { id: true, liked: true, rating: true },
        })
      : Promise.resolve(null),
  ]);

  // ── Aggregate stats — all entries (dated + undated) ─────────────────────
  const watchCount = entries.length;
  const ratings = entries.map((e) => e.rating).filter((r): r is number => r !== null);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;
  const likeCount = entries.filter((e) => e.liked).length;

  // Distribution of ratings in half-star buckets (0.5 … 5)
  const ratingBuckets = Array.from({ length: 10 }, (_, i) => {
    const value = (i + 1) / 2;
    return { value, count: ratings.filter((r) => r === value).length };
  });
  const maxBucket = Math.max(...ratingBuckets.map((b) => b.count), 1);

  // ── Current user's most recent *dated* diary entry (for the review badge) ──
  const ownEntry = currentUserId
    ? entries.find((e) => e.user.id === currentUserId && e.watchedDate !== null) ?? null
    : null;

  // ── Reviews and watch-only entries (dated entries only shown to others) ──
  const reviewEntries = entries.filter((e) => e.review && e.watchedDate !== null);
  const watchOnlyEntries = entries.filter((e) => !e.review && e.watchedDate !== null);

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <div className="border-b border-border bg-inset">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex flex-col gap-8 md:flex-row">
            {/* Embed / thumbnail */}
            <div className="w-full flex-shrink-0 md:w-[440px]">
              <VideoEmbed
                youtubeId={youtubeId}
                title={video.title}
                thumbnailUrl={video.thumbnailUrl}
              />
            </div>

            {/* Info */}
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold leading-snug">
                  {video.title}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {video.channelName && (
                    <p className="text-sm font-medium text-muted">{video.channelName}</p>
                  )}
                  <span className="flex flex-wrap gap-x-3 text-xs text-faint">
                    {video.duration && <span>{video.duration}</span>}
                    {video.publishedAt && (
                      <span>
                        {new Date(video.publishedAt).toLocaleDateString("en-GB", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {video.viewCount != null && (
                      <span>{formatCount(video.viewCount)} views</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Community stats */}
              <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
                <div>
                  <div className="font-display text-xl font-bold leading-none">
                    {watchCount}
                  </div>
                  <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-faint">
                    Watched
                  </div>
                </div>
                {avgRating !== null && (
                  <div>
                    <div className="font-display text-xl font-bold leading-none text-star">
                      {avgRating.toFixed(1)}
                    </div>
                    <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-faint">
                      Avg rating
                    </div>
                  </div>
                )}
                {likeCount > 0 && (
                  <div>
                    <div className="font-display text-xl font-bold leading-none text-primary">
                      {likeCount}
                    </div>
                    <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-faint">
                      Liked
                    </div>
                  </div>
                )}
                {ratings.length > 0 && (
                  <div
                    className="flex items-end gap-1.5"
                    role="img"
                    aria-label={`Rating distribution across ${ratings.length} rating${ratings.length !== 1 ? "s" : ""}`}
                  >
                    <span className="pb-px text-[10px] leading-none text-faint">½★</span>
                    <div className="flex h-9 items-end gap-[3px]">
                      {ratingBuckets.map(({ value, count }) => (
                        <div
                          key={value}
                          title={`${value}★ — ${count} rating${count !== 1 ? "s" : ""}`}
                          className={`w-2 rounded-sm transition-colors ${
                            count > 0
                              ? "bg-star/80 hover:bg-star"
                              : "bg-white/10"
                          }`}
                          style={{
                            height: `${Math.max((count / maxBucket) * 100, 8)}%`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="pb-px text-[10px] leading-none text-faint">5★</span>
                  </div>
                )}
              </div>

              {/* Quick actions + diary entry badge */}
              <div className="mt-auto space-y-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <VideoQuickActions
                    youtubeId={youtubeId}
                    undatedEntry={undatedEntry}
                    hasDatedEntry={!!ownEntry}
                    isLoggedIn={!!currentUserId}
                  />
                  <WatchlistButton
                    youtubeId={youtubeId}
                    initialInWatchlist={inWatchlist as boolean}
                    isLoggedIn={!!currentUserId}
                  />
                </div>
                {ownEntry && (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm">
                    <span className="text-xs font-bold uppercase tracking-wide text-primary">
                      Your review
                    </span>
                    <span className="text-xs text-muted">
                      {formatDate(ownEntry.watchedDate)}
                    </span>
                    {ownEntry.rating && (
                      <StarDisplay rating={ownEntry.rating} className="" />
                    )}
                    {ownEntry.liked && (
                      <span className="text-xs text-primary" role="img" aria-label="Liked">♥</span>
                    )}
                    {ownEntry.rewatch && (
                      <span className="text-xs text-muted" role="img" aria-label="Rewatch">↺</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description (collapsed) */}
          {video.description && (
            <details className="group mt-6">
              <summary className="flex cursor-pointer select-none list-none items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-foreground">
                <svg
                  className="h-3 w-3 transition-transform group-open:rotate-90"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 4.707a1 1 0 011.414 0L14.414 10l-5.707 5.293a1 1 0 01-1.414-1.414L11.586 10 7.293 6.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Description
              </summary>
              <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-faint">
                {video.description}
              </p>
            </details>
          )}
        </div>
      </div>

      {/* ── Reviews & watches ── */}
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
        {/* Reviews */}
        {reviewEntries.length > 0 && (
          <section id="comments" className="scroll-mt-20">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-faint">
              Reviews
            </h2>
            <div className="space-y-3">
              {reviewEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="space-y-2 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <Link href={`/u/${entry.user.username ?? entry.user.name}`}>
                      <Avatar src={entry.user.image} name={entry.user.name} size={32} interactive />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/u/${entry.user.username ?? entry.user.name}`}
                        className="text-sm font-semibold transition-colors hover:text-primary"
                      >
                        {entry.user.name ?? entry.user.username}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2">
                        {entry.watchedDate && (
                          <span className="text-xs text-faint">
                            {formatDate(entry.watchedDate)}
                          </span>
                        )}
                        {entry.rating && (
                          <StarDisplay rating={entry.rating} className="" />
                        )}
                        {entry.liked && (
                          <span className="text-xs text-primary" role="img" aria-label="Liked">♥</span>
                        )}
                        {entry.rewatch && (
                          <span className="text-xs text-muted" title="Rewatch" role="img" aria-label="Rewatch">
                            ↺
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="whitespace-pre-line pl-11 text-sm leading-relaxed text-muted">
                    {entry.review}
                  </p>
                  <div className="mt-2 flex items-center gap-4 pl-11">
                    <LikeButton
                      diaryEntryId={entry.id}
                      initialLiked={entry.likes.some((l) => l.userId === currentUserId)}
                      initialCount={entry.likes.length}
                      isLoggedIn={!!currentUserId}
                    />
                  </div>
                  <CommentSection
                    diaryEntryId={entry.id}
                    initialComments={entry.comments}
                    currentUserId={currentUserId ?? null}
                    isLoggedIn={!!currentUserId}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Watch-only entries (no review) */}
        {watchOnlyEntries.length > 0 && (
          <section>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-faint">
              Also watched by
            </h2>
            <div className="flex flex-wrap gap-2">
              {watchOnlyEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/u/${entry.user.username ?? entry.user.name}`}
                  className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 text-sm transition-colors hover:border-border-strong hover:bg-card-hover"
                >
                  <Avatar src={entry.user.image} name={entry.user.name} size={24} interactive />
                  <span className="text-xs text-muted">
                    {entry.user.username ?? entry.user.name}
                  </span>
                  {entry.rating && (
                    <span
                      className="text-xs text-star"
                      role="img"
                      aria-label={`Rated ${entry.rating} out of 5 stars`}
                    >
                      {entry.rating}★
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {watchCount === 0 && (
          <div className="py-16 text-center text-faint">
            <p className="text-lg">No one has watched this video yet.</p>
            <p className="mt-1 text-sm">Be the first to mark it as watched or write a review.</p>
          </div>
        )}
      </div>
    </div>
  );
}
