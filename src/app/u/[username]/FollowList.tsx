import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Avatar from "@/components/Avatar";

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
      <div className="mx-auto flex max-w-3xl items-end justify-between px-4 pt-10 pb-6">
        <div>
          <Link
            href={`/u/${username}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← {profileUser.name ?? username}
          </Link>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        <span className="text-sm text-muted">
          {users.length} {users.length === 1 ? "member" : "members"}
        </span>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-10">
        {users.length === 0 ? (
          <div className="space-y-3 py-16 text-center">
            <div className="text-4xl" aria-hidden="true">
              👋
            </div>
            <p className="text-sm text-muted">
              {mode === "followers"
                ? "No followers yet."
                : `${profileUser.name ?? username} isn't following anyone yet.`}
            </p>
            {mode === "following" && (
              <Link
                href="/members"
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                Browse members →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {users.map((member) => (
              <Link
                key={member.id}
                href={`/u/${member.username ?? member.name}`}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-border-strong hover:bg-card-hover"
              >
                <Avatar src={member.image} name={member.name ?? member.username} size={44} interactive />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
                    {member.name ?? member.username}
                  </p>
                  <p className="truncate text-xs text-muted">
                    @{member.username}
                  </p>
                  {member.bio && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-faint">
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
