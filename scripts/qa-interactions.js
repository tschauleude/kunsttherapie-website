#!/usr/bin/env node
/**
 * QA: Seiten laden, Buttons/Toggles/Links, API-Erreichbarkeit.
 *   BASE=http://127.0.0.1:3456 node scripts/qa-interactions.js
 */
const { chromium, devices } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:3456';
const fails = [];
const passes = [];

function pass(msg) {
  passes.push(msg);
  console.log('✓', msg);
}

function fail(msg, detail) {
  const line = detail ? `${msg} — ${detail}` : msg;
  fails.push(line);
  console.log('✗', line);
}

async function acceptConsent(page) {
  const all = page.locator('[data-consent-all]');
  if (await all.isVisible({ timeout: 2000 }).catch(() => false)) {
    await all.click();
    await page.waitForTimeout(400);
  }
}

async function testPageLoads(browser) {
  const pages = [
    '/',
    '/index.html',
    '/kunsttherapie',
    '/buchung',
    '/kontakt',
    '/preise',
    '/ueber-mich',
    '/neuigkeiten',
    '/events',
    '/atelier',
    '/impressum',
    '/datenschutz',
  ];

  for (const path of pages) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message || e)));

    const res = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
    const status = res?.status();
    if (status !== 200) fail(`Page ${path}`, `HTTP ${status}`);
    else if (errors.length) fail(`Page ${path}`, `JS: ${errors[0]}`);
    else pass(`Page loads ${path}`);

    await ctx.close();
  }
}

async function testHomeInteractions(browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await acceptConsent(page);
  await page.waitForTimeout(1200);

  // Lang switch
  await page.locator('.lang-switch-btn[data-lang="en"]').click();
  await page.waitForTimeout(300);
  const lang = await page.evaluate(() => document.documentElement.lang);
  if (lang === 'en') pass('Language switch EN');
  else fail('Language switch EN', `lang=${lang}`);

  // Service card click
  await page.locator('#angebote .services-grid h3').first().click();
  await page.waitForTimeout(600);
  if (page.url().includes('kunsttherapie')) pass('Home service card navigates');
  else fail('Home service card navigates', page.url());

  // Gallery
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await acceptConsent(page);
  await page.waitForTimeout(800);
  await page.locator('[data-gallery-open]').first().click();
  await page.waitForTimeout(600);
  const lb = await page.evaluate(() => {
    const o = document.querySelector('.lightbox');
    return o && !o.hidden;
  });
  if (lb) pass('Gallery lightbox opens');
  else fail('Gallery lightbox opens');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Quote dot
  await page.locator('[data-quote-dot="1"]').click();
  await page.waitForTimeout(200);
  const q = await page.evaluate(
    () => document.querySelectorAll('[data-quote-slide]')[1]?.classList.contains('is-active')
  );
  if (q) pass('Quote dot switches');
  else fail('Quote dot switches');

  // Nav links exist
  const navCount = await page.locator('nav[data-site-nav] a[data-nav]').count();
  if (navCount >= 5) pass(`Nav links present (${navCount})`);
  else fail('Nav links present', String(navCount));

  if (errors.length) fail('Home JS errors', errors[0]);

  await page.close();
}

async function testKunsttherapie(browser) {
  const page = await browser.newPage();
  await page.goto(`${BASE}/kunsttherapie`, { waitUntil: 'networkidle' });
  await acceptConsent(page);

  await page.locator('#angebote').scrollIntoViewIfNeeded();
  const offerBodyBeforeI18n = await page.evaluate(() => {
    const body = document.querySelector('.kt-offer-body');
    return (body?.textContent?.trim().length || 0) > 100;
  });
  if (offerBodyBeforeI18n) pass('Offer body has fallback text');
  else fail('Offer body has fallback text', 'empty before toggle');

  await page.locator('#angebote details[data-offer]').first().click();
  await page.waitForTimeout(400);
  const offer = await page.evaluate(() => {
    const d = document.querySelector('details[data-offer]');
    return {
      open: d?.open,
      hint: d?.querySelector('.kt-offer-hint')?.textContent?.trim(),
      h: d?.querySelector('.kt-offer-body')?.getBoundingClientRect().height || 0,
      hasChevron: !!d?.querySelector('.kt-offer-chevron'),
    };
  });
  if (offer.open && offer.h > 50 && offer.hasChevron && /weniger|less/i.test(offer.hint || '')) {
    pass('Offer card toggle');
  } else fail('Offer card toggle', JSON.stringify(offer));

  await page.locator('[data-quote-dot="1"]').first().click();
  await page.waitForTimeout(400);
  const quoteDot = await page.evaluate(
    () => document.querySelectorAll('[data-quote-slide]')[1]?.classList.contains('is-active')
  );
  if (quoteDot) pass('Quote dot switches (kunsttherapie)');
  else fail('Quote dot switches (kunsttherapie)');

  await page.locator('#faq .kt-details summary').first().click();
  await page.waitForTimeout(200);
  const faq = await page.evaluate(() => document.querySelector('#faq .kt-details')?.open);
  if (faq) pass('FAQ details open');
  else fail('FAQ details open');

  await page.locator('#atelier').scrollIntoViewIfNeeded();
  await page.locator('[data-raum-tab="innen"]').click();
  await page.waitForTimeout(300);
  const tab = await page.evaluate(() => !document.querySelector('[data-raum-panel="innen"]')?.hidden);
  if (tab) pass('Raum tab switches');
  else fail('Raum tab switches');

  await page.close();
}

