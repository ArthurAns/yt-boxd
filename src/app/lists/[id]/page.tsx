import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import AddToListForm from "./AddToListForm";
import ListEditForm from "./ListEditForm";
import Avatar from "@/components/Avatar";

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
      <div className="mx-auto max-w-4xl space-y-3 px-4 pt-10 pb-6">
        <Link
          href="/lists"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Lists
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="font-display text-3xl font-bold leading-snug tracking-tight">
              {list.name}
            </h1>
            {list.description && (
              <p className="max-w-xl text-sm text-muted">{list.description}</p>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {!list.isPublic && (
              <span className="rounded-md border border-border-strong px-2 py-0.5 text-xs text-muted">
                Private
              </span>
            )}
            {isOwner && (
              <ListEditForm
                listId={list.id}
                initialName={list.name}
                initialDescription={list.description ?? ""}
                initialIsPublic={list.isPublic}
              />
            )}
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2">
          <Avatar src={list.user.image} name={list.user.name} size={22} />
          <Link
            href={`/u/${list.user.username ?? list.user.name}`}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            {list.user.username ?? list.user.name}
          </Link>
          <span className="text-xs text-faint">·</span>
          <span className="text-xs text-faint">
            {list.items.length} {list.items.length === 1 ? "video" : "videos"}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-4 pb-10">
        {/* Items */}
        {list.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-faint">
            No videos in this list yet.
          </p>
        ) : (
          <div className="space-y-2">
            {list.items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-border-strong"
              >
                <span className="w-5 flex-shrink-0 pt-0.5 text-right text-sm tabular-nums text-faint">
                  {index + 1}
                </span>
                {item.video.thumbnailUrl ? (
                  <Link href={`/video/${item.video.youtubeId}`} className="block flex-shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={item.video.thumbnailUrl}
                      alt={item.video.title}
                      width={96}
                      height={54}
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </Link>
                ) : null}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/video/${item.video.youtubeId}`}
                    className="line-clamp-1 text-sm font-medium transition-colors hover:text-primary"
                  >
                    {item.video.title}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-3">
                    {item.video.channelName && (
                      <span className="truncate text-xs text-faint">
                        {item.video.channelName}
                      </span>
                    )}
                    {item.video.duration && (
                      <span className="text-xs text-faint">{item.video.duration}</span>
                    )}
                  </div>
                  {item.note && (
                    <p className="mt-1 text-xs italic text-muted">{item.note}</p>
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
