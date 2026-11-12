# Fidelity gate

- Source: https://taskgo-oly.webflow.io · Clone: http://localhost:3130
- Gate: fidelity >= 90%, meanAbsDiff <= 0.05, height drift <= 3% at 1440,768,390
- Result: 6/6 routes pass

| Route | 1440 | 768 | 390 | Pass |
|---|---|---|---|---|
| / | 97.91% (4.5) h0% | 98.98% (4.5) h0% | 98.42% (4.5) h0% | ✅ |
| /style-guide | 99.68% (5) h0% | 99.43% (5) h0% | 99.02% (5) h0% | ✅ |
| /license | 99.38% (5) h0% | 99.04% (5) h0% | 97.97% (4.5) h0% | ✅ |
| /changelog | 99.57% (5) h0% | 99.35% (5) h0% | 98.74% (4.5) h0% | ✅ |
| /401 | 99.54% (5) h0% | 99.34% (5) h0% | 98.75% (4.5) h0% | ✅ |
| /404 | 99.61% (5) h0% | 99.47% (5) h0% | 98.89% (4.5) h0% | ✅ |

Diff images: `<route>/screenshots/visual-diff-<width>.png`. Pixel ratio is lenient on mostly blank pages; always open the diff images.
