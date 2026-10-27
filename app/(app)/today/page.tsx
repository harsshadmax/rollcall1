import Link from "next/link";
import { getProfile, getStandings } from "@/lib/data/queries";
import { Face, type Mood } from "@/components/features/Face";

function moodFor(pct: number | null, threshold: number): Mood {
  if (pct == null) return "neutral";
  if (pct >= threshold * 100) return "happy";
  if (pct >= (threshold - 0.1) * 100) return "neutral";
  return "sad";
}

export default async function TodayPage() {
  const [profile, { subjects, overall }] = await Promise.all([getProfile(), getStandings()]);
  const name = profile?.display_name ?? "there";
  const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });

  return (
    <>
      <header className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <div className="flex items-center" style={{ gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--color-accent-hero)" }} />
          <div>
            <div className="rc-tag">Welcome back</div>
            <div style={{ fontWeight: 700 }}>{name}</div>
          </div>
        </div>
        <Link href="/subjects" aria-label="Manage subjects" style={{ fontSize: 20, color: "var(--color-ink-muted)", textDecoration: "none" }}>
          ☰
        </Link>
      </header>

      <p className="rc-tag" style={{ margin: "0 0 6px" }}>
        {today}
      </p>

      {subjects.length === 0 ? (
        <section className="rc-card" style={{ background: "var(--color-accent-attendance)" }}>
          <div className="rc-tag">Let&apos;s set up</div>
          <p style={{ fontWeight: 700, margin: "4px 0 10px" }}>Add your subjects to start tracking.</p>
          <Link href="/subjects" className="rc-submit" style={{ display: "inline-block", textDecoration: "none" }}>
            Add subjects
          </Link>
        </section>
      ) : (
        <>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15, margin: "0 0 14px" }}>
            Hi {name.split(" ")[0]}! Can you
            <br />
            skip today?
          </h1>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div className="rc-card" style={{ background: "var(--color-accent-marks)" }}>
              <div className="rc-tag">Overall</div>
              <div className="rc-big" style={{ fontSize: 26, marginTop: 6 }}>
                {overall.pct == null ? "—" : `${overall.pct}%`}
              </div>
              <div className="rc-tag" style={{ marginTop: 2 }}>
                {overall.held === 0 ? "nothing marked yet" : `${overall.present}/${overall.held} classes`}
              </div>
            </div>
            <Link href="/attendance" className="rc-card" style={{ background: "var(--color-accent-schedule)", textDecoration: "none", color: "inherit" }}>
              <div className="rc-tag">Mark today</div>
              <div className="rc-big" style={{ fontSize: 26, marginTop: 6 }}>
                →
              </div>
              <div className="rc-tag" style={{ marginTop: 2 }}>
                tap to mark classes
              </div>
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {subjects.map((s) => {
              const fill = `var(--color-${s.color_token ?? "accent-attendance"})`;
              const sub =
                s.pct == null
                  ? "no classes yet"
                  : s.unrecoverable
                    ? "can't miss any"
                    : s.canSkip > 0
                      ? `can skip ${s.canSkip}`
                      : s.mustAttend
                        ? `attend ${s.mustAttend}`
                        : "on the line";
              return (
                <div key={s.id} className="rc-card" style={{ background: fill, minHeight: 112, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div className="flex items-center" style={{ gap: 6 }}>
                    <Face mood={moodFor(s.pct, s.threshold)} size={18} />
                    <span className="rc-tag" style={{ color: "var(--color-ink)" }}>
                      {s.code}
                    </span>
                  </div>
                  <div>
                    <div className="rc-big" style={{ fontSize: 26 }}>
                      {s.pct == null ? "—" : `${s.pct}%`}
                    </div>
                    {/* bunk-budget meter: fill = attendance %, notch at the threshold line */}
                    <div style={{ position: "relative", height: 7, borderRadius: 999, background: "rgba(20,20,30,0.14)", margin: "6px 0 4px" }}>
                      <div style={{ width: `${Math.min(s.pct ?? 0, 100)}%`, height: "100%", borderRadius: 999, background: "var(--color-ink)" }} />
                      <div style={{ position: "absolute", top: -1, bottom: -1, left: `${s.threshold * 100}%`, width: 2, background: "var(--color-ink)", opacity: 0.5 }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
