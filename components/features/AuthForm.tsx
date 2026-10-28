"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === "sign-up";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name || email.split("@")[0] } },
        });
        if (error) throw error;
        if (!data.session) {
          // project requires email confirmation: no session yet, so don't navigate silently
          setError("Account created. Check your email and click the confirmation link, then sign in.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/today");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(
        /not confirmed/i.test(msg)
          ? "Your email isn't confirmed yet. Open the confirmation email we sent, then sign in."
          : msg,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            background: "var(--color-accent-attendance)",
            margin: "0 auto 14px",
          }}
        />
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p style={{ color: "var(--color-ink-muted)", marginTop: 4 }}>
          {isSignUp ? "Start tracking your attendance." : "Sign in to RollCall."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="rc-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {isSignUp && (
          <input
            className="rc-field"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        )}
        <input
          className="rc-field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          className="rc-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          minLength={6}
          required
        />
        {error && (
          <p role="alert" style={{ color: "var(--color-status-risk)", fontSize: 13, margin: 0 }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="rc-submit">
          {busy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: 16, color: "var(--color-ink-muted)", fontSize: 14 }}>
        {isSignUp ? (
          <>
            Already have an account? <Link href="/sign-in">Sign in</Link>
          </>
        ) : (
          <>
            New here? <Link href="/sign-up">Create account</Link>
          </>
        )}
      </p>
    </>
  );
}
