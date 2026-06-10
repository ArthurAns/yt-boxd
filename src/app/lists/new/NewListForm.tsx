"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewListForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), isPublic }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/lists/${data.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-xl p-6 space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm text-[var(--text-muted)]" htmlFor="list-name">
          List name <span className="text-red-400">*</span>
        </label>
        <input
          id="list-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g. Best tech explainers"
          className="w-full bg-[var(--bg-secondary)] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] placeholder:text-[var(--text-dim)]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm text-[var(--text-muted)]" htmlFor="list-desc">
          Description <span className="text-[var(--text-dim)]">(optional)</span>
        </label>
        <textarea
          id="list-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="What's this list about?"
          className="w-full bg-[var(--bg-secondary)] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] resize-none placeholder:text-[var(--text-dim)]"
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="w-4 h-4 accent-[var(--accent-green)]"
        />
        <div>
          <span className="text-sm font-medium">Public list</span>
          <p className="text-xs text-[var(--text-dim)]">
            Public lists appear in the community lists page
          </p>
        </div>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="px-5 py-2 rounded-lg bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create list"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
