"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Face, type Mood } from "./Face";
import { markSession, markWholeDay } from "@/lib/actions/app";
import type { ScheduleRow, SessionStatus } from "@/lib/data/types";

const STATUS_META: Record<SessionStatus, { label: string; mood: Mood; fill: string }> = {
  present: { label: "Present", mood: "happy", fill: "var(--color-accent-attendance)" },
  absent: { label: "Absent", mood: "sad", fill: "var(--color-status-risk-fill)" },
  cancelled: { label: "Cancelled", mood: "sleep", fill: "var(--color-accent-calendar)" },
  unmarked: { label: "Not marked", mood: "neutral", fill: "var(--color-surface)" },
};

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const keyOf = (subjectId: string, periodId: string | null) => `${subjectId}:${periodId ?? ""}`;

export function DayAttendance({
  day,
  rows,
  hasTimetable,
}: {
  day: string;
  rows: ScheduleRow[];
  hasTimetable: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const date = new Date(day + "T00:00:00");

  // optimistic local view so taps feel instant; server is source of truth on refresh
  const [local, setLocal] = useState<Record<string, SessionStatus>>({});
  const statusOf = (r: ScheduleRow) => local[keyOf(r.subject.id, r.periodId)] ?? r.status;

  function goDay(delta: number) {
    const n = new Date(date);
    n.setDate(n.getDate() + delta);
    router.push(`/attendance?day=${iso(n)}`);
  }

  function wholeDay(status: SessionStatus) {
    const next: Record<string, SessionStatus> = {};
    for (const r of rows) if (statusOf(r) !== "cancelled") next[keyOf(r.subject.id, r.periodId)] = status;
    setLocal((p) => ({ ...p, ...next }));
    startTransition(async () => {
      await markWholeDay(
        day,
        status,
        rows.map((r) => ({ subjectId: r.subject.id, periodId: r.periodId })),
      );
      // no router.refresh(): the action's revalidatePath already re-renders this page
    });
  }

  function one(r: ScheduleRow, status: SessionStatus) {
    setLocal((p) => ({ ...p, [keyOf(r.subject.id, r.periodId)]: status }));
    startTransition(async () => {
      await markSession(r.subject.id, day, status, r.periodId);
    });
  }

  const present = rows.filter((r) => statusOf(r) === "present").length;
  const absent = rows.filter((r) => statusOf(r) === "absent").length;
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const nice = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0 10px" }}>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
          Attendance
        </h1>
        <span style={{ display: "flex", gap: 12 }}>
          <Link href="/whatif" className="rc-tag" style={{ textDecoration: "none" }}>
            Can I skip? →
          </Link>
          <Link href="/calendar" className="rc-tag" style={{ textDecoration: "none" }}>
            Calendar →
          </Link>
        </span>
      </div>

      <div className="rc-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button aria-label="Previous day" onClick={() => goDay(-1)} style={navBtn}>
          ‹
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700 }}>{weekday}</div>
          <div className="rc-tag">{nice}</div>
        </div>
        <button aria-label="Next day" onClick={() => goDay(1)} style={navBtn}>
          ›
        </button>
      </div>

      {rows.length === 0 ? (
        hasTimetable ? (
          <section className="rc-card">
            <div className="rc-tag">No classes today</div>
            <p style={{ margin: "6px 0 0" }}>Nothing scheduled on {weekday}. Enjoy the day off.</p>
          </section>
        ) : (
          <section className="rc-card">
            <div className="rc-tag">No subjects yet</div>
            <p style={{ margin: "6px 0 10px" }}>Add your subjects first, then mark attendance here.</p>
            <Link href="/subjects" className="rc-submit" style={{ display: "inline-block", textDecoration: "none" }}>
              Add subjects
            </Link>
          </section>
        )
      ) : (
        <>
          {!hasTimetable && (
            <p style={{ color: "var(--color-ink-muted)", fontSize: 12, margin: "0 0 10px" }}>
              Showing all subjects. <Link href="/timetable">Build your timetable</Link> to see only each day&apos;s classes.
            </p>
          )}
          <section className="rc-card" style={{ marginBottom: 12 }}>
            <div className="rc-tag">Mark the whole day</div>
            <p style={{ fontSize: 13, color: "var(--color-ink-muted)", margin: "4px 0 10px" }}>
              Sets every class below. Edit any after.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => wholeDay("present")} disabled={pending} style={dayBtn("var(--color-ink)", "#fff")}>
                <Face mood="happy" size={18} /> All present
              </button>
              <button onClick={() => wholeDay("absent")} disabled={pending} style={dayBtn("var(--color-status-risk-fill)", "var(--color-ink)")}>
                <Face mood="sad" size={18} /> All absent
              </button>
            </div>
          </section>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <span className="rc-chip" style={{ background: "var(--color-accent-attendance)" }}>
              {present} present
            </span>
            <span className="rc-chip" style={{ background: "var(--color-status-risk-fill)" }}>
              {absent} absent
            </span>
          </div>

          <section className="rc-card">
            <div className="rc-tag" style={{ marginBottom: 4 }}>
              Edit individual classes
            </div>
            {rows.map((r) => {
              const st = statusOf(r);
              return (
                <div key={keyOf(r.subject.id, r.periodId)} style={{ padding: "10px 0", borderTop: "1px solid #f0eff5" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 9,
                        background: STATUS_META[st].fill,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-ink)",
                        flexShrink: 0,
                        boxShadow: st === "unmarked" ? "inset 0 0 0 1.5px #e3e1ec" : "none",
                      }}
                    >
                      <Face mood={STATUS_META[st].mood} size={20} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.subject.name}</div>
                      <div className="rc-tag">
                        {r.time ? `${r.time} · ` : ""}
                        {r.subject.code} · {r.subject.kind}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["present", "absent", "cancelled"] as SessionStatus[]).map((s) => {
                      const on = st === s;
                      return (
                        <button
                          key={s}
                          onClick={() => one(r, on ? "unmarked" : s)}
                          aria-pressed={on}
                          style={{
                            flex: 1,
                            padding: "8px 4px",
                            borderRadius: 12,
                            border: "none",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            background: on ? "var(--color-ink)" : "#f1eff6",
                            color: on ? "#fff" : "var(--color-ink)",
                          }}
                        >
                          {STATUS_META[s].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}
    </>
  );
}

const navBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 999,
  border: "none",
  background: "#f1eff6",
  fontSize: 18,
  cursor: "pointer",
};

function dayBtn(bg: string, color: string): React.CSSProperties {
  return {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 16,
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    background: bg,
    color,
    boxShadow: "var(--shadow-card)",
  };
}
