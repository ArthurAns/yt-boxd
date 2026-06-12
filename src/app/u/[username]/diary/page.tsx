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
    where: { userId: profileUser.id },
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
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-4xl px-4 py-6 flex items-center justify-between">
          <div>
            <Link
              href={`/u/${username}`}
              className="text-[var(--accent-green)] text-sm hover:underline"
            >
              ← {profileUser.name ?? username}
            </Link>
            <h1 className="text-xl font-bold mt-1">Diary</h1>
          </div>
          <span className="text-sm text-[var(--text-muted)]">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {entries.length === 0 ? (
          <p className="text-[var(--text-dim)] text-sm text-center py-16">
            No diary entries yet.
          </p>
        ) : (
          <div className="space-y-10">
            {[...grouped.entries()].map(([key, monthEntries]) => {
              const [year, month] = key.split("-");
              return (
                <section key={key}>
                  {/* Month/year heading */}
                  <div className="flex items-baseline gap-3 mb-4 border-b border-[var(--border)] pb-2">
                    <span className="text-lg font-bold text-white">
                      {MONTHS[parseInt(month) - 1]}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">{year}</span>
                  </div>

                  {/* Entry rows */}
                  <div className="space-y-1">
                    {monthEntries.map((entry) => {
                      const d = new Date(entry.watchedDate);
                      return (
                        <div
                          key={entry.id}
                          className="grid grid-cols-[2rem_1fr_auto] gap-3 items-center py-2 border-b border-[var(--border)]/40 group"
                        >
                          {/* Day number */}
                          <span className="text-[var(--text-muted)] text-sm tabular-nums text-right">
                            {d.getDate()}
                          </span>

                          {/* Thumbnail + title */}
                          <div className="flex items-center gap-3 min-w-0">
                            {entry.video.thumbnailUrl ? (
                              <Link
                                href={`/video/${entry.video.youtubeId}`}
                                className="flex-shrink-0 block overflow-hidden rounded-md"
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
                                className="text-sm font-medium hover:text-[var(--accent-green)] transition-colors line-clamp-1"
                              >
                                {entry.video.title}
                              </Link>
                              {entry.video.channelName && (
                                <p className="text-xs text-[var(--text-dim)] truncate">
                                  {entry.video.channelName}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Rating + badges */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {entry.rewatch && (
                              <span className="text-[var(--text-muted)] text-xs" title="Rewatch" role="img" aria-label="Rewatch">
                                ↺
                              </span>
                            )}
                            {entry.liked && (
                              <span className="text-red-400 text-xs" title="Liked" role="img" aria-label="Liked">
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
