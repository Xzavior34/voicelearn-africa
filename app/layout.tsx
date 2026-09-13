import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AmbientBackground from "@/components/AmbientBackground";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1e1b4b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Regamos VoiceLearn — Voice-First Learning for African Learners",
  description:
    "Learning should understand the learner, not force the learner to change how they speak. A voice-first learning companion for English and African code-switched speech.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Regamos VoiceLearn Africa",
    description: "Voice-first educational intelligence supporting natural code-switching in English and Nigerian Pidgin.",
    type: "website",
    siteName: "Regamos VoiceLearn Africa",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-paper text-ink selection:bg-indigo/30 selection:text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-indigo focus:text-paper focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg text-sm font-medium"
        >
          Skip to main content
        </a>
        <AmbientBackground />
        <Navbar />
        <main id="main" className="flex-1 flex flex-col w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
