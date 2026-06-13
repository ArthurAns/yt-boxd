import Link from "next/link";

const NAV_LINKS = [
  { href: "/videos", label: "Videos" },
  { href: "/lists", label: "Lists" },
  { href: "/members", label: "Members" },
  { href: "/feed", label: "Feed" },
];

const ACCOUNT_LINKS = [
  { href: "/login", label: "Sign in" },
  { href: "/settings", label: "Settings" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)]/30 mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {/* Branding */}
        <div className="space-y-2">
          <p className="text-[var(--accent-green)] font-bold text-xl tracking-tight">YTBoxd</p>
          <p className="text-xs text-[var(--text-dim)] leading-relaxed max-w-xs">
            Track, rate and share the YouTube videos you watch — like Letterboxd, but for the tube.
          </p>
        </div>

        {/* Navigate */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3">Navigate</p>
          <ul className="space-y-2">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3">Account</p>
          <ul className="space-y-2">
            {ACCOUNT_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--border)]/50 py-4 text-center text-xs text-[var(--text-dim)]">
        © {new Date().getFullYear()} YTBoxd · built for video lovers
      </div>
    </footer>
  );
}
