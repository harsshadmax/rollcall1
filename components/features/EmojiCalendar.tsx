import Link from "next/link";
import { Face, type Mood } from "./Face";
import type { MonthAttendance } from "@/lib/data/queries";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WD = ["M", "T", "W", "T", "F", "S", "S"];

function shiftYm(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function cellStyle(mood: Mood | null, fill: string) {
  return {
    aspectRatio: "1",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    background: fill,
    boxShadow: mood ? "var(--shadow-card)" : "none",
    color: "var(--color-ink)",
  };
}

export function EmojiCalendar({ data, ym }: { data: MonthAttendance; ym: string }) {
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < data.firstWeekday; i++) cells.push(<div key={`b${i}`} />);

  for (let day = 1; day <= data.lastDay; day++) {
    const c = data.byDay[day];
    let mood: Mood | null = null;
    let fill = "transparent";
    if (c) {
      if (c.absent > 0) {
        mood = "sad";
        fill = "var(--color-status-risk-fill)";
      } else if (c.present > 0) {
        mood = "happy";
        fill = "var(--color-accent-attendance)";
      } else if (c.cancelled > 0) {
        mood = "sleep";
        fill = "var(--color-accent-calendar)";
      }
    }
    cells.push(
      <div key={day} style={cellStyle(mood, mood ? fill : "#f4f2fa")}>
        {mood ? <Face mood={mood} size={18} /> : <span style={{ height: 18 }} />}
        <b style={{ fontSize: 9, opacity: 0.65, marginTop: 1, fontWeight: 600 }}>{day}</b>
      </div>,
    );
  }

  const summaryMood: Mood = data.pct == null ? "neutral" : data.pct >= 80 ? "happy" : data.pct >= 70 ? "neutral" : "sad";
  const verdict =
    data.pct == null ? "Nothing marked yet" : data.pct >= 80 ? "Great · above the line" : data.pct >= 75 ? "Watch it" : "Below the line";

  return (
    <>
      <div className="rc-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Link href={`/calendar?ym=${shiftYm(ym, -1)}`} aria-label="Previous month" style={navLink}>
          ‹
        </Link>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700 }}>{MONTHS[data.month - 1]}</div>
          <div className="rc-tag">{data.year}</div>
        </div>
        <Link href={`/calendar?ym=${shiftYm(ym, 1)}`} aria-label="Next month" style={navLink}>
          ›
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6, fontSize: 10, color: "var(--color-ink-muted)", textAlign: "center" }}>
        {WD.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>{cells}</div>

      <section className="rc-card" style={{ background: "var(--color-accent-attendance)", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
        <div>
          <div className="rc-tag">Monthly summary</div>
          <div className="rc-big" style={{ fontSize: 26 }}>
            {data.pct == null ? "—" : `${data.pct}%`}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{verdict}</div>
        </div>
        <Face mood={summaryMood} size={52} />
      </section>

      <div className="rc-card" style={{ marginTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center" }}>
          <div>
            <b className="font-display" style={{ fontSize: 18, display: "block" }}>
              {data.presentDays}
            </b>
            <span className="rc-tag">Present days</span>
          </div>
          <div style={{ borderLeft: "1px solid #eee", borderRight: "1px solid #eee" }}>
            <b className="font-display" style={{ fontSize: 18, display: "block" }}>
              {data.absentDays}
            </b>
            <span className="rc-tag">Absent days</span>
          </div>
          <div>
            <b className="font-display" style={{ fontSize: 18, display: "block" }}>
              {data.present}/{data.held}
            </b>
            <span className="rc-tag">Classes</span>
          </div>
        </div>
      </div>
    </>
  );
}

const navLink: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 999,
  background: "#f1eff6",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  textDecoration: "none",
  color: "var(--color-ink)",
};
