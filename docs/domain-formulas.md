# RollCall domain formulas (with worked examples)

> The single source of truth for the pure-function layer (`lib/domain/*`). Every formula here has a matching entry in [`lib/domain/__vectors__.json`](../lib/domain/__vectors__.json), which the unit tests load. If a formula changes, change the vector too.
> Rules cited from [sathyabama-rules.md](./sathyabama-rules.md).

## 1. Attendance percentage

For a subject (or overall), over classes that actually count (held classes, excluding `cancelled` and `no_class_days`):

```
present  = count(status = present)
absent   = count(status = absent)
held     = present + absent          # cancelled & unmarked excluded from the denominator
pct      = held == 0 ? null : (present / held) * 100
```

- `cancelled` classes and holidays never count in numerator or denominator.
- `unmarked` classes are **not** counted yet (they're in the future or simply not marked). The projection functions (§3) handle the future ones.
- A subject with `held == 0` shows "—", not 0%.

**Worked:** present 23, absent 3 → held 26 → 23/26 = **88.46%**. (Matches SIST-ERP's sample dossier.)

## 2. Can-skip / must-attend (against threshold `t`, e.g. 0.80)

Let `A` = present (attended), `T` = held so far. Current `pct = A/T`.

**If already at or above the line (`A ≥ t·T`): how many future classes you can miss and stay ≥ t.**
Miss `S` future classes (attend none of them): new ratio `A / (T + S) ≥ t`.

```
canSkip = max(0, floor(A / t − T))
```

**If below the line (`A < t·T`): how many future classes you must attend in a row to reach t.**
Attend `M` future classes (miss none): new ratio `(A + M) / (T + M) ≥ t`.

```
mustAttend = max(0, ceil((t·T − A) / (1 − t)))
```

- Exactly one of `canSkip` / `mustAttend` is > 0 at a time (the other is 0). When `pct == t` exactly, `canSkip = 0` and `mustAttend = 0`.
- `t = 1.0` (practical, 100%): `canSkip` is always 0; if any class was missed, `mustAttend` is infinite in principle — RollCall shows "can't drop any" / "already below 100%, cannot recover this semester" rather than a number. Vector covers this.

**Worked A (can skip):** A=60, T=70, t=0.80 → canSkip = floor(60/0.8 − 70) = floor(75 − 70) = **5**. (Matches the sistmate `/attendance-calculator` example: "For 60 attended of 70, S = 5".)

**Worked B (percentage display):** A=42, T=48 → 42/48 = **87.5%** with t=0.80 → canSkip = floor(42/0.8 − 48) = floor(52.5 − 48) = floor(4.5) = **4**. (Matches the sistmate landing hero: "87.5% … 4 classes you can still skip".)

**Worked C (must attend):** A=30, T=50, t=0.80 → pct 60% → mustAttend = ceil((0.8·50 − 30)/(1 − 0.8)) = ceil((40 − 30)/0.2) = ceil(50) = **50**.

**Worked D (practical):** A=9, T=10, t=1.0 → pct 90% → below 100%, unrecoverable → flag, no number.

## 3. What-if projection

Given a set of future dated classes the student toggles to "will skip" (or "will attend"):

```
projHeld   = T + (future classes included in the scenario)
projPresent= A + (future classes marked "will attend" in the scenario)
projPct    = projPresent / projHeld * 100
```

The planner just re-runs §1 on the hypothetical counts per subject and shows the resulting pct and the new canSkip/mustAttend. Presets (tomorrow / next Mon / next Fri) select the matching timetable classes as "will skip".

## 4. GPA / CGPA (credit-weighted, cleared courses only)

```
clearedCourses = courses whose grade ∈ {A++,A+,B++,B+,C}   # RA/ABS/W/AAA excluded
GPA (one semester)  = Σ(Ci · GPi) / Σ(Ci)  over cleared courses in that semester
CGPA (all semesters)= Σ(Ci · GPi) / Σ(Ci)  over all cleared courses
percentageEquiv     = CGPA * 10
```

**Worked (one semester):** Data Structures (4cr, A++=10), Operating Systems (3cr, A+=9), Computer Networks (3cr, A+=9), Discrete Maths (4cr, B++=8).
Σ(Ci·GPi) = 4·10 + 3·9 + 3·9 + 4·8 = 40+27+27+32 = 126. ΣCi = 14. GPA = 126/14 = **9.00**.
(A B++ 4-credit subject pulls an otherwise-A+ semester down — the planner uses this to answer "what do I need next".)

**Worked (RA excluded):** add a 3cr course graded RA. It is dropped from both sums → GPA unchanged at 9.00; the RA course is listed separately as "to re-register".

## 5. CGPA target planner

To reach a target CGPA `G*` after `k` more semesters, given current cleared credits `Cnow` with points `Pnow = Σ(Ci·GPi)` and an assumed `cNext` credits per future semester:

```
neededAvgGP = (G* · (Cnow + k·cNext) − Pnow) / (k·cNext)
```

Shown as "average `neededAvgGP` across the next `k` semesters" (clamped to ≤ 10; if > 10, report "not reachable in k semesters"). Mirrors the sistmate planner line "To reach 8.5, average 8.66 over the next two semesters."

## 6. Grade-target planner per subject (N8)

Given internal marks `internal` out of `internalMax`, an end-sem paper out of `endMax` weighted so the course total is out of 100, and a target grade's lower bound `need` (e.g. 60 for B+):

```
endSemMarkNeeded = (need − internalScaledToTotal) / endWeight   # in end-sem paper's own scale
```

Clamp to `[0, endMax]`; if it exceeds `endMax`, that grade is not reachable; also enforce the separate end-sem minimum if configured. Exact scaling confirmed in Phase 5 against a real mark sheet; the function takes the weights as parameters so the rule stays data-driven.
