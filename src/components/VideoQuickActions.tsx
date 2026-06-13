"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { useLogModal } from "@/components/LogModal";

type UndatedEntry = { id: string; liked: boolean; rating: number | null } | null;

// ─── Inline star picker ───────────────────────────────────────────────────────

function InlineStarPicker({
  value,
  onChange,
  onClose,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  onClose: () => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full mt-2 left-0 z-20 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-3 shadow-xl animate-fade-in"
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const full = (hover ?? value ?? 0) >= star;
          const half = !full && (hover ?? value ?? 0) >= star - 0.5;
          return (
            <div key={star} className="relative w-7 h-7 cursor-pointer" role="button">
              <div
                className="absolute left-0 top-0 w-1/2 h-full z-10"
                onMouseEnter={() => setHover(star - 0.5)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onChange(value === star - 0.5 ? null : star - 0.5)}
              />
              <div
                className="absolute right-0 top-0 w-1/2 h-full z-10"
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onChange(value === star ? null : star)}
              />
              <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden="true">
                {half && (
                  <defs>
                    <linearGradient id={`qhalf-${star}`}>
                      <stop offset="50%" stopColor="var(--star-color)" />
                      <stop offset="50%" stopColor="#444" />
                    </linearGradient>
                  </defs>
                )}
                <polygon
                  points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                  fill={full ? "var(--star-color)" : half ? `url(#qhalf-${star})` : "#444"}
                />
              </svg>
            </div>
          );
        })}
        {value !== null && (
          <button
            type="button"
            aria-label="Remove rating"
            className="ml-2 text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors"
            onClick={() => onChange(null)}
          >
            ×
          </button>
        )}
      </div>
      {value !== null && (
        <p className="text-xs text-[var(--text-dim)] mt-1.5 text-center">
          {value}★ — click to change
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VideoQuickActions({
  youtubeId,
  undatedEntry: initialUndatedEntry,
  hasDatedEntry,
  isLoggedIn,
}: {
  youtubeId: string;
  undatedEntry: UndatedEntry;
  hasDatedEntry: boolean;
  isLoggedIn: boolean;
}) {
  const [entry, setEntry] = useState<UndatedEntry>(initialUndatedEntry);
  const [busy, setBusy] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { open: openLogModal } = useLogModal();

  const isWatched = entry !== null || hasDatedEntry;
  const isLiked = entry?.liked ?? false;
  const currentRating = entry?.rating ?? null;

  const callApi = useCallback(
    async (action: string, rating?: number) => {
      const res = await fetch("/api/watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeId, action, ...(rating !== undefined && { rating }) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      return data.entry as UndatedEntry;
    },
    [youtubeId]
  );

  async function handle(action: string, rating?: number) {
    if (!isLoggedIn) { router.push("/login"); return; }
    setBusy(true);
    try {
      const updated = await callApi(action, rating);
      setEntry(updated);
      router.refresh();
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleWatch() {
    if (isWatched) {
      if (!entry && hasDatedEntry) {
        toast("Remove your diary entry to unmark as watched", "error");
        return;
      }
      await handle("unwatch");
    } else {
      await handle("watch");
    }
  }

  async function handleRate(rating: number | null) {
    setRatingOpen(false);
    if (rating === null) {
      await handle("unrate");
    } else {
      await handle("rate", rating);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Watched */}
      <button
        onClick={toggleWatch}
        disabled={busy}
        aria-pressed={isWatched}
        className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border transition-colors disabled:opacity-50 ${
          isWatched
            ? "bg-[var(--accent-green)]/10 border-[var(--accent-green)] text-[var(--accent-green)] hover:bg-red-500/10 hover:border-red-400/60 hover:text-red-400"
            : "border-[var(--border)] text-[var(--text-muted)] hover:border-white/30 hover:text-white"
        }`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          {isWatched ? (
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          )}
        </svg>
        Watched
      </button>

      {/* Like */}
      <button
        onClick={() => handle(isLiked ? "unlike" : "like")}
        disabled={busy}
        aria-pressed={isLiked}
        className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border transition-colors disabled:opacity-50 ${
          isLiked
            ? "bg-red-500/10 border-red-400/60 text-red-400 hover:bg-red-500/20"
            : "border-[var(--border)] text-[var(--text-muted)] hover:border-white/30 hover:text-white"
        }`}
      >
        <span className="text-base leading-none" aria-hidden="true">♥</span>
        Like
      </button>

      {/* Rate */}
      <div className="relative">
        <button
          onClick={() => {
            if (!isLoggedIn) { router.push("/login"); return; }
            setRatingOpen((v) => !v);
          }}
          disabled={busy}
          aria-expanded={ratingOpen}
          className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border transition-colors disabled:opacity-50 ${
            currentRating !== null
              ? "bg-[var(--star-color)]/10 border-[var(--star-color)]/60 text-[var(--star-color)] hover:bg-[var(--star-color)]/20"
              : "border-[var(--border)] text-[var(--text-muted)] hover:border-white/30 hover:text-white"
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill={currentRating !== null ? "var(--star-color)" : "none"}
            stroke={currentRating !== null ? "none" : "currentColor"}
            strokeWidth="2"
            aria-hidden="true"
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          {currentRating !== null ? `${currentRating}★` : "Rate"}
        </button>
        {ratingOpen && (
          <InlineStarPicker
            value={currentRating}
            onChange={handleRate}
            onClose={() => setRatingOpen(false)}
          />
        )}
      </div>

      {/* Review */}
      <button
        onClick={() => {
          if (!isLoggedIn) { router.push("/login"); return; }
          openLogModal(youtubeId);
        }}
        className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:border-white/30 hover:text-white transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
        Review
      </button>
    </div>
  );
}
