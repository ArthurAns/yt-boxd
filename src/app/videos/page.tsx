import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Videos" };

export default async function VideosPage() {
  // Videos ordered by number of diary entries (most logged first)
  const videos = await prisma.video.findMany({
    orderBy: { diaryEntries: { _count: "desc" } },
    take: 60,
    include: { _count: { select: { diaryEntries: true } } },
  });

  return (
    <div className="min-h-screen">
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-bold">Videos</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Most-logged videos on YTBoxd
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {videos.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-dim)]">
            <p>No videos logged yet.</p>
            <Link
              href="/log"
              className="mt-4 inline-block text-[var(--accent-green)] hover:underline text-sm"
            >
              Be the first to log one →
            </Link>
          </div>
        ) : (
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
                    {video._count.diaryEntries}{" "}
                    {video._count.diaryEntries === 1 ? "watch" : "watches"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
