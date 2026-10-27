# Sathyabama academic rules (confirmed) — RollCall reference

> Source: **Sathyabama Institute of Science and Technology — Academic Regulations, UG B.E./B.Tech** (official PDF on sathyabama.ac.in, 2023 copy). Extracted and verified in Phase 1 on 2026-10-27. Section numbers (§) are from that document.
> **These rules are seeded as defaults and must stay editable in RollCall** — regulations differ by batch and are revised. A student's own grade sheet / the Controller of Examinations is the final word.

## Attendance

| Rule | Value | Source |
|---|---|---|
| Overall attendance to complete a semester / write end-sem exams | **≥ 80%** | §6.1 |
| Theory classes | **≥ 80%** | §9.1(d) |
| Practical / lab sessions | **100%** | §9.1(d) |
| Below requirement | Not permitted to write the semester examinations | §6.2, §9.1(d) |
| Condonation band | **None stated** in these regulations | §6.2 (no condonation clause) |
| Attendance granularity | Taken **every hour** ("hour-wise"); CA tests compulsory | §9.1(b),(c) |

**Implication for RollCall:** the attendance threshold is **per class kind** — theory default 80%, practical default 100%. Both are editable per subject (a student may want to track against a laxer personal target). The "can skip / must attend" math runs per subject against its kind's threshold. The 100% practical rule means `canSkip = 0` for any practical subject at the default — surface that clearly rather than showing a negative number.

## Grades and grade points (§16)

| Range of marks | Grade | Grade points (GP) |
|---|---|---|
| 90–100 | A++ | 10 |
| 80–89 | A+ | 9 |
| 70–79 | B++ | 8 |
| 60–69 | B+ | 7 |
| 50–59 | C | 6 |
| 00–49 (reappear) | RA | 0 |
| Absent | ABS | 0 |
| Withdrawal | W | 0 |
| Authorised Break of Study | AAA | 0 |

- **Pass:** a course pass needs the absolute total to reach the C band (≥ 50). A failed course is graded **RA** and must be re-registered and re-attempted until cleared (§15).
- This matches what the live sistmate CGPA page stated (A++=10 … C=6), so the references' scale was correct.

## GPA / CGPA (§16)

```
        Σ (Ci · GPi)                 Σ (Ci · GPi)   over all cleared courses,
GPA  =  ─────────────   (one sem)    all semesters  for CGPA
          Σ Ci
```

- `Ci` = credits of course *i*; `GPi` = grade point for the grade obtained.
- `n` = number of courses **successfully cleared** (so RA/ABS/W/AAA are **excluded** from the sums — confirmed: "RA, AAA and W grades will be excluded for calculating GPA and CGPA").
- **Percentage equivalent ≈ CGPA × 10** (per the official CGPA conversion certificate).

## Degree classification (§16) — informational, not a v1 feature

| CGPA | Class |
|---|---|
| ≥ 9.0 | First Class — Exemplary |
| 7.50 – < 9.0 | First Class with Distinction |
| 6.00 – < 7.50 | First Class |
| 5.00 – < 6.00 | Second Class |
| < 5.0 | Does not meet the minimum for the degree |

## Notes / open points for a later regulation check
- These are the **UG B.E./B.Tech** rules. B.Arch, law and other programmes have their own regulation documents and may differ — out of scope for v1 (CSE/engineering focus).
- Some older regulation years (2010) excluded "F/W" instead of "RA/AAA/W"; the 2023 UG text above is what RollCall seeds.
- The exact end-semester minimum (a separate ~30% floor in the end-sem paper on top of the 50% total) is mentioned but not needed for GPA display; RollCall's "below pass" flag uses the 50% total rule and lets the student override a grade.
