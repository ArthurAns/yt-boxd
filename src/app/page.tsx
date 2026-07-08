import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StarDisplay from "@/components/StarDisplay";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <div className="relative overflow-hidden border-b border-border bg-inset">
        {heroVideos.length > 0 && (
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 grid grid-cols-3 auto-rows-fr gap-1.5 opacity-30 md:grid-cols-6 [transform:perspective(1200px)_rotateX(8deg)_scale(1.1)]">
              {heroVideos.map((video) => (
                <div key={video.youtubeId} className="relative overflow-hidden rounded-md">
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
            <div className="absolute inset-0 bg-gradient-to-b from-inset/80 via-inset/55 to-inset" />
          </div>
        )}
        <div className="relative mx-auto flex min-h-[62vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
          <h1 className="mb-5 font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Every video you watch,{" "}
            <span className="text-primary">worth remembering.</span>
          </h1>
          <p className="mb-9 max-w-xl text-base text-muted sm:text-lg">
            Keep a diary of the YouTube videos you watch. Rate them, review
            them, and see what your friends think is worth your time.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {loggedIn ? (
              <Link href="/log" className={buttonVariants({ size: "lg" })}>
                Log a video
              </Link>
            ) : (
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                Get started — it&apos;s free
              </Link>
            )}
            <Link
              href="/videos"
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
            >
              Browse videos
            </Link>
          </div>
        </div>
      </div>

      {!loggedIn && (
        <div className="mx-auto max-w-6xl space-y-14 px-4 py-14">
          {/* Stats counters */}
          <div className="flex flex-wrap justify-center gap-x-16 gap-y-6">
            {[
              { label: "Members", value: memberCount },
              { label: "Videos", value: videoCount },
              { label: "Watches logged", value: entryCount },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="font-display text-3xl font-bold leading-none text-foreground">
                  {value.toLocaleString("en-GB")}
                </div>
                <div className="mt-2 text-xs font-medium uppercase tracking-widest text-faint">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Recent public activity */}
          {recentEntries.length > 0 && (
            <section>
              <h2 className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-faint">
                Recently logged on ytboxd
              </h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-6">
                {recentEntries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/video/${entry.video.youtubeId}`}
                    className="group space-y-2"
                  >
                    {entry.video.thumbnailUrl ? (
                      <div className="overflow-hidden rounded-xl ring-1 ring-white/5 transition-shadow group-hover:ring-2 group-hover:ring-primary/70">
                        <Image
                          src={entry.video.thumbnailUrl}
                          alt={entry.video.title}
                          width={200}
                          height={113}
                          className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-card text-xs text-faint">
                        No thumb
                      </div>
                    )}
                    <p className="line-clamp-2 text-xs font-medium text-muted transition-colors group-hover:text-foreground">
                      {entry.video.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-faint">
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
