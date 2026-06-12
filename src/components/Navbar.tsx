"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import Avatar from "@/components/Avatar";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type UserWithUsername = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string;
  username?: string | null;
};

function NavLink({
  href,
  children,
  onClick,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`transition-colors ${
        active ? "text-[var(--accent-green)]" : "hover:text-white"
      } ${className}`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const user = session?.user as UserWithUsername | undefined;

  // Close the user dropdown on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  // Close both menus whenever the route changes (adjust state during render)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileNavOpen(false);
    setMenuOpen(false);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            className="md:hidden flex flex-col justify-center gap-[5px] w-8 h-8 text-[var(--text-muted)] hover:text-white"
          >
            {mobileNavOpen ? (
              <span className="text-xl leading-none mx-auto">×</span>
            ) : (
              <>
                <span className="block h-0.5 w-5 bg-current mx-auto rounded" />
                <span className="block h-0.5 w-5 bg-current mx-auto rounded" />
                <span className="block h-0.5 w-5 bg-current mx-auto rounded" />
              </>
            )}
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="text-[var(--accent-green)] font-bold text-xl tracking-tight"
          >
            YTBoxd
          </Link>
        </div>

        {/* Centre nav links (desktop) */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          {user && <NavLink href="/feed">Feed</NavLink>}
          <NavLink href="/videos">Videos</NavLink>
          <NavLink href="/lists">Lists</NavLink>
          <NavLink href="/members">Members</NavLink>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/log"
                className="inline-flex items-center gap-1 bg-[var(--accent-green)] text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-[var(--accent-green-dark)] transition-colors"
              >
                + LOG
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white"
                >
                  <Avatar src={user.image} name={user.name} size={28} />
                  <span className="hidden sm:block font-medium uppercase tracking-wider text-xs">
                    {user.name}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-[var(--bg-secondary)] border border-[var(--border)] rounded shadow-lg text-sm py-1 animate-fade-in">
                    <Link
                      href={`/u/${user.username ?? user.name}`}
                      className="block px-4 py-2 hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/feed"
                      className="block px-4 py-2 hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white"
                      onClick={() => setMenuOpen(false)}
                    >
                      Feed
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white"
                      onClick={() => setMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <hr className="my-1 border-[var(--border)]" />
                    <button
                      onClick={() => {
                        signOut();
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-[var(--text-muted)] hover:text-white"
              >
                Sign in
              </Link>
              <button
                onClick={() => signIn("google")}
                className="bg-[var(--accent-green)] text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-[var(--accent-green-dark)] transition-colors"
              >
                Create account
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileNavOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-secondary)] animate-fade-in">
          <div className="px-4 py-2 flex flex-col text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {user && (
              <NavLink
                href="/feed"
                className="py-2.5 border-b border-[var(--border)]/40"
                onClick={() => setMobileNavOpen(false)}
              >
                Feed
              </NavLink>
            )}
            <NavLink
              href="/videos"
              className="py-2.5 border-b border-[var(--border)]/40"
              onClick={() => setMobileNavOpen(false)}
            >
              Videos
            </NavLink>
            <NavLink
              href="/lists"
              className="py-2.5 border-b border-[var(--border)]/40"
              onClick={() => setMobileNavOpen(false)}
            >
              Lists
            </NavLink>
            <NavLink
              href="/members"
              className="py-2.5"
              onClick={() => setMobileNavOpen(false)}
            >
              Members
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );
}