async function testBooking(browser) {
  const page = await browser.newPage();
  await page.goto(`${BASE}/buchung`, { waitUntil: 'networkidle' });
  await acceptConsent(page);
  await page.waitForTimeout(500);

  const freeDay = page.locator('.booking-day-free').first();
  if (!(await freeDay.count())) {
    fail('Booking free day exists');
    await page.close();
    return;
  }
  await freeDay.click();
  await page.waitForTimeout(1500);

  const slot = page.locator('.slot-free').first();
  if (!(await slot.count())) {
    fail('Booking free slot exists');
    await page.close();
    return;
  }
  await slot.click();
  await page.waitForTimeout(500);

  const formVisible = await page.evaluate(() =>
    document.getElementById('bookingFormPanel')?.classList.contains('is-visible')
  );
  if (formVisible) pass('Booking form opens after slot');
  else fail('Booking form opens after slot');

  const summary = await page.locator('#bookingSummary').textContent();
  if (summary && summary.length > 5) pass('Booking summary filled');
  else fail('Booking summary filled');

  await page.close();
}

async function testContact(browser) {
  const page = await browser.newPage();
  await page.goto(`${BASE}/kontakt`, { waitUntil: 'networkidle' });
  await acceptConsent(page);

  const form = page.locator('#contactForm');
  if (!(await form.count())) {
    fail('Contact form exists');
    await page.close();
    return;
  }

  await page.fill('#contactName', 'QA Test');
  await page.fill('#contactEmail', 'qa-test@example.com');
  await page.fill('#contactMessage', 'Automatischer QA-Test – bitte ignorieren.');

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/contact') && r.request().method() === 'POST'),
    page.locator('#contactForm button[type="submit"]').click(),
  ]);

  if (res.status() === 200 || res.status() === 201) pass('Contact form POST succeeds');
  else fail('Contact form POST succeeds', `HTTP ${res.status()}`);

  await page.close();
}

async function testEventsNews(browser) {
  const page = await browser.newPage();
  await page.goto(`${BASE}/events`, { waitUntil: 'networkidle' });
  await acceptConsent(page);
  await page.waitForTimeout(1500);

  const eventCards = await page.locator('.event-card').count();
  if (eventCards > 0) {
    pass(`Events list renders (${eventCards})`);
    await page.locator('.event-card h3').first().click();
    await page.waitForTimeout(500);
    if (page.url().includes('kontakt')) pass('Event card click navigates to kontakt');
    else fail('Event card click navigates to kontakt', page.url());
  } else {
    pass('Events page loads (empty list OK)');
  }

  await page.goto(`${BASE}/neuigkeiten`, { waitUntil: 'networkidle' });
  await acceptConsent(page);
  await page.waitForTimeout(1500);
  const newsCards = await page.locator('.news-card').count();
  if (newsCards >= 0) pass(`News page renders (${newsCards} cards)`);

  await page.close();
}

async function testMobileNav(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await acceptConsent(page);

  const toggle = page.locator('.nav-toggle');
  if (!(await toggle.count())) {
    fail('Mobile nav toggle exists');
    await ctx.close();
    return;
  }

  await toggle.click();
  await page.waitForTimeout(300);
  const open = await page.evaluate(() => document.body.classList.contains('nav-open'));
  if (open) pass('Mobile nav opens');
  else fail('Mobile nav opens');

  await ctx.close();
}

async function testApis() {
  const routes = [
    ['/health', 200],
    ['/api/news', 200],
    ['/api/events', 200],
    ['/api/bookings/config', 200],
    ['/api/site-images', 200],
    ['/api/i18n/overrides', 200],
    ['/angebote', 301],
  ];

  for (const [path, expect] of routes) {
    const res = await fetch(`${BASE}${path}`, { redirect: 'manual' });
    if (res.status === expect) pass(`API ${path} -> ${expect}`);
    else fail(`API ${path}`, `expected ${expect}, got ${res.status}`);
  }
}

async function testInternalLinks(browser) {
  const page = await browser.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await acceptConsent(page);

  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll('a[href]')]
      .map((a) => a.getAttribute('href'))
      .filter((h) => h && !h.startsWith('mailto:') && !h.startsWith('tel:') && !h.startsWith('http'))
  );

  const unique = [...new Set(hrefs)].slice(0, 25);
  for (const href of unique) {
    const url = href.startsWith('/') ? `${BASE}${href}` : `${BASE}/${href}`;
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.status < 400) pass(`Link ${href}`);
      else fail(`Link ${href}`, `HTTP ${res.status}`);
    } catch (e) {
      fail(`Link ${href}`, e.message);
    }
  }

  await page.close();
}

(async () => {
  console.log(`\nQA interactions @ ${BASE}\n`);

  try {
    await testApis();
  } catch (e) {
    fail('API tests', e.message);
  }

  const browser = await chromium.launch();
  try {
    await testPageLoads(browser);
    await testHomeInteractions(browser);
    await testKunsttherapie(browser);
    await testBooking(browser);
    await testContact(browser);
    await testEventsNews(browser);
    await testMobileNav(browser);
    await testInternalLinks(browser);
  } finally {
    await browser.close();
  }

  console.log(`\n--- ${passes.length} passed, ${fails.length} failed ---\n`);
  if (fails.length) {
    fails.forEach((f) => console.error('  ', f));
    process.exit(1);
  }
})();
