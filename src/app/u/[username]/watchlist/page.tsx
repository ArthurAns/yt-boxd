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
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-4xl px-4 py-6 flex items-center justify-between">
          <div>
            <Link
              href={`/u/${username}`}
              className="text-[var(--accent-green)] text-sm hover:underline"
            >
              ← {profileUser.name ?? username}
            </Link>
            <h1 className="text-xl font-bold mt-1">Watchlist</h1>
          </div>
          <span className="text-sm text-[var(--text-muted)]">
            {items.length} {items.length === 1 ? "video" : "videos"}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {items.length === 0 ? (
          <p className="text-center text-[var(--text-dim)] py-16 text-sm">
            Nothing saved to watchlist yet.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map(({ video, addedAt }) => (
              <div
                key={video.youtubeId}
                className="flex items-center gap-3 bg-[var(--bg-card)] rounded-lg p-3"
              >
                {video.thumbnailUrl ? (
                  <Link href={`/video/${video.youtubeId}`} className="flex-shrink-0">
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      width={96}
                      height={54}
                      className="rounded object-cover hover:opacity-80 transition-opacity"
                    />
                  </Link>
                ) : null}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/video/${video.youtubeId}`}
                    className="font-medium text-sm hover:text-[var(--accent-green)] transition-colors line-clamp-1"
                  >
                    {video.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-0.5">
                    {video.channelName && (
                      <span className="text-xs text-[var(--text-dim)] truncate">
                        {video.channelName}
                      </span>
                    )}
                    {video.duration && (
                      <span className="text-xs text-[var(--text-dim)]">{video.duration}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-[var(--text-dim)] flex-shrink-0">
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
