#!/usr/bin/env node
// Checks a built site folder: broken internal links and anchors, missing images, one <h1> per page,
// title and description lengths, duplicate ids and valid JSON-LD. Run after every build and as part
// of the monthly maintenance check.
//   node tools/check.mjs [folder]          (default: the preview build)
//   node tools/check.mjs dist --external   also request every external link
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(ROOT, process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '../../karis-smart-cleaning');
const external = process.argv.includes('--external');
const problems = [];
const warn = (file, msg) => problems.push(`${path.relative(dir, file)}: ${msg}`);

const pages = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) pages.push(p);
  }
})(dir);

const html = Object.fromEntries(pages.map((p) => [p, fs.readFileSync(p, 'utf8')]));
const idsOf = (src) => new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const externals = new Set();

function resolveTarget(fromFile, ref) {
  const clean = ref.split('#')[0].split('?')[0];
  let target = clean ? path.resolve(path.dirname(fromFile), clean) : fromFile;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  return target;
}

for (const file of pages) {
  const src = html[file];
  const is404 = file.endsWith('404.html');
  const h1s = (src.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) warn(file, `${h1s} <h1> elements`);
  const title = src.match(/<title>([^<]*)<\/title>/)?.[1] || '';
  if (!title) warn(file, 'missing <title>');
  else if (title.length > 70) warn(file, `title is ${title.length} characters (aim for 70 or fewer)`);
  const desc = src.match(/<meta name="description" content="([^"]*)"/)?.[1] || '';
  if (!desc) warn(file, 'missing meta description');
  else if (desc.length > 170) warn(file, `meta description is ${desc.length} characters (aim for 160 or so)`);
  const ids = [...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) warn(file, `duplicate ids: ${[...new Set(dup)].join(', ')}`);
  for (const m of src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { warn(file, `invalid JSON-LD: ${e.message}`); }
  }
  for (const m of src.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) warn(file, `image without alt: ${m[0].slice(0, 80)}`);
  if (is404) continue; // root-relative links, only valid once deployed at the site root
  for (const m of src.matchAll(/\s(?:href|src|srcset|data-still-base)="([^"]+)"/g)) {
    for (let ref of m[1].split(',').map((x) => x.trim().split(/\s+/)[0])) {
      if (/^(mailto:|tel:|data:|javascript:)/.test(ref)) continue;
      if (/^https?:/.test(ref)) { externals.add(ref); continue; }
      if (m[0].includes('data-still-base')) ref += 'overview-800.webp';
      const target = resolveTarget(file, ref);
      if (!fs.existsSync(target)) { warn(file, `broken link: ${ref}`); continue; }
      const frag = ref.split('#')[1];
      if (frag && target.endsWith('.html') && !idsOf(html[target] ?? fs.readFileSync(target, 'utf8')).has(frag)) warn(file, `missing anchor: ${ref}`);
    }
  }
}

if (external) {
  for (const url of externals) {
    if (/googletagmanager|formsubmit\.co/.test(url)) continue;
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000) });
      if (res.status >= 400) problems.push(`external ${res.status}: ${url}`);
    } catch (e) { problems.push(`external unreachable (${e.cause?.code || e.message}): ${url}`); }
  }
}

console.log(`Checked ${pages.length} pages, ${externals.size} external links${external ? '' : ' (not requested; use --external)'}.`);
if (problems.length) { console.log(problems.map((p) => '  - ' + p).join('\n')); process.exitCode = 1; } else console.log('No problems found.');
