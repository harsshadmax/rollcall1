# RollCall — Design gaps & open items (Phase 2)

> Tracks screens with no supplied reference, assets to source, and decisions to make. New screenshots you send get added to `screen-map.md` and removed from here.

## Screens with no reference (to be designed, then confirmed in Phase 7)
| Screen | Why it matters | Plan |
|---|---|---|
| Timetable **week grid** | Core P0 view; S1 only shows the day list | Derive from S1's type + S2 outline; frozen day headers, horizontal scroll |
| **Marks & CGPA** | P1 core | Use S2 outlined cards + tiles; grade chips in accent-marks |
| **Settings** | account, threshold, grade scale, export, theme | Plain outlined list rows |
| **Onboarding wizard** | first-run setup (subjects, timetable) | Stepper on S2 cards |
| **Auth** (sign in/up/reset) | entry | Minimal centered S2 card |
| **Empty / loading / error** states | every list | Define a standard pattern in Phase 3 |
| **Dark mode** (N10) | no dark reference | Derive: ink bg, cream text; re-run contrast for dark pairs |

## Assets to source (licence recorded before shipping — checklist §24)
- **Icons:** an open-licensed set (candidate: Lucide, ISC) for nav + actions. **Do not** reuse the screenshots' icons.
- **Illustrations:** optional empty-state art — own or openly licensed only. **Not** the S3/S4 artwork.
- **Fonts:** Space Grotesk + Inter, both SIL OFL — confirm the OFL files ship in `/public` or via a self-hosted/next-font route.

## Decisions settled this phase
- Primary style = S2 base + S1 dates/blocks (Q5). ✅
- Palette sampled from references; semantic tokens pass WCAG AA (`check_contrast.py`, all pass). ✅
- Practical attendance default 100% (owner). Shown as "can't miss any", not a negative. ✅

## Decisions still open (non-blocking for Phase 3)
- **D1:** Bottom nav 5th slot — "More" menu vs. put Stats there. (Lean: More → Stats/Settings/Calendar.)
- **D2:** Exact fonts — confirm Space Grotesk reads well at the 72px date size, else try Clash Display/Bricolage Grotesque (also OFL).
- **D3:** Whether the public calculators share the app shell or get a lighter standalone layout.

## Licensing / IP guardrails (from blueprint R2)
- S1 (uiux.aditya) and S4 (ronasit.com) are **credited third-party designs**. We reproduce **layout and token style only**, with our own content, icons and illustrations. No artwork, avatars, 3D renders or logos are copied. Recorded for the §24 pre-deploy check.
