import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StarDisplay from "@/components/StarDisplay";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type EntryWithVideo = Awaited<
  ReturnType<typeof prisma.diaryEntry.findMany>
>[number] & { video: { youtubeId: string; title: string; thumbnailUrl: string | null; channelName: string | null } };

function groupByMonth(entries: EntryWithVideo[]) {
  const map = new Map<string, EntryWithVideo[]>();
  for (const entry of entries) {
    if (!entry.watchedDate) continue;
    const d = new Date(entry.watchedDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return map;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DiaryPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const profileUser = await prisma.user.findUnique({ where: { username } });
  if (!profileUser) notFound();

  const entries = (await prisma.diaryEntry.findMany({
    where: { userId: profileUser.id, watchedDate: { not: null } },
    orderBy: [{ watchedDate: "desc" }, { createdAt: "desc" }],
    include: {
      video: {
        select: {
          youtubeId: true,
          title: true,
          thumbnailUrl: true,
          channelName: true,
        },
      },
    },
  })) as EntryWithVideo[];

  const grouped = groupByMonth(entries);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mx-auto flex max-w-4xl items-end justify-between px-4 pt-10 pb-6">
        <div>
          <Link
            href={`/u/${username}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← {profileUser.name ?? username}
          </Link>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Diary</h1>
        </div>
        <span className="text-sm text-muted">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-10">
        {entries.length === 0 ? (
          <p className="py-16 text-center text-sm text-faint">
            No diary entries yet.
          </p>
        ) : (
          <div className="space-y-10">
            {[...grouped.entries()].map(([key, monthEntries]) => {
              const [year, month] = key.split("-");
              return (
                <section key={key}>
                  {/* Month/year heading */}
                  <div className="mb-4 flex items-baseline gap-3 border-b border-border pb-2">
                    <span className="font-display text-lg font-bold">
                      {MONTHS[parseInt(month) - 1]}
                    </span>
                    <span className="text-sm text-muted">{year}</span>
                  </div>

                  {/* Entry rows */}
                  <div className="space-y-1">
                    {monthEntries.map((entry) => {
                      const d = new Date(entry.watchedDate!);
                      return (
                        <div
                          key={entry.id}
                          className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-border/60 py-2"
                        >
                          {/* Day number */}
                          <span className="text-right text-sm tabular-nums text-muted">
                            {d.getDate()}
                          </span>

                          {/* Thumbnail + title */}
                          <div className="flex min-w-0 items-center gap-3">
                            {entry.video.thumbnailUrl ? (
                              <Link
                                href={`/video/${entry.video.youtubeId}`}
                                className="block flex-shrink-0 overflow-hidden rounded-md"
                              >
                                <Image
                                  src={entry.video.thumbnailUrl}
                                  alt={entry.video.title}
                                  width={64}
                                  height={36}
                                  className="object-cover transition-transform duration-300 hover:scale-105"
                                />
                              </Link>
                            ) : null}
                            <div className="min-w-0">
                              <Link
                                href={`/video/${entry.video.youtubeId}`}
                                className="line-clamp-1 text-sm font-medium transition-colors hover:text-primary"
                              >
                                {entry.video.title}
                              </Link>
                              {entry.video.channelName && (
                                <p className="truncate text-xs text-faint">
                                  {entry.video.channelName}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Rating + badges */}
                          <div className="flex flex-shrink-0 items-center gap-2">
                            {entry.rewatch && (
                              <span className="text-xs text-muted" title="Rewatch" role="img" aria-label="Rewatch">
                                ↺
                              </span>
                            )}
                            {entry.liked && (
                              <span className="text-xs text-primary" title="Liked" role="img" aria-label="Liked">
                                ♥
                              </span>
                            )}
                            <StarDisplay rating={entry.rating} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
