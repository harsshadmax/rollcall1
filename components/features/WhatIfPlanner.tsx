"use client";

import { useState } from "react";
import Link from "next/link";
import type { SubjectStanding, UpcomingDay } from "@/lib/data/types";

type Standing = Pick<SubjectStanding, "id" | "name" | "code" | "present" | "held" | "threshold">;

export function WhatIfPlanner({ standings, upcoming }: { standings: Standing[]; upcoming: UpcomingDay[] }) {
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  function toggle(iso: string) {
    setSkipped((prev) => {
      const n = new Set(prev);
      if (n.has(iso)) n.delete(iso);
      else n.add(iso);
      return n;
    });
  }

  // count skipped scheduled classes per subject
  const skipCount = new Map<string, number>();
  for (const day of upcoming) {
    if (!skipped.has(day.iso)) continue;
    for (const c of day.classes) skipCount.set(c.subjectId, (skipCount.get(c.subjectId) ?? 0) + 1);
  }

  const projected = standings.map((s) => {
    const skip = skipCount.get(s.id) ?? 0;
    const projHeld = s.held + skip;
    const projPct = projHeld === 0 ? null : Math.round((s.present / projHeld) * 10000) / 100;
    const safe = projPct == null ? true : projPct >= s.threshold * 100;
    return { ...s, skip, projPct, safe };
  });

  const anySkip = skipped.size > 0;
  const anyBelow = projected.some((p) => !p.safe && p.skip > 0);

  if (upcoming.length === 0) {
    return (
      <section className="rc-card">
        <div className="rc-tag">Build your timetable first</div>
        <p style={{ margin: "6px 0 10px" }}>The planner uses your weekly classes to work out what you can skip.</p>
        <Link href="/timetable" className="rc-submit" style={{ display: "inline-block", textDecoration: "none" }}>
          Set up timetable
        </Link>
      </section>
    );
  }

  return (
    <>
      <p style={{ color: "var(--color-ink-muted)", fontSize: 13, margin: "0 0 10px" }}>
        Tap the days you want to skip. See what your attendance becomes.
      </p>

      <section className="rc-card" style={{ marginBottom: 12 }}>
        <div className="rc-tag" style={{ marginBottom: 6 }}>
          Upcoming days
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {upcoming.map((d) => {
            const on = skipped.has(d.iso);
            return (
              <button
                key={d.iso}
                onClick={() => toggle(d.iso)}
                aria-pressed={on}
                style={{
                  borderRadius: 999,
                  border: "none",
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: on ? "var(--color-status-risk-fill)" : "#f1eff6",
                  color: "var(--color-ink)",
                }}
              >
                {d.label} · {d.classes.length}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rc-card" style={{ marginBottom: 12 }}>
        <div className="rc-tag" style={{ marginBottom: 4 }}>
          Projected attendance
        </div>
        {projected.map((p) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #f0eff5" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
              <div className="rc-tag">
                {p.skip > 0 ? `skipping ${p.skip}` : "no change"} · target {Math.round(p.threshold * 100)}%
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="rc-big" style={{ fontSize: 20, color: p.safe ? "var(--color-status-safe)" : "var(--color-status-risk)" }}>
                {p.projPct == null ? "—" : `${p.projPct}%`}
              </div>
              <div className="rc-tag">{p.skip === 0 ? "" : p.safe ? "still safe" : "below line"}</div>
            </div>
          </div>
        ))}
      </section>

      {anySkip && (
        <section className="rc-card" style={{ background: anyBelow ? "var(--color-status-risk-fill)" : "var(--color-accent-attendance)" }}>
          <div style={{ fontWeight: 700 }}>{anyBelow ? "Careful" : "You're good"}</div>
          <div style={{ fontSize: 13 }}>
            {anyBelow
              ? "Skipping those days drops at least one subject below its line."
              : "You can skip those days and stay above every line."}
          </div>
        </section>
      )}
    </>
  );
}

export type { Standing };
