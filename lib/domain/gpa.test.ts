import { describe, it, expect } from "vitest";
import { gpa, neededAverage } from "./gpa";
import vectors from "./__vectors__.json";

const bands = vectors.gradeScaleSathyabama.bands;
function resolve(grade: string) {
  const b = bands.find((x) => x.grade === grade)!;
  return { points: b.points, countsInGpa: b.countsInGpa };
}
function graded(courses: { credits: number; grade: string }[]) {
  return courses.map((c) => ({ credits: c.credits, ...resolve(c.grade) }));
}

describe("gpa", () => {
  for (const v of vectors.gpa) {
    it(v.name, () => {
      expect(gpa(graded(v.courses))).toBe(v.expectGpa);
    });
  }
});

describe("cgpa (over all semesters)", () => {
  for (const v of vectors.cgpa) {
    it(v.name, () => {
      const all = v.semesters.flatMap((s) => s.courses);
      expect(gpa(graded(all))).toBe(v.expectCgpa);
    });
  }
});

describe("neededAverage (target planner)", () => {
  for (const v of vectors.cgpaTargetPlanner) {
    it(v.name, () => {
      expect(
        neededAverage(v.currentPoints, v.currentCredits, v.futureSemesters, v.creditsPerFutureSemester, v.targetCgpa),
      ).toBe(v.expectNeededAvgGP);
    });
  }
});
