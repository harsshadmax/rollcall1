# ADR-001 — Manual data model: sessions, thresholds, holidays

- **Status:** Accepted (Phase 1, 2026-10-27)
- **Context:** RollCall holds no ERP connection (owner decision Q1). All attendance, timetable and marks are student-entered. The design must make daily entry cheap and keep the attendance math correct against the official Sathyabama rules ([sathyabama-rules.md](../sathyabama-rules.md)).

## Decision 1 — Timetable generates sessions; sessions are what you mark
The weekly `timetable_slots` are a **template**. From them plus the semester's start/end dates minus `no_class_days`, RollCall generates one `class_sessions` row per occurrence (FR-5). Students mark **sessions**, not the template.

- **Why:** the daily action becomes a tap on a pre-made list, not data entry. It also makes the attendance denominator exact (every real class is a row) and the what-if planner trivial (future rows already exist as `unmarked`).
- **Regeneration rule:** editing the timetable re-runs generation but **never overwrites a session already marked present/absent**. It only adds sessions for new slots and removes future `unmarked` sessions for deleted slots. Idempotent.
- **Alternative rejected:** storing only running counts (attended/total) per subject, like the public calculators. Simpler, but loses per-day history, the calendar view, edit-any-day, and accurate holiday handling.

## Decision 2 — Threshold is per class kind, defaulting to the regulation
`theory = 80%`, `practical/lab = 100%` (§9.1(d)). Stored on the profile as defaults and overridable per subject.

- **Why:** the official rule genuinely differs by kind; a single 80% would be wrong for labs.
- **UX consequence:** at 100%, `canSkip` is always 0 and any miss is unrecoverable. The UI shows "can't miss any" and, after a miss, "below 100% — can't recover this semester", never a negative or infinite number. Encoded in the vectors.
- **Escape hatch:** a student who wants to track against a personal 75%/80% target can lower the per-subject threshold; the official default is restorable.

## Decision 3 — What counts in the denominator
`held = present + absent`. `cancelled` and `no_class_days` are excluded from both numerator and denominator. `unmarked` is excluded from current % and handled only by the projection.

- **Why:** matches how a student reasons ("out of classes that actually happened and were marked"). Cancelled classes shouldn't help or hurt.

## Decision 4 — Grades/GPA are credit-weighted over cleared courses only
Seed the Sathyabama scale (A++=10 … C=6; RA/ABS/W/AAA=0, excluded). GPA/CGPA per §4. The scale is a `grade_scales` preset row, read-only, clonable per user.

- **Why:** authoritative and matches the references. Clonable so a different batch/regulation can be entered without a code change.

## Decision 5 — No stored derived values
Attendance %, canSkip, GPA, CGPA are computed by pure functions in `lib/domain/*` at read time (or as SQL views), never written to tables.

- **Why:** they can't drift from the source rows; the functions are unit-tested against `__vectors__.json`.

## Consequences
- Setup cost is front-loaded (build the timetable once); daily cost is a few taps. This is the main UX risk (blueprint R1), mitigated by quick-mark, bulk mark, CSV import and reminders.
- Everything works offline and needs no external service, which is the whole point of the manual model.
- If official ERP access is ever granted, a sync layer can upsert into these same `class_sessions`/`subjects` rows behind a `source` column, without changing the domain functions or the UI.
