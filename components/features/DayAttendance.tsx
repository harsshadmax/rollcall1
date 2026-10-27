"use client";

import { useState } from "react";
import { Face, type Mood } from "./Face";

export type Status = "present" | "absent" | "cancelled" | "unmarked";

interface Period {
  id: string;
  subject: string;
  time: string;
  kind: "theory" | "practical";
  status: Status;
}

// Sample timetable for the day. Phase 5 generates these rows from the student's real timetable.
const BASE_PERIODS: Omit<Period, "status">[] = [
  { id: "p1", subject: "Data Structures", time: "09:00–09:50", kind: "theory" },
  { id: "p2", subject: "Operating Systems", time: "10:00–10:50", kind: "theory" },
  { id: "p3", subject: "Computer Networks", time: "11:00–11:50", kind: "theory" },
  { id: "p4", subject: "Discrete Maths", time: "12:00–12:50", kind: "theory" },
  { id: "p5", subject: "DBMS Lab", time: "13:30–16:10", kind: "practical" },
];

const STATUS_META: Record<Status, { label: string; mood: Mood; fill: string }> = {
  present: { label: "Present", mood: "happy", fill: "var(--color-accent-attendance)" },
  absent: { label: "Absent", mood: "sad", fill: "var(--color-status-risk-fill)" },
  cancelled: { label: "Cancelled", mood: "sleep", fill: "var(--color-accent-calendar)" },
  unmarked: { label: "Not marked", mood: "neutral", fill: "var(--color-surface)" },
};

function freshPeriods(): Period[] {
  return BASE_PERIODS.map((p) => ({ ...p, status: "unmarked" }));
}

export function DayAttendance({ initialDate = "2026-09-24" }: { initialDate?: string }) {
  const [date, setDate] = useState(() => new Date(initialDate + "T00:00:00"));
  const [periods, setPeriods] = useState<Period[]>(freshPeriods);
  // In-memory for now; Phase 4 persists marks to the database per student + date.

  // Day-level: set every non-cancelled period to the chosen status.
  function markWholeDay(status: Status) {
    setPeriods((prev) => prev.map((p) => (p.status === "cancelled" ? p : { ...p, status })));
  }

  // Per-period: edit one class individually (overrides the day default).
  function setOne(id: string, status: Status) {
    setPeriods((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  function shiftDay(delta: number) {
    setDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + delta);
      return n;
    });
    setPeriods(freshPeriods());
  }

  const present = periods.filter((p) => p.status === "present").length;
  const absent = periods.filter((p) => p.status === "absent").length;
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const nice = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, margin: "4px 0 10px" }}>
        Attendance
      </h1>

      {/* date nav */}
      <div className="rc-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button aria-label="Previous day" onClick={() => shiftDay(-1)} style={navBtn}>
          ‹
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700 }}>{weekday}</div>
          <div className="rc-tag">{nice}</div>
        </div>
        <button aria-label="Next day" onClick={() => shiftDay(1)} style={navBtn}>
          ›
        </button>
      </div>

      {/* day-level mark */}
      <section className="rc-card" style={{ marginBottom: 12 }}>
        <div className="rc-tag">Mark the whole day</div>
        <p style={{ fontSize: 13, color: "var(--color-ink-muted)", margin: "4px 0 10px" }}>
          Sets every period below. Edit any class after.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => markWholeDay("present")} style={dayBtn("var(--color-ink)", "#fff")}>
            <Face mood="happy" size={18} /> All present
          </button>
          <button onClick={() => markWholeDay("absent")} style={dayBtn("var(--color-status-risk-fill)", "var(--color-ink)")}>
            <Face mood="sad" size={18} /> All absent
          </button>
        </div>
      </section>

      {/* summary */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <span className="rc-chip" style={{ background: "var(--color-accent-attendance)" }}>
          {present} present
        </span>
        <span className="rc-chip" style={{ background: "var(--color-status-risk-fill)" }}>
          {absent} absent
        </span>
      </div>

      {/* per-period rows */}
      <section className="rc-card" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div className="rc-tag" style={{ marginBottom: 4 }}>
          Edit individual classes
        </div>
        {periods.map((p) => (
          <div key={p.id} style={{ padding: "10px 0", borderTop: "1px solid #f0eff5" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: STATUS_META[p.status].fill,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-ink)",
                  flexShrink: 0,
                  boxShadow: p.status === "unmarked" ? "inset 0 0 0 1.5px #e3e1ec" : "none",
                }}
              >
                <Face mood={STATUS_META[p.status].mood} size={20} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.subject}</div>
                <div className="rc-tag">
                  {p.time} · {p.kind}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["present", "absent", "cancelled"] as Status[]).map((s) => {
                const on = p.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setOne(p.id, s)}
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
        ))}
      </section>
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
