# taskgo-oly.webflow.io clone notes

## Source
- Source URL: https://taskgo-oly.webflow.io/
- Built with: Webflow (IX2 interactions + IX3/GSAP 3.15 with SplitText and ScrollTrigger)
- Author: Olynex (template). Images: Freepik. Icons: Flaticon. Font: Inter Tight (Google Fonts, OFL).
- License: commercial Webflow template. This clone is a local showcase, not a redistribution.

## Assessment
- Complexity: L4 (animation-heavy brand site), 6 routes
- Mode: faithful
- Approach: Webflow markup converted to React components (`scripts/webflow-to-jsx.mjs`), Webflow stylesheet kept with local asset URLs, interactions rebuilt in `SiteRuntime.tsx`:
  - IX2: interpreter replaying `ix2-data.json` (216 events: scroll into view, scroll progress, click/second click, hover, tab active/inactive)
  - IX3: GSAP + ScrollTrigger + SplitText with the exported values (`source/ix3.json`)
  - Webflow components: mobile nav overlay, tabs, forms (local success state)

## Route map
| Source | Local |
|---|---|
| / | src/app/page.tsx (sections in src/components/sites/taskgo-oly-webflow-io/sections/) |
| /style-guide | src/app/style-guide/page.tsx |
| /license | src/app/license/page.tsx |
| /changelog | src/app/changelog/page.tsx |
| /401 | src/app/401/page.tsx |
| /404 | src/app/not-found.tsx |

## Fidelity (fidelity/FIDELITY.md)
| Route | 1440 | 768 | 390 | Height |
|---|---|---|---|---|
| / | 97.91% | 98.98% | 98.42% | identical |
| /style-guide | 99.68% | 99.43% | 99.02% | identical |
| /license | 99.38% | 99.04% | 97.97% | identical |
| /changelog | 99.57% | 99.35% | 98.74% | identical |
| /401 | 99.54% | 99.34% | 98.75% | identical |
| /404 | 99.61% | 99.47% | 98.89% | identical |

Home at 11 scroll positions (viewport shots): 97.89-99.69%. Interactions with real input: pricing Yearly toggle 94.61% (4px scroll offset, same content), FAQ open 99.45%, mobile menu 99.30%.

## Checks
- `npm run check`: lint + typecheck + build pass, 0 warnings
- `audit-clone --strict`: no fidelity defects, no tracking scripts

## Known gaps
- Hero load animation duration/ease are not in the IX3 export; GSAP defaults (0.5s, power1.out) are used. Estimate.
- 12 IX2 continuous action items have an empty target in the export (Team Scroll, Text Color Change); Webflow skips them too, so they are no-ops here.
- Scroll-scrubbed review cards can differ by a sub-pixel skew/scale at a given instant (smoothing), visible only in diff images.
- Forms do not submit anywhere; they show Webflow's success state locally.
- /404 is served by Next.js `not-found` (status 404), while the source returns 200 for /404.

## Replace before deploying
Logo, product name "TaskGo", copy, photography, icons, and testimonials belong to the template author and asset owners.

## Run
npm run dev (or npm run build && node .next/standalone/server.js)
