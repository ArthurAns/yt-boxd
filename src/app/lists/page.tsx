import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import Image from "next/image";

export const metadata: Metadata = { title: "Lists" };

export default async function ListsPage() {
  const [lists, session] = await Promise.all([
    prisma.list.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        user: { select: { username: true, name: true, image: true } },
        items: {
          orderBy: { position: "asc" },
          take: 5,
          include: { video: { select: { thumbnailUrl: true, title: true } } },
        },
        _count: { select: { items: true } },
      },
    }),
    auth(),
  ]);

  const isLoggedIn = !!(session?.user as { id?: string } | undefined)?.id;

  return (
    <div className="min-h-screen">
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lists</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Curated video collections from the community
            </p>
          </div>
          {isLoggedIn && (
            <Link
              href="/lists/new"
              className="bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black text-sm font-bold px-4 py-2 rounded-md transition-colors"
            >
              + New list
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {lists.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-[var(--text-dim)]">No lists yet.</p>
            {isLoggedIn ? (
              <Link
                href="/lists/new"
                className="inline-block text-[var(--accent-green)] hover:underline text-sm"
              >
                Create the first list →
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-block text-[var(--accent-green)] hover:underline text-sm"
              >
                Sign in to create a list →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.id}`}
                className="bg-[var(--bg-card)] border border-white/[0.06] rounded-lg p-4 hover:bg-[var(--bg-secondary)] hover:border-white/[0.14] transition-colors group space-y-3"
              >
                {/* Overlapping thumbnail stack */}
                {list.items.length > 0 ? (
                  <div className="relative h-28">
                    {list.items.map(({ video }, i) => (
                      <div
                        key={i}
                        className="absolute top-0 h-full aspect-video rounded-md overflow-hidden ring-1 ring-black/60 shadow-lg bg-[var(--bg-secondary)]"
                        style={{ left: `${i * 12.5}%`, zIndex: list.items.length - i }}
                      >
                        {video.thumbnailUrl ? (
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            fill
                            className="object-cover"
                            sizes="200px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[var(--text-dim)] text-xs">
                            No thumb
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-28 rounded-md bg-[var(--bg-secondary)]/60 border border-dashed border-white/10 flex items-center justify-center text-xs text-[var(--text-dim)]">
                    Empty list
                  </div>
                )}

                <div>
                  <h2 className="font-semibold text-sm group-hover:text-[var(--accent-green)] transition-colors line-clamp-1">
                    {list.name}
                  </h2>
                  {list.description && (
                    <p className="text-xs text-[var(--text-dim)] mt-0.5 line-clamp-2">
                      {list.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Avatar src={list.user.image} name={list.user.name} size={18} />
                  <span className="text-xs text-[var(--text-muted)]">
                    {list.user.username ?? list.user.name}
                  </span>
                  <span className="text-xs text-[var(--text-dim)] ml-auto">
                    {list._count.items} {list._count.items === 1 ? "video" : "videos"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
