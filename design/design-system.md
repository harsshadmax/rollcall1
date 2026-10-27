# RollCall — Design System (Phase 2, revised direction)

> Revised 2026-10-27 at owner request toward the **S4/S3** look. Tokens: `tokens.json` → `styles/tokens.css`. Screens: `screen-map.md`. Open items: `gaps.md`. Preview: `design/preview.html`.

## Direction (revised)
**S4 soft-rounded bento + S3 bold rounded type & bright chips.** White background with a faint lilac tint; large-radius (28px) **filled bento cards** with **soft shadows** (no outlines); bright, friendly pastels; a **dark floating pill** bottom nav; bold rounded display type. Replaces the earlier S2 cream/outlined/flat direction.

## Colour (sampled from S3/S4, AA-validated)
| Token | Hex | Use |
|---|---|---|
| `bg` | #FAF9FE | page background (white + faint lilac) |
| `surface` | #FFFFFF | plain cards |
| `ink` / `ink-muted` | #141417 / #67676E | text (both pass AA) |
| `accent-attendance` | #B3F4A5 green | attendance tiles/series |
| `accent-schedule` | #CBB5F7 lavender | timetable / next-class hero |
| `accent-marks` | #F7B858 orange | marks/GPA |
| `accent-calendar` | #AACBFC blue | calendar/events |
| `accent-hero` | #ADA0F1 purple | big hero card |
| extra fills | pink #F2A7D3, peach #EF9D90, yellow #F5D655 | variety across bento |
| `status-safe/warn/risk` | #1E7A43 / #8A5A00 / #B23A22 | % text + meters, with green/orange/peach fills |
| `nav-surface` / `nav-ink` | #17171B / #FFFFFF | dark floating pill nav |

All text/fill pairs verified by `check_contrast.py` → **ALL PASS** (body ≥4.5, nav ≥4.5).

## Type
- **Display:** Poppins (SIL OFL) — bold rounded headings/heroes (the S3/S4 look).
- **Body:** Inter (SIL OFL). Scale 12/14/16/20/28/40/56.

## Shape, shadow & space
- Radii **12 / 20 / 28** / pill. **No borders** — depth comes from **soft shadows** (`--shadow-card`, `--shadow-nav`).
- Space 4/8/12/16/24/32. Gutter 16px. Floating nav ≈68px + safe-area.

## Rules of thumb
1. Card = `surface` or a bright fill, radius `lg` (28), soft shadow, **no outline**.
2. A pastel-filled tile uses **dark ink** text (a darker shade of its own hue for secondary text, e.g. green tile → deep-green caption). All combos pass AA.
3. Coloured numbers/meters use the dark `status-*` ink.
4. Domain colour is consistent: attendance = green, schedule = lavender, marks = orange, calendar = blue.
5. Big numbers/headings in Poppins; bottom nav is a dark floating pill.

## Playful layer (added 2026-10-27, owner request — "make it more fun" + S3 mood calendar)
- **Emoji attendance calendar:** each day is a rounded coloured tile with a face — 😄 present (green), 😟 absent (peach), 😴 cancelled (blue), ☀️ holiday (grey). Modelled on S3's Mood Calendar. Below it, a big-face **monthly summary** card ("84% · Looking good!") and 3 stat tiles (Present / Absent / Streak).
- **Faces as status everywhere:** quick-mark chips (😄/😟/😴) and per-subject rows carry the matching face, so status reads at a glance.
- **Star date-pills:** the timetable/date strip uses ★/☆ in the day pills (S4 "Move/Sync" look).
- **Pink accent** added (`raw.pink #F2A7D3`) for playful action buttons.
- Emoji are decorative glyphs layered on AA-passing colour tiles; colour is never the only signal (the face + the number carry it too), so accessibility holds.

## What changed from the first direction
cream→white+lilac · outlined flat cards→filled bento with soft shadows · larger radii (16→28) · angular Space Grotesk→rounded Poppins · light pill nav→dark floating pill. The S1 giant-date idea is now optional (kept only if you want it on the Calendar).

## Regenerate / validate
`python design/sample_colors.py` · `python design/check_contrast.py` · inline build script regenerates `styles/tokens.css` from `tokens.json`.
