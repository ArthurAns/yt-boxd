import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const [members, session] = await Promise.all([
    prisma.user.findMany({
      where: { username: { not: null } },
      orderBy: { diaryEntries: { _count: "desc" } },
      take: 60,
      include: { _count: { select: { diaryEntries: true, followers: true } } },
    }),
    auth(),
  ]);

  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const followingIds = currentUserId
    ? new Set(
        (
          await prisma.follow.findMany({
            where: { followerId: currentUserId },
            select: { followingId: true },
          })
        ).map((f) => f.followingId)
      )
    : new Set<string>();

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Members"
        subtitle="Most active watchers on ytboxd"
        maxWidth="max-w-5xl"
      />

      <div className="mx-auto max-w-5xl px-4 pb-10">
        {members.length === 0 ? (
          <p className="py-20 text-center text-sm text-faint">
            No members yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-border-strong"
              >
                <Link
                  href={`/u/${member.username}`}
                  className="flex min-w-0 flex-1 items-start gap-3"
                >
                  <Avatar
                    src={member.image}
                    name={member.name ?? member.username}
                    size={44}
                    interactive
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
                      {member.name ?? member.username}
                    </p>
                    <p className="truncate text-xs text-muted">
                      @{member.username}
                    </p>
                    {member.bio && (
                      <p className="mt-1 line-clamp-2 text-xs text-faint">
                        {member.bio}
                      </p>
                    )}
                  </div>
                </Link>
                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="font-display text-sm font-bold">
                      {member._count.diaryEntries}
                    </p>
                    <p className="text-xs text-faint">videos</p>
                  </div>
                  {currentUserId && currentUserId !== member.id && (
                    <FollowButton
                      targetUserId={member.id}
                      targetName={`@${member.username}`}
                      initialFollowing={followingIds.has(member.id)}
                      isLoggedIn={true}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
