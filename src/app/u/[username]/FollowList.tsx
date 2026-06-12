import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const userSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
  bio: true,
} as const;

export default async function FollowList({
  username,
  mode,
}: {
  username: string;
  mode: "followers" | "following";
}) {
  const profileUser = await prisma.user.findUnique({ where: { username } });
  if (!profileUser) notFound();

  const users =
    mode === "followers"
      ? (
          await prisma.follow.findMany({
            where: { followingId: profileUser.id },
            orderBy: { createdAt: "desc" },
            include: { follower: { select: userSelect } },
          })
        ).map((f) => f.follower)
      : (
          await prisma.follow.findMany({
            where: { followerId: profileUser.id },
            orderBy: { createdAt: "desc" },
            include: { following: { select: userSelect } },
          })
        ).map((f) => f.following);

  const title = mode === "followers" ? "Followers" : "Following";

  return (
    <div className="min-h-screen">
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-4 py-6 flex items-center justify-between">
          <div>
            <Link
              href={`/u/${username}`}
              className="text-[var(--accent-green)] text-sm hover:underline"
            >
              ← {profileUser.name ?? username}
            </Link>
            <h1 className="text-xl font-bold mt-1">{title}</h1>
          </div>
          <span className="text-sm text-[var(--text-muted)]">
            {users.length} {users.length === 1 ? "member" : "members"}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {users.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-4xl" aria-hidden="true">
              👋
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {mode === "followers"
                ? "No followers yet."
                : `${profileUser.name ?? username} isn't following anyone yet.`}
            </p>
            {mode === "following" && (
              <Link
                href="/members"
                className="inline-block text-sm text-[var(--accent-green)] hover:underline"
              >
                Browse members →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {users.map((member) => (
              <Link
                key={member.id}
                href={`/u/${member.username ?? member.name}`}
                className="flex items-center gap-3 bg-[var(--bg-card)] rounded-lg p-4 hover:bg-[var(--bg-secondary)] transition-colors group"
              >
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name ?? member.username ?? ""}
                    width={44}
                    height={44}
                    className="rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] text-sm font-medium flex-shrink-0">
                    {(member.name ?? member.username ?? "?")[0].toUpperCase()}
                  </div>
                )}
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
