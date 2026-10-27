# RollCall — Functional Specification (Phase 1)

> Status: **Phase 1 deliverable, for approval before Phase 2.** Derived from `blueprint.md` (§7 requirements) with testable acceptance criteria. Domain rules: [sathyabama-rules.md](./sathyabama-rules.md), formulas: [domain-formulas.md](./domain-formulas.md).
> Scope decision: **all of N1–N11 are in v1 scope** at the priorities below (owner approved the revised blueprint). Data is 100% manual-entry; no ERP/scraping/credentials.

## Glossary
- **Session** = one scheduled occurrence of a subject on a date at a period. Status ∈ `present | absent | cancelled | unmarked`.
- **Held** = sessions that count toward %: present + absent (cancelled and no-class days excluded).
- **Kind** = `theory | lab | both`. Threshold defaults: theory 80%, practical/lab 100% (editable).

## Acceptance criteria by requirement

Priority: **P0** = must ship for a usable v1; **P1** = ship for v1 if time allows; **P2** = post-v1.

| FR | Requirement | Acceptance criteria (Given/When/Then) | Pri |
|---|---|---|---|
| FR-1 | Accounts | Given a new email, When sign-up completes, Then a profile row exists and the user lands on onboarding. Sign-out clears the session cookie. Password reset emails a link. Delete account removes every row owned by the user (verified by querying as that user after deletion returns nothing). | P0 |
| FR-2 | Semesters | Create/edit/delete a semester with name + start/end dates. Exactly one `is_active=true` per user is enforced (setting a new active clears the old). | P0 |
| FR-3 | Subjects | CRUD subject with code, name, credits (>0), kind, colour token, optional instructor/room. Validation rejects empty code/name and credits ≤ 0. | P0 |
| FR-4 | Periods + timetable | Define periods (ordered, start<end, break flag). Assign a subject to a (weekday, period) slot. A slot can be cleared. Two subjects cannot occupy the same weekday+period. | P0 |
| FR-5 | Session generation | Given a timetable and semester dates, When the student taps "Generate", Then one `unmarked` session is created per matching weekday/period between start and end, skipping `no_class_days`. Regenerating after a timetable edit preserves sessions already marked present/absent and only adds/removes the changed ones. Idempotent: running twice makes no duplicates. | P0 |
| FR-6 | Mark attendance | Set/change any session's status. "Mark today" bulk-sets all of today's sessions to present in one action, each still editable. Quick-mark (N1) does this from the Today card. Past sessions are editable from the Attendance screen. | P0 |
| FR-7 | Attendance % + projection | Per subject (by kind threshold) and overall: show pct (per §1), canSkip/mustAttend (per §2), excluding holidays. Matches vectors: 60/70@80%→skip 5; 42/48→87.5%→skip 4; practical 100% shows "can't drop any". | P0 |
| FR-8 | What-if planner | Select future sessions (or a preset) as "will skip"/"will attend"; projected pct and new canSkip/mustAttend per subject update live (per §3). | P0 |
| FR-9 | Marks | Record assessments per subject (name, max>0, obtained 0..max, weight). Flag "below pass" when the course total projects < 50 (§ rules). Detect arrear = any subject graded RA. | P1 |
| FR-10 | GPA/CGPA | Enter a grade (from the seeded Sathyabama scale) + credits per subject → semester GPA and CGPA (per §4), RA/ABS/W/AAA excluded. Target planner outputs needed average (per §5), clamped ≤10 with "not reachable" message. | P1 |
| FR-11 | Events/calendar | CRUD events (title, date/time or all-day, colour, category). Month and year views render them. | P1 |
| FR-12 | Holidays | Mark a date (range) as no-class; it disappears from session generation and the attendance denominator. | P1 |
| FR-13 | CSV import | Upload a CSV of subjects/timetable/attendance (documented columns). Preview shows parsed rows + per-row validation errors; nothing is written until "Commit". Oversized (>1MB) or malformed files are rejected with a clear message. | P1 |
| FR-14 | Public calculators | `/attendance-calculator` and `/cgpa-calculator` work with no login, using the same domain functions. | P1 |
| FR-15 | Export/restore | Export all account data as one JSON file. Import that JSON into a fresh account reproduces the data (round-trip test). | P1 |
| FR-16 | Bunk budget | Per subject + overall, show "can still miss N" with a meter (N3), derived from canSkip; practical shows 0/locked. | P1 |
| FR-17 | ICS export | Download timetable + events as a valid `.ics` that imports into Google/Apple Calendar. | P2 |
| FR-18 | Stats | Weekly/monthly present-rate bars; current and best attendance streak. | P2 |
| FR-19 | Reminders | Opt-in PWA notification after the last class of the day to mark attendance. | P2 |
| FR-20 | Grade-target planner | Per subject, end-sem mark needed to reach a chosen grade (per §6). | P2 |
| FR-21 | Dark mode | Toggle; persists per device; both themes pass contrast. | P2 |
| FR-22 | PWA/offline | Installable. Works offline reading cached data. Attendance marks made offline queue and sync on reconnect. | P0 shell / P1 offline writes |

## Non-functional acceptance (from blueprint §8)
- Today route JS < 200 kB gzip; LCP < 2.5 s on mid Android/4G.
- WCAG 2.2 AA; colour never the only signal; tap targets ≥ 44 px; reduced-motion respected.
- RLS proven: a test as user A cannot read/write user B's rows.
- No secrets in client bundle; no third-party trackers by default.

## Out of scope for v1 (restated)
ERP/LMS sync, wellbeing, other colleges, native apps, multi-user/social, student dossier/PII, WebGL background.

## Approval
Phase 2 (design tokens) starts when you approve this spec and the Sathyabama rules. Open choices you may want to set now:
- **Default practical threshold:** keep the regulation's **100%**, or default to 80% with 100% as an option? (Recommend: keep 100% to match the rule, but show it as "can't drop any" not a scary negative.)
- **Which P1 items are must-haves** for your 4-student rollout vs. deferrable.
