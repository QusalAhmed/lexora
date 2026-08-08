"use client";

// =============================================================================
// src/app/(app)/page.tsx
// Dashboard / Library home — Phase 2 shell.
// Shows: daily review count, recent words, quick-add CTA.
// Full implementation comes in Phase 3 (Add Word form) and Phase 5 (FSRS decks).
// =============================================================================

import { motion } from "framer-motion";
import { Button, Text } from "@mantine/core";
import {
  IconPlus,
  IconBrain,
  IconBooks,
  IconFlame,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Stat card component
// ---------------------------------------------------------------------------
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ size?: number; stroke?: number; color?: string }>;
  color: string;
  delay?: number;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  delay = 0,
}: StatCardProps): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: "20px 24px",
        borderRadius: "var(--lexora-radius-lg)",
        background: "var(--lexora-bg-surface)",
        border: "1px solid var(--lexora-border-subtle)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        cursor: "default",
      }}
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.15 },
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} stroke={1.8} color={color} />
        </div>
        <Text size="sm" c="dimmed" fw={500}>
          {label}
        </Text>
      </div>

      <div>
        <div
          style={{
            fontSize: "32px",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--lexora-text-primary)",
            lineHeight: 1,
            marginBottom: "4px",
          }}
        >
          {value}
        </div>
        {sub && (
          <Text size="xs" c="dimmed">
            {sub}
          </Text>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState(): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        gap: "20px",
        textAlign: "center",
        borderRadius: "var(--lexora-radius-xl)",
        background: "var(--lexora-bg-surface)",
        border: "1px dashed var(--lexora-border-default)",
      }}
    >
      {/* Animated icon */}
      <motion.div
        animate={{
          y: [0, -6, 0],
          rotate: [0, 3, -3, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width: 72,
          height: 72,
          borderRadius: "20px",
          background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconSparkles size={32} stroke={1.5} color="var(--lexora-primary-400)" />
      </motion.div>

      <div>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--lexora-text-primary)",
            marginBottom: "8px",
            letterSpacing: "-0.01em",
          }}
        >
          Your library is empty
        </div>
        <Text size="sm" c="dimmed" style={{ maxWidth: 340, lineHeight: 1.6 }}>
          Add your first word to get started. Each word can have multiple
          definitions — perfect for handling polysemy and nuance.
        </Text>
      </div>

      <Button
        component={Link}
        href="/app/words/new"
        size="md"
        leftSection={<IconPlus size={16} stroke={2.5} />}
        styles={{
          root: {
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none",
            fontWeight: 600,
            padding: "0 24px",
            height: "44px",
            "&:hover": {
              background: "linear-gradient(135deg, #5558e3, #7c3aed)",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)",
            },
            transition: "all 0.15s ease",
          },
        }}
      >
        Add your first word
      </Button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------
export default function DashboardPage(): React.JSX.Element {
  return (
    <div
      style={{
        padding: "40px 48px",
        maxWidth: "1100px",
        width: "100%",
        margin: "0 auto",
      }}
    >
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "36px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "var(--lexora-text-primary)",
              margin: "0 0 4px",
            }}
          >
            Word Library
          </h1>
          <Text size="sm" c="dimmed">
            Your personal vocabulary collection
          </Text>
        </div>

        <Button
          component={Link}
          href="/app/words/new"
          id="add-word-btn"
          leftSection={<IconPlus size={16} stroke={2.5} />}
          styles={{
            root: {
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              fontWeight: 600,
              height: "42px",
              padding: "0 20px",
              "&:hover": {
                background: "linear-gradient(135deg, #5558e3, #7c3aed)",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)",
              },
              transition: "all 0.15s ease",
            },
          }}
        >
          Add word
        </Button>
      </motion.div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "40px",
        }}
      >
        <StatCard
          label="Total Words"
          value={0}
          sub="Get started by adding your first"
          icon={IconBooks}
          color="#6366f1"
          delay={0.1}
        />
        <StatCard
          label="Due Today"
          value={0}
          sub="No reviews scheduled"
          icon={IconBrain}
          color="#14b8a6"
          delay={0.15}
        />
        <StatCard
          label="Day Streak"
          value={0}
          sub="Start a streak today"
          icon={IconFlame}
          color="#f59e0b"
          delay={0.2}
        />
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <Button
          component={Link}
          href="/app/review"
          id="start-review-btn"
          variant="default"
          leftSection={<IconBrain size={16} stroke={1.8} />}
          styles={{
            root: {
              background: "var(--lexora-bg-surface)",
              border: "1px solid var(--lexora-border-default)",
              color: "var(--lexora-text-secondary)",
              height: "38px",
              "&:hover": {
                background: "var(--lexora-bg-elevated)",
                borderColor: "var(--lexora-border-strong)",
                color: "var(--lexora-text-primary)",
              },
              transition: "all 0.15s ease",
            },
          }}
        >
          Start review session
        </Button>
      </motion.div>

      {/* Word list (empty state for now — populated in Phase 3) */}
      <EmptyState />
    </div>
  );
}
