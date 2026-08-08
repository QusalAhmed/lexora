// =============================================================================
// src/app/(app)/layout.tsx
// Protected layout — wraps all /app/* routes with the LexoraAppShell.
// Server component: validates auth server-side before rendering.
// =============================================================================

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { LexoraAppShell } from "@/components/ui/AppShell";

export const metadata: Metadata = {
  title: {
    default: "Library | Lexora",
    template: "%s | Lexora",
  },
};

interface AppLayoutProps {
  readonly children: React.ReactNode;
}

export default async function AppLayout({
  children,
}: AppLayoutProps): Promise<React.JSX.Element> {
  // Server-side auth guard — middleware already handles this,
  // but we double-check here as defense in depth.
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return <LexoraAppShell>{children}</LexoraAppShell>;
}
