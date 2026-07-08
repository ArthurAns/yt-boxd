"use client";

import { useState } from "react";

const STAR_POINTS =
  "12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26";

/** Interactive half-star picker (amber). */
export default function StarRating({
  value,
  onChange,
  size = 28,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <div className="flex items-center gap-0.5" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const full = shown >= star;
        const half = !full && shown >= star - 0.5;
        return (
          <div
            key={star}
            className="relative cursor-pointer transition-transform hover:scale-110"
            style={{ width: size, height: size }}
          >
            <div
              className="absolute left-0 top-0 z-10 h-full w-1/2"
              onMouseEnter={() => setHover(star - 0.5)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onChange(value === star - 0.5 ? null : star - 0.5)}
            />
            <div
              className="absolute right-0 top-0 z-10 h-full w-1/2"
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onChange(value === star ? null : star)}
            />
            <svg viewBox="0 0 24 24" style={{ width: size, height: size }} aria-hidden="true">
              {half && (
                <defs>
                  <linearGradient id={`half-${size}-${star}`}>
                    <stop offset="50%" stopColor="var(--color-star)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.14)" />
                  </linearGradient>
                </defs>
              )}
              <polygon
                points={STAR_POINTS}
                fill={
                  full
                    ? "var(--color-star)"
                    : half
                      ? `url(#half-${size}-${star})`
                      : "rgba(255,255,255,0.14)"
                }
              />
            </svg>
          </div>
        );
      })}
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-2 text-xs text-muted transition-colors hover:text-foreground"
        >
          clear
        </button>
      )}
    </div>
  );
}
