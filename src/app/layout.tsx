import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomTabBar from "@/components/BottomTabBar";
import Footer from "@/components/Footer";
import { SessionProvider } from "@/components/SessionProvider";
import { ToastProvider } from "@/components/Toast";
import { LogModalProvider } from "@/components/LogModal";
import { auth } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ytboxd",
    template: "%s · ytboxd",
  },
  description: "Track, rate and share the YouTube videos you watch.",
};

export const viewport: Viewport = {
  themeColor: "#0e1014",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen flex flex-col">
        <SessionProvider session={session}>
          <ToastProvider>
            <LogModalProvider>
              <Navbar />
              {/* pb clears the fixed mobile tab bar */}
              <main className="flex-1 pb-24 md:pb-0">{children}</main>
              <Footer />
              <BottomTabBar />
            </LogModalProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
