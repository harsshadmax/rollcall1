# RollCall — project rules for Claude Code

RollCall is a mobile-first PWA for Sathyabama students: manual attendance tracking with skip/attend projections, timetable, marks and GPA/CGPA. Full plan in `../blueprint.md`; spec in `docs/spec.md`.

## Hard rules
- **No ERP/LMS integration, no scraping, no CAPTCHA bypass, no university credentials.** All data is student-entered or CSV-imported. This is non-negotiable (it's what makes the app legal to run).
- **No copied design assets.** The UI style is inspired by supplied references but all artwork (icons, faces, illustrations) is original or openly licensed. Don't reproduce third-party app artwork or characters.
- Secrets only in env vars; `.env*` is git-ignored. Never put `service_role` keys in `app/` runtime.

## Stack
- Next.js (App Router) + TypeScript strict, React 19.
- Tailwind v4 (CSS-first) + design tokens in `styles/tokens.css` (generated from `design/tokens.json`).
- Supabase (auth + Postgres with RLS) — added in Phase 4.
- Zod for validation, date-fns for dates. Vitest (unit) + Playwright (e2e, later).

## Conventions
- Pure domain logic in `lib/domain/*` with tests against `lib/domain/__vectors__.json`. Never store derived values (%, GPA) — compute them.
- Attendance thresholds are per class kind: theory 80%, practical 100% (Sathyabama rule, editable). See `docs/sathyabama-rules.md`.
- Design system: S4/S3 look — white bg, rounded bento cards, soft shadows, dark floating nav, Poppins display / Inter body, emoji-style faces for attendance. See `design/design-system.md`.
- Keep colour never the only signal (faces + numbers carry status) for accessibility.

## Commands
- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm run test`
- Regenerate tokens: edit `design/tokens.json`, then the generator in `design/` → `styles/tokens.css`; validate with `python design/check_contrast.py`.

## Current phase
Phase 4 done (local): Supabase schema + RLS + auth working on local Docker. Run `npx supabase start` then `npm run dev`; keys in `.env.local`. A cloud project is still needed before real users. Next: Phase 5 — wire Today/Attendance to real data (subjects, timetable, session generation, live %).
