// Copies PDF docs from docs/ into public/docs-pdf/ so they're published with the site.
// The files are copied byte-for-byte; the originals in docs/ are never touched.
import fs from "node:fs";
import path from "node:path";

const src = path.join(process.cwd(), "docs");
const dest = path.join(process.cwd(), "public", "docs-pdf");

fs.mkdirSync(dest, { recursive: true });
for (const name of fs.existsSync(src) ? fs.readdirSync(src) : []) {
  if (name.toLowerCase().endsWith(".pdf")) {
    fs.copyFileSync(path.join(src, name), path.join(dest, name));
    console.log(`copied docs/${name} -> public/docs-pdf/${name}`);
  }
}
