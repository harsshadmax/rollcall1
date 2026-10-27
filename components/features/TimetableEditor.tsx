"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addClass, removeSlot } from "@/lib/actions/app";
import type { Subject, SlotRow } from "@/lib/data/types";

const DAYS = [
  { n: 1, label: "Mon" },
  { n: 2, label: "Tue" },
  { n: 3, label: "Wed" },
  { n: 4, label: "Thu" },
  { n: 5, label: "Fri" },
  { n: 6, label: "Sat" },
];

export function TimetableEditor({ slots, subjects }: { slots: SlotRow[]; subjects: Subject[] }) {
  const [day, setDay] = useState(1);
  const [picking, setPicking] = useState(false);
  const [pending, startTransition] = useTransition();

  const daySlots = slots.filter((s) => s.weekday === day).sort((a, b) => a.period.idx - b.period.idx);

  if (subjects.length === 0) {
    return (
      <section className="rc-card">
        <div className="rc-tag">No subjects yet</div>
        <p style={{ margin: "6px 0 10px" }}>Add subjects before building your timetable.</p>
        <Link href="/subjects" className="rc-submit" style={{ display: "inline-block", textDecoration: "none" }}>
          Add subjects
        </Link>
      </section>
    );
  }

  return (
    <>
      <div className="rc-card" style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
        {DAYS.map((d) => (
          <button
            key={d.n}
            onClick={() => {
              setDay(d.n);
              setPicking(false);
            }}
            style={{
              flex: 1,
              minWidth: 44,
              padding: "9px 0",
              borderRadius: 999,
              border: "none",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              background: day === d.n ? "var(--color-ink)" : "transparent",
              color: day === d.n ? "#fff" : "var(--color-ink)",
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      <section className="rc-card">
        <div className="rc-tag" style={{ marginBottom: 4 }}>
          {DAYS.find((d) => d.n === day)?.label} classes ({daySlots.length})
        </div>

        {daySlots.length === 0 && !picking && (
          <p style={{ color: "var(--color-ink-muted)", fontSize: 14, margin: "8px 0" }}>No classes yet on this day.</p>
        )}

        {daySlots.map((s) => (
          <div key={s.slotId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #f0eff5" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: `var(--color-${s.subject.color_token ?? "accent-attendance"})`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                P{s.period.idx}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.subject.name}</div>
                <div className="rc-tag">
                  {s.period.starts_at.slice(0, 5)}–{s.period.ends_at.slice(0, 5)} · {s.subject.kind}
                </div>
              </div>
            </div>
            <button
              aria-label={`Remove ${s.subject.name}`}
              onClick={() => startTransition(() => void removeSlot(s.slotId))}
              style={{ border: "none", background: "none", color: "var(--color-status-risk)", cursor: "pointer", fontSize: 18 }}
            >
              ✕
            </button>
          </div>
        ))}

        {picking ? (
          <div style={{ borderTop: "1px solid #f0eff5", paddingTop: 10, marginTop: 6 }}>
            <div className="rc-tag" style={{ marginBottom: 6 }}>
              Add which subject?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await addClass(day, sub.id);
                      setPicking(false);
                    })
                  }
                  className="rc-rowbtn"
                  style={{ borderTop: "none", background: "#f1eff6", borderRadius: 12, padding: "10px 12px" }}
                >
                  {sub.name} <span className="rc-tag">({sub.code})</span>
                </button>
              ))}
              <button onClick={() => setPicking(false)} className="rc-rowbtn" style={{ borderTop: "none", color: "var(--color-ink-muted)" }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setPicking(true)}
            className="rc-submit"
            style={{ marginTop: 10, width: "100%", background: "var(--color-accent-hero)", color: "var(--color-ink)" }}
          >
            + Add a class
          </button>
        )}
      </section>

      <p style={{ color: "var(--color-ink-muted)", fontSize: 12, textAlign: "center", marginTop: 12 }}>
        Attendance for each day now shows only that day&apos;s classes.
      </p>
    </>
  );
}
