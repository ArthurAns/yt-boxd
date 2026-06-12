import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import FollowButton from "@/components/FollowButton";
import StarDisplay from "@/components/StarDisplay";
import AddToListButton from "@/components/AddToListButton";
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
  const [totalWatched, totalRatings, thisYearCount, followerCount, followingCount, isFollowing, userLists, ownListsForSelector] = await Promise.all([
    prisma.diaryEntry.count({ where: { userId: profileUser.id } }),
    prisma.diaryEntry.count({
      where: { userId: profileUser.id, rating: { not: null } },
    }),
    prisma.diaryEntry.count({
      where: {
        userId: profileUser.id,
        watchedDate: { gte: new Date(`${new Date().getFullYear()}-01-01`) },
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

  // Recent diary entries (last 8)
  const recentEntries = await prisma.diaryEntry.findMany({
    where: { userId: profileUser.id },
    orderBy: [{ watchedDate: "desc" }, { createdAt: "desc" }],
    take: 8,
    include: { video: true },
  });

  return (
    <div className="min-h-screen">
      {/* ── Profile header ── */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-4 py-8 flex items-end gap-6">
          {profileUser.image ? (
            <Image
              src={profileUser.image}
              alt={profileUser.name ?? username}
              width={80}
              height={80}
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-2xl text-[var(--text-muted)] flex-shrink-0">
              {(profileUser.name ?? username)[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">
              {profileUser.name ?? username}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">@{username}</p>
            {profileUser.bio ? (
              <p className="mt-2 text-sm text-[var(--text-dim)] max-w-lg">
                {profileUser.bio}
              </p>
            ) : (
              isOwn && (
                <Link
                  href="/settings"
                  className="mt-2 inline-block text-sm text-[var(--accent-green)] hover:underline"
                >
                  Add a bio →
                </Link>
              )
            )}
          </div>
          {isOwn ? (
            <Link
              href="/settings"
              className="text-xs text-[var(--text-muted)] border border-[var(--border)] rounded px-3 py-1.5 hover:text-white hover:border-white/30 transition-colors flex-shrink-0"
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
        <div className="mx-auto max-w-5xl px-4 pb-4 flex items-center gap-8 text-sm flex-wrap">
          {[
            { label: "Videos", value: totalWatched },
            { label: "This year", value: thisYearCount },
            { label: "Ratings", value: totalRatings },
            { label: "Followers", value: followerCount, href: `/u/${username}/followers` },
            { label: "Following", value: followingCount, href: `/u/${username}/following` },
          ].map(({ label, value, href }) => {
            const stat = (
              <>
                <div className="text-white font-bold text-lg leading-none">
                  {value}
                </div>
                <div className="text-[var(--text-muted)] text-xs mt-0.5 uppercase tracking-wide">
                  {label}
                </div>
              </>
            );
            return href ? (
              <Link
                key={label}
                href={href}
                className="text-center hover:opacity-80 transition-opacity"
              >
                {stat}
              </Link>
            ) : (
              <div key={label} className="text-center">
                {stat}
              </div>
            );
          })}
          <div className="ml-auto flex gap-4 text-xs text-[var(--text-muted)] uppercase tracking-wide">
            <Link href={`/u/${username}/diary`} className="hover:text-white transition-colors">
              Diary
            </Link>
            <Link href={`/u/${username}/watchlist`} className="hover:text-white transition-colors">
              Watchlist
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">
        {/* ── Favorite videos (up to 4) ── */}
        {profileUser.favoriteVideos.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
              Favorite videos
            </h2>
            <div className="flex gap-3 flex-wrap">
              {profileUser.favoriteVideos.map(({ video }) => (
                <Link
                  key={video.id}
                  href={`/video/${video.youtubeId}`}
                  className="group relative w-36 flex-shrink-0"
                >
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      width={144}
                      height={81}
                      className="rounded w-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-36 h-20 bg-[var(--bg-card)] rounded flex items-center justify-center text-[var(--text-dim)] text-xs">
                      No thumb
                    </div>
                  )}
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 group-hover:text-white transition-colors">
                    {video.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Recent diary entries ── */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
              Recent watches
            </h2>
            <Link
              href={`/u/${username}/diary`}
              className="text-xs text-[var(--accent-green)] hover:underline"
            >
              All diary entries →
            </Link>
          </div>

          {recentEntries.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-[var(--bg-card)] rounded-lg">
              <div className="text-4xl" aria-hidden="true">
                🎬
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                {isOwn
                  ? "You haven't logged any videos yet."
                  : `${profileUser.name ?? username} hasn't logged any videos yet.`}
              </p>
              {isOwn && (
                <Link
                  href="/log"
                  className="inline-flex items-center gap-1.5 bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black font-bold px-4 py-2 rounded text-sm transition-colors"
                >
                  + Log your first watch
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex gap-3 bg-[var(--bg-card)] rounded-lg p-3 items-start"
                >
                  {entry.video.thumbnailUrl ? (
                    <Link href={`/video/${entry.video.youtubeId}`} className="flex-shrink-0">
                      <Image
                        src={entry.video.thumbnailUrl}
                        alt={entry.video.title}
                        width={96}
                        height={54}
                        className="rounded object-cover hover:opacity-80 transition-opacity"
                      />
                    </Link>
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/video/${entry.video.youtubeId}`}
                      className="font-medium text-sm hover:text-[var(--accent-green)] transition-colors line-clamp-1"
                    >
                      {entry.video.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatDate(entry.watchedDate)}
                      </span>
                      {entry.rating && <StarDisplay rating={entry.rating} />}
                      {entry.liked && (
                        <span className="text-red-400 text-xs" role="img" aria-label="Liked">♥</span>
                      )}
                      {entry.rewatch && (
                        <span className="text-[var(--text-muted)] text-xs" role="img" aria-label="Rewatch">↺</span>
                      )}
                    </div>
                    {entry.review && (
                      <p className="text-xs text-[var(--text-dim)] mt-1 line-clamp-2">
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
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Lists
              </h2>
              <Link
                href="/lists"
                className="text-xs text-[var(--accent-green)] hover:underline"
              >
                All lists →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userLists.map((list) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.id}`}
                  className="bg-[var(--bg-card)] rounded-lg p-3 hover:bg-[var(--bg-secondary)] transition-colors group space-y-2"
                >
                  {list.items.length > 0 && (
                    <div className="flex gap-0.5 overflow-hidden rounded">
                      {list.items.map(({ video }, i) =>
                        video.thumbnailUrl ? (
                          <div key={i} className="relative flex-1 aspect-video min-w-0">
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
                    <p className="text-sm font-medium line-clamp-1 group-hover:text-[var(--accent-green)] transition-colors">
                      {list.name}
                    </p>
                    <p className="text-xs text-[var(--text-dim)] mt-0.5">
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
