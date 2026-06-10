import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import AddToListForm from "./AddToListForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const list = await prisma.list.findUnique({ where: { id } });
  if (!list) return { title: "List not found" };
  return { title: list.name };
}

export default async function ListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [list, session] = await Promise.all([
    prisma.list.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, name: true, image: true } },
        items: {
          orderBy: { position: "asc" },
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
        },
      },
    }),
    auth(),
  ]);

  if (!list || (!list.isPublic && list.user.id !== (session?.user as { id?: string } | undefined)?.id)) {
    notFound();
  }

  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const isOwner = currentUserId === list.user.id;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-3">
          <Link
            href="/lists"
            className="text-[var(--accent-green)] text-sm hover:underline"
          >
            ← Lists
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold leading-snug">{list.name}</h1>
              {list.description && (
                <p className="text-[var(--text-muted)] text-sm max-w-xl">{list.description}</p>
              )}
            </div>
            {!list.isPublic && (
              <span className="flex-shrink-0 text-xs border border-[var(--border)] text-[var(--text-muted)] px-2 py-0.5 rounded">
                Private
              </span>
            )}
          </div>

          {/* Author */}
          <div className="flex items-center gap-2">
            {list.user.image ? (
              <Image
                src={list.user.image}
                alt={list.user.name ?? ""}
                width={22}
                height={22}
                className="rounded-full"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-[10px] text-[var(--text-muted)]">
                {(list.user.name ?? "?")[0].toUpperCase()}
              </div>
            )}
            <Link
              href={`/u/${list.user.username ?? list.user.name}`}
              className="text-sm text-[var(--text-muted)] hover:text-white transition-colors"
            >
              {list.user.username ?? list.user.name}
            </Link>
            <span className="text-[var(--text-dim)] text-xs">·</span>
            <span className="text-xs text-[var(--text-dim)]">
              {list.items.length} {list.items.length === 1 ? "video" : "videos"}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Items */}
        {list.items.length === 0 ? (
          <p className="text-[var(--text-dim)] text-sm text-center py-8">
            No videos in this list yet.
          </p>
        ) : (
          <div className="space-y-2">
            {list.items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-3 bg-[var(--bg-card)] rounded-lg p-3"
              >
                <span className="text-[var(--text-dim)] text-sm tabular-nums w-5 text-right flex-shrink-0 pt-0.5">
                  {index + 1}
                </span>
                {item.video.thumbnailUrl ? (
                  <Link href={`/video/${item.video.youtubeId}`} className="flex-shrink-0">
                    <Image
                      src={item.video.thumbnailUrl}
                      alt={item.video.title}
                      width={96}
                      height={54}
                      className="rounded object-cover hover:opacity-80 transition-opacity"
                    />
                  </Link>
                ) : null}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/video/${item.video.youtubeId}`}
                    className="font-medium text-sm hover:text-[var(--accent-green)] transition-colors line-clamp-1"
                  >
                    {item.video.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-0.5">
                    {item.video.channelName && (
                      <span className="text-xs text-[var(--text-dim)] truncate">
                        {item.video.channelName}
                      </span>
                    )}
                    {item.video.duration && (
                      <span className="text-xs text-[var(--text-dim)]">{item.video.duration}</span>
                    )}
                  </div>
                  {item.note && (
                    <p className="text-xs text-[var(--text-muted)] mt-1 italic">{item.note}</p>
                  )}
                </div>
                {isOwner && (
                  <RemoveButton listId={list.id} youtubeId={item.video.youtubeId} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add to list (owner only) */}
        {isOwner && <AddToListForm listId={list.id} />}
      </div>
    </div>
  );
}

// Inline client component for remove button
function RemoveButton({ listId, youtubeId }: { listId: string; youtubeId: string }) {
  // This needs to be a client component — extract it
  return <RemoveButtonClient listId={listId} youtubeId={youtubeId} />;
}

// We need a separate client component file for the remove button
import RemoveButtonClient from "./RemoveButton";
