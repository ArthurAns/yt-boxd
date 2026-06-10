"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      className="flex-shrink-0 text-[var(--text-dim)] hover:text-red-400 transition-colors text-sm px-1 disabled:opacity-50"
      aria-label="Remove from list"
    >
      ×
    </button>
  );
}
