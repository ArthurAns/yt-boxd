import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username}'s Watchlist` };
}

export default async function WatchlistPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const profileUser = await prisma.user.findUnique({ where: { username } });
  if (!profileUser) notFound();

  const items = await prisma.watchlistItem.findMany({
    where: { userId: profileUser.id },
    orderBy: { addedAt: "desc" },
    include: {
      video: {
        select: {
          youtubeId: true,
          title: true,
          thumbnailUrl: true,
          channelName: true,
          duration: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-4xl items-end justify-between px-4 pt-10 pb-6">
        <div>
          <Link
            href={`/u/${username}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← {profileUser.name ?? username}
          </Link>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Watchlist</h1>
        </div>
        <span className="text-sm text-muted">
          {items.length} {items.length === 1 ? "video" : "videos"}
        </span>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-10">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-faint">
            Nothing saved to watchlist yet.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map(({ video, addedAt }) => (
              <div
                key={video.youtubeId}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-border-strong"
              >
                {video.thumbnailUrl ? (
                  <Link href={`/video/${video.youtubeId}`} className="block flex-shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      width={96}
                      height={54}
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </Link>
                ) : null}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/video/${video.youtubeId}`}
                    className="line-clamp-1 text-sm font-medium transition-colors hover:text-primary"
                  >
                    {video.title}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-3">
                    {video.channelName && (
                      <span className="truncate text-xs text-faint">
                        {video.channelName}
                      </span>
                    )}
                    {video.duration && (
                      <span className="text-xs text-faint">{video.duration}</span>
                    )}
                  </div>
                </div>
                <span className="flex-shrink-0 text-xs text-faint">
                  {new Date(addedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
