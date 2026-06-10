"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

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
    <div className="space-y-10">
      {/* ── Profile section ── */}
      <section className="bg-[var(--bg-card)] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Profile
        </h2>

        {/* Avatar (display only — managed by Google) */}
        <div className="flex items-center gap-4">
          {initial.image ? (
            <Image
              src={initial.image}
              alt={initial.name}
              width={56}
              height={56}
              className="rounded-full"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-xl text-[var(--text-muted)]">
              {initial.name[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <p className="font-medium">{initial.name}</p>
            <p className="text-xs text-[var(--text-dim)]">
              Profile picture is managed by Google
            </p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-[var(--text-muted)]" htmlFor="username">
              Username
            </label>
            <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-white/10 rounded-lg px-4 py-2.5">
              <span className="text-[var(--text-dim)] text-sm">@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={30}
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>
            <p className="text-xs text-[var(--text-dim)]">
              Lowercase letters, numbers, underscores. Max 30 characters.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-[var(--text-muted)]" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="A few words about yourself…"
              className="w-full bg-[var(--bg-secondary)] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] resize-none placeholder:text-[var(--text-dim)]"
            />
            <p className="text-xs text-[var(--text-dim)] text-right">{bio.length}/200</p>
          </div>

          {profileMsg && (
            <p className={`text-sm ${profileMsg.ok ? "text-[var(--accent-green)]" : "text-red-400"}`}>
              {profileMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="px-5 py-2 rounded-lg bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {profileSaving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      {/* ── Favorite videos section ── */}
      <section className="bg-[var(--bg-card)] rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Favorite Videos
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-1">
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
                    <div className="relative group">
                      {fav.thumbnailUrl ? (
                        <Image
                          src={fav.thumbnailUrl}
                          alt={fav.title}
                          width={144}
                          height={81}
                          className="rounded w-full object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-video bg-[var(--bg-secondary)] rounded flex items-center justify-center text-[var(--text-dim)] text-xs">
                          No thumb
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFavorite(fav.youtubeId)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                      <p className="text-xs text-[var(--text-dim)] line-clamp-1 mt-0.5">{fav.title}</p>
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-[var(--bg-secondary)] rounded border-2 border-dashed border-white/10 flex items-center justify-center text-[var(--text-dim)] text-xs">
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
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your diary to add a favorite…"
                className="w-full bg-[var(--bg-secondary)] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] placeholder:text-[var(--text-dim)]"
              />
              {filtered.length > 0 && (
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                  {filtered.slice(0, 10).map((v) => (
                    <button
                      key={v.youtubeId}
                      type="button"
                      onClick={() => addFavorite(v)}
                      disabled={!!favorites.find((f) => f.youtubeId === v.youtubeId)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-card)] transition-colors text-left disabled:opacity-40"
                    >
                      {v.thumbnailUrl && (
                        <Image
                          src={v.thumbnailUrl}
                          alt={v.title}
                          width={56}
                          height={32}
                          className="rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm truncate">{v.title}</p>
                        {v.channelName && (
                          <p className="text-xs text-[var(--text-dim)] truncate">{v.channelName}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {favMsg && (
            <p className={`text-sm ${favMsg.ok ? "text-[var(--accent-green)]" : "text-red-400"}`}>
              {favMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={favSaving}
            className="px-5 py-2 rounded-lg bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {favSaving ? "Saving…" : "Save favorites"}
          </button>
        </form>
      </section>
    </div>
  );
}
