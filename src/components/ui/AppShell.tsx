"use client";

// =============================================================================
// src/components/ui/AppShell.tsx
// The primary app chrome: sidebar navigation + header + content area.
//
// Layout:
//   Desktop: Frosted-glass sidebar (240px) | Content area
//   Mobile:  Full-width content + fixed bottom tab bar
//
// Features:
//   - Animated active nav indicator (Framer Motion shared layout)
//   - Sync status badge in sidebar footer
//   - User avatar with sign-out dropdown
//   - Responsive via Mantine useMediaQuery
// =============================================================================

import React, { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Avatar,
  Menu,
  UnstyledButton,
  Tooltip,
  Indicator,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconBooks,
  IconBrain,
  IconChartBar,
  IconSettings,
  IconLogout,
  IconChevronRight,
  IconSparkles,
  type Icon as TablerIconType,
} from "@tabler/icons-react";
import { SyncStatusBadge } from "@/components/ui/SyncStatusBadge";
import { useAuth } from "@/lib/powersync/PowerSyncProvider";

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------
interface NavItem {
  href: string;
  label: string;
  icon: TablerIconType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/app",         label: "Library",   icon: IconBooks },
  { href: "/app/review",  label: "Review",    icon: IconBrain  },
  { href: "/app/stats",   label: "Analytics", icon: IconChartBar },
  { href: "/app/settings",label: "Settings",  icon: IconSettings },
];

// ---------------------------------------------------------------------------
// Sidebar Nav Item
// ---------------------------------------------------------------------------
interface NavItemProps {
  item: NavItem;
  isActive: boolean;
}

function SidebarNavItem({ item, isActive }: NavItemProps): React.JSX.Element {
  const { icon: Icon, href, label, badge } = item;

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 12px",
          borderRadius: "var(--lexora-radius-md)",
          cursor: "pointer",
          overflow: "hidden",
          marginBottom: "2px",
          background: isActive ? "rgba(99, 102, 241, 0.14)" : "transparent",
          border: `1px solid ${isActive ? "rgba(99, 102, 241, 0.25)" : "transparent"}`,
          transition: "background 0.15s ease, border-color 0.15s ease",
        }}
      >
        {/* Active indicator bar */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="nav-indicator"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                left: 0,
                top: "20%",
                bottom: "20%",
                width: "3px",
                background: "linear-gradient(180deg, #818cf8, #6366f1)",
                borderRadius: "0 2px 2px 0",
              }}
            />
          )}
        </AnimatePresence>

        {/* Icon */}
        <Icon
          size={18}
          stroke={isActive ? 2 : 1.7}
          style={{
            color: isActive
              ? "var(--lexora-primary-400)"
              : "var(--lexora-text-secondary)",
            flexShrink: 0,
            transition: "color 0.15s ease",
          }}
        />

        {/* Label */}
        <span
          style={{
            fontSize: "14px",
            fontWeight: isActive ? 600 : 400,
            color: isActive
              ? "var(--lexora-text-primary)"
              : "var(--lexora-text-secondary)",
            flex: 1,
            transition: "color 0.15s ease, font-weight 0.15s ease",
          }}
        >
          {label}
        </span>

        {/* Optional badge */}
        {badge && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: "10px",
              background: "rgba(99, 102, 241, 0.2)",
              color: "var(--lexora-primary-300)",
              letterSpacing: "0.04em",
            }}
          >
            {badge}
          </span>
        )}

        {isActive && (
          <IconChevronRight
            size={14}
            stroke={2}
            style={{ color: "var(--lexora-primary-400)", flexShrink: 0 }}
          />
        )}
      </motion.div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Bottom tab bar (mobile)
// ---------------------------------------------------------------------------
function BottomTabBar(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(13, 12, 24, 0.92)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--lexora-border-subtle)",
        padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {NAV_ITEMS.slice(0, 4).map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              padding: "4px 16px",
              textDecoration: "none",
              position: "relative",
            }}
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              transition={{ duration: 0.1 }}
              style={{ position: "relative" }}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-bg"
                  style={{
                    position: "absolute",
                    inset: "-6px -10px",
                    borderRadius: "10px",
                    background: "rgba(99, 102, 241, 0.15)",
                  }}
                />
              )}
              <Icon
                size={22}
                stroke={isActive ? 2 : 1.6}
                style={{
                  color: isActive
                    ? "var(--lexora-primary-400)"
                    : "var(--lexora-text-muted)",
                  position: "relative",
                  zIndex: 1,
                  transition: "color 0.15s ease",
                }}
              />
            </motion.div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: isActive ? 600 : 400,
                color: isActive
                  ? "var(--lexora-primary-400)"
                  : "var(--lexora-text-muted)",
                transition: "color 0.15s ease",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main AppShell
