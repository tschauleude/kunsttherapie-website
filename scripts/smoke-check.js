#!/usr/bin/env node
/**
 * Smoke-Check: Assets, i18n, statische HTML-Referenzen, optional HTTP.
 *   node scripts/smoke-check.js
 *   SMOKE_URL=http://localhost:3000 node scripts/smoke-check.js
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
let exit = 0;

function fail(msg) {
  console.error('✗', msg);
  exit = 1;
}
function pass(msg) {
  console.log('✓', msg);
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

// --- Static checks ---
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/asset-manifest.json'), 'utf8'));
for (const [key, file] of Object.entries(manifest)) {
  if (key === 'builtAt') continue;
  if (key === 'pageBundles' && file && typeof file === 'object') {
    for (const [page, bundle] of Object.entries(file)) {
      const rel = `assets/js/${bundle}`;
      if (exists(rel)) pass(`manifest pageBundles.${page}: ${bundle}`);
      else fail(`manifest file missing: ${rel}`);
    }
    continue;
  }
  const rel = key === 'coreBundle' ? `assets/js/${file}` : `assets/css/${file}`;
  if (exists(rel)) pass(`manifest ${key}: ${file}`);
  else fail(`manifest file missing: ${rel}`);
}

const pages = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith('.html') && f !== 'admin.html' && f !== 'angebote.html');

const assetRefs = new Set();
for (const page of pages) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  [...html.matchAll(/assets\/(?:js|css|img)\/[^"'?\s]+/g)].forEach((m) => assetRefs.add(m[0].split('?')[0]));
}
for (const ref of assetRefs) {
  if (!exists(ref)) fail(`broken asset ref: ${ref} (from HTML)`);
}

const cores = fs.readdirSync(path.join(ROOT, 'assets/js')).filter((f) => f.startsWith('site-core.') && f.endsWith('.js'));
if (cores.length !== 1) fail(`expected 1 site-core bundle, found ${cores.length}: ${cores.join(', ')}`);
else pass(`site-core bundle: ${cores[0]}`);

if (fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8').length !== fs.readFileSync(path.join(ROOT, 'public/admin.html'), 'utf8').length) {
  fail('admin.html out of sync with public/admin.html — run npm run sync-admin');
} else pass('admin.html synced');

const booking = require(path.join(ROOT, 'lib/booking'));
const norm = booking.normalizeBookingPayload({ name: 'T', email: 't@t.de', date: '2026-06-16', time: '11:00' });
if (norm.startTime !== '11:00') fail('booking.normalizeBookingPayload time alias broken');
else pass('booking field aliases OK');

// --- Optional HTTP ---
const base = process.env.SMOKE_URL;
if (!base) {
  console.log('\n(Skip HTTP — set SMOKE_URL to test live routes)');
  process.exit(exit);
}

function get(urlPath) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlPath, base);
    http
      .get({ hostname: u.hostname, port: u.port, path: u.pathname + u.search }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
      })
      .on('error', reject);
  });
}

(async () => {
  const routes = ['/', '/kunsttherapie', '/buchung', '/kontakt', '/admin', '/health', '/api/bookings/config', '/api/site-images'];
  for (const r of routes) {
    const res = await get(r);
    if (res.status !== 200) fail(`HTTP ${r} -> ${res.status}`);
    else pass(`HTTP ${r} -> 200`);
  }

  const ang = await get('/angebote');
  if (ang.status !== 301) fail(`/angebote -> ${ang.status} (expected 301)`);
  else pass('/angebote -> 301 redirect');

  const admin = await get('/api/admin/news');
  if (admin.status !== 401) fail(`/api/admin/news without auth -> ${admin.status}`);
  else pass('/api/admin/news protected');

  process.exit(exit);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
