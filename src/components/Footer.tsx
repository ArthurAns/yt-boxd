import Link from "next/link";
import Logo from "@/components/Logo";

const LINKS = [
  { href: "/videos", label: "Videos" },
  { href: "/lists", label: "Lists" },
  { href: "/members", label: "Members" },
  { href: "/feed", label: "Feed" },
  { href: "/settings", label: "Settings" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-10 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Logo />
          <p className="text-xs text-faint">
            Track, rate and share the videos you watch.
          </p>
        </div>

        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-faint">
        © {new Date().getFullYear()} ytboxd
      </div>
    </footer>
  );
}
