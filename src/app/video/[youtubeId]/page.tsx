import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import VideoEmbed from "@/components/VideoEmbed";
import WatchlistButton from "@/components/WatchlistButton";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";
import StarDisplay from "@/components/StarDisplay";
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

  // ── Watchlist state for current user ────────────────────────────────────
  const inWatchlist = currentUserId
    ? !!(await prisma.watchlistItem.findUnique({
        where: { userId_videoId: { userId: currentUserId, videoId: video.id } },
      }))
    : false;

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const watchCount = entries.length;
  const ratings = entries.map((e) => e.rating).filter((r): r is number => r !== null);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;
  const likeCount = entries.filter((e) => e.liked).length;

  // ── Current user's own entry (if any) ───────────────────────────────────
  const ownEntry = currentUserId
    ? entries.find((e) => e.user.id === currentUserId) ?? null
    : null;

  // ── Entries with reviews to show in the reviews section ─────────────────
  const reviewEntries = entries.filter((e) => e.review);
  // Other watches (no review) shown in a compact list
  const watchOnlyEntries = entries.filter((e) => !e.review);

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Embed / thumbnail */}
            <div className="w-full md:w-[420px] flex-shrink-0">
              <VideoEmbed
                youtubeId={youtubeId}
                title={video.title}
                thumbnailUrl={video.thumbnailUrl}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <div>
                <h1 className="text-2xl font-bold leading-snug">{video.title}</h1>
                {video.channelName && (
                  <p className="text-[var(--text-muted)] text-sm mt-1">
                    {video.channelName}
                  </p>
                )}
              </div>

              {/* Video metadata row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-dim)]">
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
              </div>

              {/* Community stats */}
              <div className="flex gap-6 mt-1">
                <div className="text-center">
                  <div className="text-white font-bold text-lg leading-none">
                    {watchCount}
                  </div>
                  <div className="text-[var(--text-muted)] text-xs mt-0.5 uppercase tracking-wide">
                    Watched
                  </div>
                </div>
                {avgRating !== null && (
                  <div className="text-center">
                    <div className="text-[var(--star-color)] font-bold text-lg leading-none">
                      {avgRating.toFixed(1)}
                    </div>
                    <div className="text-[var(--text-muted)] text-xs mt-0.5 uppercase tracking-wide">
                      Avg rating
                    </div>
                  </div>
                )}
                {likeCount > 0 && (
                  <div className="text-center">
                    <div className="text-red-400 font-bold text-lg leading-none">
                      {likeCount}
                    </div>
                    <div className="text-[var(--text-muted)] text-xs mt-0.5 uppercase tracking-wide">
                      Liked
                    </div>
                  </div>
                )}
              </div>

              {/* Own entry summary or CTA */}
              <div className="mt-auto pt-2 space-y-2">
                {ownEntry ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-[var(--bg-card)] rounded-lg px-3 py-2 text-sm">
                      <span className="text-[var(--accent-green)] text-xs font-bold uppercase tracking-wide">
                        You watched
                      </span>
                      <span className="text-[var(--text-muted)] text-xs">
                        {formatDate(ownEntry.watchedDate)}
                      </span>
                      {ownEntry.rating && (
                        <StarDisplay rating={ownEntry.rating} className="" />
                      )}
                      {ownEntry.liked && (
                        <span className="text-red-400 text-xs" role="img" aria-label="Liked">♥</span>
                      )}
                      {ownEntry.rewatch && (
                        <span className="text-[var(--text-muted)] text-xs" role="img" aria-label="Rewatch">↺</span>
                      )}
                    </div>
                    <Link
                      href={`/log?v=${youtubeId}`}
                      className="text-xs text-[var(--text-muted)] border border-[var(--border)] rounded px-3 py-2 hover:text-white hover:border-white/30 transition-colors"
                    >
                      Log again
                    </Link>
                  </div>
                ) : (
                  <div>
                    <Link
                      href={`/log?v=${youtubeId}`}
                      className="inline-flex items-center gap-1.5 bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black font-bold px-4 py-2 rounded text-sm transition-colors"
                    >
                      + Log this video
                    </Link>
                  </div>
                )}
                <WatchlistButton
                  youtubeId={youtubeId}
                  initialInWatchlist={inWatchlist}
                  isLoggedIn={!!currentUserId}
                />
              </div>
            </div>
          </div>

          {/* Description (collapsed) */}
          {video.description && (
            <details className="mt-6 group">
              <summary className="cursor-pointer text-xs text-[var(--text-muted)] hover:text-white transition-colors list-none flex items-center gap-1 select-none">
                <svg
                  className="w-3 h-3 transition-transform group-open:rotate-90"
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
              <p className="mt-2 text-sm text-[var(--text-dim)] whitespace-pre-line max-w-2xl leading-relaxed">
                {video.description}
              </p>
            </details>
          )}
        </div>
      </div>

      {/* ── Reviews & watches ── */}
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">
        {/* Reviews */}
        {reviewEntries.length > 0 && (
          <section id="comments" className="scroll-mt-20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
              Reviews
            </h2>
            <div className="space-y-4">
              {reviewEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-[var(--bg-card)] rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center gap-3">
                    {entry.user.image ? (
                      <Link href={`/u/${entry.user.username ?? entry.user.name}`}>
                        <Image
                          src={entry.user.image}
                          alt={entry.user.name ?? ""}
                          width={32}
                          height={32}
                          className="rounded-full hover:opacity-80 transition-opacity"
                        />
                      </Link>
                    ) : (
                      <Link
                        href={`/u/${entry.user.username ?? entry.user.name}`}
                        className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-xs text-[var(--text-muted)] hover:opacity-80"
                      >
                        {(entry.user.name ?? "?")[0].toUpperCase()}
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/u/${entry.user.username ?? entry.user.name}`}
                        className="font-medium text-sm hover:text-[var(--accent-green)] transition-colors"
                      >
                        {entry.user.name ?? entry.user.username}
                      </Link>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-[var(--text-muted)]">
                          {formatDate(entry.watchedDate)}
                        </span>
                        {entry.rating && (
                          <StarDisplay rating={entry.rating} className="" />
                        )}
                        {entry.liked && (
                          <span className="text-red-400 text-xs" role="img" aria-label="Liked">♥</span>
                        )}
                        {entry.rewatch && (
                          <span className="text-[var(--text-muted)] text-xs" title="Rewatch" role="img" aria-label="Rewatch">
                            ↺
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-dim)] leading-relaxed whitespace-pre-line pl-11">
                    {entry.review}
                  </p>
                  <div className="pl-11 flex items-center gap-4 mt-2">
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
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
              Also watched by
            </h2>
            <div className="flex flex-wrap gap-2">
              {watchOnlyEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/u/${entry.user.username ?? entry.user.name}`}
                  className="flex items-center gap-2 bg-[var(--bg-card)] rounded-full pl-1 pr-3 py-1 hover:bg-[var(--bg-secondary)] transition-colors text-sm"
                >
                  {entry.user.image ? (
                    <Image
                      src={entry.user.image}
                      alt={entry.user.name ?? ""}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-xs text-[var(--text-muted)]">
                      {(entry.user.name ?? "?")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="text-[var(--text-muted)] text-xs">
                    {entry.user.username ?? entry.user.name}
                  </span>
                  {entry.rating && (
                    <span
                      className="text-[var(--star-color)] text-xs"
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
          <div className="text-center py-16 text-[var(--text-dim)]">
            <p className="text-lg">No one has logged this video yet.</p>
            <Link
              href={`/log?v=${youtubeId}`}
              className="mt-4 inline-flex items-center gap-1.5 bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black font-bold px-4 py-2 rounded text-sm transition-colors"
            >
              + Be the first
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
