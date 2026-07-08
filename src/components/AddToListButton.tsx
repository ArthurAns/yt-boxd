"use client";

import { useState } from "react";
import { Check, ListPlus } from "lucide-react";
import { useToast } from "@/components/Toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ListOption = { id: string; name: string };

export default function AddToListButton({
  youtubeId,
  lists,
}: {
  youtubeId: string;
  lists: ListOption[];
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const toast = useToast();

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
      } else if (res.status === 409) {
        toast(`Already in "${listName}"`);
        setAdded((prev) => new Set([...prev, listId]));
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
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Add to list"
        className="inline-flex h-7 flex-shrink-0 items-center gap-1 rounded-lg border border-border-strong px-2 text-[11px] font-semibold text-faint outline-none transition-colors hover:border-primary/50 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ListPlus className="size-3.5" />
        List
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Add to list</DropdownMenuLabel>
        {lists.map((list) => {
          const done = added.has(list.id);
          const busy = pending === list.id;
          return (
            <DropdownMenuItem
              key={list.id}
              disabled={!!pending}
              onSelect={(e) => {
                e.preventDefault();
                addToList(list.id, list.name);
              }}
              className={cn(done && "text-watched data-[highlighted]:text-watched")}
            >
              <span className="flex w-4 flex-shrink-0 items-center justify-center text-xs">
                {busy ? "…" : done ? <Check className="size-3.5" /> : null}
              </span>
              <span className="truncate">{list.name}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
