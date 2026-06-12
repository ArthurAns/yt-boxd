"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function ListEditForm({
  listId,
  initialName,
  initialDescription,
  initialIsPublic,
}: {
  listId: string;
  initialName: string;
  initialDescription: string;
  initialIsPublic: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();

  function cancel() {
    setName(initialName);
    setDescription(initialDescription);
    setIsPublic(initialIsPublic);
    setOpen(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
        }),
      });
      if (res.ok) {
        toast("List updated");
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        toast(data.error ?? "Couldn't save changes", "error");
      }
    } catch {
      toast("Couldn't save changes", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] border border-[var(--border)] rounded-md px-2.5 py-1 transition-colors"
      >
        Edit
      </button>
    );
  }

  return (
    <form
      onSubmit={save}
      className="mt-4 space-y-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4"
    >
      <div className="space-y-1">
        <label className="text-xs text-[var(--text-muted)]" htmlFor="edit-name">
          List name
        </label>
        <input
          id="edit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="w-full bg-[var(--bg-secondary)] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-[var(--text-muted)]" htmlFor="edit-desc">
          Description
        </label>
        <textarea
          id="edit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="What's this list about?"
          className="w-full bg-[var(--bg-secondary)] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] resize-none placeholder:text-[var(--text-dim)]"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="w-4 h-4 accent-[var(--accent-green)]"
        />
        Public list
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="px-4 py-1.5 rounded-lg bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="px-4 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
