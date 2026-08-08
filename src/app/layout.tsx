// =============================================================================
// src/app/layout.tsx
// Root layout — sets up fonts, meta, and root providers.
// ColorSchemeScript MUST be in <head> before any CSS to prevent flash.
// =============================================================================

import type { Metadata, Viewport } from "next";
import { Inter, Fira_Code } from "next/font/google";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { Providers } from "@/components/providers/Providers";
import "@/app/globals.css";

// ---------------------------------------------------------------------------
// Fonts (self-hosted by Next.js — safe with COEP require-corp headers)
// ---------------------------------------------------------------------------
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fira",
  weight: ["300", "400", "500", "600", "700"],
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: {
    default: "Lexora — Intelligent Vocabulary",
    template: "%s | Lexora",
  },
  description:
    "Build a powerful vocabulary with AI-generated examples, FSRS spaced repetition, and offline-first sync. Your words, anywhere.",
  keywords: ["vocabulary", "flashcards", "FSRS", "spaced repetition", "offline", "English"],
  authors: [{ name: "Lexora" }],
  creator: "Lexora",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Lexora — Intelligent Vocabulary",
    description: "Build a powerful vocabulary with AI examples and spaced repetition.",
    siteName: "Lexora",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#07060e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------
interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html
      lang="en"
      {...mantineHtmlProps}
      className={`${inter.variable} ${firaCode.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Prevents color scheme flash on initial load */}
        <ColorSchemeScript forceColorScheme="dark" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
