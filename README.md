# RollCall

Attendance, sorted. A mobile-first PWA for Sathyabama students: track your classes by hand, see how many you can skip or must attend to hold 80% (100% for labs), and your GPA/CGPA on the official scale.

**Manual entry only — no ERP connection, no scraping, no credentials.**

## Dev

```bash
npm install
npm run dev        # http://localhost:3000  → /today
npm run test       # domain unit tests (vitest)
npm run lint && npm run typecheck && npm run build
```

## Layout

- `app/` — Next.js App Router. `(app)/` holds the signed-in pages behind the bottom nav.
- `components/` — `ui/` primitives, `features/` app components (BottomNav, Face, …).
- `lib/domain/` — pure attendance/GPA logic, tested against `__vectors__.json`.
- `styles/tokens.css` — design tokens (generated from `design/tokens.json`).
- `design/` — tokens, references, screen map, the full-frontend mockup (`prototype.html`).
- `docs/` — spec, Sathyabama rules, formulas, ADRs.

Plan: `../blueprint.md`. Rules for contributors/agents: `CLAUDE.md`.

## Status

Phase 3 (scaffold) complete. Today screen is live from sample data; other tabs are placeholders. Phase 4 adds Supabase auth + the database.
