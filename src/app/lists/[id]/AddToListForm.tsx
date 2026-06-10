"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseYouTubeId } from "@/lib/youtube";

export default function AddToListForm({ listId }: { listId: string }) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const youtubeId = parseYouTubeId(url.trim());
    if (!youtubeId) {
      setError("Invalid YouTube URL or ID.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeId, note: note.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setUrl("");
      setNote("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-[var(--bg-card)] rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">
        Add a video
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          placeholder="YouTube URL or video ID"
          className="w-full bg-[var(--bg-secondary)] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] placeholder:text-[var(--text-dim)]"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder="Note (optional)"
          className="w-full bg-[var(--bg-secondary)] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] placeholder:text-[var(--text-dim)]"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={saving || !url.trim()}
          className="px-4 py-2 rounded-lg bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add video"}
        </button>
      </form>
    </section>
  );
}
