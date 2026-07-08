"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Plus, User, Activity, Settings, LogOut } from "lucide-react";
import Avatar from "@/components/Avatar";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useLogModal } from "@/components/LogModal";
import { cn } from "@/lib/utils";

type UserWithUsername = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string;
  username?: string | null;
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "text-foreground" : "text-muted hover:text-foreground"
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary transition-opacity duration-200",
          active ? "opacity-100" : "opacity-0"
        )}
      />
    </Link>
  );
}

export default function Navbar() {
  const { data: session } = useSession();
  const { open: openLogModal } = useLogModal();
  const user = session?.user as UserWithUsername | undefined;
  const profileHref = user ? `/u/${user.username ?? user.name}` : "/login";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Logo />

        {/* Centre nav links (desktop; mobile uses the bottom tab bar) */}
        <div className="hidden items-center gap-1 md:flex">
          {user && <NavLink href="/feed">Feed</NavLink>}
          <NavLink href="/videos">Videos</NavLink>
          <NavLink href="/lists">Lists</NavLink>
          <NavLink href="/members">Members</NavLink>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <Button size="sm" onClick={() => openLogModal()} className="hidden sm:inline-flex">
                <Plus />
                Log
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Account menu"
                  className="rounded-full outline-none transition-shadow hover:ring-2 hover:ring-primary/60 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Avatar src={user.image} name={user.name} size={30} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="truncate">
                    {user.name ?? user.username}
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={profileHref}>
                      <User />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/feed">
                      <Activity />
                      Feed
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Button size="sm" onClick={() => signIn("google")}>
                Create account
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
