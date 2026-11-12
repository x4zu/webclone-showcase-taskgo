<div align="center">

# WebCloner Showcase: TaskGo

**A full-site clone of [taskgo-oly.webflow.io](https://taskgo-oly.webflow.io/), produced with [WebCloner](https://github.com/x4zu/WebCloner) by [Reivan Elsyafir Pratama](https://www.x2zu.net/)**

Next.js 16 · React 19 · TypeScript · GSAP · measured against the live site

</div>

---

This repository is the proof: the complete output of `/webclone-full https://taskgo-oly.webflow.io/`, plus the evidence used to verify it. Every route of the Webflow site is rebuilt as editable React components, and the site's interactions run again from their own exported data.

## Measured fidelity

Full-page pixel fidelity of the clone against the live site, same viewport, from `fidelity-gate.mjs` (gate: ≥ 90% and page height within 3%).

| Route | 1440px | 768px | 390px | Page height |
|---|---|---|---|---|
| `/` | 97.91% | 98.98% | 98.42% | identical |
| `/style-guide` | 99.68% | 99.43% | 99.02% | identical |
| `/license` | 99.38% | 99.04% | 97.97% | identical |
| `/changelog` | 99.57% | 99.35% | 98.74% | identical |
| `/401` | 99.54% | 99.34% | 98.75% | identical |
| `/404` | 99.61% | 99.47% | 98.89% | identical |

Also verified:

- Home page at 11 scroll positions: 97.89-99.69%.
- Interactions driven with real clicks/taps: mobile menu 99.30%, FAQ accordion 99.45%, pricing Monthly/Yearly toggle (same content, 4px scroll offset).
- `npm run check` (lint + typecheck + build): pass, 0 warnings.
- `audit-clone --strict`: no font, image, or color defects; no tracking scripts.
- Browser console on every route: 0 errors.

Evidence: [`docs/research/taskgo-oly-webflow-io/fidelity/FIDELITY.md`](docs/research/taskgo-oly-webflow-io/fidelity/FIDELITY.md) (with source, clone, and diff screenshots per route and width), [`NOTES.md`](docs/research/taskgo-oly-webflow-io/NOTES.md), [`CLONE_AUDIT.md`](CLONE_AUDIT.md).

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Production: `npm run build && node .next/standalone/server.js`.

## How it was built

| Layer | Implementation |
|---|---|
| Markup | Webflow HTML converted to React components, one file per section ([`scripts/webflow-to-jsx.mjs`](scripts/webflow-to-jsx.mjs) → [`src/components/sites/taskgo-oly-webflow-io/`](src/components/sites/taskgo-oly-webflow-io/)) |
| Styles | The site's stylesheet with every asset URL rewritten to local files; Tailwind without preflight |
| Fonts & images | Self-hosted Inter Tight and all images, harvested from what the browser actually loaded (`public/sites/taskgo-oly-webflow-io/`) |
| IX2 interactions | A small interpreter ([`SiteRuntime.tsx`](src/components/sites/taskgo-oly-webflow-io/SiteRuntime.tsx)) replaying the 216 exported events: scroll reveals, scroll-progress animations, logo marquee, FAQ accordion, hover effects, tab states |
| IX3 / GSAP | Split-letter headings, scroll-scrubbed step cards and review rows, rebuilt with GSAP + ScrollTrigger + SplitText from the registered values |
| Components | Mobile nav overlay, tabs, forms (local success state) |

Routes: `src/app/page.tsx`, `style-guide/`, `license/`, `changelog/`, `401/`, and `not-found.tsx` for `/404`.

## Known gaps

- The hero load animation's duration/ease are not in the export; GSAP defaults (0.5s, power1.out) are used.
- Forms show the success state locally; nothing is sent.
- `/404` returns status 404 here (the source returns 200 with the same page).

## Ownership

This is a technical demonstration of WebCloner. The TaskGo template, its design, copy, and layout belong to **Olynex**; images are from **Freepik** and icons from **Flaticon** under their respective licenses; Inter Tight is under the SIL Open Font License. No rights to the template are granted by this repository. Do not use this code as a substitute for purchasing the template, and replace all branding, copy, and media before any real use. Owners who want this repository removed can open an issue.

The conversion scripts and runtime code written for this clone are by [Reivan Elsyafir Pratama](https://www.x2zu.net/).
