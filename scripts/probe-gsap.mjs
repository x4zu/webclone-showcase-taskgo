import fs from "node:fs";
import { loadPlaywright, launchChromium } from "file:///C:/Users/habir/Documents/WebCloner/ai-website-cloner-template-master/skills/webclone/scripts/lib/playwright-loader.mjs";
const { chromium } = loadPlaywright();
const browser = await launchChromium(chromium);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("https://taskgo-oly.webflow.io/", { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(3000);
const data = await page.evaluate(() => {
  const d = (el) => (el && el.tagName ? `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${String(el.className).trim().split(/\s+/).slice(0, 3).join(".")}${el.getAttribute("data-w-id") ? `[w-id=${el.getAttribute("data-w-id")}]` : ""}` : String(el));
  const prim = (o) => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => ["string", "number", "boolean"].includes(typeof v)));
  const out = ScrollTrigger.getAll().map((st) => {
    const anim = st.animation;
    const kids = anim ? (anim.getChildren ? anim.getChildren(true, true, false) : [anim]) : [];
    return {
      trigger: d(st.trigger), start: st.vars.start, end: st.vars.end, scrub: st.vars.scrub, toggleActions: st.vars.toggleActions,
      animDuration: anim?.duration(),
      tweens: kids.map((t) => ({ start: t.startTime(), duration: t.duration(), ease: typeof t.vars.ease === "string" ? t.vars.ease : t.vars.ease ? "fn" : undefined, stagger: prim(t.vars.stagger), from: prim(t.vars.startAt), to: Object.fromEntries(Object.entries(prim(t.vars)).filter(([k]) => !["force3D", "immediateRender", "overwrite", "delay", "duration", "ease", "lazy"].includes(k))), targets: t.targets().length, first: d(t.targets()[0]), last: d(t.targets()[t.targets().length - 1]) })),
    };
  });
  const letters = [...document.querySelectorAll(".gsap_split_letter")];
  const parents = new Map();
  for (const l of letters) { const h = l.closest("h1,h2,h3,h4,p,div[class*=heading]"); parents.set(h, (parents.get(h) || 0) + 1); }
  const sample = letters.slice(0, 6).map((l) => ({ cls: l.className, text: l.textContent, parentCls: l.parentElement.className, style: l.getAttribute("style") }));
  const heads = [...parents.entries()].map(([h, n]) => ({ h: d(h), n, text: h.textContent.slice(0, 50) }));
  return { triggers: out, letterCount: letters.length, sample, heads, splitWords: document.querySelectorAll("[class*=gsap_split_word],[class*=split-word]").length, splitLines: document.querySelectorAll("[class*=gsap_split_line]").length };
});
fs.writeFileSync("docs/research/taskgo-oly-webflow-io/recon/motion/gsap-triggers.json", JSON.stringify(data, null, 1));
console.log(JSON.stringify(data.triggers.map((t) => ({ trigger: t.trigger, start: t.start, end: t.end, scrub: t.scrub, tw: t.tweens.map((w) => `${w.start}+${w.duration} ${w.ease} n${w.targets} from${JSON.stringify(w.from)} to${JSON.stringify(w.to)} stagger${JSON.stringify(w.stagger)} ${w.first}`) })), null, 1).slice(0, 6000));
console.log("letters", data.letterCount, data.splitWords, data.splitLines, JSON.stringify(data.sample).slice(0, 600));
console.log(JSON.stringify(data.heads).slice(0, 1500));
await browser.close();
