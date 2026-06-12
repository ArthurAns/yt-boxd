/**
 * Seed script – fake users + real videos from the "Banger Meme Songs" playlist.
 *
 * Usage:
 *   npx tsx prisma/seed.ts
 *
 * Safe to re-run: all inserts use upsert where a unique key exists, or
 * skip on conflict. Existing real users are never touched.
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// ─── Setup ────────────────────────────────────────────────────────────────────
// In a plain Node.js process (non-serverless) the Neon driver needs a real
// WebSocket constructor — it doesn't ship one by default.
neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ─── Video IDs from playlist PLxTwngSRhxH0Fm3GfYciNs1PY3VUz99m8 ─────────────

const VIDEO_IDS = [
  "dQw4w9WgXcQ", // Rick Astley – Never Gonna Give You Up
  "9bZkp7q19f0", // PSY – Gangnam Style
  "djV11Xbc914", // Darude – Sandstorm
  "y6120QOlsfU", // Smash Mouth – All Star
  "kfVsfOSbJY0", // Bag Raiders – Shooting Stars
  "J---aiyznGQ", // Caramelldansen
  "hHkKJfcBXcw", // Dragostea Din Tei (Numa Numa)
  "4feUSTS21-8", // (playlist entry #1)
  "ZZ5LpwO-An4", // (playlist entry)
  "_V2sBURgUBI", // (playlist entry)
  "gMlby1X98wU", // (playlist entry)
  "feA64wXhbjo", // (playlist entry)
  "pxIofYrt0kE", // (playlist entry)
  "MtN1YnoL46Q", // (playlist entry)
  "astISOttCQ0", // (playlist entry)
];

// ─── Fake users ───────────────────────────────────────────────────────────────

const USERS = [
  {
    username: "marcuswebb",
    name: "Marcus Webb",
    email: "marcus.seed@ytboxd.fake",
    image: "https://api.dicebear.com/8.x/thumbs/svg?seed=marcus&backgroundColor=1e3a5f",
    bio: "Certified meme historian. I've seen every Shrek meme at least twice.",
  },
  {
    username: "verasantos",
    name: "Vera Santos",
    email: "vera.seed@ytboxd.fake",
    image: "https://api.dicebear.com/8.x/thumbs/svg?seed=vera&backgroundColor=3a1e5f",
    bio: "nostalgia is my love language 🎵",
  },
  {
    username: "dankowalski",
    name: "Dan Kowalski",
    email: "dan.seed@ytboxd.fake",
    image: "https://api.dicebear.com/8.x/thumbs/svg?seed=dan&backgroundColor=1e5f3a",
    bio: "ironically unironically enjoying everything on this site",
  },
  {
    username: "priyamehta",
    name: "Priya Mehta",
    email: "priya.seed@ytboxd.fake",
    image: "https://api.dicebear.com/8.x/thumbs/svg?seed=priya&backgroundColor=5f3a1e",
    bio: "cataloguing internet culture one banger at a time",
  },
  {
    username: "natecollins",
    name: "Nate Collins",
    email: "nate.seed@ytboxd.fake",
    image: "https://api.dicebear.com/8.x/thumbs/svg?seed=nate&backgroundColor=1e5f5f",
    bio: "somebody once told me this site was gonna rock me",
  },
  {
    username: "zoepark",
    name: "Zoe Park",
    email: "zoe.seed@ytboxd.fake",
    image: "https://api.dicebear.com/8.x/thumbs/svg?seed=zoe&backgroundColor=5f1e3a",
    bio: "if it slaps, it slaps. no further explanation needed.",
  },
];

// ─── oEmbed fetch ─────────────────────────────────────────────────────────────

async function fetchOEmbed(id: string) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`oEmbed failed for ${id}: ${res.status}`);
  const d = await res.json() as { title: string; thumbnail_url: string; author_name: string };
  return { title: d.title, thumbnailUrl: d.thumbnail_url, channelName: d.author_name };
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding YTBoxd…");

  // ── 1. Create / upsert users ──────────────────────────────────────────────
  console.log("  Creating users…");
  const userRecords = await Promise.all(
    USERS.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: { username: u.username, name: u.name, bio: u.bio, image: u.image },
        create: { ...u },
      })
    )
  );
  const [marcus, vera, dan, priya, nate, zoe] = userRecords;
  console.log(`  ✓ ${userRecords.length} users ready`);

  // ── 2. Fetch video metadata via oEmbed and upsert videos ─────────────────
  console.log("  Fetching video metadata via oEmbed…");
  const videoRecords: Awaited<ReturnType<typeof prisma.video.upsert>>[] = [];
  for (const id of VIDEO_IDS) {
    try {
      const meta = await fetchOEmbed(id);
      const v = await prisma.video.upsert({
        where: { youtubeId: id },
        update: { title: meta.title, thumbnailUrl: meta.thumbnailUrl, channelName: meta.channelName },
        create: {
          youtubeId: id,
          title: meta.title,
          thumbnailUrl: meta.thumbnailUrl,
          channelName: meta.channelName,
          enriched: false,
        },
      });
      videoRecords.push(v);
      console.log(`    ✓ ${meta.title}`);
    } catch (err) {
      console.warn(`    ⚠ skipped ${id}: ${err}`);
    }
  }
  console.log(`  ✓ ${videoRecords.length} videos ready`);

  if (videoRecords.length === 0) {
    console.error("No videos fetched – aborting");
    return;
  }

  // Helpers for picking videos
  const vid = (n: number) => videoRecords[n % videoRecords.length];

  // ── 3. Diary entries ──────────────────────────────────────────────────────
  console.log("  Creating diary entries…");

  // Helper: upsert diary entry (unique on userId+videoId+watchedDate)
  async function entry(
    userId: string,
    videoId: string,
    watchedDate: Date,
    opts: { rating?: number; liked?: boolean; rewatch?: boolean; review?: string }
  ) {
    return prisma.diaryEntry.upsert({
      where: { userId_videoId_watchedDate: { userId, videoId, watchedDate } },
      update: { rating: opts.rating, liked: opts.liked ?? false, rewatch: opts.rewatch ?? false, review: opts.review },
      create: {
        userId,
        videoId,
        watchedDate,
        rating: opts.rating,
        liked: opts.liked ?? false,
        rewatch: opts.rewatch ?? false,
        review: opts.review,
      },
    });
  }

  // Marcus – the historian
  const eM1 = await entry(marcus.id, vid(0).id, daysAgo(60), { rating: 5, liked: true, review: "The foundational text of internet culture. Nothing before or after compares. A perfect video." });
  const eM2 = await entry(marcus.id, vid(1).id, daysAgo(45), { rating: 4.5, liked: true, review: "A cultural reset. PSY understood the assignment a decade before that phrase existed." });
  const eM3 = await entry(marcus.id, vid(2).id, daysAgo(40), { rating: 4, review: "Technically a trance track. Practically a meme delivery mechanism. The transition is immaculate." });
  const eM4 = await entry(marcus.id, vid(3).id, daysAgo(30), { rating: 5, liked: true, rewatch: true, review: "Somebody once told me this was the greatest song ever made. They were right." });
  const eM5 = await entry(marcus.id, vid(4).id, daysAgo(20), { rating: 4, liked: true });
  const eM6 = await entry(marcus.id, vid(5).id, daysAgo(10), { rating: 3.5 });
  const eM7 = await entry(marcus.id, vid(6).id, daysAgo(5),  { rating: 4.5, liked: true, rewatch: true, review: "O-zone created something that transcends language. The melody is mathematically perfect for going viral." });
  const eM8 = await entry(marcus.id, vid(7).id, daysAgo(3),  { rating: 3 });

  // Vera – the nostalgic
  const eV1 = await entry(vera.id, vid(0).id, daysAgo(55), { rating: 5, liked: true, rewatch: true, review: "This hits different at 2am. A timeless classic. Rick Astley was too good for this world." });
  const eV2 = await entry(vera.id, vid(3).id, daysAgo(50), { rating: 4.5, liked: true, review: "Every. Single. Time. I hear this song I transform into a Shrek variant. 10/10 no notes." });
  const eV3 = await entry(vera.id, vid(6).id, daysAgo(35), { rating: 5, liked: true, rewatch: true, review: "My Roman Empire. I think about Dragostea Din Tei every single day." });
  const eV4 = await entry(vera.id, vid(1).id, daysAgo(25), { rating: 4, review: "Still gets the whole room moving. Oppa Gangnam Style will never not be a banger." });
  const eV5 = await entry(vera.id, vid(8).id, daysAgo(15), { rating: 3.5 });
  const eV6 = await entry(vera.id, vid(9).id, daysAgo(7),  { rating: 4, liked: true });

  // Dan – the ironic enjoyer
  const eD1 = await entry(dan.id, vid(2).id, daysAgo(58), { rating: 5, liked: true, review: "UNTZ UNTZ UNTZ. This is not irony. This is genuine 5-star music. I will not elaborate." });
  const eD2 = await entry(dan.id, vid(4).id, daysAgo(42), { rating: 4.5, liked: true, review: "The slow motion before the drop is cinema. Actual cinema." });
  const eD3 = await entry(dan.id, vid(5).id, daysAgo(38), { rating: 4, review: "Genuinely cannot tell if I love this ironically or sincerely. Doesn't matter. It's a 4." });
  const eD4 = await entry(dan.id, vid(0).id, daysAgo(28), { rating: 5, liked: true, rewatch: true });
  const eD5 = await entry(dan.id, vid(3).id, daysAgo(18), { rating: 4.5, liked: true, review: "Smash Mouth lore is so deep. This song was literally written as a joke and now it's in Shrek. Peak fiction." });
  const eD6 = await entry(dan.id, vid(10).id, daysAgo(12), { rating: 3.5 });
  const eD7 = await entry(dan.id, vid(11).id, daysAgo(6), { rating: 4, liked: true });

  // Priya – the cataloguer
  const eP1 = await entry(priya.id, vid(1).id, daysAgo(62), { rating: 4.5, liked: true, review: "The horse dance is peak choreography. I have studied it. I will not accept criticism." });
  const eP2 = await entry(priya.id, vid(6).id, daysAgo(48), { rating: 5, liked: true, rewatch: true, review: "Three boys lip-syncing on a webcam. Two billion views. This is the internet at its purest." });
  const eP3 = await entry(priya.id, vid(2).id, daysAgo(36), { rating: 4, review: "I traced back 47 memes to this song. It is load-bearing for early internet culture." });
  const eP4 = await entry(priya.id, vid(7).id, daysAgo(22), { rating: 3.5, review: "Solid entry. Does what it says on the tin." });
  const eP5 = await entry(priya.id, vid(12).id, daysAgo(14), { rating: 4, liked: true });
  const eP6 = await entry(priya.id, vid(13).id, daysAgo(4),  { rating: 3.5 });

  // Nate – the All Star guy
  const eN1 = await entry(nate.id, vid(3).id, daysAgo(65), { rating: 5, liked: true, rewatch: true, review: "Somebody once told me this was a 5 star video and I could not agree more. Changed my life in 1999 and again every rewatch." });
  const eN2 = await entry(nate.id, vid(0).id, daysAgo(50), { rating: 4.5, liked: true, review: "Getting rickrolled used to be embarrassing. Now I click the link on purpose. Character development." });
  const eN3 = await entry(nate.id, vid(4).id, daysAgo(44), { rating: 4, liked: true });
  const eN4 = await entry(nate.id, vid(5).id, daysAgo(33), { rating: 4, review: "It is what it is. It is great." });
  const eN5 = await entry(nate.id, vid(8).id, daysAgo(16), { rating: 3 });
  const eN6 = await entry(nate.id, vid(14).id, daysAgo(2),  { rating: 4.5, liked: true, review: "Perfect banger. No notes. This playlist is healing me." });

  // Zoe – the concise one
  const eZ1 = await entry(zoe.id, vid(0).id, daysAgo(52), { rating: 5, liked: true, review: "It goes so hard. That's all I have to say." });
  const eZ2 = await entry(zoe.id, vid(2).id, daysAgo(46), { rating: 5, liked: true, review: "Drop hits every single time. I've never skipped past the 0:21 mark." });
  const eZ3 = await entry(zoe.id, vid(1).id, daysAgo(32), { rating: 4, liked: true });
  const eZ4 = await entry(zoe.id, vid(3).id, daysAgo(21), { rating: 4.5, review: "Smash Mouth outsold. This song is perfect. Moving on." });
  const eZ5 = await entry(zoe.id, vid(6).id, daysAgo(11), { rating: 4.5, liked: true, rewatch: true });
  const eZ6 = await entry(zoe.id, vid(4).id, daysAgo(1),  { rating: 4, liked: true });

  console.log(`  ✓ Diary entries created`);

  // ── 4. Follows ─────────────────────────────────────────────────────────────
  console.log("  Creating follows…");
  const followPairs = [
    [marcus.id, vera.id],
    [marcus.id, dan.id],
    [marcus.id, priya.id],
    [vera.id, marcus.id],
    [vera.id, nate.id],
    [vera.id, zoe.id],
    [dan.id, marcus.id],
    [dan.id, vera.id],
    [dan.id, priya.id],
    [dan.id, nate.id],
    [dan.id, zoe.id],
    [priya.id, vera.id],
    [priya.id, zoe.id],
    [priya.id, marcus.id],
    [nate.id, marcus.id],
    [nate.id, dan.id],
    [nate.id, zoe.id],
    [zoe.id, priya.id],
    [zoe.id, nate.id],
    [zoe.id, marcus.id],
  ] as [string, string][];

  for (const [followerId, followingId] of followPairs) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      update: {},
      create: { followerId, followingId },
    });
  }
  console.log(`  ✓ ${followPairs.length} follow relationships`);

  // ── 5. Likes on diary entries ──────────────────────────────────────────────
  console.log("  Creating likes…");
  const likePairs: [string, string][] = [
    // likes on Marcus's entries
    [vera.id,  eM1.id],
    [dan.id,   eM1.id],
    [priya.id, eM1.id],
    [nate.id,  eM1.id],
    [zoe.id,   eM1.id],
    [vera.id,  eM4.id],
    [dan.id,   eM4.id],
    [zoe.id,   eM7.id],
    [nate.id,  eM7.id],
    // likes on Vera's entries
    [marcus.id, eV1.id],
    [dan.id,    eV1.id],
    [priya.id,  eV3.id],
    [nate.id,   eV3.id],
    [marcus.id, eV3.id],
    // likes on Dan's entries
    [marcus.id, eD1.id],
    [vera.id,   eD1.id],
    [zoe.id,    eD1.id],
    [nate.id,   eD2.id],
    [vera.id,   eD5.id],
    // likes on Priya's entries
    [marcus.id, eP2.id],
    [vera.id,   eP2.id],
    [dan.id,    eP2.id],
    [zoe.id,    eP3.id],
    // likes on Nate's entries
    [marcus.id, eN1.id],
    [vera.id,   eN1.id],
    [dan.id,    eN1.id],
    [zoe.id,    eN2.id],
    // likes on Zoe's entries
    [marcus.id, eZ1.id],
    [dan.id,    eZ1.id],
    [vera.id,   eZ2.id],
    [nate.id,   eZ2.id],
    [priya.id,  eZ4.id],
  ];

  for (const [userId, diaryEntryId] of likePairs) {
    const existing = await prisma.like.findFirst({ where: { userId, diaryEntryId } });
    if (!existing) await prisma.like.create({ data: { userId, diaryEntryId } });
  }
  console.log(`  ✓ ${likePairs.length} likes`);

  // ── 6. Comments ───────────────────────────────────────────────────────────
  console.log("  Creating comments…");

  async function comment(userId: string, diaryEntryId: string, body: string) {
    // Comments have no unique key, so we check before inserting
    const existing = await prisma.comment.findFirst({
      where: { userId, diaryEntryId, body },
    });
    if (existing) return existing;
    return prisma.comment.create({ data: { userId, diaryEntryId, body } });
  }

  // On Marcus's Never Gonna Give You Up review (most popular)
  await comment(vera.id,  eM1.id, "Marcus you've been talking about this review for literally a year. Worth the wait.");
  await comment(dan.id,   eM1.id, "Foundational text is correct. I'm citing this in my dissertation.");
  await comment(priya.id, eM1.id, "Adding this to my 'canonical takes' folder.");
  await comment(zoe.id,   eM1.id, "The only acceptable opinion on this video.");

  // On Vera's All Star review
  await comment(marcus.id, eV2.id, "The Shrek pipeline. We all go through it.");
  await comment(nate.id,   eV2.id, "I feel this in my SOUL every time.");

  // On Dan's Sandstorm review
  await comment(zoe.id,    eD1.id, "Not irony. Never was irony. We knew all along.");
  await comment(marcus.id, eD1.id, "Dan finally admitted it. Historic day.");
  await comment(vera.id,   eD1.id, "I'm framing this comment.");

  // On Dan's Shooting Stars review
  await comment(nate.id, eD2.id, "The drop really is cinema though, not even joking.");
  await comment(zoe.id,  eD2.id, "Agreed.");

  // On Priya's Numa Numa review
  await comment(marcus.id, eP2.id, "Three boys and a webcam. That's all it takes.");
  await comment(vera.id,   eP2.id, "I watched this on dial-up in 2004. Full circle.");
  await comment(nate.id,   eP2.id, "Two billion views is crazy when you think about it.");

  // On Nate's All Star review
  await comment(vera.id, eN1.id,   "He woke up. Somebody spoke. The rest is history.");
  await comment(marcus.id, eN1.id, "Changed your life in 1999 and mine in 2007. Different eras, same impact.");
  await comment(dan.id, eN1.id,    "All Star defenders we stay winning.");

  // On Zoe's Never Gonna Give You Up review
  await comment(marcus.id, eZ1.id, "Economy of language. I respect it.");
  await comment(dan.id, eZ1.id,    "'It goes so hard' is the perfect review.");

  // On Vera's Numa Numa review
  await comment(marcus.id, eV3.id, "Your Roman Empire and mine both. Solidarity.");
  await comment(priya.id,  eV3.id, "Every. Single. Day. Same.");

  // On Nate's latest entry
  await comment(zoe.id, eN6.id,   "Welcome to the good side of the playlist.");
  await comment(vera.id, eN6.id,  "Nate's taste arc has been remarkable to witness.");

  console.log("  ✓ Comments created");

  // ── 7. Favorite videos (pinned on profiles) ────────────────────────────────
  console.log("  Setting favorite videos…");

  async function setFavorites(userId: string, videoIds: string[]) {
    for (let i = 0; i < videoIds.length && i < 4; i++) {
      const video = videoRecords.find((v) => v.youtubeId === videoIds[i]);
      if (!video) continue;
      await prisma.favoriteVideo.upsert({
        where: { userId_position: { userId, position: i + 1 } },
        update: { videoId: video.id },
        create: { userId, videoId: video.id, position: i + 1 },
      });
    }
  }

  await setFavorites(marcus.id, ["dQw4w9WgXcQ", "djV11Xbc914", "y6120QOlsfU", "hHkKJfcBXcw"]);
  await setFavorites(vera.id,   ["dQw4w9WgXcQ", "hHkKJfcBXcw", "y6120QOlsfU", "9bZkp7q19f0"]);
  await setFavorites(dan.id,    ["djV11Xbc914", "kfVsfOSbJY0", "dQw4w9WgXcQ", "J---aiyznGQ"]);
  await setFavorites(priya.id,  ["9bZkp7q19f0", "hHkKJfcBXcw", "djV11Xbc914", "dQw4w9WgXcQ"]);
  await setFavorites(nate.id,   ["y6120QOlsfU", "dQw4w9WgXcQ", "kfVsfOSbJY0", "J---aiyznGQ"]);
  await setFavorites(zoe.id,    ["dQw4w9WgXcQ", "djV11Xbc914", "9bZkp7q19f0", "y6120QOlsfU"]);

  console.log("  ✓ Favorite videos set");

  console.log("\n✅ Seed complete!");
  console.log(`   Users:   ${userRecords.length}`);
  console.log(`   Videos:  ${videoRecords.length}`);
  console.log(`   Follows: ${followPairs.length}`);
  console.log(`   Likes:   ${likePairs.length}`);
  console.log("\n   Login as any seed user via /login (OAuth not available for fake emails).");
  console.log("   Browse their profiles at /u/<username>.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
