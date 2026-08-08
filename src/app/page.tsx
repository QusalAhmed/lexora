// =============================================================================
// src/app/page.tsx
// Root route — redirects to /app (middleware handles auth check).
// =============================================================================

import { redirect } from "next/navigation";

export default function RootPage(): never {
  redirect("/app");
}
