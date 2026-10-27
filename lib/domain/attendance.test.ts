import { describe, it, expect } from "vitest";
import { attendancePct, projectAttendance } from "./attendance";
import vectors from "./__vectors__.json";

describe("attendancePct", () => {
  for (const v of vectors.attendancePct) {
    it(v.name, () => {
      expect(attendancePct({ present: v.present, absent: v.absent })).toBe(v.expectPct);
    });
  }
});

describe("projectAttendance (canSkip / mustAttend)", () => {
  for (const v of vectors.canSkip) {
    it(v.name, () => {
      const r = projectAttendance(v.attended, v.held, v.threshold);
      expect(r.canSkip).toBe(v.expectCanSkip);
      expect(r.mustAttend).toBe(v.expectMustAttend);
      if ("expectUnrecoverable" in v) {
        expect(r.unrecoverable).toBe(v.expectUnrecoverable);
      }
    });
  }
});
