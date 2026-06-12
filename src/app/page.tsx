import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StarDisplay from "@/components/StarDisplay";

export default async function HomePage() {
  const session = await auth();
  const loggedIn = !!session?.user;

  const [heroVideos, [memberCount, videoCount, entryCount, recentEntries]] =
    await Promise.all([
      prisma.video.findMany({
        where: { thumbnailUrl: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 18,
        select: { youtubeId: true, thumbnailUrl: true },
      }),
      loggedIn
        ? Promise.resolve([0, 0, 0, []] as const)
        : Promise.all([
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
          ]),
    ]);

  return (
    <div>
      {/* Hero with thumbnail-collage backdrop */}
      <div className="relative overflow-hidden">
        {heroVideos.length > 0 && (
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 grid grid-cols-3 md:grid-cols-6 auto-rows-fr gap-1 opacity-25">
              {heroVideos.map((video) => (
                <div key={video.youtubeId} className="relative">
                  <Image
                    src={video.thumbnailUrl!}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 17vw"
                  />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/70 via-[var(--bg-primary)]/40 to-[var(--bg-primary)]" />
          </div>
        )}
        <div className="relative flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            Track videos you&apos;ve watched.
            <br />
            <span className="text-[var(--accent-green)]">Save those you want to.</span>
            <br />
            Tell your friends what&apos;s good.
          </h1>
          <p className="text-[var(--text-muted)] text-base sm:text-lg max-w-xl mb-8">
            YTBoxd is a social platform for YouTube. Keep a diary, rate videos,
            write reviews, and see what your friends are watching.
          </p>
          {loggedIn ? (
            <Link
              href="/log"
              className="bg-[var(--accent-green)] text-black font-bold px-6 py-3 rounded-md text-lg hover:bg-[var(--accent-green-dark)] transition-colors"
            >
              + Log a video
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-[var(--accent-green)] text-black font-bold px-6 py-3 rounded-md text-lg hover:bg-[var(--accent-green-dark)] transition-colors"
            >
              Get started — it&apos;s free
            </Link>
          )}
        </div>
      </div>

      {!loggedIn && (
        <div className="mx-auto max-w-5xl px-4 pb-16 space-y-12">
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
                      <div className="overflow-hidden rounded-md">
                        <Image
                          src={entry.video.thumbnailUrl}
                          alt={entry.video.title}
                          width={200}
                          height={113}
                          className="w-full object-cover aspect-video transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-[var(--bg-card)] rounded-md flex items-center justify-center text-[var(--text-dim)] text-xs">
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
