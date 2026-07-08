import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsForm from "./SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, name: true, bio: true, image: true },
  });
  if (!user) redirect("/login");

  // Fetch the user's diary videos for the favorites picker
  const diaryVideos = await prisma.diaryEntry.findMany({
    where: { userId: session.user.id },
    distinct: ["videoId"],
    include: {
      video: { select: { youtubeId: true, title: true, thumbnailUrl: true, channelName: true } },
    },
    orderBy: { watchedDate: { sort: "desc", nulls: "last" } },
  });

  // Current favorites
  const favorites = await prisma.favoriteVideo.findMany({
    where: { userId: session.user.id },
    orderBy: { position: "asc" },
    include: { video: { select: { youtubeId: true, title: true, thumbnailUrl: true } } },
  });

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <SettingsForm
          initial={{
            username: user.username ?? "",
            bio: user.bio ?? "",
            name: user.name ?? "",
            image: user.image ?? null,
          }}
          diaryVideos={diaryVideos.map((e) => e.video)}
          initialFavorites={favorites.map((f) => f.video)}
        />
      </div>
    </div>
  );
}
