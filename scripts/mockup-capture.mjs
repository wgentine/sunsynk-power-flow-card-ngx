/**
 * High-fidelity design mockup captures (no card bundle).
 * PNG @2x DPR + WebM animation for direction A (dark).
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { auditMockupGeometry } from './mockup-qa.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mockupDir = path.join(root, 'design', 'mockup');
const artifacts = '/opt/cursor/artifacts';
fs.mkdirSync(artifacts, { recursive: true });

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let filePath = path.join(mockupDir, url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
  if (!filePath.startsWith(mockupDir)) {
    res.statusCode = 403;
    res.end();
    return;
  }
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end('not found');
    return;
  }
  const ext = path.extname(filePath);
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
  res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
  res.end(fs.readFileSync(filePath));
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}/index.html`;

const combos = [
  ['a', 'dark'],
  ['a', 'light'],
  ['b', 'dark'],
  ['b', 'light'],
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 980, height: 580 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
let qaFailed = false;

for (const [dir, theme] of combos) {
  await page.goto(`${base}?dir=${dir}&theme=${theme}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const qa = await auditMockupGeometry(page);
  if (!qa.ok) {
    qaFailed = true;
    const tag = `mockup-${dir}-${theme}`;
    console.error(`QA FAIL ${tag}:`, JSON.stringify(qa.violations.slice(0, 12), null, 2));
    const overlay = path.join(artifacts, `${tag}-qa-violations.json`);
    fs.writeFileSync(overlay, JSON.stringify(qa, null, 2));
    console.error('wrote', overlay);
    await page.evaluate((violations) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', 'qa-debug');
      g.setAttribute('opacity', '0.85');
      for (const v of violations) {
        if (v.kind !== 'path-text' || !v.at) continue;
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', v.at.x);
        c.setAttribute('cy', v.at.y);
        c.setAttribute('r', '5');
        c.setAttribute('fill', '#ff3366');
        g.appendChild(c);
      }
      document.getElementById('diagram').appendChild(g);
    }, qa.violations);
    await page.locator('.card').screenshot({
      path: path.join(artifacts, `${tag}-qa-overlay.png`),
    });
  } else {
    console.log(`QA pass mockup-${dir}-${theme} (${qa.pathCount} paths, ${qa.textCount} text boxes)`);
  }
  const out = path.join(artifacts, `mockup-${dir}-${theme}.png`);
  await page.locator('.card').screenshot({ path: out });
  console.log('saved', out);
}

// Animation capture — direction A dark
const videoDir = path.join(artifacts, 'mockup-a-dark-video');
fs.mkdirSync(videoDir, { recursive: true });
const videoContext = await browser.newContext({
  viewport: { width: 980, height: 580 },
  deviceScaleFactor: 2,
  recordVideo: { dir: videoDir, size: { width: 980, height: 580 } },
});
const vPage = await videoContext.newPage();
await vPage.goto(`${base}?dir=a&theme=dark`, { waitUntil: 'networkidle' });
await vPage.waitForTimeout(4000);
await vPage.close();
await videoContext.close();

const videos = fs.readdirSync(videoDir).filter((f) => f.endsWith('.webm'));
const webmPath = path.join(artifacts, 'mockup-a-flow-dark.webm');
if (videos[0]) {
  fs.renameSync(path.join(videoDir, videos[0]), webmPath);
  console.log('saved', webmPath);
  try {
    execSync(
      `ffmpeg -y -i "${webmPath}" -vf "fps=12,scale=920:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "${path.join(artifacts, 'mockup-a-flow-dark.gif')}"`,
      { stdio: 'pipe' },
    );
    console.log('saved', path.join(artifacts, 'mockup-a-flow-dark.gif'));
  } catch {
    console.log('gif skipped (ffmpeg palette step failed)');
  }
}

// Junction QA crops (direction A dark, 4× zoom on key rings)
const crops = [
  ['junction-pv-trunk', { x: 250, y: 40, width: 180, height: 200 }],
  ['junction-inv-grid', { x: 60, y: 180, width: 380, height: 140 }],
  ['junction-inv-battery', { x: 330, y: 200, width: 140, height: 220 }],
  ['junction-home-bus', { x: 450, y: 130, width: 200, height: 150 }],
  ['junction-load-stub', { x: 600, y: 60, width: 100, height: 130 }],
  ['junction-gridct', { x: 40, y: 180, width: 220, height: 200 }],
];
await page.goto(`${base}?dir=a&theme=dark`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const cardBox = await page.locator('.card').boundingBox();
for (const [name, rel] of crops) {
  const out = path.join(artifacts, `mockup-a-dark-${name}.png`);
  await page.screenshot({
    path: out,
    clip: {
      x: cardBox.x + rel.x,
      y: cardBox.y + rel.y,
      width: rel.width,
      height: rel.height,
    },
  });
  console.log('saved', out);
}

await context.close();
await browser.close();
server.close();

if (qaFailed) {
  console.error('mockup-capture: geometry QA failed — fix overlaps before shipping PNGs');
  process.exitCode = 1;
}