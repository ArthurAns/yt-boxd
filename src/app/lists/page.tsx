import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
          take: 4,
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
              className="bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black text-sm font-bold px-4 py-2 rounded transition-colors"
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
                className="bg-[var(--bg-card)] rounded-lg p-4 hover:bg-[var(--bg-secondary)] transition-colors group space-y-3"
              >
                {/* Thumbnail strip */}
                {list.items.length > 0 && (
                  <div className="flex gap-1 overflow-hidden rounded">
                    {list.items.map(({ video }, i) =>
                      video.thumbnailUrl ? (
                        <div key={i} className="relative flex-1 aspect-video min-w-0">
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            fill
                            className="object-cover"
                            sizes="10vw"
                          />
                        </div>
                      ) : null
                    )}
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
                  {list.user.image ? (
                    <Image
                      src={list.user.image}
                      alt={list.user.name ?? ""}
                      width={18}
                      height={18}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[8px] text-[var(--text-muted)]">
                      {(list.user.name ?? "?")[0].toUpperCase()}
                    </div>
                  )}
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
