"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Activity, Play, List, Users, Plus, User } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useLogModal } from "@/components/LogModal";
import { cn } from "@/lib/utils";

type UserWithUsername = {
  name?: string | null;
  image?: string | null;
  username?: string | null;
};

function Tab({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
        active ? "text-primary" : "text-faint hover:text-muted"
      )}
    >
      {children}
      {label}
    </Link>
  );
}

/** App-like fixed bottom navigation — mobile only. */
export default function BottomTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { open: openLogModal } = useLogModal();
  const user = session?.user as UserWithUsername | undefined;

  const is = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const profileHref = user ? `/u/${user.username ?? user.name}` : "/login";
  const profileActive = user ? is(`/u/${user.username ?? user.name}`) : is("/login");

  return (
    <>
      {/* Floating LOG action, above the tab bar */}
      {user && (
        <button
          onClick={() => openLogModal()}
          aria-label="Log a video"
          className="fixed bottom-20 right-4 z-40 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_20px_rgba(255,90,60,0.4)] transition-transform active:scale-95 md:hidden"
        >
          <Plus className="size-6" strokeWidth={2.5} />
        </button>
      )}

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/92 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="flex items-stretch">
          {user ? (
            <Tab href="/feed" label="Feed" active={is("/feed")}>
              <Activity className="size-5" />
            </Tab>
          ) : (
            <Tab href="/" label="Home" active={pathname === "/"}>
              <Home className="size-5" />
            </Tab>
          )}
          <Tab href="/videos" label="Videos" active={is("/videos") || is("/video")}>
            <Play className="size-5" />
          </Tab>
          <Tab href="/lists" label="Lists" active={is("/lists")}>
            <List className="size-5" />
          </Tab>
          <Tab href="/members" label="Members" active={is("/members")}>
            <Users className="size-5" />
          </Tab>
          <Tab href={profileHref} label={user ? "Profile" : "Sign in"} active={profileActive}>
            {user ? (
              <Avatar src={user.image} name={user.name} size={20} />
            ) : (
              <User className="size-5" />
            )}
          </Tab>
        </div>
      </nav>
    </>
  );
}
