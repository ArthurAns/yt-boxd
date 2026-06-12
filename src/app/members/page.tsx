import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";

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
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Most active watchers on YTBoxd
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {members.length === 0 ? (
          <p className="text-center text-[var(--text-dim)] py-20 text-sm">
            No members yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-start gap-3 bg-[var(--bg-card)] border border-white/[0.06] rounded-lg p-4 hover:border-white/[0.14] transition-colors group"
              >
                <Link
                  href={`/u/${member.username}`}
                  className="flex items-start gap-3 min-w-0 flex-1"
                >
                  <Avatar
                    src={member.image}
                    name={member.name ?? member.username}
                    size={44}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate group-hover:text-[var(--accent-green)] transition-colors">
                      {member.name ?? member.username}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      @{member.username}
                    </p>
                    {member.bio && (
                      <p className="text-xs text-[var(--text-dim)] mt-1 line-clamp-2">
                        {member.bio}
                      </p>
                    )}
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      {member._count.diaryEntries}
                    </p>
                    <p className="text-xs text-[var(--text-dim)]">videos</p>
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
