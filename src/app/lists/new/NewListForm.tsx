"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-card p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="list-name">
          List name <span className="text-primary">*</span>
        </Label>
        <Input
          id="list-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g. Best tech explainers"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="list-desc">
          Description <span className="font-normal normal-case text-faint">(optional)</span>
        </Label>
        <Textarea
          id="list-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="What's this list about?"
          className="resize-none"
        />
      </div>

      <label className="flex cursor-pointer select-none items-center gap-3">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="size-4 accent-[var(--color-primary)]"
        />
        <div>
          <span className="text-sm font-medium">Public list</span>
          <p className="text-xs text-faint">
            Public lists appear in the community lists page
          </p>
        </div>
      </label>

      {error && <p className="text-sm text-primary">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Creating…" : "Create list"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
