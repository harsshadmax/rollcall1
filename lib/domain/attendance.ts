/**
 * Attendance math — see docs/domain-formulas.md and docs/sathyabama-rules.md.
 * Pure functions, unit-tested against lib/domain/__vectors__.json.
 */

export interface SessionCounts {
  present: number;
  absent: number;
  /** cancelled + holiday are excluded from the denominator; kept for clarity, not used in %. */
  cancelled?: number;
}

/** Attendance % over held classes (present + absent). null when nothing is held yet. */
export function attendancePct({ present, absent }: SessionCounts): number | null {
  const held = present + absent;
  if (held === 0) return null;
  return Math.round(((present / held) * 100 + Number.EPSILON) * 100) / 100;
}

export interface Projection {
  canSkip: number;
  /** null when at a 100% threshold and a class was already missed (unrecoverable this term). */
  mustAttend: number | null;
  unrecoverable: boolean;
}

/**
 * How many future classes can be skipped (while staying >= threshold), or must be
 * attended in a row (to reach threshold). threshold in (0,1].
 */
export function projectAttendance(attended: number, held: number, threshold: number): Projection {
  const t = threshold;
  // 100% threshold: no skips ever; if anything was missed, it can't be recovered.
  if (t >= 1) {
    const missed = held - attended;
    return { canSkip: 0, mustAttend: missed > 0 ? null : 0, unrecoverable: missed > 0 };
  }
  // epsilon guards floating-point error (e.g. (1 - 0.8) === 0.199999… would round 50 up to 51)
  const EPS = 1e-9;
  const canSkip = Math.max(0, Math.floor(attended / t - held + EPS));
  const mustAttend = Math.max(0, Math.ceil((t * held - attended) / (1 - t) - EPS));
  return { canSkip, mustAttend, unrecoverable: false };
}
