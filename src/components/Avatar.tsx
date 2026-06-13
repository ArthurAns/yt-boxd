"use client";

import Image from "next/image";
import { useState } from "react";

const PALETTE = [
  "#3d5a80", "#5c4a7f", "#7f4a5c", "#3d7f5c",
  "#7f6a3d", "#4a5c7f", "#5c7f4a", "#7f4a4a",
];

function colorFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({
  src,
  name,
  size = 32,
  className = "",
  interactive = false,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  interactive?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const ringClass = interactive
    ? "hover:ring-2 hover:ring-[var(--accent-green)] transition-all duration-150"
    : "";

  if (src && !failed) {
    return (
      <Image
        src={src}
        alt={name ?? "avatar"}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={`rounded-full flex-shrink-0 ${ringClass} ${className}`}
      />
    );
  }

  const initial = name ? name[0].toUpperCase() : null;
  const bg = name ? colorFor(name) : "var(--border)";
  const fontSize = Math.max(9, Math.round(size * 0.38));

  return (
    <span
      role="img"
      aria-label={name ?? "avatar"}
      style={{ width: size, height: size, backgroundColor: bg, fontSize }}
      className={`rounded-full flex items-center justify-center text-white font-semibold select-none flex-shrink-0 ${ringClass} ${className}`}
    >
      {initial ?? (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ width: size * 0.55, height: size * 0.55 }}
          aria-hidden="true"
        >
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      )}
    </span>
  );
}
