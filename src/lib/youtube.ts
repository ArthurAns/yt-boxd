/**
 * YouTube utilities
 *
 * Strategy (cheapest-first):
 *  1. Parse video ID from any YouTube URL format (free, no network)
 *  2. oEmbed  – always called first; free, no quota, returns title + thumbnail
 *  3. YouTube Data API v3 – enriches with channel / duration / description
 *     • If quota is exhausted (HTTP 403 + reason "quotaExceeded") we return
 *       quotaExceeded: true so the caller can store oEmbed data now and show
 *       the user a "will be enriched shortly" message.
 */

export type OEmbedData = {
  title: string;
  thumbnailUrl: string;
  authorName: string;
};

export type ApiEnrichmentData = {
  channelId: string;
  channelName: string;
  description: string;
  duration: string;   // formatted "H:MM:SS" or "M:SS"
  publishedAt: string;
  viewCount: number;
  tags: string[];
};

export type VideoMetadata = OEmbedData &
  Partial<ApiEnrichmentData> & {
    youtubeId: string;
    enriched: boolean;
    /** true when the API 403'd due to quota – show a pending message */
    quotaExceeded?: boolean;
  };

// ─── URL parsing ─────────────────────────────────────────────────────────────

/**
 * Extract the YouTube video ID from any common URL format, or return null.
 * Handles: youtu.be/ID, ?v=ID, /embed/ID, /shorts/ID, /live/ID, bare 11-char ID
 */
export function parseYouTubeId(input: string): string | null {
  try {
    const url = new URL(input.trim());

    if (url.hostname === "youtu.be" || url.hostname === "www.youtu.be") {
      return url.pathname.slice(1).split("/")[0] || null;
    }

    if (
      url.hostname === "youtube.com" ||
      url.hostname === "www.youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      if (url.searchParams.has("v")) return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live", "v", "e"].includes(parts[0])) {
        return parts[1] ?? null;
      }
    }
  } catch {
    // not a valid URL – fall through
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
  return null;
}

// ─── oEmbed (always free, no key required) ───────────────────────────────────

export async function fetchOEmbed(youtubeId: string): Promise<OEmbedData> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`oEmbed failed: ${res.status}`);
  const data = await res.json();
  return {
    title: data.title,
    thumbnailUrl: data.thumbnail_url,
    authorName: data.author_name,
  };
}

// ─── YouTube Data API v3 enrichment ─────────────────────────────────────────

/**
 * Returns enrichment data, or null if:
 *  - No API key is configured
 *  - Quota is exceeded (caller should show a pending message instead of erroring)
 * Throws on unexpected API errors.
 */
export async function fetchApiEnrichment(
  youtubeId: string
): Promise<ApiEnrichmentData | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  const url =
    `https://www.googleapis.com/youtube/v3/videos` +
    `?id=${youtubeId}&part=snippet,contentDetails,statistics&key=${apiKey}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    if (res.status === 403) {
      const body = await res.json().catch(() => ({}));
      const reason: string = body?.error?.errors?.[0]?.reason ?? "";
      const isQuotaError =
        reason === "quotaExceeded" ||
        reason === "dailyLimitExceeded" ||
        reason === "rateLimitExceeded";
      if (isQuotaError) return null; // signal quota exhaustion without throwing
    }
    throw new Error(`YouTube API error: ${res.status}`);
  }

  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;

  return {
    channelId: item.snippet.channelId,
    channelName: item.snippet.channelTitle,
    description: item.snippet.description,
    duration: parseDuration(item.contentDetails.duration),
    publishedAt: item.snippet.publishedAt,
    viewCount: parseInt(item.statistics.viewCount ?? "0", 10),
    tags: item.snippet.tags ?? [],
  };
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

/**
 * Fetches full video metadata.
 * Always fetches oEmbed (free). Attempts API enrichment in parallel.
 * Never throws due to quota — returns quotaExceeded flag instead.
 */
export async function fetchVideoMetadata(
  youtubeId: string
): Promise<VideoMetadata> {
  const [oembed, enrichment] = await Promise.allSettled([
    fetchOEmbed(youtubeId),
    fetchApiEnrichment(youtubeId),
  ]);

  if (oembed.status === "rejected") {
    throw new Error(`Could not retrieve video info: ${oembed.reason}`);
  }

  const base: VideoMetadata = {
    youtubeId,
    ...oembed.value,
    enriched: false,
  };

  if (enrichment.status === "fulfilled" && enrichment.value !== null) {
    return { ...base, ...enrichment.value, enriched: true };
  }

  // null = quota exceeded
  if (enrichment.status === "fulfilled" && enrichment.value === null) {
    return { ...base, quotaExceeded: true };
  }

  // unexpected enrichment error – log but don't block the user
  console.error(
    "API enrichment error (non-quota):",
    (enrichment as PromiseRejectedResult).reason
  );
  return base;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert ISO 8601 duration (PT1H2M3S) → "1:02:03" / "2:03" */
function parseDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = parseInt(m[1] ?? "0", 10);
  const min = parseInt(m[2] ?? "0", 10);
  const s = parseInt(m[3] ?? "0", 10);
  const mm = String(min).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
