// Download asset URLs the browser never requested (srcset variants etc.) and record them in a manifest.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const SITE = "taskgo-oly-webflow-io";
const R = `docs/research/${SITE}/recon`;
const urls = JSON.parse(fs.readFileSync(`${R}/missing-assets.json`, "utf8"));
const assets = [];
for (const url of urls) {
  const u = new URL(url);
  const base = decodeURIComponent(path.basename(u.pathname)).replace(/[^a-zA-Z0-9._-]+/g, "-");
  const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 10);
  const rel = path.join("images", u.hostname, `${base.replace(/(\.[a-z0-9]+)$/i, `-${hash}$1`)}`);
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 Chrome/130", referer: "https://taskgo-oly.webflow.io/" } });
  if (!res.ok) { assets.push({ url, status: "error", error: `HTTP ${res.status}` }); continue; }
  const dest = path.join("public/sites", SITE, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  assets.push({ url, kind: "image", via: "direct", status: "ok", localPath: rel.split(path.sep).join("/") });
}
fs.writeFileSync(`${R}/asset-manifest-srcset.json`, JSON.stringify({ assets }, null, 2));
console.log(`${assets.filter((a) => a.status === "ok").length}/${urls.length} downloaded`);
