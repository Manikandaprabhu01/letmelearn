import { chromium } from 'playwright';
const [url, out, sel] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(1500);
if (sel) {
  const el = await p.locator(sel).first();
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await el.screenshot({ path: out });
} else {
  await p.screenshot({ path: out });
}
console.log('ERRORS:', errs.slice(0,3).join(' | ') || 'none');
await b.close();
