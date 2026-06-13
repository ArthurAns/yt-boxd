import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LikeButton from "@/components/LikeButton";
import StarDisplay from "@/components/StarDisplay";
import Avatar from "@/components/Avatar";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Feed" };

export default async function FeedPage() {
  const session = await auth();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  if (!currentUserId) redirect("/login?callbackUrl=/feed");

  // Who the current user follows
  const follows = await prisma.follow.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  });
  const followingIds = follows.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
          <div className="mx-auto max-w-2xl px-4 py-6">
            <h1 className="text-2xl font-bold">Feed</h1>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
          <div className="text-5xl" aria-hidden="true">
            📺
          </div>
          <p className="text-[var(--text-muted)] font-medium">Your feed is empty.</p>
          <p className="text-sm text-[var(--text-dim)]">
            Follow some members to see what they&apos;re watching, rating and
            reviewing — right here.
          </p>
          <Link
            href="/members"
            className="inline-flex items-center gap-1.5 bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black font-bold px-4 py-2 rounded-md text-sm transition-colors"
          >
            Find people to follow →
          </Link>
        </div>
      </div>
    );
  }

  const entries = await prisma.diaryEntry.findMany({
    where: { userId: { in: followingIds } },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
      video: {
        select: {
          youtubeId: true,
          title: true,
          thumbnailUrl: true,
          channelName: true,
          duration: true,
        },
      },
      likes: { select: { userId: true } },
      _count: { select: { comments: true } },
    },
  });

  return (
    <div className="min-h-screen">
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <h1 className="text-2xl font-bold">Feed</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Recent activity from people you follow
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        {entries.length === 0 ? (
          <p className="text-center text-[var(--text-dim)] py-16 text-sm">
            No activity yet from the people you follow.
          </p>
        ) : (
          entries.map((entry) => {
            const likedByMe = entry.likes.some((l) => l.userId === currentUserId);
            const likeCount = entry.likes.length;

            return (
              <div
                key={entry.id}
                className="bg-[var(--bg-card)] border border-white/[0.06] rounded-lg p-4 space-y-3"
              >
                {/* User row */}
                <div className="flex items-center gap-2">
                  <Link href={`/u/${entry.user.username ?? entry.user.name}`}>
                    <Avatar src={entry.user.image} name={entry.user.name} size={28} interactive />
                  </Link>
                  <div className="flex items-baseline gap-1.5 flex-wrap text-sm">
                    <Link
                      href={`/u/${entry.user.username ?? entry.user.name}`}
                      className="font-medium hover:text-[var(--accent-green)] transition-colors"
                    >
                      {entry.user.name ?? entry.user.username}
                    </Link>
                    <span className="text-[var(--text-dim)] text-xs">watched</span>
                    <Link
                      href={`/video/${entry.video.youtubeId}`}
                      className="text-[var(--text-muted)] hover:text-white transition-colors text-xs"
                    >
                      {entry.video.title}
                    </Link>
                  </div>
                  <span className="ml-auto text-xs text-[var(--text-dim)] flex-shrink-0">
                    {formatDate(entry.watchedDate)}
                  </span>
                </div>

                {/* Video card */}
                <div className="flex gap-3 items-start">
                  {entry.video.thumbnailUrl && (
                    <Link href={`/video/${entry.video.youtubeId}`} className="flex-shrink-0 block overflow-hidden rounded-md">
                      <Image
                        src={entry.video.thumbnailUrl}
                        alt={entry.video.title}
                        width={112}
                        height={63}
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </Link>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      href={`/video/${entry.video.youtubeId}`}
                      className="font-medium text-sm hover:text-[var(--accent-green)] transition-colors line-clamp-2 leading-snug"
                    >
                      {entry.video.title}
                    </Link>
                    {entry.video.channelName && (
                      <p className="text-xs text-[var(--text-dim)]">{entry.video.channelName}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.rating && <StarDisplay rating={entry.rating} />}
                      {entry.liked && (
                        <span className="text-red-400 text-xs" role="img" aria-label="Liked">♥</span>
                      )}
                      {entry.rewatch && (
                        <span className="text-[var(--text-muted)] text-xs" title="Rewatch" role="img" aria-label="Rewatch">↺</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review snippet */}
                {entry.review && (
                  <p className="text-sm text-[var(--text-dim)] leading-relaxed line-clamp-3 border-l-2 border-[var(--border)] pl-3">
                    {entry.review}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-1">
                  <LikeButton
                    diaryEntryId={entry.id}
                    initialLiked={likedByMe}
                    initialCount={likeCount}
                    isLoggedIn={true}
                  />
                  <Link
                    href={`/video/${entry.video.youtubeId}#comments`}
                    className="text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
                  >
                    {entry._count.comments > 0
                      ? `${entry._count.comments} comment${entry._count.comments !== 1 ? "s" : ""}`
                      : "Comment"}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
