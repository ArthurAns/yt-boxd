"use client";

import Image from "next/image";
import { useState } from "react";

export default function VideoEmbed({
  youtubeId,
  title,
  thumbnailUrl,
}: {
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-lg"
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="relative w-full group rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-green)]"
      style={{ paddingBottom: "56.25%" }}
      aria-label={`Play ${title}`}
    >
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover group-hover:brightness-75 transition-[filter]"
          sizes="(max-width: 768px) 100vw, 640px"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-[var(--bg-card)]" />
      )}
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80 transition-colors">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-white ml-1"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}
