"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/components/Avatar";

type Comment = {
  id: string;
  body: string;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

export default function CommentSection({
  diaryEntryId,
  initialComments,
  currentUserId,
  isLoggedIn,
}: {
  diaryEntryId: string;
  initialComments: Comment[];
  currentUserId: string | null;
  isLoggedIn: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diaryEntryId, body }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setBody("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(id: string) {
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
  }

  const total = comments.length;

  return (
    <div className="pl-11 mt-2">
      {/* Toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
      >
        {open
          ? "Hide comments"
          : total > 0
          ? `${total} comment${total !== 1 ? "s" : ""}`
          : "Add a comment"}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Existing comments */}
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 items-start group">
              <Link href={`/u/${comment.user.username ?? comment.user.name}`}>
                <Avatar src={comment.user.image} name={comment.user.name} size={22} className="hover:opacity-80 transition-opacity" />
              </Link>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-[var(--text-muted)] mr-1.5">
                  {comment.user.username ?? comment.user.name}
                </span>
                <span className="text-xs text-[var(--text-dim)]">{comment.body}</span>
              </div>
              {comment.user.id === currentUserId && (
                <button
                  onClick={() => deleteComment(comment.id)}
                  className="text-[var(--text-dim)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  aria-label="Delete comment"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* Add comment form */}
          {isLoggedIn ? (
            <form onSubmit={submit} className="flex gap-2 mt-1">
              <input
                type="text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add a comment…"
                maxLength={1000}
                className="flex-1 bg-[var(--bg-secondary)] border border-white/10 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent-green)] placeholder:text-[var(--text-dim)]"
              />
              <button
                type="submit"
                disabled={submitting || !body.trim()}
                className="text-xs px-3 py-1.5 bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black font-semibold rounded transition-colors disabled:opacity-50"
              >
                Post
              </button>
            </form>
          ) : (
            <Link href="/login" className="text-xs text-[var(--accent-green)] hover:underline">
              Sign in to comment
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
