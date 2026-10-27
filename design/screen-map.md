# RollCall — Screen & component map (Phase 2)

> Maps every app page (from `docs/spec.md`) to a reference screenshot or a marked "derived" design, and lists the components each needs. Primary style (revised 2026-10-27): **S4 soft-rounded bento + S3 bold rounded type & bright chips** — white/lilac bg, filled bento cards with soft shadows, dark floating pill nav. References live in `design/references/S1–S4.jpg` (S3/S4 now lead). Tokens in `design/tokens.json`.
> "derived" = no supplied design; proposed here, to confirm visually in Phase 7.

## Pages

| App page | Route | Primary ref | Components | Design status |
|---|---|---|---|---|
| Today / Home | `/today` | S4 | GreetingHeader(avatar), NextClassHero(lavender), DateStrip, QuickMarkChips (N1), SubjectBentoTile, EventCard | ref |
| Attendance | `/attendance` | S3/S4 | StatCard(%), BunkMeter (N3), StatTile×3, SegmentedControl (daily/subject/calc), SubjectBentoTile, DayEditor | ref |
| What-if planner | `/attendance?tab=whatif` | S2 | DatePickerGrid, PresetPills, ProjectedStat | derived (extends S2) |
| Attendance calendar | `/attendance?tab=calendar` | **S3 Mood Calendar** | EmojiMonthGrid (😄/😟/😴/☀️ per day), MonthlySummaryCard (big face + %), StatTile×3 | ref |
| Timetable — day | `/timetable` | S1b | MonthSwitcher, DayRow, TimeChip, AddButton | ref |
| Timetable — week | `/timetable?view=week` | — | WeekGrid (frozen headers, horizontal scroll) | **derived (missing)** |
| Calendar | `/calendar` | S1c | YearGrid (4×3), MonthCard, SearchBar, EventCard | ref |
| Marks & CGPA | `/marks` | — (S2 tiles) | AssessmentRow, PassPill, GradeInput, GpaHero, SemesterList, CgpaPlanner, GradeTargetPlanner (N8) | **derived (missing)** |
| Stats | `/stats` | S2 | SegmentedControl, BarChart, StreakCard | ref (S2 charts) |
| Settings/Profile | `/settings` | — | ThresholdEditor, GradeScaleEditor, ExportButton (N7), DeleteAccount, ThemeToggle (N10) | **derived (missing)** |
| Onboarding wizard | `/onboarding` | — (S2 cards) | StepSemester, StepSubjects, StepTimetable, StepThreshold, CsvImport | **derived (missing)** |
| Sign in / up / reset | `/sign-in` etc. | — | AuthForm, Field, SubmitButton | **derived (missing)** |
| Public attendance calc | `/attendance-calculator` | S2 hero | HoursInput (+/−), Line80Bar, ResultText | ref (matches sistmate) |
| Public GPA/CGPA calc | `/cgpa-calculator` | — | CourseRow, GradeSelect, GpaResult | derived |
| Install guide | `/install` | — | StepList, PlatformTabs | derived |
| Bottom navigation | (layout) | S2, S4 | BottomNav (≤5: Today, Attendance, Timetable, Marks, More) | ref |

## Shared components (build order for Phase 3/5)
1. **Primitives (ui/):** Button, Pill, Card (outlined), SegmentedControl, Sheet/Dialog, Field, Toggle, Meter.
2. **Feature (features/):** BigDate, DateStrip, NextClassCard, SubjectStatusCard, QuickMarkRow, BunkMeter, StatTile, SubjectRow, WeekGrid, MonthGrid, YearGrid, BarChart, GradeInput, CgpaPlanner.

## Style rules distilled from the references (revised S4/S3)
- **Background** white + faint lilac `bg`; **cards** are filled bento blocks or white `surface`, radius `lg` (28), **soft shadow, no outline**.
- **Bento tiles** (Today subjects, attendance): bright pastel fill, **dark ink text** + a deeper shade of the fill hue for the caption (all pass AA). Big numbers in Poppins.
- **Next-class hero**: lavender card, bold rounded title (S4 "Daily challenge").
- **Analytics**: rounded bars, dashed target line, segmented control as a pill group; green/orange/blue series.
- **Bottom nav**: **dark floating pill**, ≤5 items, icon + label, safe-area inset.
- **Accents by domain** (token): attendance = green, schedule = lavender, marks = orange, calendar = blue; hero = purple. Status: safe green-ink, warn amber-ink, risk red-ink (+ green/orange/peach fills).

## Responsive (no supplied tablet/desktop designs — derived, confirm Phase 7)
- **Mobile <640:** as designed, single column, bottom nav.
- **Tablet 640–1023:** two columns (Today + timetable); nav becomes a left rail in landscape.
- **Desktop ≥1024:** max-width 1200, left rail nav, year grid 4×3, attendance list+detail split.
