import { Face, type Mood } from "@/components/features/Face";

// Sample data for the scaffold. Phase 4/5 replaces this with the signed-in user's rows.
const subjects: { code: string; name: string; mood: Mood; color: string }[] = [
  { code: "DS", name: "Data Str.", mood: "happy", color: "var(--color-accent-attendance)" },
  { code: "OS", name: "OS", mood: "neutral", color: "var(--color-accent-marks)" },
  { code: "CN", name: "Networks", mood: "sleep", color: "var(--color-accent-calendar)" },
  { code: "DM", name: "Maths", mood: "sad", color: "var(--color-status-risk-fill)" },
];

export default function TodayPage() {
  return (
    <>
      <header className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <div className="flex items-center" style={{ gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "var(--color-accent-hero)",
            }}
          />
          <div>
            <div className="rc-tag">Welcome back</div>
            <div style={{ fontWeight: 700 }}>Alex Miller</div>
          </div>
        </div>
        <span aria-hidden style={{ fontSize: 20, color: "var(--color-ink-muted)" }}>
          ☰
        </span>
      </header>

      <p className="rc-tag" style={{ margin: "0 0 6px" }}>
        Mon 27 Oct
      </p>
      <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15, margin: "0 0 14px" }}>
        Hi Alex! Can you
        <br />
        skip today?
      </h1>

      <div className="flex" style={{ gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {subjects.map((s) => (
          <span key={s.code} className="rc-chip">
            <i
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background: s.color,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-ink)",
              }}
            >
              <Face mood={s.mood} size={18} />
            </i>
            {s.name}
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div className="rc-card" style={{ background: "var(--color-accent-marks)" }}>
          <div className="rc-tag">Overall</div>
          <div className="rc-big" style={{ fontSize: 26, marginTop: 6 }}>
            84%
          </div>
          <div className="rc-tag" style={{ marginTop: 2 }}>
            above 80%
          </div>
        </div>
        <div className="rc-card" style={{ background: "var(--color-accent-schedule)" }}>
          <div className="rc-tag">At risk</div>
          <div className="rc-big" style={{ fontSize: 26, marginTop: 6 }}>
            1
          </div>
          <div className="rc-tag" style={{ marginTop: 2 }}>
            subject below
          </div>
        </div>
      </div>

      <section className="rc-card" style={{ background: "var(--color-accent-attendance)" }}>
        <div className="rc-tag">Quick mark · 2 left today</div>
        <p style={{ fontWeight: 700, margin: "4px 0 10px" }}>Were you present for DBMS Lab?</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 16,
              border: "none",
              fontWeight: 700,
              background: "var(--color-ink)",
              color: "#fff",
            }}
          >
            Present
          </button>
          <button
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 16,
              border: "none",
              fontWeight: 700,
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            Absent
          </button>
        </div>
      </section>
    </>
  );
}
