"use client";

// =============================================================================
// src/components/ui/SyncStatusBadge.tsx
// Animated real-time sync status indicator.
// Shows: Connected (green pulse), Syncing (indigo pulse), Offline (amber),
//        Disconnected/Error (red), Connecting (spinner).
// =============================================================================

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "@mantine/core";
import {
  IconWifi,
  IconWifiOff,
  IconCloudUpload,
  IconCloudCheck,
  IconAlertCircle,
  type Icon as TablerIconType,
} from "@tabler/icons-react";
import { useSyncStatus } from "@/hooks/useDatabase";

type StatusVariant = "connected" | "syncing" | "offline" | "error" | "connecting";

interface StatusConfig {
  label: string;
  color: string;
  dotClass: string;
  Icon: TablerIconType;
}

const STATUS_CONFIG: Record<StatusVariant, StatusConfig> = {
  connected: {
    label: "Synced",
    color: "#10b981",
    dotClass: "sync-dot-connected",
    Icon: IconCloudCheck,
  },
  syncing: {
    label: "Syncing…",
    color: "#6366f1",
    dotClass: "sync-dot-syncing",
    Icon: IconCloudUpload,
  },
  offline: {
    label: "Offline — changes saved locally",
    color: "#f59e0b",
    dotClass: "",
    Icon: IconWifiOff,
  },
  error: {
    label: "Sync error",
    color: "#ef4444",
    dotClass: "",
    Icon: IconAlertCircle,
  },
  connecting: {
    label: "Connecting…",
    color: "#6366f1",
    dotClass: "sync-dot-syncing",
    Icon: IconWifi,
  },
};

export function SyncStatusBadge(): React.JSX.Element {
  let status: SyncStatus;

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    status = useSyncStatus();
  } catch {
    // Not inside a PowerSync context (e.g. auth pages) — show nothing
    return <></>;
  }

  // Derive a simple variant from the PowerSync SyncStatus object
  const variant: StatusVariant = (() => {
    if (!navigator.onLine) return "offline";
    if (status.dataFlowStatus?.uploading || status.dataFlowStatus?.downloading)
      return "syncing";
    if (status.connected) return "connected";
    if (status.connecting) return "connecting";
    return "error";
  })();

  const config = STATUS_CONFIG[variant];

  return (
    <Tooltip
      label={config.label}
      position="right"
      withArrow
      arrowSize={6}
      transitionProps={{ duration: 150 }}
      styles={{
        tooltip: {
          fontSize: "12px",
          background: "var(--lexora-bg-overlay)",
          border: "1px solid var(--lexora-border-subtle)",
          color: "var(--lexora-text-secondary)",
        },
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={variant}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "6px 10px",
            borderRadius: "8px",
            cursor: "default",
            background: `${config.color}12`,
            border: `1px solid ${config.color}28`,
          }}
        >
          {/* Animated dot */}
          <div
            className={config.dotClass}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: config.color,
              flexShrink: 0,
            }}
          />

          {/* Icon */}
          <config.Icon
            size={13}
            stroke={2}
            style={{ color: config.color, flexShrink: 0 }}
          />

          {/* Label (hidden on very small sidebars) */}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: config.color,
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {config.label}
          </span>
        </motion.div>
      </AnimatePresence>
    </Tooltip>
  );
}

// Re-export SyncStatus type for convenience
import type { SyncStatus } from "@powersync/web";
