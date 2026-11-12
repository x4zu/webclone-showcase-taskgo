import fs from "node:fs";
import { parseDocument, DomUtils } from "htmlparser2";
for (const page of process.argv.slice(2)) {
  const doc = parseDocument(fs.readFileSync(page, "utf8"), { lowerCaseAttributeNames: false, recognizeSelfClosing: true });
  const body = DomUtils.findOne((e) => e.name === "body", doc.children, true);
  console.log("==", page, JSON.stringify(body.attribs));
  const walk = (nodes, depth) => {
    for (const n of nodes) {
      if (n.type !== "tag" || n.name === "script") continue;
      console.log(`${"  ".repeat(depth)}${n.name}.${(n.attribs.class || "").split(" ").join(".")}${n.attribs.id ? "#" + n.attribs.id : ""} (${DomUtils.getText(n).trim().slice(0, 40).replace(/\s+/g, " ")})`);
      if (depth < 2) walk(n.children, depth + 1);
    }
  };
  walk(body.children, 0);
}
