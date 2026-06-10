import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT body: { youtubeIds: string[] }  — ordered array of up to 4 YouTube IDs
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { youtubeIds } = await req.json();
  if (!Array.isArray(youtubeIds) || youtubeIds.length > 4) {
    return NextResponse.json({ error: "youtubeIds must be an array of up to 4 IDs" }, { status: 400 });
  }

  // Resolve video IDs
  const videos = await prisma.video.findMany({
    where: { youtubeId: { in: youtubeIds } },
    select: { id: true, youtubeId: true },
  });
  const byYtId = Object.fromEntries(videos.map((v) => [v.youtubeId, v.id]));

  // Replace all favorites atomically
  await prisma.$transaction([
    prisma.favoriteVideo.deleteMany({ where: { userId: session.user.id } }),
    ...youtubeIds.flatMap((ytId, i) => {
      const videoId = byYtId[ytId];
      if (!videoId) return [];
      return [
        prisma.favoriteVideo.create({
          data: { userId: session.user.id, videoId, position: i + 1 },
        }),
      ];
    }),
  ]);

  return NextResponse.json({ ok: true });
}
