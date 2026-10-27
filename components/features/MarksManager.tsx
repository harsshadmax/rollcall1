"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { setGrade } from "@/lib/actions/app";
import { neededAverage } from "@/lib/domain/gpa";
import type { MarksData } from "@/lib/data/queries";

export function MarksManager({ data }: { data: MarksData }) {
  const [, startTransition] = useTransition();
  const [local, setLocal] = useState<Record<string, string>>({});
  const [target, setTarget] = useState("8.5");
  const [sems, setSems] = useState("2");

  const gradeOf = (id: string, fallback: string | null) => local[id] ?? fallback ?? "";

  // live GPA from current selections
  const { gpa, points, credits } = useMemo(() => {
    const band = new Map(data.scale.map((b) => [b.grade, b]));
    let p = 0;
    let c = 0;
    for (const s of data.subjects) {
      const g = gradeOf(s.id, s.grade);
      const b = g ? band.get(g) : undefined;
      if (b?.counts_in_gpa) {
        p += Number(s.credits) * Number(b.points);
        c += Number(s.credits);
      }
    }
    return { gpa: c ? Math.round((p / c) * 100) / 100 : null, points: p, credits: c };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, data]);

  function choose(subjectId: string, grade: string) {
    setLocal((p) => ({ ...p, [subjectId]: grade }));
    startTransition(() => void setGrade(subjectId, grade));
  }

  if (data.subjects.length === 0) {
    return (
      <section className="rc-card">
        <div className="rc-tag">No subjects yet</div>
        <p style={{ margin: "6px 0 10px" }}>Add subjects, then record your grades here.</p>
        <Link href="/subjects" className="rc-submit" style={{ display: "inline-block", textDecoration: "none" }}>
          Add subjects
        </Link>
      </section>
    );
  }

  const needed = neededAverage(points, credits, Number(sems) || 0, credits || 20, Number(target) || 0);

  return (
    <>
      <section className="rc-card" style={{ background: "var(--color-accent-marks)", marginBottom: 12 }}>
        <div className="rc-tag">GPA (this semester)</div>
        <div className="rc-big" style={{ fontSize: 40 }}>
          {gpa == null ? "—" : gpa.toFixed(2)}
        </div>
        <div className="rc-tag">
          {gpa == null ? "grade your subjects below" : `${credits} credits · ≈ ${(gpa * 10).toFixed(1)}%`}
        </div>
      </section>

      <section className="rc-card" style={{ marginBottom: 12 }}>
        <div className="rc-tag" style={{ marginBottom: 4 }}>
          Grades
        </div>
        {data.subjects.map((s) => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #f0eff5" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
              <div className="rc-tag">
                {s.code} · {s.credits} cr
              </div>
            </div>
            <select
              aria-label={`Grade for ${s.name}`}
              className="rc-field"
              style={{ width: 96, padding: "8px 10px" }}
              value={gradeOf(s.id, s.grade)}
              onChange={(e) => choose(s.id, e.target.value)}
            >
              <option value="">—</option>
              {data.scale.map((b) => (
                <option key={b.grade} value={b.grade}>
                  {b.grade}
                </option>
              ))}
            </select>
          </div>
        ))}
      </section>

      <section className="rc-card" style={{ background: "var(--color-accent-attendance)" }}>
        <div className="rc-tag">CGPA planner</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
          <span style={{ fontSize: 13 }}>Reach</span>
          <input className="rc-field" style={{ width: 70, padding: "8px 10px" }} value={target} onChange={(e) => setTarget(e.target.value)} />
          <span style={{ fontSize: 13 }}>over</span>
          <input className="rc-field" style={{ width: 56, padding: "8px 10px" }} value={sems} onChange={(e) => setSems(e.target.value)} />
          <span style={{ fontSize: 13 }}>sems</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {gpa == null
            ? "Grade some subjects first."
            : !isFinite(needed)
              ? "Enter how many semesters."
              : needed > 10
                ? `Not reachable in ${sems} semesters.`
                : `Average ${needed.toFixed(2)} across the next ${sems} semesters.`}
        </div>
      </section>
    </>
  );
}
