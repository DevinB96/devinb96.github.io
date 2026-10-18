#!/usr/bin/env node
// Renders every still image the site uses from the 3D maquette, plus social cards and icons.
//   node tools/render.mjs            all images
//   node tools/render.mjs svc-deep   only images whose name contains "svc-deep"
// Needs Playwright with Chromium (npx playwright install chromium if it is missing).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMG = path.join(ROOT, 'src/assets/img');
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }

const only = process.argv[2] || '';
const stills = [
  { name: 'room-overview', view: 'overview' },
  { name: 'room-kitchen', view: 'kitchen' },
  { name: 'room-bathroom', view: 'bathroom' },
  { name: 'room-living', view: 'living' },
  { name: 'room-bedroom', view: 'bedroom' },
  { name: 'svc-regular', view: 'living' },
  { name: 'svc-deep', view: 'kitchen' },
  { name: 'svc-tenancy', view: 'bedroom', level: 'tenancy' },
  { name: 'svc-office', view: 'office', scene: 'office' },
  { name: 'svc-windows', view: 'exterior' },
];
const cards = [
  { name: 'og-default', img: 'room-overview', title: 'Come home to <em>clean.</em>', meta: 'Home & office cleaning in Guildford, Surrey' },
  { name: 'svc-regular-og', img: 'svc-regular', title: 'Regular home cleaning <em>in Guildford</em>' },
  { name: 'svc-deep-og', img: 'svc-deep', title: 'Deep cleaning <em>in Guildford</em>' },
  { name: 'svc-tenancy-og', img: 'svc-tenancy', title: 'End of tenancy cleaning <em>in Guildford</em>' },
  { name: 'svc-office-og', img: 'svc-office', title: 'Office and commercial cleaning <em>in Guildford</em>' },
  { name: 'svc-windows-og', img: 'svc-windows', title: 'Window cleaning <em>in Guildford</em>' },
];

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('page error:', e.message));
const save = (name, dataUrl) => fs.writeFileSync(path.join(IMG, name), Buffer.from(dataUrl.split(',')[1], 'base64'));

for (const s of stills.filter((x) => x.name.includes(only))) {
  const t = Date.now();
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.goto(`${base}/tools/render.html?view=${s.view}&level=${s.level || 'regular'}&scene=${s.scene || 'home'}&w=1600&h=1200`);
  await page.waitForFunction(() => window.__result, null, { timeout: 180000 });
  const r = await page.evaluate(() => window.__result);
  save(`${s.name}-1600.webp`, r.full);
  save(`${s.name}-800.webp`, r.half);
  save(`${s.name}-src.jpg`, r.jpeg);
  console.log(`${s.name} (${((Date.now() - t) / 1000).toFixed(1)}s)`);
}

for (const c of cards.filter((x) => x.name.includes(only) || x.img.includes(only))) {
  await page.setViewportSize({ width: 1200, height: 630 });
  const q = new URLSearchParams({ img: `../src/assets/img/${c.img}-src.jpg`, title: c.title, meta: c.meta || '' });
  await page.goto(`${base}/tools/og.html?${q}`);
  await page.evaluate(() => Promise.all([document.fonts.ready, new Promise((r) => { const i = document.getElementById('img'); i.complete ? r() : (i.onload = r); })]));
  await page.screenshot({ path: path.join(IMG, `${c.name}.jpg`), type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log(c.name);
}

if (!only || only === 'icons') {
  const svg = fs.readFileSync(path.join(IMG, 'favicon.svg'), 'utf8');
  for (const [name, size, pad, bg] of [['logo-512.png', 512, 0, null], ['icon-192.png', 192, 0, null], ['apple-touch-icon.png', 180, 22, '#f5f1ea'], ['favicon-32.png', 32, 0, null]]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:${bg || 'transparent'}"><div style="width:${size}px;height:${size}px;display:grid;place-items:center">${svg.replace('<svg ', `<svg width="${size - pad * 2}" height="${size - pad * 2}" `)}</div></body></html>`);
    await page.screenshot({ path: path.join(IMG, name), omitBackground: !bg, clip: { x: 0, y: 0, width: size, height: size } });
    console.log(name);
  }
}

// The -src.jpg files are only inputs for the social cards.
for (const f of fs.readdirSync(IMG)) if (f.endsWith('-src.jpg')) fs.rmSync(path.join(IMG, f));
await browser.close();
server.close();
