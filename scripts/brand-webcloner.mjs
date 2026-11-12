// Rebrand the visible "TaskGo" marks of the clone to "WebCloner" so screenshots of the clone are
// distinguishable from the source. Keeps each logo's canvas size (CSS fixes their width), keeps the
// original icon paths, and replaces the wordmark paths with "WebCloner" set in the site's own
// Inter Tight 600 (embedded in the SVG, since <img> SVGs cannot use page fonts).
// Usage: node scripts/brand-webcloner.mjs
import fs from "node:fs";
import path from "node:path";

const SITE = "taskgo-oly-webflow-io";
const IMG = `public/sites/${SITE}/images/cdn.prod.website-files.com`;
const OUT_DIR = `public/sites/${SITE}/webcloner`;
const font = fs.readFileSync(`public/sites/${SITE}/fonts/fonts.gstatic.com/NGSnv5HMAFg6IuGlBNMjxJEL2VmU3NS7Z2mj0QiaWy5X-bfbebb311d.ttf`).toString("base64");

const LOGOS = [
  // file, icon/text split on the path's first x, wordmark start x, baseline y, cap height
  { file: "695c8defd2d1925285937c97_Frame-209-e787dfe573.svg", out: "webcloner-logo-nav.svg" },
  { file: "695e4369ebbba91ab0ed8bb8_Frame-2055-3c4d4565c5.svg", out: "webcloner-logo-footer.svg" },
  { file: "696cf4b5e9833d99ee28dae7_625443c1a98275c71d382d31635332d4_TaskGo-c205bd22b1.svg", out: "webcloner-wordmark.svg" },
];

for (const logo of LOGOS) {
  const svg = fs.readFileSync(path.join(IMG, logo.file), "utf8");
  const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
  const scale = w / 168; // the large wordmark is the same lockup at a bigger size
  const paths = [...svg.matchAll(/<path\b[^>]*\/>/g)].map((m) => m[0]);
  const firstX = (p) => Number((p.match(/d="M\s*([\d.]+)/) || [])[1] ?? 0);
  const icon = paths.filter((p) => firstX(p) < 62 * scale);
  const textPath = paths.find((p) => firstX(p) >= 62 * scale);
  const textFill = (textPath?.match(/fill="([^"]+)"/) || [])[1] ?? "#0D062D";
  const defs = (svg.match(/<defs>[\s\S]*<\/defs>/) || [""])[0];
  // Icon at 78% so the longer wordmark fits the fixed width; vertically centred.
  const k = 0.78;
  const iconTransform = `translate(0 ${((h * (1 - k)) / 2).toFixed(2)}) scale(${k})`;
  const textX = 53 * scale;
  const textW = w - textX - 1 * scale;
  const fontSize = 24 * scale;
  const baseline = h / 2 + fontSize * 0.36;
  const out = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
<style>@font-face{font-family:"WC Inter Tight";font-weight:600;src:url(data:font/ttf;base64,${font}) format("truetype");}</style>
<g transform="${iconTransform}">
${icon.join("\n")}
</g>
<text x="${textX.toFixed(2)}" y="${baseline.toFixed(2)}" textLength="${textW.toFixed(2)}" lengthAdjust="spacingAndGlyphs" font-family="'WC Inter Tight', 'Inter Tight', sans-serif" font-weight="600" font-size="${fontSize.toFixed(2)}" letter-spacing="${(-0.5 * scale).toFixed(2)}" fill="${textFill}">WebCloner</text>
${defs}
</svg>
`;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, logo.out), out);
  console.log(logo.out, `${w}x${h}`, `icon paths ${icon.length}`, `text fill ${textFill}`);
}

// Point the components at the rebranded logos and replace the visible brand name in copy.
const C = `src/components/sites/${SITE}`;
const files = [`${C}/Navbar.tsx`, `${C}/Footer.tsx`, `${C}/pages/PasswordPage.tsx`, `${C}/sections/Integrations.tsx`, `${C}/sections/Choose.tsx`];
let changed = 0;
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const before = s;
  for (const logo of LOGOS) s = s.split(`/sites/${SITE}/images/cdn.prod.website-files.com/${logo.file}`).join(`/sites/${SITE}/webcloner/${logo.out}`);
  s = s.replace(/Why Teams Choose TaskGo/g, "Why Teams Choose WebCloner");
  if (s !== before) {
    fs.writeFileSync(f, s);
    changed++;
  }
}
console.log(`components updated: ${changed}`);
