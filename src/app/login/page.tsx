"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const FEATURES = [
  {
    title: "Keep a diary",
    description:
      "Log every video you watch with the date, so you never lose track of a gem again.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: "Rate and review",
    description:
      "Half-star ratings and short reviews — tell the world which videos are actually worth it.",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
  },
  {
    title: "Follow friends",
    description:
      "See what the people you trust are watching, liking and reviewing in your feed.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center max-w-4xl w-full">
        {/* Value props */}
        <div className="space-y-8 order-2 md:order-1">
          <h1 className="text-3xl font-bold leading-snug">
            The social network for{" "}
            <span className="text-[var(--accent-green)]">YouTube lovers</span>.
          </h1>
          <ul className="space-y-6">
            {FEATURES.map(({ title, description, icon }) => (
              <li key={title} className="flex gap-4">
                <span className="flex-shrink-0 w-10 h-10 rounded-md bg-[var(--accent-green)]/10 text-[var(--accent-green)] flex items-center justify-center">
                  {icon}
                </span>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Auth card */}
        <div className="order-1 md:order-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Sign in to YTBoxd</h2>
          <p className="text-[var(--text-muted)] text-sm mb-6">
            Track, rate and share the YouTube videos you watch.
          </p>
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-2.5 px-4 rounded-md hover:bg-gray-100 transition-colors"
          >
            {/* Google G icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26a5.4 5.4 0 0 1-8.07-2.85H.96v2.34A9 9 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.34z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95L3.97 7.3A5.36 5.36 0 0 1 9 3.58z"/>
            </svg>
            Continue with Google
          </button>
          <p className="text-xs text-[var(--text-dim)] mt-4">
            Free forever. No ads, no tracking — just videos.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
