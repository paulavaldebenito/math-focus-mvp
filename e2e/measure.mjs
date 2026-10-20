import { chromium } from "@playwright/test";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
const ROOT = "/Users/pau/Documents/GitHub/math-focus-mvp/client/public/banco-imagenes";
const OLD = 'font-family="DejaVu Sans, Trebuchet MS, Arial, sans-serif"';
const NEW = 'font-family="Comic Sans MS, Comic Sans, Chalkboard SE, Comic Neue, DejaVu Sans, Trebuchet MS, Arial, sans-serif"';
const files = [];
for (const g of readdirSync(ROOT)) for (const l of ["es", "en"]) for (const f of readdirSync(`${ROOT}/${g}/${l}`)) files.push(`${g}/${l}/${f}`);
const b = await chromium.launch({ channel: "chrome" });
const page = await b.newPage();
await page.setContent("<html><body></body></html>");
const measure = (svg) => page.evaluate((svg) => {
  document.body.innerHTML = svg;
  const el = document.body.querySelector("svg");
  const vb = el.viewBox.baseVal;
  const boxes = [...el.querySelectorAll("text")].map((t) => { const bb = t.getBBox(); return { x: bb.x, y: bb.y, w: bb.width, h: bb.height, s: t.textContent }; });
  const out = boxes.filter((bb) => bb.w > 0 && (bb.x < vb.x - 1 || bb.y < vb.y - 1 || bb.x + bb.w > vb.x + vb.width + 1 || bb.y + bb.h > vb.y + vb.height + 1)).map((bb) => bb.s);
  const ov = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], c = boxes[j];
    const ix = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x), iy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
    if (ix > 2 && iy > 2) ov.push(`${a.s} × ${c.s}`);
  }
  return { out, ov, fam: getComputedStyle(el.querySelector("text")).fontFamily };
}, svg);
const problems = [];
let checked = 0;
for (const f of files) {
  const src = readFileSync(`${ROOT}/${f}`, "utf8");
  const before = await measure(src);
  const after = await measure(src.replaceAll(OLD, NEW));
  const newOut = after.out.filter((s) => !before.out.includes(s));
  const newOv = after.ov.filter((s) => !before.ov.includes(s));
  if (newOut.length || newOv.length) problems.push({ f, newOut, newOv });
  checked++;
}
writeFileSync(process.argv[2] + "/svg_font_problems.json", JSON.stringify(problems, null, 1));
console.log("revisadas", checked, "| con problemas nuevos", problems.length);
for (const p of problems.slice(0, 12)) console.log(p.f, "| fuera:", p.newOut.join(" ; "), "| solapa:", p.newOv.join(" ; "));
await b.close();
