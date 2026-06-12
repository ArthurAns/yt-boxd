import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Avatar from "@/components/Avatar";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const members = await prisma.user.findMany({
    where: { username: { not: null } },
    orderBy: { diaryEntries: { _count: "desc" } },
    take: 60,
    include: { _count: { select: { diaryEntries: true, followers: true } } },
  });

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
              <Link
                key={member.id}
                href={`/u/${member.username}`}
                className="flex items-center gap-3 bg-[var(--bg-card)] rounded-lg p-4 hover:bg-[var(--bg-secondary)] transition-colors group"
              >
                <Avatar src={member.image} name={member.name ?? member.username} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate group-hover:text-[var(--accent-green)] transition-colors">
                    {member.name ?? member.username}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    @{member.username}
                  </p>
                  {member.bio && (
                    <p className="text-xs text-[var(--text-dim)] mt-0.5 line-clamp-1">
                      {member.bio}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-white">
                    {member._count.diaryEntries}
                  </p>
                  <p className="text-xs text-[var(--text-dim)]">videos</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
