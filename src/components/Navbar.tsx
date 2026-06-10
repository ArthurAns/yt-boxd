"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

type UserWithUsername = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string;
  username?: string | null;
};

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session?.user as UserWithUsername | undefined;

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link
          href="/"
          className="text-[var(--accent-green)] font-bold text-xl tracking-tight"
        >
          YTBoxd
        </Link>

        {/* Centre nav links (desktop) */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          {user && (
            <Link href="/feed" className="hover:text-white transition-colors">
              Feed
            </Link>
          )}
          <Link href="/videos" className="hover:text-white transition-colors">
            Videos
          </Link>
          <Link href="/lists" className="hover:text-white transition-colors">
            Lists
          </Link>
          <Link href="/members" className="hover:text-white transition-colors">
            Members
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/log"
                className="hidden sm:inline-flex items-center gap-1 bg-[var(--accent-green)] text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-[var(--accent-green-dark)] transition-colors"
              >
                + LOG
              </Link>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white"
                >
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name ?? "avatar"}
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-[var(--border)] flex items-center justify-center text-xs">
                      {user.name?.[0] ?? "?"}
                    </span>
                  )}
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
    </nav>
  );
}
