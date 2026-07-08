import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import FollowButton from "@/components/FollowButton";
import StarDisplay from "@/components/StarDisplay";
import AddToListButton from "@/components/AddToListButton";
import Avatar from "@/components/Avatar";
import { formatDate } from "@/lib/format";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const profileUser = await prisma.user.findUnique({
    where: { username },
    include: {
      favoriteVideos: { include: { video: true }, orderBy: { position: "asc" } },
    },
  });

  if (!profileUser) notFound();

  const session = await auth();
  const currentUserId = (session?.user as { id?: string })?.id;
  const isOwn = currentUserId === profileUser.id;

  // Stats + social counts + follow state
  const [totalWatchedRows, totalRatings, thisYearCount, followerCount, followingCount, isFollowing, userLists, ownListsForSelector] = await Promise.all([
    prisma.diaryEntry.findMany({
      where: { userId: profileUser.id },
      select: { videoId: true },
      distinct: ["videoId"],
    }),
    prisma.diaryEntry.count({
      where: { userId: profileUser.id, rating: { not: null } },
    }),
    prisma.diaryEntry.count({
      where: {
        userId: profileUser.id,
        watchedDate: { not: null, gte: new Date(`${new Date().getFullYear()}-01-01`) },
      },
    }),
    prisma.follow.count({ where: { followingId: profileUser.id } }),
    prisma.follow.count({ where: { followerId: profileUser.id } }),
    currentUserId && !isOwn
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: currentUserId, followingId: profileUser.id } },
        }).then(Boolean)
      : Promise.resolve(false),
    prisma.list.findMany({
      where: { userId: profileUser.id, ...(isOwn ? {} : { isPublic: true }) },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        items: {
          take: 4,
          orderBy: { position: "asc" },
          include: { video: { select: { thumbnailUrl: true, title: true } } },
        },
        _count: { select: { items: true } },
      },
    }),
    isOwn
      ? prisma.list.findMany({
          where: { userId: profileUser.id },
          select: { id: true, name: true },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);

  const totalWatched = totalWatchedRows.length;

  // Recent diary entries (last 8, dated only)
  const recentEntries = await prisma.diaryEntry.findMany({
    where: { userId: profileUser.id, watchedDate: { not: null } },
    orderBy: [{ watchedDate: "desc" }, { createdAt: "desc" }],
    take: 8,
    include: { video: true },
  });

  return (
    <div className="min-h-screen">
      {/* ── Profile header ── */}
      <div className="border-b border-border bg-inset">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end gap-x-6 gap-y-4 px-4 pt-10 pb-6">
          <Avatar src={profileUser.image} name={profileUser.name ?? username} size={84} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-3xl font-bold tracking-tight">
              {profileUser.name ?? username}
            </h1>
            <p className="text-sm text-muted">@{username}</p>
            {profileUser.bio ? (
              <p className="mt-2 max-w-lg text-sm text-muted">
                {profileUser.bio}
              </p>
            ) : (
              isOwn && (
                <Link
                  href="/settings"
                  className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Add a bio →
                </Link>
              )
            )}
          </div>
          {isOwn ? (
            <Link
              href="/settings"
              className="flex-shrink-0 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-white/30 hover:text-foreground"
            >
              Edit profile
            </Link>
          ) : (
            <FollowButton
              targetUserId={profileUser.id}
              targetName={`@${username}`}
              initialFollowing={isFollowing as boolean}
              isLoggedIn={!!currentUserId}
            />
          )}
        </div>

        {/* Stats bar + nav links */}
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-4 px-4 pb-5 text-sm">
          {[
            { label: "Videos", value: totalWatched },
            { label: "This year", value: thisYearCount },
            { label: "Ratings", value: totalRatings },
            { label: "Followers", value: followerCount, href: `/u/${username}/followers` },
            { label: "Following", value: followingCount, href: `/u/${username}/following` },
          ].map(({ label, value, href }) => {
            const stat = (
              <>
                <div className="font-display text-lg font-bold leading-none">
                  {value}
                </div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-faint">
                  {label}
                </div>
              </>
            );
            return href ? (
              <Link
                key={label}
                href={href}
                className="text-center transition-opacity hover:opacity-75"
              >
                {stat}
              </Link>
            ) : (
              <div key={label} className="text-center">
                {stat}
              </div>
            );
          })}
          <div className="ml-auto flex gap-2">
            <Link
              href={`/u/${username}/diary`}
              className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-white/30 hover:text-foreground"
            >
              Diary
            </Link>
            <Link
              href={`/u/${username}/watchlist`}
              className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-white/30 hover:text-foreground"
            >
              Watchlist
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        {/* ── Favorite videos (up to 4) ── */}
        {profileUser.favoriteVideos.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-faint">
              Favorite videos
            </h2>
            <div className="flex flex-wrap gap-3">
              {profileUser.favoriteVideos.map(({ video }) => (
                <Link
                  key={video.id}
                  href={`/video/${video.youtubeId}`}
                  className="group relative w-36 flex-shrink-0"
                >
                  {video.thumbnailUrl ? (
                    <div className="overflow-hidden rounded-xl ring-1 ring-white/5 transition-shadow group-hover:ring-2 group-hover:ring-primary/70">
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        width={144}
                        height={81}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-36 items-center justify-center rounded-xl bg-card text-xs text-faint">
                      No thumb
                    </div>
                  )}
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted transition-colors group-hover:text-foreground">
                    {video.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Recent diary entries ── */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-faint">
              Recent watches
            </h2>
            <Link
              href={`/u/${username}/diary`}
              className="text-xs font-medium text-primary hover:underline"
            >
              All diary entries →
            </Link>
          </div>

          {recentEntries.length === 0 ? (
            <div className="space-y-3 rounded-2xl border border-border bg-card py-12 text-center">
              <div className="text-4xl" aria-hidden="true">
                🎬
              </div>
              <p className="text-sm text-muted">
                {isOwn
                  ? "You haven't logged any videos yet."
                  : `${profileUser.name ?? username} hasn't logged any videos yet.`}
              </p>
              {isOwn && (
                <Link
                  href="/log"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  Log your first watch
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-border-strong"
                >
                  {entry.video.thumbnailUrl ? (
                    <Link href={`/video/${entry.video.youtubeId}`} className="block flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={entry.video.thumbnailUrl}
                        alt={entry.video.title}
                        width={96}
                        height={54}
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </Link>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/video/${entry.video.youtubeId}`}
                      className="line-clamp-1 text-sm font-medium transition-colors hover:text-primary"
                    >
                      {entry.video.title}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-faint">
                        {formatDate(entry.watchedDate)}
                      </span>
                      {entry.rating && <StarDisplay rating={entry.rating} />}
                      {entry.liked && (
                        <span className="text-xs text-primary" role="img" aria-label="Liked">♥</span>
                      )}
                      {entry.rewatch && (
                        <span className="text-xs text-muted" role="img" aria-label="Rewatch">↺</span>
                      )}
                    </div>
                    {entry.review && (
                      <p className="mt-1 line-clamp-2 text-xs text-faint">
                        {entry.review}
                      </p>
                    )}
                  </div>
                  {isOwn && (
                    <AddToListButton
                      youtubeId={entry.video.youtubeId}
                      lists={ownListsForSelector}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Lists ── */}
        {userLists.length > 0 && (
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-faint">
                Lists
              </h2>
              <Link
                href="/lists"
                className="text-xs font-medium text-primary hover:underline"
              >
                All lists →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {userLists.map((list) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.id}`}
                  className="group space-y-2 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-border-strong hover:bg-card-hover"
                >
                  {list.items.length > 0 && (
                    <div className="flex gap-0.5 overflow-hidden rounded-lg">
                      {list.items.map(({ video }, i) =>
                        video.thumbnailUrl ? (
                          <div key={i} className="relative aspect-video min-w-0 flex-1">
                            <Image
                              src={video.thumbnailUrl}
                              alt={video.title}
                              fill
                              className="object-cover"
                              sizes="8vw"
                            />
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                  <div>
                    <p className="line-clamp-1 text-sm font-medium transition-colors group-hover:text-primary">
                      {list.name}
                    </p>
                    <p className="mt-0.5 text-xs text-faint">
                      {list._count.items} {list._count.items === 1 ? "video" : "videos"}
                      {!list.isPublic && " · Private"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
