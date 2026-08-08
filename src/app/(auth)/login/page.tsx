"use client";

// =============================================================================
// src/app/(auth)/login/page.tsx
// Beautiful auth page: split layout with animated branding + glassmorphism form.
// Supports email/password login and GitHub OAuth.
// =============================================================================

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  TextInput,
  PasswordInput,
  Button,
  Divider,
  Anchor,
  Text,
  Alert,
} from "@mantine/core";
import {
  IconBrandGithub,
  IconSparkles,
  IconAlertCircle,
  IconArrowRight,
  IconBook2,
  IconBrain,
  IconChartBar,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Metadata } from "next";

// Note: metadata export is handled server-side; this is for reference
export const _metadata: Partial<Metadata> = {
  title: "Sign In",
  description: "Sign in to Lexora and continue building your vocabulary.",
};

// ---------------------------------------------------------------------------
// Feature bullets shown on the left panel
// ---------------------------------------------------------------------------
const FEATURES = [
  {
    icon: IconBook2,
    title: "Structured Knowledge",
    desc: "Separate words from definitions — handle polysemy beautifully.",
  },
  {
    icon: IconBrain,
    title: "FSRS Spaced Repetition",
    desc: "Review cards at the optimal moment. Never forget a word.",
  },
  {
    icon: IconChartBar,
    title: "AI Example Sentences",
    desc: "Auto-generated examples tailored to each definition's meaning.",
  },
] as const;

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------
interface FormState {
  email: string;
  password: string;
  error: string | null;
  isLoading: boolean;
  mode: "login" | "signup";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/app";

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    error: null,
    isLoading: false,
    mode: "login",
  });

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const setField = useCallback(
    <K extends keyof Pick<FormState, "email" | "password">>(
      field: K,
      value: string
    ) => {
      setForm((prev) => ({ ...prev, [field]: value, error: null }));
    },
    []
  );

  const toggleMode = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      mode: prev.mode === "login" ? "signup" : "login",
      error: null,
    }));
  }, []);

  // Email/password submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      setForm((prev) => ({ ...prev, isLoading: true, error: null }));

      const { email, password, mode } = form;

      try {
        const { error } =
          mode === "login"
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: `${window.location.origin}/app` },
              });

        if (error) {
          setForm((prev) => ({ ...prev, error: error.message, isLoading: false }));
          return;
        }

        if (mode === "signup") {
          notifications.show({
            title: "Check your email",
            message: "We've sent you a confirmation link.",
            color: "violet",
          });
          setForm((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        router.push(redirectTo);
      } catch {
        setForm((prev) => ({
          ...prev,
          error: "An unexpected error occurred. Please try again.",
          isLoading: false,
        }));
      }
    },
    [form, router, redirectTo, supabase.auth]
  );

  // GitHub OAuth
  const handleGitHubLogin = useCallback(async (): Promise<void> => {
    setForm((prev) => ({ ...prev, isLoading: true, error: null }));
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });
    if (error) {
      setForm((prev) => ({ ...prev, error: error.message, isLoading: false }));
    }
  }, [supabase.auth]);

  const isLogin = form.mode === "login";

  return (
    <div
      className="animated-gradient-bg mesh-bg"
      style={{
        minHeight: "100dvh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        overflow: "hidden",
      }}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Left panel — Branding & features                                   */}
      {/* ----------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 56px",
          borderRight: "1px solid var(--lexora-border-subtle)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "56px" }}
        >
          <div
            className="glow-primary"
            style={{
              width: 48,
              height: 48,
              borderRadius: "14px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSparkles size={26} stroke={2} color="white" />
          </div>
          <span
            className="text-gradient"
            style={{
              fontSize: "26px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            Lexora
          </span>
        </motion.div>

        {/* Hero copy */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: "48px" }}
        >
          <h1
            style={{
              fontSize: "38px",
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
              color: "var(--lexora-text-primary)",
              margin: "0 0 16px",
            }}
          >
            Build a vocabulary
            <br />
            <span className="text-gradient">worth remembering.</span>
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "var(--lexora-text-secondary)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Offline-first spaced repetition, AI examples, and beautiful
            flashcards — all synced across your devices.
          </p>
        </motion.div>

        {/* Feature bullets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.3 + i * 0.1,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background: "rgba(99, 102, 241, 0.12)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <feat.icon size={18} stroke={1.8} color="var(--lexora-primary-400)" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--lexora-text-primary)",
                    marginBottom: "3px",
                  }}
                >
                  {feat.title}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--lexora-text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  {feat.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ----------------------------------------------------------------- */}
      {/* Right panel — Auth form                                            */}
      {/* ----------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 56px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: 380, width: "100%", margin: "0 auto" }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: "32px" }}
          >
            <h2
              style={{
                fontSize: "26px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--lexora-text-primary)",
                margin: "0 0 8px",
              }}
            >
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <Text size="sm" c="dimmed">
              {isLogin
                ? "Sign in to continue your vocabulary journey."
                : "Start building your vocabulary today."}
            </Text>
          </motion.div>

          {/* GitHub OAuth button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Button
              fullWidth
              size="md"
              variant="default"
              leftSection={<IconBrandGithub size={18} stroke={1.8} />}
              onClick={handleGitHubLogin}
              loading={form.isLoading}
              styles={{
                root: {
                  background: "var(--lexora-bg-elevated)",
                  border: "1px solid var(--lexora-border-default)",
                  color: "var(--lexora-text-primary)",
                  height: "46px",
                  "&:hover": {
                    background: "var(--lexora-bg-overlay)",
                    borderColor: "var(--lexora-border-strong)",
                  },
                },
              }}
            >
              Continue with GitHub
            </Button>
          </motion.div>

          <Divider
            label={<Text size="xs" c="dimmed">or with email</Text>}
            labelPosition="center"
            my="xl"
            styles={{ root: { borderColor: "var(--lexora-border-subtle)" } }}
          />

          {/* Email/Password form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {form.error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                variant="light"
                styles={{
                  root: {
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  },
                  message: { fontSize: "13px" },
                }}
              >
                {form.error}
              </Alert>
            )}

            <TextInput
              id="email-input"
              label="Email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setField("email", e.currentTarget.value)}
              size="md"
              styles={{
                label: {
                  color: "var(--lexora-text-secondary)",
                  fontSize: "13px",
                  marginBottom: "6px",
                },
                input: {
                  height: "46px",
                  background: "var(--lexora-bg-surface)",
                  border: "1px solid var(--lexora-border-default)",
                  color: "var(--lexora-text-primary)",
                  "&:focus": {
                    borderColor: "var(--lexora-primary-500)",
                    boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.15)",
                  },
                  "&::placeholder": { color: "var(--lexora-text-muted)" },
                },
              }}
            />

            <PasswordInput
              id="password-input"
              label="Password"
              placeholder="••••••••"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={form.password}
              onChange={(e) => setField("password", e.currentTarget.value)}
              size="md"
              styles={{
                label: {
                  color: "var(--lexora-text-secondary)",
                  fontSize: "13px",
                  marginBottom: "6px",
                },
                input: {
                  height: "46px",
                  background: "var(--lexora-bg-surface)",
                  border: "1px solid var(--lexora-border-default)",
                  color: "var(--lexora-text-primary)",
                  "&:focus": {
                    borderColor: "var(--lexora-primary-500)",
                  },
                },
              }}
            />

            <Button
              id="auth-submit-btn"
              type="submit"
              fullWidth
              size="md"
              loading={form.isLoading}
              rightSection={<IconArrowRight size={16} stroke={2.5} />}
              style={{ height: "46px", marginTop: "4px" }}
              styles={{
                root: {
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none",
                  fontWeight: 600,
                  "&:hover": {
                    background: "linear-gradient(135deg, #5558e3, #7c3aed)",
                    boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.15s ease",
                },
              }}
            >
              {isLogin ? "Sign in" : "Create account"}
            </Button>
          </motion.form>

          {/* Mode toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{ textAlign: "center", marginTop: "24px" }}
          >
            <Text size="sm" c="dimmed">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Anchor
                component="button"
                type="button"
                onClick={toggleMode}
                fw={600}
                style={{ color: "var(--lexora-primary-400)" }}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </Anchor>
            </Text>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
