"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";

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
    <div className="mt-2 pl-11">
      {/* Toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-faint transition-colors hover:text-muted"
      >
        <MessageCircle className="size-3.5" aria-hidden="true" />
        {open
          ? "Hide comments"
          : total > 0
          ? `${total} comment${total !== 1 ? "s" : ""}`
          : "Add a comment"}
      </button>

      {open && (
        <div className="mt-3 space-y-3 animate-fade-in">
          {/* Existing comments */}
          {comments.map((comment) => (
            <div key={comment.id} className="group flex items-start gap-2">
              <Link href={`/u/${comment.user.username ?? comment.user.name}`}>
                <Avatar src={comment.user.image} name={comment.user.name} size={22} interactive />
              </Link>
              <div className="min-w-0 flex-1">
                <span className="mr-1.5 text-xs font-medium text-foreground">
                  {comment.user.username ?? comment.user.name}
                </span>
                <span className="text-xs text-muted">{comment.body}</span>
              </div>
              {comment.user.id === currentUserId && (
                <button
                  onClick={() => deleteComment(comment.id)}
                  className="flex-shrink-0 text-faint opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                  aria-label="Delete comment"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}

          {/* Add comment form */}
          {isLoggedIn ? (
            <form onSubmit={submit} className="mt-1 flex gap-2">
              <input
                type="text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add a comment…"
                maxLength={1000}
                className="h-8 flex-1 rounded-lg border border-border-strong bg-inset px-3 text-xs text-foreground placeholder:text-faint transition-colors hover:border-white/25 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <Button type="submit" size="sm" disabled={submitting || !body.trim()}>
                Post
              </Button>
            </form>
          ) : (
            <Link href="/login" className="text-xs font-medium text-primary hover:underline">
              Sign in to comment
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
