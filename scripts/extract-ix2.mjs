// Extract the Webflow IX2 interaction data (events + actionLists) from the captured webflow.js.
// The data is a JS object literal; it is evaluated in an empty vm context with a timeout.
import fs from "node:fs";
import vm from "node:vm";
const dir = "docs/research/taskgo-oly-webflow-io/source";
const file = fs.readdirSync(dir).find((f) => f.startsWith("wf-webflow.") && fs.readFileSync(`${dir}/${f}`, "utf8").includes('events:{"e-'));
const s = fs.readFileSync(`${dir}/${file}`, "utf8");
const k = s.indexOf('events:{"e-');
const i = s.lastIndexOf("{", k);
let depth = 0;
let j = i;
for (; j < s.length; j++) {
  const c = s[j];
  if (c === '"') {
    j++;
    while (s[j] !== '"') {
      if (s[j] === "\\") j++;
      j++;
    }
    continue;
  }
  if (c === "{") depth++;
  else if (c === "}") {
    depth--;
    if (!depth) break;
  }
}
const ix = vm.runInNewContext(`(${s.slice(i, j + 1)})`, Object.create(null), { timeout: 1000 });
fs.writeFileSync(`${dir}/ix2.json`, JSON.stringify(ix, null, 1));
const events = Object.values(ix.events);
const types = {};
for (const e of events) types[e.eventTypeId] = (types[e.eventTypeId] || 0) + 1;
console.log("events", events.length, types);
for (const [id, al] of Object.entries(ix.actionLists)) {
  console.log(id, "|", al.title, "| initialGroup:", Boolean(al.useFirstGroupAsInitialState));
  for (const g of al.actionItemGroups || (al.continuousParameterGroups || []).flatMap((p) => p.continuousActionGroups.map((cg) => ({ actionItems: cg.actionItems.map((a) => ({ ...a, config: { ...a.config, delay: `kf${cg.keyframe}` } })) })))) {
    console.log("   ", g.actionItems.map((a) => {
      const c = a.config;
      const v = Object.fromEntries(Object.entries(c).filter(([key]) => /Value$|Unit$|^value$|filters|^rValue/.test(key)));
      return `${a.actionTypeId.replace("TRANSFORM_", "")} ${c.duration || 0}ms+${c.delay || 0} ${c.easing || "-"} ${JSON.stringify(v)} sel=${c.target?.selector || c.target?.useEventTarget || ""}`;
    }).join(" || ").slice(0, 500));
  }
}
for (const e of events) console.log(e.id, e.eventTypeId, e.action?.config?.actionListId, JSON.stringify(e.target?.selector || e.target?.id || "").slice(0, 80), JSON.stringify(e.config?.[0] || e.config || {}).slice(0, 120));
