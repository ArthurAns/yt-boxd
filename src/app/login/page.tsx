"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, Star, Users } from "lucide-react";
import Logo from "@/components/Logo";

const FEATURES = [
  {
    title: "Keep a diary",
    description:
      "Log every video you watch with the date, so you never lose track of a gem again.",
    icon: <CalendarDays className="size-5" aria-hidden="true" />,
  },
  {
    title: "Rate and review",
    description:
      "Half-star ratings and short reviews — tell the world which videos are actually worth it.",
    icon: <Star className="size-5" aria-hidden="true" />,
  },
  {
    title: "Follow friends",
    description:
      "See what the people you trust are watching, liking and reviewing in your feed.",
    icon: <Users className="size-5" aria-hidden="true" />,
  },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-4xl items-center gap-10 md:grid-cols-2 md:gap-16">
        {/* Value props */}
        <div className="order-2 space-y-8 md:order-1">
          <h1 className="font-display text-3xl font-bold leading-snug tracking-tight">
            The social network for{" "}
            <span className="text-primary">video lovers</span>.
          </h1>
          <ul className="space-y-6">
            {FEATURES.map(({ title, description, icon }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  {icon}
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Auth card */}
        <div className="order-1 rounded-2xl border border-border bg-card p-8 text-center md:order-2">
          <div className="mb-5 flex justify-center">
            <Logo size="lg" />
          </div>
          <h2 className="mb-2 font-display text-xl font-bold">Sign in</h2>
          <p className="mb-6 text-sm text-muted">
            Track, rate and share the videos you watch.
          </p>
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-2.5 font-semibold text-gray-800 transition-colors hover:bg-gray-100"
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
          <p className="mt-4 text-xs text-faint">
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
