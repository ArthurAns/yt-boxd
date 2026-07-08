import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Heart, RotateCcw, Tv } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LikeButton from "@/components/LikeButton";
import StarDisplay from "@/components/StarDisplay";
import Avatar from "@/components/Avatar";
import PageHeader from "@/components/PageHeader";
import { buttonVariants } from "@/components/ui/button";
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
        <PageHeader title="Feed" maxWidth="max-w-2xl" />
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-16 text-center">
          <Tv className="mx-auto size-10 text-faint" aria-hidden="true" />
          <p className="font-medium text-muted">Your feed is empty.</p>
          <p className="text-sm text-faint">
            Follow some members to see what they&apos;re watching, rating and
            reviewing — right here.
          </p>
          <div className="pt-2">
            <Link href="/members" className={buttonVariants()}>
              Find people to follow
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const entries = await prisma.diaryEntry.findMany({
    where: { userId: { in: followingIds }, watchedDate: { not: null } },
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
      <PageHeader
        title="Feed"
        subtitle="Recent activity from people you follow"
        maxWidth="max-w-2xl"
      />

      <div className="mx-auto max-w-2xl space-y-3 px-4 pb-10">
        {entries.length === 0 ? (
          <p className="py-16 text-center text-sm text-faint">
            No activity yet from the people you follow.
          </p>
        ) : (
          entries.map((entry) => {
            const likedByMe = entry.likes.some((l) => l.userId === currentUserId);
            const likeCount = entry.likes.length;

            return (
              <article
                key={entry.id}
                className="space-y-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-border-strong"
              >
                {/* User row */}
                <div className="flex items-center gap-2.5">
                  <Link href={`/u/${entry.user.username ?? entry.user.name}`}>
                    <Avatar src={entry.user.image} name={entry.user.name} size={28} interactive />
                  </Link>
                  <div className="flex flex-wrap items-baseline gap-1.5 text-sm">
                    <Link
                      href={`/u/${entry.user.username ?? entry.user.name}`}
                      className="font-semibold transition-colors hover:text-primary"
                    >
                      {entry.user.name ?? entry.user.username}
                    </Link>
                    <span className="text-xs text-faint">watched</span>
                  </div>
                  <span className="ml-auto flex-shrink-0 text-xs text-faint">
                    {formatDate(entry.watchedDate)}
                  </span>
                </div>

                {/* Video card */}
                <div className="flex items-start gap-3">
                  {entry.video.thumbnailUrl && (
                    <Link
                      href={`/video/${entry.video.youtubeId}`}
                      className="block flex-shrink-0 overflow-hidden rounded-lg"
                    >
                      <Image
                        src={entry.video.thumbnailUrl}
                        alt={entry.video.title}
                        width={128}
                        height={72}
                        className="aspect-video object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </Link>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <Link
                      href={`/video/${entry.video.youtubeId}`}
                      className="line-clamp-2 text-sm font-medium leading-snug transition-colors hover:text-primary"
                    >
                      {entry.video.title}
                    </Link>
                    {entry.video.channelName && (
                      <p className="text-xs text-faint">{entry.video.channelName}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {entry.rating && <StarDisplay rating={entry.rating} />}
                      {entry.liked && (
                        <Heart
                          className="size-3 fill-current text-primary"
                          role="img"
                          aria-label="Liked"
                        />
                      )}
                      {entry.rewatch && (
                        <RotateCcw
                          className="size-3 text-muted"
                          role="img"
                          aria-label="Rewatch"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Review snippet */}
                {entry.review && (
                  <p className="line-clamp-3 border-l-2 border-primary/40 pl-3 text-sm leading-relaxed text-muted">
                    {entry.review}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-0.5">
                  <LikeButton
                    diaryEntryId={entry.id}
                    initialLiked={likedByMe}
                    initialCount={likeCount}
                    isLoggedIn={true}
                  />
                  <Link
                    href={`/video/${entry.video.youtubeId}#comments`}
                    className="text-xs font-medium text-faint transition-colors hover:text-muted"
                  >
                    {entry._count.comments > 0
                      ? `${entry._count.comments} comment${entry._count.comments !== 1 ? "s" : ""}`
                      : "Comment"}
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
