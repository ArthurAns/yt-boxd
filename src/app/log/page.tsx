"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";

// ─── Star Rating component ────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const stars = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  return (
    <div className="flex items-center gap-0.5" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const full = (hover ?? value ?? 0) >= star;
        const half =
          !full && (hover ?? value ?? 0) >= star - 0.5;
        return (
          <div key={star} className="relative w-6 h-6 cursor-pointer">
            {/* left half (0.5) */}
            <div
              className="absolute left-0 top-0 w-1/2 h-full z-10"
              onMouseEnter={() => setHover(star - 0.5)}
              onMouseLeave={() => setHover(null)}
              onClick={() =>
                onChange(value === star - 0.5 ? null : star - 0.5)
              }
            />
            {/* right half (1.0) */}
            <div
              className="absolute right-0 top-0 w-1/2 h-full z-10"
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onChange(value === star ? null : star)}
            />
            {/* Star SVG */}
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6"
              style={{ color: full || half ? "var(--star-color)" : "#444" }}
            >
              {half ? (
                <defs>
                  <linearGradient id={`half-${star}`}>
                    <stop
                      offset="50%"
                      stopColor="var(--star-color)"
                    />
                    <stop offset="50%" stopColor="#444" />
                  </linearGradient>
                </defs>
              ) : null}
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill={
                  full
                    ? "var(--star-color)"
                    : half
                    ? `url(#half-${star})`
                    : "#444"
                }
                stroke="none"
              />
            </svg>
          </div>
        );
      })}
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          clear
        </button>
      )}
    </div>
  );
}

// ─── Main log form ────────────────────────────────────────────────────────────

function LogForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [url, setUrl] = useState(searchParams.get("v") ?? "");
  const [preview, setPreview] = useState<{
    title: string;
    thumbnail: string;
    channel: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const [watchedDate, setWatchedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [rating, setRating] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [rewatch, setRewatch] = useState(false);
  const [review, setReview] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [quotaNotice, setQuotaNotice] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/log");
  }, [status, router]);

  // Auto-preview when URL changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPreview(null);
    setPreviewError("");

    if (!url.trim()) return;

    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        // Use oEmbed directly for the preview (lightweight)
        const encoded = encodeURIComponent(
          url.startsWith("http") ? url : `https://www.youtube.com/watch?v=${url}`
        );
        const res = await fetch(
          `https://www.youtube.com/oembed?url=${encoded}&format=json`
        );
        if (!res.ok) {
          setPreviewError("Could not find that video. Check the URL.");
        } else {
          const data = await res.json();
          setPreview({
            title: data.title,
            thumbnail: data.thumbnail_url,
            channel: data.author_name,
          });
        }
      } catch {
        setPreviewError("Could not reach YouTube. Check your connection.");
      } finally {
        setPreviewLoading(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [url]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, watchedDate, rating, liked, rewatch, review }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong.");
        return;
      }

      setSuccess(true);
      setQuotaNotice(data.quotaExceeded ?? false);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading…</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-[var(--bg-card)] rounded-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="text-4xl">✓</div>
          <h2 className="text-xl font-bold text-[var(--accent-green)]">Logged!</h2>
          {preview && (
            <p className="text-[var(--text-muted)] text-sm">
              <span className="text-[var(--text-primary)] font-medium">
                {preview.title}
              </span>{" "}
              has been added to your diary.
            </p>
          )}
          {quotaNotice && (
            <p className="text-xs text-yellow-400 bg-yellow-900/20 rounded px-3 py-2">
              YouTube API quota reached today — extra video details (duration,
              description) will be filled in automatically when the quota resets.
            </p>
          )}
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => {
                setSuccess(false);
                setUrl("");
                setPreview(null);
                setRating(null);
                setLiked(false);
                setRewatch(false);
                setReview("");
                setWatchedDate(new Date().toISOString().split("T")[0]);
              }}
              className="px-4 py-2 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-sm transition-colors"
            >
              Log another
            </button>
            <button
              onClick={() => router.push(`/u/${(session?.user as { username?: string })?.username ?? session?.user?.email}`)}
              className="px-4 py-2 rounded bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black text-sm font-semibold transition-colors"
            >
              View diary
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Log a video</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── URL input ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-muted)]">
              YouTube URL or ID
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=… or youtu.be/…"
              required
              className="w-full bg-[var(--bg-secondary)] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] placeholder:text-[var(--text-dim)]"
            />
          </div>

          {/* ── Video preview ── */}
          {previewLoading && (
            <div className="text-sm text-[var(--text-muted)] animate-pulse">
              Fetching video info…
            </div>
          )}
          {previewError && (
            <div className="text-sm text-red-400">{previewError}</div>
          )}
          {preview && (
            <div className="flex gap-3 bg-[var(--bg-card)] rounded-lg p-3 items-start">
              <Image
                src={preview.thumbnail}
                alt={preview.title}
                width={120}
                height={68}
                className="rounded object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium text-sm leading-snug line-clamp-2">
                  {preview.title}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {preview.channel}
                </p>
              </div>
            </div>
          )}

          {/* ── Date ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-muted)]">
              Date watched
            </label>
            <input
              type="date"
              value={watchedDate}
              onChange={(e) => setWatchedDate(e.target.value)}
              required
              className="bg-[var(--bg-secondary)] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] [color-scheme:dark]"
            />
          </div>

          {/* ── Rating ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-muted)]">
              Rating{" "}
              {rating !== null && (
                <span className="text-[var(--star-color)]">{rating} ★</span>
              )}
            </label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* ── Toggles ── */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={liked}
                onChange={(e) => setLiked(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent-green)]"
              />
              <span className="text-sm">
                <span className="text-red-400 mr-1">♥</span> Like
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rewatch}
                onChange={(e) => setRewatch(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent-green)]"
              />
              <span className="text-sm">
                <span className="mr-1">↺</span> Rewatch
              </span>
            </label>
          </div>

          {/* ── Review ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-muted)]">
              Review{" "}
              <span className="text-[var(--text-dim)]">(optional)</span>
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              placeholder="What did you think?"
              className="w-full bg-[var(--bg-secondary)] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] resize-none placeholder:text-[var(--text-dim)]"
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-400">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !preview}
            className="w-full py-3 rounded-lg bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving…" : "Save to diary"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LogPage() {
  return (
    <Suspense>
      <LogForm />
    </Suspense>
  );
}
