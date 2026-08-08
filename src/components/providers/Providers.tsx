"use client";

// =============================================================================
// src/components/providers/Providers.tsx
// Root provider tree for the entire application.
// Order matters: Mantine → Notifications → PowerSync+Auth
// =============================================================================

import type { ReactNode } from "react";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { LexoraPowerSyncProvider } from "@/lib/powersync/PowerSyncProvider";

// ---------------------------------------------------------------------------
// Mantine v7 theme — dark-first premium vocabulary aesthetic
// ---------------------------------------------------------------------------
const theme = createTheme({
  primaryColor: "violet",
  primaryShade: { dark: 5, light: 6 },

  colors: {
    // Custom violet-indigo palette
    violet: [
      "#f5f3ff", // 0
      "#ede9fe", // 1
      "#ddd6fe", // 2
      "#c4b5fd", // 3
      "#a78bfa", // 4
      "#8b5cf6", // 5  ← primary dark
      "#7c3aed", // 6  ← primary light
      "#6d28d9", // 7
      "#5b21b6", // 8
      "#4c1d95", // 9
    ],
  },

  fontFamily:
    "var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  fontFamilyMonospace:
    "var(--font-fira), 'Fira Code', 'Cascadia Code', 'JetBrains Mono', ui-monospace, monospace",

  headings: {
    fontFamily:
      "var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    fontWeight: "700",
  },

  defaultRadius: "md",

  cursorType: "pointer",

  components: {
    Button: {
      defaultProps: { radius: "md" },
      styles: {
        root: {
          fontWeight: 600,
          letterSpacing: "0.01em",
          transition: "all 0.15s ease",
        },
      },
    },
    TextInput: {
      defaultProps: { radius: "md" },
      styles: {
        input: {
          background: "var(--lexora-bg-surface)",
          border: "1px solid var(--lexora-border-default)",
          color: "var(--lexora-text-primary)",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          "&:focus": {
            borderColor: "var(--lexora-primary-500)",
            boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.15)",
          },
        },
      },
    },
    Textarea: {
      defaultProps: { radius: "md" },
      styles: {
        input: {
          background: "var(--lexora-bg-surface)",
          border: "1px solid var(--lexora-border-default)",
          color: "var(--lexora-text-primary)",
        },
      },
    },
    Select: {
      defaultProps: { radius: "md" },
      styles: {
        input: {
          background: "var(--lexora-bg-surface)",
          border: "1px solid var(--lexora-border-default)",
          color: "var(--lexora-text-primary)",
        },
        dropdown: {
          background: "var(--lexora-bg-elevated)",
          border: "1px solid var(--lexora-border-default)",
          backdropFilter: "blur(20px)",
        },
      },
    },
    Card: {
      defaultProps: { radius: "lg", padding: "xl" },
      styles: {
        root: {
          background: "var(--lexora-bg-surface)",
          border: "1px solid var(--lexora-border-subtle)",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        },
      },
    },
    Modal: {
      defaultProps: { radius: "lg", centered: true },
      styles: {
        content: {
          background: "var(--lexora-bg-surface)",
          border: "1px solid var(--lexora-border-default)",
          backdropFilter: "blur(20px)",
        },
        header: {
          background: "transparent",
          borderBottom: "1px solid var(--lexora-border-subtle)",
        },
        overlay: {
          backdropFilter: "blur(4px)",
        },
      },
    },
    Notification: {
      styles: {
        root: {
          background: "var(--lexora-bg-elevated)",
          border: "1px solid var(--lexora-border-default)",
          backdropFilter: "blur(20px)",
        },
      },
    },
    Tooltip: {
      defaultProps: { withArrow: true, arrowSize: 6 },
    },
  },
});

// ---------------------------------------------------------------------------
// Root Providers
// ---------------------------------------------------------------------------
interface ProvidersProps {
  readonly children: ReactNode;
}

export function Providers({ children }: ProvidersProps): React.JSX.Element {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark" forceColorScheme="dark">
      <Notifications
        position="top-right"
        autoClose={4000}
        containerWidth={380}
        styles={{
          root: { top: 16, right: 16 },
        }}
      />
      <LexoraPowerSyncProvider>{children}</LexoraPowerSyncProvider>
    </MantineProvider>
  );
}
