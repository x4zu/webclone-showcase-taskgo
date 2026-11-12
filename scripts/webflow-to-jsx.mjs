// Convert the captured Webflow HTML pages into editable React components.
// Usage: node scripts/webflow-to-jsx.mjs
// Reads docs/research/<site>/source/*.html + asset manifests, writes src/components/sites/<site>/**.
import fs from "node:fs";
import path from "node:path";
import { parseDocument, DomUtils } from "htmlparser2";

const SITE = "taskgo-oly-webflow-io";
const ORIGIN = "https://taskgo-oly.webflow.io";
const R = `docs/research/${SITE}`;
const OUT = `src/components/sites/${SITE}`;
const PUBLIC_BASE = `/sites/${SITE}/`;

// originalUrl -> local public path, from every asset manifest
const urlMap = new Map();
for (const file of fs.readdirSync(`${R}/recon`).filter((f) => f.startsWith("asset-manifest"))) {
  const manifest = JSON.parse(fs.readFileSync(`${R}/recon/${file}`, "utf8"));
  for (const a of manifest.assets || []) if (a.status === "ok" && a.localPath) urlMap.set(a.url, PUBLIC_BASE + a.localPath.split(path.sep).join("/"));
}
const missing = new Set();
const mapUrl = (raw) => {
  if (!raw) return raw;
  const value = raw.trim();
  if (value.startsWith("data:") || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("tel:")) return value;
  let abs;
  try {
    abs = new URL(value, `${ORIGIN}/`).href;
  } catch {
    return value;
  }
  if (urlMap.has(abs)) return urlMap.get(abs);
  const decoded = decodeURI(abs);
  for (const [k, v] of urlMap) if (decodeURI(k) === decoded) return v;
  if (abs.startsWith(`${ORIGIN}/`) || abs === ORIGIN) {
    const u = new URL(abs);
    return `${u.pathname}${u.search}${u.hash}`;
  }
  if (/website-files\.com/.test(abs)) missing.add(abs);
  return value;
};
const mapSrcset = (v) => v.split(",").map((part) => {
  const [u, ...rest] = part.trim().split(/\s+/);
  return [mapUrl(u), ...rest].join(" ");
}).join(", ");
const mapCssUrls = (css) => css.replace(/url\((['"]?)([^'")]+)\1\)/g, (_m, q, u) => `url(${q}${mapUrl(u)}${q})`);

const ATTR = {
  class: "className", for: "htmlFor", tabindex: "tabIndex", srcset: "srcSet", crossorigin: "crossOrigin",
  autocomplete: "autoComplete", maxlength: "maxLength", readonly: "readOnly", colspan: "colSpan", rowspan: "rowSpan",
  allowfullscreen: "allowFullScreen", frameborder: "frameBorder", enctype: "encType", "accept-charset": "acceptCharset",
  "xlink:href": "xlinkHref", "xml:space": "xmlSpace", "xmlns:xlink": "xmlnsXlink", value: "defaultValue", checked: "defaultChecked",
  novalidate: "noValidate", autoplay: "autoPlay", playsinline: "playsInline", srcdoc: "srcDoc", datetime: "dateTime",
  referrerpolicy: "referrerPolicy", loading: "loading", sizes: "sizes", autofocus: "autoFocus", inputmode: "inputMode", spellcheck: "spellCheck", fetchpriority: "fetchPriority",
};
const BOOL = new Set(["autoFocus", "allowFullScreen", "autoPlay", "playsInline", "readOnly", "defaultChecked", "noValidate", "disabled", "required", "muted", "loop", "controls", "multiple", "hidden"]);
// Plain (non-hyphenated) attributes React's DOM types know. Anything else is emitted as a spread.
const KNOWN = new Set(["id", "href", "src", "alt", "title", "role", "type", "name", "method", "action", "target", "rel", "width", "height", "sizes", "loading", "placeholder", "required", "disabled", "lang", "dir", "hidden", "download", "media", "async", "defer", "accept", "multiple", "muted", "loop", "controls", "poster", "preload", "label", "selected", "wrap", "rows", "cols", "min", "max", "step", "pattern", "form", "list", "span", "start", "reversed", "cite", "content", "charset", "headers", "scope", "summary", "shape", "coords", "usemap", "decoding", "fetchpriority", "integrity", "nonce", "draggable", "spellcheck", "translate", "inputmode", "enterkeyhint", "autofocus", "viewBox", "xmlns", "fill", "stroke", "d", "x", "y", "x1", "x2", "y1", "y2", "cx", "cy", "r", "rx", "ry", "points", "transform", "opacity", "offset", "version", "preserveAspectRatio", "gradientUnits", "gradientTransform", "patternUnits", "filterUnits", "maskUnits", "result", "in", "in2", "stdDeviation", "values", "mode", "operator", "k1", "k2", "k3", "k4", "dx", "dy", "radius", "mask", "filter", "style", "class", "for"]);
const VOID = new Set(["img", "br", "hr", "input", "meta", "link", "source", "area", "col", "embed", "track", "wbr"]);
const camel = (s) => s.replace(/-([a-z])/g, (_m, c) => c.toUpperCase());
// Hyphenated SVG presentation attributes React expects in camelCase. Other hyphenated
// attributes (custom data like split-text, fs-*) pass through unchanged.
const SVG_ATTRS = new Set(["stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-dasharray", "stroke-dashoffset", "stroke-opacity", "fill-rule", "fill-opacity", "clip-rule", "clip-path", "stop-color", "stop-opacity", "font-family", "font-size", "font-weight", "font-style", "text-anchor", "dominant-baseline", "color-interpolation-filters", "color-interpolation", "flood-color", "flood-opacity", "letter-spacing", "mask-type", "shape-rendering", "vector-effect", "enable-background", "alignment-baseline", "baseline-shift", "image-rendering", "paint-order", "pointer-events", "writing-mode", "text-decoration", "word-spacing", "lighting-color", "marker-start", "marker-mid", "marker-end", "text-rendering", "overline-position", "underline-position"]);

function styleObject(css) {
  const entries = css.split(";").map((d) => d.trim()).filter(Boolean).map((d) => {
    const i = d.indexOf(":");
    const prop = d.slice(0, i).trim();
    const val = mapCssUrls(d.slice(i + 1).trim());
    const vendor = prop.match(/^-(webkit|moz|ms|o)-(.+)$/);
    const key = prop.startsWith("--") ? JSON.stringify(prop) : vendor ? (vendor[1] === "ms" ? "ms" : vendor[1][0].toUpperCase() + vendor[1].slice(1)) + camel("-" + vendor[2]) : camel(prop);
    return `${key}: ${JSON.stringify(val)}`;
  });
  return `{{ ${entries.join(", ")} }}`;
}

function attrs(el) {
  const out = [];
  for (let [name, value] of Object.entries(el.attribs)) {
    if (name === "style") {
      if (value.trim()) out.push(`style=${styleObject(value)}`);
      continue;
    }
    if (["src", "href", "poster", "action"].includes(name)) value = mapUrl(value);
    if (name === "srcset") value = mapSrcset(value);
    let key = ATTR[name] || name;
    if (!ATTR[name] && SVG_ATTRS.has(name)) key = camel(name);
    if (el.name === "textarea" && name === "value") key = "defaultValue";
    if (BOOL.has(key) && (value === "" || value === "true" || value === key || value === name)) {
      out.push(key);
      continue;
    }
    if (["maxLength", "tabIndex", "colSpan", "rowSpan"].includes(key) && /^-?\d+$/.test(value)) {
      out.push(`${key}={${value}}`);
      continue;
    }
    // Custom attributes without a hyphen (Webflow IX3 uses data="..." and Section="...") are not in
    // React's DOM types; spread them so they still render verbatim and selectors keep matching.
    if (!ATTR[name] && !name.includes("-") && !KNOWN.has(name)) {
      out.push(`{...{ ${JSON.stringify(name.toLowerCase())}: ${JSON.stringify(value)} }}`);
      continue;
    }
    // JSX string attributes cannot hold backslash escapes: use an expression when the value has quotes.
    out.push(/["\\]/.test(value) ? `${key}={${JSON.stringify(value)}}` : `${key}="${value}"`);
  }
  return out.length ? ` ${out.join(" ")}` : "";
}

function text(t) {
  if (!t) return "";
  if (/^\s+$/.test(t)) return t.includes("\n") ? "" : "{\" \"}";
  if (/[{}<>'"]/.test(t) || /^\s|\s$/.test(t) || t.includes("\n")) return `{${JSON.stringify(t)}}`;
  return t;
}

function jsx(node, depth = 0) {
  const pad = "  ".repeat(depth);
  if (node.type === "text") {
    const t = text(node.data);
    return t ? `${pad}${t}` : "";
  }
  if (node.type !== "tag" && node.type !== "script" && node.type !== "style") return "";
  if (node.name === "script" || node.name === "noscript") return "";
  if (node.name === "style") return `${pad}<style>{${JSON.stringify(DomUtils.getText(node))}}</style>`;
  if ((node.attribs.class || "").includes("w-webflow-badge")) return "";
  // Internal page links use next/link (client navigation); hashes, mail, assets and external links stay <a>.
  const href = node.name === "a" ? mapUrl(node.attribs.href || "") : "";
  const tag = node.name === "a" && href.startsWith("/") && !href.startsWith("//") && !href.startsWith(PUBLIC_BASE) ? "Link" : node.name;
  if (tag === "Link") usesLink = true;
  const open = `${pad}<${tag}${attrs(node)}`;
  if (VOID.has(node.name)) return `${open} />`;
  if (node.name === "textarea") return `${open} />`;
  const kids = node.children.map((c) => jsx(c, depth + 1)).filter(Boolean);
  if (!kids.length) return `${open}></${tag}>`;
  return `${open}>\n${kids.join("\n")}\n${pad}</${tag}>`;
}

const pascal = (s) => s.replace(/(^|[^a-zA-Z0-9]+)([a-zA-Z0-9])/g, (_m, _s, c) => c.toUpperCase()).replace(/^[0-9]/, "S$&");

let usesLink = false;
function component(name, nodes) {
  usesLink = false;
  const body = nodes.map((n) => jsx(n, 2)).filter(Boolean).join("\n");
  return `${usesLink ? 'import Link from "next/link";\n' : ""}// Generated from the captured Webflow markup by scripts/webflow-to-jsx.mjs, then edited by hand where noted.\n/* eslint-disable @next/next/no-img-element */\nexport function ${name}() {\n  return (\n    <>\n${body}\n    </>\n  );\n}\n`;
}

function load(file) {
  const doc = parseDocument(fs.readFileSync(file, "utf8"), { lowerCaseAttributeNames: false, recognizeSelfClosing: true });
  return DomUtils.findOne((e) => e.name === "body", doc.children, true);
}

fs.mkdirSync(`${OUT}/sections`, { recursive: true });
fs.mkdirSync(`${OUT}/pages`, { recursive: true });
const SECTION_NAMES = ["Hero", "Features", "Choose", "Steps", "Testimonials", "Pricing", "Integrations", "Faq", "Cta"];

// Home: split into Navbar, sections, Footer
const homeBody = load(`${R}/source/index.html`);
const wrapper = homeBody.children.find((n) => n.type === "tag" && (n.attribs.class || "").includes("page-wraper"));
const parts = wrapper.children.filter((n) => n.type === "tag" && n.name !== "script");
const nav = parts.find((n) => (n.attribs.class || "").includes("navbar"));
const footer = parts.find((n) => n.name === "footer");
fs.writeFileSync(`${OUT}/Navbar.tsx`, component("Navbar", [nav]));
fs.writeFileSync(`${OUT}/Footer.tsx`, component("Footer", [footer]));
const sections = parts.filter((n) => n !== nav && n !== footer);
const imports = [];
sections.forEach((s, i) => {
  const name = SECTION_NAMES[i] || `Section${i + 1}`;
  fs.writeFileSync(`${OUT}/sections/${name}.tsx`, component(name, [s]));
  imports.push(name);
});
fs.writeFileSync(`${OUT}/pages/HomePage.tsx`, `${imports.map((n) => `import { ${n} } from "../sections/${n}";`).join("\n")}\n\nexport function HomePage() {\n  return (\n    <>\n${imports.map((n) => `      <${n} />`).join("\n")}\n    </>\n  );\n}\n`);

// Other pages: everything between navbar and footer (or the whole body when there is no wrapper)
for (const page of ["style-guide", "license", "changelog", "404", "401"]) {
  const body = load(`${R}/source/${page}.html`);
  const wrap = body.children.find((n) => n.type === "tag" && (n.attribs.class || "").includes("page-wraper")) || body;
  const kids = wrap.children.filter((n) => n.type === "tag" && n.name !== "script");
  const hasNav = kids.some((n) => (n.attribs.class || "").includes("navbar"));
  const hasFooter = kids.some((n) => n.name === "footer");
  const inner = kids.filter((n) => !(n.attribs.class || "").includes("navbar") && n.name !== "footer");
  const name = `${pascal(page === "404" ? "NotFound" : page === "401" ? "Password" : page)}Page`;
  fs.writeFileSync(`${OUT}/pages/${name}.tsx`, component(name, inner));
  console.log(page, "->", name, { hasNav, hasFooter, wrapperClass: wrap.attribs?.class });
}

// Webflow CSS with asset URLs rewritten to local files
const cssEntry = [...urlMap.entries()].find(([u]) => /webflow\.shared\..*\.css$/.test(u));
const cssFile = path.join("public", cssEntry[1]);
const cssText = mapCssUrls(fs.readFileSync(cssFile, "utf8"));
fs.writeFileSync(`${OUT}/webflow.css`, `/* Webflow stylesheet from ${cssEntry[0]}, asset URLs rewritten to local files. */\n${cssText}`);

console.log("sections:", imports.join(", "));
fs.writeFileSync(`${R}/recon/missing-assets.json`, JSON.stringify([...missing], null, 2));
console.log("unmapped website-files URLs:", missing.size);
for (const m of [...missing].slice(0, 15)) console.log("  ", m);