// ---------------------------------------------------------------------------
interface AppShellProps {
  readonly children: ReactNode;
}

export function LexoraAppShell({ children }: AppShellProps): React.JSX.Element {
  const pathname = usePathname();
  const { userId, signOut } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)") ?? false;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Derive user initials for avatar
  const userInitials = userId ? userId.slice(0, 2).toUpperCase() : "?";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        background: "var(--lexora-bg-base)",
      }}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Sidebar (desktop only)                                             */}
      {/* ----------------------------------------------------------------- */}
      {!isMobile && (
        <aside
          className="glass"
          style={{
            width: "var(--lexora-sidebar-width)",
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            padding: "20px 12px",
            position: "sticky",
            top: 0,
            borderRight: "1px solid var(--lexora-border-subtle)",
            flexShrink: 0,
          }}
        >
          {/* Brand */}
          <Link
            href="/app"
            style={{ textDecoration: "none", marginBottom: "32px", padding: "0 4px" }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <div
                className="glow-primary"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconSparkles size={20} stroke={2} color="white" />
              </div>
              <div>
                <div
                  className="text-gradient"
                  style={{
                    fontSize: "17px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                  }}
                >
                  Lexora
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--lexora-text-muted)",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Vocabulary
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Navigation */}
          <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1px" }}>
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/app"
                  ? pathname === "/app"
                  : pathname.startsWith(item.href);

              return (
                <SidebarNavItem key={item.href} item={item} isActive={isActive} />
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Sync status */}
            <SyncStatusBadge />

            {/* User */}
            <Menu
              opened={isMenuOpen}
              onChange={setIsMenuOpen}
              position="top"
              offset={8}
              shadow="xl"
              styles={{
                dropdown: {
                  background: "var(--lexora-bg-elevated)",
                  border: "1px solid var(--lexora-border-default)",
                  backdropFilter: "blur(20px)",
                  borderRadius: "var(--lexora-radius-lg)",
                  padding: "6px",
                },
                item: {
                  borderRadius: "var(--lexora-radius-md)",
                  color: "var(--lexora-text-secondary)",
                  fontSize: "13px",
                },
              }}
            >
              <Menu.Target>
                <UnstyledButton
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "var(--lexora-radius-md)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: isMenuOpen
                      ? "rgba(99, 102, 241, 0.08)"
                      : "transparent",
                    border: "1px solid transparent",
                    transition: "background 0.15s ease",
                    cursor: "pointer",
                  }}
                >
                  <Indicator
                    color="#10b981"
                    size={8}
                    offset={3}
                    position="bottom-end"
                    withBorder
                    styles={{ indicator: { borderColor: "var(--lexora-bg-base)" } }}
                  >
                    <Avatar
                      size={32}
                      radius="xl"
                      style={{
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "white",
                        flexShrink: 0,
                      }}
                    >
                      {userInitials}
                    </Avatar>
                  </Indicator>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--lexora-text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      My Account
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "var(--lexora-text-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {userId?.slice(0, 8)}…
                    </div>
                  </div>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconSettings size={15} stroke={1.8} />}
                  component={Link}
                  href="/app/settings"
                >
                  Settings
                </Menu.Item>
                <Menu.Divider
                  style={{ borderColor: "var(--lexora-border-subtle)" }}
                />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={15} stroke={1.8} />}
                  onClick={signOut}
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        </aside>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Main content area                                                  */}
      {/* ----------------------------------------------------------------- */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          paddingBottom: isMobile ? "80px" : 0,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ----------------------------------------------------------------- */}
      {/* Mobile bottom tab bar                                              */}
      {/* ----------------------------------------------------------------- */}
      {isMobile && <BottomTabBar />}
    </div>
  );
}
