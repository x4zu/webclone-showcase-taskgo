// Extract Webflow IX3 (GSAP interactions) registration data: a.register(interactions, timelines).
import fs from "node:fs";
import vm from "node:vm";
const dir = "docs/research/taskgo-oly-webflow-io/source";
const file = fs.readdirSync(dir).find((f) => f.startsWith("wf-webflow.") && fs.readFileSync(`${dir}/${f}`, "utf8").includes("a.register(["));
const s = fs.readFileSync(`${dir}/${file}`, "utf8");
const i = s.indexOf("a.register(") + "a.register".length;
let depth = 0;
let j = i;
for (; j < s.length; j++) {
  const c = s[j];
  if (c === '"' || c === "'") {
    const q = c;
    j++;
    while (s[j] !== q) {
      if (s[j] === "\\") j++;
      j++;
    }
    continue;
  }
  if (c === "(" || c === "[" || c === "{") depth++;
  else if (c === ")" || c === "]" || c === "}") {
    depth--;
    if (!depth) break;
  }
}
const args = vm.runInNewContext(`[${s.slice(i + 1, j)}]`, Object.create(null), { timeout: 1000 });
const [interactions, timelines] = args;
fs.writeFileSync(`${dir}/ix3.json`, JSON.stringify({ interactions, timelines }, null, 1));
const tl = Object.fromEntries(timelines.map((t) => [t.id, t]));
for (const it of interactions) {
  console.log(it.id, JSON.stringify(it.triggers).slice(0, 260));
  for (const id of it.timelineIds) for (const a of tl[id]?.actions || []) console.log("   ", JSON.stringify({ targets: a.targets, timing: a.timing, tt: a.tt, properties: a.properties, splitText: a.splitText }).slice(0, 420));
}
