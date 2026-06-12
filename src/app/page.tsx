import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StarDisplay from "@/components/StarDisplay";

export default async function HomePage() {
  const session = await auth();
  const loggedIn = !!session?.user;

  const [memberCount, videoCount, entryCount, recentEntries] = loggedIn
    ? [0, 0, 0, []]
    : await Promise.all([
        prisma.user.count({ where: { username: { not: null } } }),
        prisma.video.count(),
        prisma.diaryEntry.count(),
        prisma.diaryEntry.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          include: {
            user: { select: { name: true, username: true } },
            video: {
              select: { youtubeId: true, title: true, thumbnailUrl: true },
            },
          },
        }),
      ]);

  return (
    <div className="px-4">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-5xl font-bold mb-4 leading-tight">
          Track videos you&apos;ve watched.
          <br />
          <span className="text-[var(--accent-green)]">Save those you want to.</span>
          <br />
          Tell your friends what&apos;s good.
        </h1>
        <p className="text-[var(--text-muted)] text-lg max-w-xl mb-8">
          YTBoxd is a social platform for YouTube. Keep a diary, rate videos,
          write reviews, and see what your friends are watching.
        </p>
        {loggedIn ? (
          <Link
            href="/log"
            className="bg-[var(--accent-green)] text-black font-bold px-6 py-3 rounded text-lg hover:bg-[var(--accent-green-dark)] transition-colors"
          >
            + Log a video
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-[var(--accent-green)] text-black font-bold px-6 py-3 rounded text-lg hover:bg-[var(--accent-green-dark)] transition-colors"
          >
            Get started — it&apos;s free
          </Link>
        )}
      </div>

      {!loggedIn && (
        <div className="mx-auto max-w-5xl pb-16 space-y-12">
          {/* Stats counters */}
          <div className="flex justify-center gap-12 flex-wrap border-y border-[var(--border)] py-6">
            {[
              { label: "Members", value: memberCount },
              { label: "Videos", value: videoCount },
              { label: "Watches logged", value: entryCount },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-white font-bold text-2xl leading-none">
                  {value.toLocaleString("en-GB")}
                </div>
                <div className="text-[var(--text-muted)] text-xs mt-1 uppercase tracking-wide">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Recent public activity */}
          {recentEntries.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 text-center">
                Recently logged on YTBoxd
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {recentEntries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/video/${entry.video.youtubeId}`}
                    className="group space-y-1.5"
                  >
                    {entry.video.thumbnailUrl ? (
                      <Image
                        src={entry.video.thumbnailUrl}
                        alt={entry.video.title}
                        width={200}
                        height={113}
                        className="rounded w-full object-cover aspect-video group-hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-[var(--bg-card)] rounded flex items-center justify-center text-[var(--text-dim)] text-xs">
                        No thumb
                      </div>
                    )}
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 group-hover:text-white transition-colors">
                      {entry.video.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-dim)]">
                      <span className="truncate">
                        {entry.user.name ?? entry.user.username}
                      </span>
                      {entry.rating && <StarDisplay rating={entry.rating} className="text-[10px]" />}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
