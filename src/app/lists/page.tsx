import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
      <PageHeader
        title="Lists"
        subtitle="Curated video collections from the community"
        maxWidth="max-w-5xl"
        action={
          isLoggedIn && (
            <Link href="/lists/new" className={buttonVariants({ size: "sm" })}>
              <Plus className="size-4" />
              New list
            </Link>
          )
        }
      />

      <div className="mx-auto max-w-5xl px-4 pb-10">
        {lists.length === 0 ? (
          <div className="space-y-3 py-20 text-center">
            <p className="text-faint">No lists yet.</p>
            {isLoggedIn ? (
              <Link
                href="/lists/new"
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                Create the first list →
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                Sign in to create a list →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {lists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.id}`}
                className="group space-y-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-border-strong hover:bg-card-hover"
              >
                {/* Overlapping thumbnail stack */}
                {list.items.length > 0 ? (
                  <div className="relative h-28">
                    {list.items.map(({ video }, i) => (
                      <div
                        key={i}
                        className="absolute top-0 aspect-video h-full overflow-hidden rounded-lg bg-popover shadow-lg ring-1 ring-black/60"
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
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-faint">
                            No thumb
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-white/10 bg-inset/60 text-xs text-faint">
                    Empty list
                  </div>
                )}

                <div>
                  <h2 className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-primary">
                    {list.name}
                  </h2>
                  {list.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-faint">
                      {list.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Avatar src={list.user.image} name={list.user.name} size={18} />
                  <span className="text-xs text-muted">
                    {list.user.username ?? list.user.name}
                  </span>
                  <span className="ml-auto text-xs text-faint">
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
