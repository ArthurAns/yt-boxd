"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function RemoveButton({
  listId,
  youtubeId,
}: {
  listId: string;
  youtubeId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function remove() {
    setLoading(true);
    try {
      await fetch(`/api/lists/${listId}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeId }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="flex-shrink-0 rounded-md p-1 text-faint transition-colors hover:bg-white/[0.06] hover:text-primary disabled:opacity-50"
      aria-label="Remove from list"
    >
      <X className="size-4" />
    </button>
  );
}
