"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CircleCheck, Heart, RotateCcw } from "lucide-react";
import { useToast } from "@/components/Toast";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Context ──────────────────────────────────────────────────────────────────

type LogModalCtx = { open: (youtubeId?: string) => void };
const LogModalContext = createContext<LogModalCtx>({ open: () => {} });

export function useLogModal() {
  return useContext(LogModalContext);
}

// ─── Toggle chip (like / rewatch) ─────────────────────────────────────────────

function ToggleChip({
  pressed,
  onPressedChange,
  activeClass,
  children,
}: {
  pressed: boolean;
  onPressedChange: (v: boolean) => void;
  activeClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors [&_svg]:size-4",
        pressed
          ? activeClass
          : "border-border-strong text-muted hover:border-white/30 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

// ─── Review form ──────────────────────────────────────────────────────────────

export function ReviewForm({
  initialYoutubeId = "",
  onClose,
}: {
  initialYoutubeId?: string;
  onClose?: () => void; // provided by modal; absent = page context (shows own success screen)
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [url, setUrl] = useState(initialYoutubeId);
  const [preview, setPreview] = useState<{ title: string; thumbnail: string; channel: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const [watchedDate, setWatchedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [rating, setRating] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [rewatch, setRewatch] = useState(false);
  const [review, setReview] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [quotaNotice, setQuotaNotice] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Page context: redirect unauthenticated users
  useEffect(() => {
    if (!onClose && status === "unauthenticated") {
      router.push("/login?callbackUrl=/log");
    }
  }, [status, router, onClose]);

  // Debounced preview fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPreview(null);
    setPreviewError("");
    if (!url.trim()) return;

    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const encoded = encodeURIComponent(
          url.startsWith("http") ? url : `https://www.youtube.com/watch?v=${url}`
        );
        const res = await fetch(`https://www.youtube.com/oembed?url=${encoded}&format=json`);
        if (!res.ok) {
          setPreviewError("Could not find that video. Check the URL.");
        } else {
          const data = await res.json();
          setPreview({ title: data.title, thumbnail: data.thumbnail_url, channel: data.author_name });
        }
      } catch {
        setPreviewError("Could not reach YouTube. Check your connection.");
      } finally {
        setPreviewLoading(false);
      }
    }, 600);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [url]);

  function resetForm() {
    setSuccess(false);
    setUrl("");
    setPreview(null);
    setRating(null);
    setLiked(false);
    setRewatch(false);
    setReview("");
    setWatchedDate(new Date().toISOString().split("T")[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, watchedDate, rating, liked, rewatch, review }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error ?? "Something went wrong."); return; }

      toast("Review saved");
      router.refresh();

      if (onClose) {
        // Modal context: close immediately (toast handles feedback)
        onClose();
      } else {
        // Page context: show success screen
        setSuccess(true);
        setQuotaNotice(data.quotaExceeded ?? false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading state (page context only) ─────────────────────────────────────
  if (!onClose && status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted">Loading…</div>
      </div>
    );
  }

  // ── Success screen (page context only) ────────────────────────────────────
  if (!onClose && success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 text-center">
          <CircleCheck className="mx-auto size-10 text-watched" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold">Review saved</h2>
          {preview && (
            <p className="text-sm text-muted">
              Your review of{" "}
              <span className="font-medium text-foreground">{preview.title}</span>{" "}
              has been added to your diary.
            </p>
          )}
          {quotaNotice && (
            <p className="rounded-lg bg-star-soft px-3 py-2 text-xs text-star">
              YouTube API quota reached today — extra video details will be filled in automatically when the quota resets.
            </p>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={resetForm}>
              Review another
            </Button>
            <Button
              onClick={() =>
                router.push(`/u/${(session?.user as { username?: string })?.username ?? session?.user?.email}`)
              }
            >
              View diary
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* URL input */}
      <div className="space-y-2">
        <Label htmlFor="log-url">YouTube URL or ID</Label>
        <Input
          id="log-url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=… or youtu.be/…"
          required
          autoFocus={!initialYoutubeId}
        />
      </div>

      {/* Preview */}
      {previewLoading && (
        <div className="animate-pulse text-sm text-muted">Fetching video info…</div>
      )}
      {previewError && <div className="text-sm text-primary">{previewError}</div>}
      {preview && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
          <Image
            src={preview.thumbnail}
            alt={preview.title}
            width={120}
            height={68}
            className="flex-shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-medium leading-snug">{preview.title}</p>
            <p className="mt-1 text-xs text-muted">{preview.channel}</p>
          </div>
        </div>
      )}

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="log-date">Date watched</Label>
        <Input
          id="log-date"
          type="date"
          value={watchedDate}
          onChange={(e) => setWatchedDate(e.target.value)}
          required
          className="w-auto [color-scheme:dark]"
        />
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <Label>
          Rating
          {rating !== null && <span className="ml-1.5 normal-case text-star">{rating} ★</span>}
        </Label>
        <StarRating value={rating} onChange={setRating} size={26} />
      </div>

      {/* Toggles */}
      <div className="flex gap-2.5">
        <ToggleChip
          pressed={liked}
          onPressedChange={setLiked}
          activeClass="border-primary/60 bg-primary-soft text-primary"
        >
          <Heart className={liked ? "fill-current" : ""} />
          Like
        </ToggleChip>
        <ToggleChip
          pressed={rewatch}
          onPressedChange={setRewatch}
          activeClass="border-watched/60 bg-watched-soft text-watched"
        >
          <RotateCcw />
          Rewatch
        </ToggleChip>
      </div>

      {/* Review text */}
      <div className="space-y-2">
        <Label htmlFor="log-review">
          Review <span className="font-normal normal-case text-faint">(optional)</span>
        </Label>
        <Textarea
          id="log-review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
          placeholder="What did you think?"
          className="resize-none"
        />
      </div>

      {submitError && <p className="text-sm text-primary">{submitError}</p>}

      {/* Actions */}
      <div className={cn("flex gap-3", onClose && "justify-end")}>
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting || !preview}
          className={onClose ? "px-6" : "w-full"}
        >
          {submitting ? "Saving…" : "Save review"}
        </Button>
      </div>
    </form>
  );

  // Page context: wrapped in full-page layout with heading
  if (!onClose) {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-xl space-y-6">
          <h1 className="font-display text-2xl font-bold">Write a review</h1>
          {formContent}
        </div>
      </div>
    );
  }

  // Modal context: return form content directly (dialog wrapper is in LogModalProvider)
  return formContent;
}

// ─── Provider + dialog ────────────────────────────────────────────────────────

export function LogModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [youtubeId, setYoutubeId] = useState("");
  const [formKey, setFormKey] = useState(0);

  const open = useCallback((yid?: string) => {
    setYoutubeId(yid ?? "");
    setFormKey((k) => k + 1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <LogModalContext.Provider value={{ open }}>
      {children}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a review</DialogTitle>
          </DialogHeader>
          <ReviewForm key={formKey} initialYoutubeId={youtubeId} onClose={close} />
        </DialogContent>
      </Dialog>
    </LogModalContext.Provider>
  );
}
