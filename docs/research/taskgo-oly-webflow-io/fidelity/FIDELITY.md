# Fidelity gate

- Source: https://taskgo-oly.webflow.io · Clone: http://localhost:3150
- Gate: fidelity >= 90%, meanAbsDiff <= 0.05, height drift <= 3% at 1440,768,390
- Result: 6/6 routes pass

| Route | 1440 | 768 | 390 | Pass |
|---|---|---|---|---|
| / | 93.2% (4) h0.7% | 98.89% (4.5) h0% | 98.31% (4.5) h0% | ✅ |
| /style-guide | 99.61% (5) h0% | 99.31% (5) h0% | 98.86% (4.5) h0% | ✅ |
| /license | 99.22% (5) h0% | 98.78% (4.5) h0% | 97.58% (4.5) h0% | ✅ |
| /changelog | 99.38% (5) h0% | 99.01% (5) h0% | 98.21% (4.5) h0% | ✅ |
| /401 | 99.32% (5) h0% | 99.01% (5) h0% | 98.27% (4.5) h0% | ✅ |
| /404 | 99.42% (5) h0% | 99.16% (5) h0% | 98.39% (4.5) h0% | ✅ |

Diff images: `<route>/screenshots/visual-diff-<width>.png`. Pixel ratio is lenient on mostly blank pages; always open the diff images.
