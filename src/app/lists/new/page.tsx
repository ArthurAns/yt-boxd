import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import NewListForm from "./NewListForm";

export const metadata: Metadata = { title: "New List" };

export default async function NewListPage() {
  const session = await auth();
  if (!(session?.user as { id?: string } | undefined)?.id) {
    redirect("/login?callbackUrl=/lists/new");
  }
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Create a list</h1>
        <NewListForm />
      </div>
    </div>
  );
}
