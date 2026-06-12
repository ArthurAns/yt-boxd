import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SessionProvider } from "@/components/SessionProvider";
import { ToastProvider } from "@/components/Toast";
import { auth } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "YTBoxd",
    template: "%s · YTBoxd",
  },
  description: "Track, rate and share the YouTube videos you watch.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">
        <SessionProvider session={session}>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-[var(--border)] py-6 text-center text-[var(--text-dim)] text-xs">
              YTBoxd · built for video lovers
            </footer>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
