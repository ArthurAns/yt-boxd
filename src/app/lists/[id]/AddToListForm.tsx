"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseYouTubeId } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-faint">
        Add a video
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          placeholder="YouTube URL or video ID"
        />
        <Input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder="Note (optional)"
        />
        {error && <p className="text-sm text-primary">{error}</p>}
        <Button type="submit" disabled={saving || !url.trim()}>
          {saving ? "Adding…" : "Add video"}
        </Button>
      </form>
    </section>
  );
}
