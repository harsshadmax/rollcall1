/**
 * GPA / CGPA — credit-weighted over cleared courses only.
 * See docs/domain-formulas.md §4–5 and docs/sathyabama-rules.md §16.
 */

export interface GradedCourse {
  credits: number;
  points: number;
  countsInGpa: boolean;
}

/** Credit-weighted GPA/CGPA over courses that count (RA/ABS/W/AAA excluded). null if none. */
export function gpa(courses: GradedCourse[]): number | null {
  let num = 0;
  let den = 0;
  for (const c of courses) {
    if (!c.countsInGpa) continue;
    num += c.credits * c.points;
    den += c.credits;
  }
  if (den === 0) return null;
  return Math.round((num / den) * 100) / 100;
}

export function sumPoints(courses: GradedCourse[]): { points: number; credits: number } {
  let points = 0;
  let credits = 0;
  for (const c of courses) {
    if (!c.countsInGpa) continue;
    points += c.credits * c.points;
    credits += c.credits;
  }
  return { points, credits };
}

/** Average grade-point needed over future semesters to reach a target CGPA. */
export function neededAverage(
  currentPoints: number,
  currentCredits: number,
  futureSemesters: number,
  creditsPerFutureSemester: number,
  targetCgpa: number,
): number {
  const futureCredits = futureSemesters * creditsPerFutureSemester;
  if (futureCredits <= 0) return NaN;
  return (
    Math.round(((targetCgpa * (currentCredits + futureCredits) - currentPoints) / futureCredits) * 100) / 100
  );
}
