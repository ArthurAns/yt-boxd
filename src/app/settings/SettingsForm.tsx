"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Video = { youtubeId: string; title: string; thumbnailUrl: string | null; channelName?: string | null };

export default function SettingsForm({
  initial,
  diaryVideos,
  initialFavorites,
}: {
  initial: { username: string; bio: string; name: string; image: string | null };
  diaryVideos: Video[];
  initialFavorites: Video[];
}) {
  const router = useRouter();

  // ── Profile state ────────────────────────────────────────────────────────
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), bio: bio.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({ ok: false, text: data.error ?? "Something went wrong." });
      } else {
        setProfileMsg({ ok: true, text: "Saved!" });
        router.refresh();
      }
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Favorites state ──────────────────────────────────────────────────────
  const [favorites, setFavorites] = useState<Video[]>(initialFavorites.slice(0, 4));
  const [favSaving, setFavSaving] = useState(false);
  const [favMsg, setFavMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? diaryVideos.filter(
        (v) =>
          v.title.toLowerCase().includes(search.toLowerCase()) ||
          (v.channelName ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : [];

  function addFavorite(video: Video) {
    if (favorites.length >= 4) return;
    if (favorites.find((f) => f.youtubeId === video.youtubeId)) return;
    setFavorites([...favorites, video]);
    setSearch("");
  }

  function removeFavorite(youtubeId: string) {
    setFavorites(favorites.filter((f) => f.youtubeId !== youtubeId));
  }

  async function saveFavorites(e: React.FormEvent) {
    e.preventDefault();
    setFavSaving(true);
    setFavMsg(null);
    try {
      const res = await fetch("/api/settings/favorites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeIds: favorites.map((f) => f.youtubeId) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFavMsg({ ok: false, text: data.error ?? "Something went wrong." });
      } else {
        setFavMsg({ ok: true, text: "Saved!" });
        router.refresh();
      }
    } finally {
      setFavSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Profile section ── */}
      <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-faint">
          Profile
        </h2>

        {/* Avatar (display only — managed by Google) */}
        <div className="flex items-center gap-4">
          <Avatar src={initial.image} name={initial.name} size={56} />
          <div>
            <p className="font-medium">{initial.name}</p>
            <p className="text-xs text-faint">
              Profile picture is managed by Google
            </p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-border-strong bg-inset px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25 hover:border-white/25">
              <span className="text-sm text-faint">@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={30}
                className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
              />
            </div>
            <p className="text-xs text-faint">
              Lowercase letters, numbers, underscores. Max 30 characters.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="A few words about yourself…"
              className="resize-none"
            />
            <p className="text-right text-xs text-faint">{bio.length}/200</p>
          </div>

          {profileMsg && (
            <p className={`text-sm ${profileMsg.ok ? "text-watched" : "text-primary"}`}>
              {profileMsg.text}
            </p>
          )}

          <Button type="submit" disabled={profileSaving}>
            {profileSaving ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </section>

      {/* ── Favorite videos section ── */}
      <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-faint">
            Favorite Videos
          </h2>
          <p className="mt-1 text-xs text-faint">
            Pin up to 4 videos on your profile. Choose from videos you&apos;ve logged.
          </p>
        </div>

        <form onSubmit={saveFavorites} className="space-y-4">
          {/* Current favorites grid */}
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => {
              const fav = favorites[i];
              return (
                <div key={i} className="space-y-1">
                  {fav ? (
                    <div className="group relative">
                      {fav.thumbnailUrl ? (
                        <Image
                          src={fav.thumbnailUrl}
                          alt={fav.title}
                          width={144}
                          height={81}
                          className="w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-inset text-xs text-faint">
                          No thumb
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFavorite(fav.youtubeId)}
                        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-primary group-hover:opacity-100"
                        aria-label="Remove"
                      >
                        <X className="size-3" />
                      </button>
                      <p className="mt-0.5 line-clamp-1 text-xs text-faint">{fav.title}</p>
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-lg border-2 border-dashed border-white/10 bg-inset text-xs text-faint">
                      {i + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Search to add */}
          {favorites.length < 4 && (
            <div className="space-y-2">
              <Input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your diary to add a favorite…"
              />
              {filtered.length > 0 && (
                <div className="max-h-56 overflow-hidden overflow-y-auto rounded-xl border border-border bg-popover">
                  {filtered.slice(0, 10).map((v) => (
                    <button
                      key={v.youtubeId}
                      type="button"
                      onClick={() => addFavorite(v)}
                      disabled={!!favorites.find((f) => f.youtubeId === v.youtubeId)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/[0.06] disabled:opacity-40"
                    >
                      {v.thumbnailUrl && (
                        <Image
                          src={v.thumbnailUrl}
                          alt={v.title}
                          width={56}
                          height={32}
                          className="flex-shrink-0 rounded-md object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm">{v.title}</p>
                        {v.channelName && (
                          <p className="truncate text-xs text-faint">{v.channelName}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {favMsg && (
            <p className={`text-sm ${favMsg.ok ? "text-watched" : "text-primary"}`}>
              {favMsg.text}
            </p>
          )}

          <Button type="submit" disabled={favSaving}>
            {favSaving ? "Saving…" : "Save favorites"}
          </Button>
        </form>
      </section>
    </div>
  );
}
