"use client";

import { useState, useTransition } from "react";
import { signOut, deleteAccount } from "@/lib/actions/auth";

export function AccountActions() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="rc-card" style={{ marginTop: 12 }}>
      <div className="rc-tag" style={{ marginBottom: 8 }}>
        Account
      </div>

      <form action={() => startTransition(() => void signOut())}>
        <button type="submit" className="rc-rowbtn" disabled={pending}>
          Sign out
        </button>
      </form>

      {!confirming ? (
        <button
          className="rc-rowbtn"
          style={{ color: "var(--color-status-risk)" }}
          onClick={() => setConfirming(true)}
        >
          Delete account
        </button>
      ) : (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13, color: "var(--color-ink-muted)", margin: "0 0 8px" }}>
            This permanently deletes your account and all your data. This can&apos;t be undone.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="rc-rowbtn"
              onClick={() => setConfirming(false)}
              style={{ background: "#f1eff6", flex: 1, textAlign: "center" }}
            >
              Cancel
            </button>
            <button
              className="rc-rowbtn"
              disabled={pending}
              onClick={() => startTransition(() => void deleteAccount())}
              style={{ background: "var(--color-status-risk)", color: "#fff", flex: 1, textAlign: "center" }}
            >
              {pending ? "Deleting…" : "Delete forever"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
