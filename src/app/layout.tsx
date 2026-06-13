import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SessionProvider } from "@/components/SessionProvider";
import { ToastProvider } from "@/components/Toast";
import { LogModalProvider } from "@/components/LogModal";
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
            <LogModalProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </LogModalProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
