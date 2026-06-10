import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-5xl font-bold mb-4 leading-tight">
        Track videos you&apos;ve watched.
        <br />
        <span className="text-[var(--accent-green)]">Save those you want to.</span>
        <br />
        Tell your friends what&apos;s good.
      </h1>
      <p className="text-[var(--text-muted)] text-lg max-w-xl mb-8">
        YTBoxd is a social platform for YouTube. Keep a diary, rate videos,
        write reviews, and see what your friends are watching.
      </p>
      {session?.user ? (
        <Link
          href="/log"
          className="bg-[var(--accent-green)] text-black font-bold px-6 py-3 rounded text-lg hover:bg-[var(--accent-green-dark)] transition-colors"
        >
          + Log a video
        </Link>
      ) : (
        <Link
          href="/login"
          className="bg-[var(--accent-green)] text-black font-bold px-6 py-3 rounded text-lg hover:bg-[var(--accent-green-dark)] transition-colors"
        >
          Get started — it&apos;s free
        </Link>
      )}
    </div>
  );
}
