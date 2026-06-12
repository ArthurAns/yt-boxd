"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";

type ListOption = { id: string; name: string };

export default function AddToListButton({
  youtubeId,
  lists,
}: {
  youtubeId: string;
  lists: ListOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function addToList(listId: string, listName: string) {
    if (pending) return;
    setPending(listId);
    try {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeId }),
      });
      if (res.ok) {
        setAdded((prev) => new Set([...prev, listId]));
        toast(`Added to "${listName}"`);
        setOpen(false);
      } else if (res.status === 409) {
        toast(`Already in "${listName}"`);
        setAdded((prev) => new Set([...prev, listId]));
        setOpen(false);
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "Couldn't add to list", "error");
      }
    } catch {
      toast("Couldn't add to list", "error");
    } finally {
      setPending(null);
    }
  }

  if (lists.length === 0) return null;

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Add to list"
        aria-expanded={open}
        className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-dim)] hover:text-[var(--accent-green)] border border-[var(--border)] hover:border-[var(--accent-green)]/40 rounded-md px-2 py-1 transition-colors"
      >
        + list
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-52 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg py-1 animate-fade-in">
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-semibold">
            Add to list
          </p>
          {lists.map((list) => {
            const done = added.has(list.id);
            const busy = pending === list.id;
            return (
              <button
                key={list.id}
                onClick={() => addToList(list.id, list.name)}
                disabled={!!pending}
                className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                  done
                    ? "text-[var(--accent-green)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-white"
                } disabled:opacity-60`}
              >
                <span className="w-3 flex-shrink-0 text-xs">
                  {busy ? "…" : done ? "✓" : ""}
                </span>
                <span className="truncate">{list.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
