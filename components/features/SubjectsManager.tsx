"use client";

import { useActionState, useTransition } from "react";
import { createSubject, deleteSubject } from "@/lib/actions/app";
import type { Subject } from "@/lib/data/types";

type State = { ok: boolean; error?: string } | null;

export function SubjectsManager({ subjects }: { subjects: Subject[] }) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, fd) => {
    const res = await createSubject(fd);
    return res;
  }, null);
  const [, startDelete] = useTransition();

  return (
    <>
      <form action={formAction} className="rc-card" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
        <div className="rc-tag">Add a subject</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="rc-field" name="code" placeholder="Code (e.g. CSB301)" style={{ flex: 1 }} required />
          <input className="rc-field" name="credits" type="number" step="0.5" min="0.5" placeholder="Credits" style={{ width: 92 }} required />
        </div>
        <input className="rc-field" name="name" placeholder="Subject name" required />
        <select className="rc-field" name="kind" defaultValue="theory" aria-label="Kind">
          <option value="theory">Theory (80%)</option>
          <option value="lab">Practical / Lab (100%)</option>
          <option value="both">Both</option>
        </select>
        {state?.error && (
          <p role="alert" style={{ color: "var(--color-status-risk)", fontSize: 13, margin: 0 }}>
            {state.error}
          </p>
        )}
        <button type="submit" className="rc-submit" disabled={pending}>
          {pending ? "Adding…" : "Add subject"}
        </button>
      </form>

      <div className="rc-card">
        <div className="rc-tag" style={{ marginBottom: 4 }}>
          Your subjects ({subjects.length})
        </div>
        {subjects.length === 0 ? (
          <p style={{ color: "var(--color-ink-muted)", fontSize: 14, marginTop: 8 }}>
            None yet. Add your first subject above.
          </p>
        ) : (
          subjects.map((s) => (
            <div key={s.id} className="rc-rowbtn" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "default" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div className="rc-tag">
                  {s.code} · {s.credits} cr · {s.kind}
                </div>
              </div>
              <button
                aria-label={`Delete ${s.name}`}
                onClick={() => {
                  if (confirm(`Delete ${s.name}? Its attendance is removed too.`))
                    startDelete(() => void deleteSubject(s.id));
                }}
                style={{ border: "none", background: "none", color: "var(--color-status-risk)", cursor: "pointer", fontSize: 18 }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
