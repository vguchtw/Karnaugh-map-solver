'use strict';

// Optional real-browser responsive acceptance; no packages are installed.
// CHROME_PATH=<chrome> PUPPETEER_MODULE=<existing puppeteer dir> node tests/mobile-browser.acceptance.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const puppeteer = require(process.env.PUPPETEER_MODULE || 'puppeteer');

async function run() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vgm-kmap-phone-'));
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH || undefined,
      userDataDir: profile,
      headless: true,
      timeout: 20000,
      args: [
        '--disable-gpu', '--disable-extensions', '--no-first-run',
        '--disable-background-networking', '--disable-component-update'
      ]
    });
    for (const width of [320, 375, 767, 768, 1024]) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.setViewport({
        width, height: 900, deviceScaleFactor: 1,
        isMobile: width <= 375, hasTouch: width <= 375
      });
      await page.goto(pathToFileURL(path.resolve(__dirname, '..', 'solver.html')).href, {
        waitUntil: 'load',
        timeout: 20000
      });
      let ui = await page.evaluate(() => {
        const rect = selector => document.querySelector(selector).getBoundingClientRect();
        const visible = selector => {
          const el = document.querySelector(selector);
          return el && getComputedStyle(el).display !== 'none' &&
            getComputedStyle(el).visibility !== 'hidden' && rect(selector).width > 0;
        };
        const scroller = document.querySelector('#kmap-container');
        return {
          visibleSettings: visible('.karnaugh-solver .settings'),
          visibleMap: visible('#kmap-container'),
          visibleResult: visible('#result'),
          fallback: visible('.mobile-fallback'),
          cells: document.querySelectorAll('#kmap-container td').length,
          headers: [...scroller.querySelectorAll('tr:first-child th')].map(th => th.textContent),
          rowHeaders: [...scroller.querySelectorAll('tr')].slice(1).map(tr => tr.querySelector('th').textContent),
          rootScrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          scrollerWidth: scroller.clientWidth,
          tableWidth: scroller.querySelector('table').scrollWidth
        };
      });
      assert.equal(ui.visibleSettings, true, width + 'px: settings must be visible');
      assert.equal(ui.visibleMap, true, width + 'px: map must be visible');
      assert.equal(ui.visibleResult, true, width + 'px: result must be visible');
      assert.notEqual(ui.fallback, true, width + 'px: fallback must not replace controls');
      assert.equal(ui.cells, 16, width + 'px: four-variable map');
      assert.deepEqual(ui.headers, ['AB / CD', '00', '01', '11', '10'],
        width + 'px: four-variable Gray-code column headers');
      assert.deepEqual(ui.rowHeaders, ['00', '01', '11', '10'],
        width + 'px: four-variable Gray-code row headers');
      assert.ok(ui.rootScrollWidth <= ui.viewportWidth + 1,
        width + 'px: entire document must not scroll horizontally: ' + JSON.stringify(ui));

      if (width <= 375) {
        const cell = await page.$('#kmap-container td');
        const bounds = await cell.boundingBox();
        assert.ok(bounds, width + 'px: touch target must be rendered');
        const x = bounds.x + bounds.width / 2;
        const y = bounds.y + bounds.height / 2;
        await page.touchscreen.tap(x, y);
        assert.equal(await page.$eval('#kmap-container td',
          el => el.getAttribute('aria-checked')), 'true',
          width + 'px: touchscreen tap must toggle');
        await page.touchscreen.tap(x, y);
        assert.equal(await page.$eval('#kmap-container td',
          el => el.getAttribute('aria-checked')), 'false',
          width + 'px: second touchscreen tap must untoggle');
      }
      await page.click('#kmap-container td');
      let first = await page.$eval('#kmap-container td', el => ({
        checked: el.getAttribute('aria-checked'),
        value: el.textContent
      }));
      assert.deepEqual(first, {checked: 'true', value: '1'}, width + 'px: tap/click toggles');
      await page.focus('#kmap-container td');
      await page.keyboard.press('Space');
      first = await page.$eval('#kmap-container td', el => el.getAttribute('aria-checked'));
      assert.equal(first, 'false', width + 'px: keyboard activation still works');

      await page.select('#var-count', '6');
      ui = await page.evaluate(() => {
        const scroller = document.querySelector('#kmap-container');
        const table = scroller.querySelector('table');
        return {
          cells: table.querySelectorAll('td').length,
          headers: [...table.querySelectorAll('tr:first-child th')].map(th => th.textContent),
          rowHeaders: [...table.querySelectorAll('tr')].slice(1).map(tr => tr.querySelector('th').textContent),
          scrollerWidth: scroller.clientWidth,
          tableWidth: table.scrollWidth,
          rootScrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          overflowX: getComputedStyle(scroller).overflowX
        };
      });
      assert.equal(ui.cells, 64, width + 'px: six-variable map must display');
      assert.deepEqual(ui.headers, ['ABC / DEF', '000', '001', '011', '010', '110', '111', '101', '100'],
        width + 'px: six-variable Gray-code column headers');
      assert.deepEqual(ui.rowHeaders, ['000', '001', '011', '010', '110', '111', '101', '100'],
        width + 'px: six-variable Gray-code row headers');
      assert.ok(ui.rootScrollWidth <= ui.viewportWidth + 1,
        width + 'px: six-variable map must not overflow the whole page');
      if (ui.tableWidth > ui.scrollerWidth) {
        assert.equal(ui.overflowX, 'auto', width + 'px: wide table must scroll within map');
      }
      await page.click('#kmap-container td:last-child');
      const checked = await page.$eval('#kmap-container td:last-child',
        el => el.getAttribute('aria-checked'));
      assert.equal(checked, 'true', width + 'px: final cell remains operable');
      assert.deepEqual(errors, [], width + 'px: no uncaught JS error');
      console.log('RESPONSIVE_REAL_CHROME_PASS ' + JSON.stringify({width, ...ui}));
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    fs.rmSync(profile, {recursive: true, force: true});
  }
}
run().catch(error => {
  console.error('RESPONSIVE_REAL_CHROME_FAIL', error.stack || error);
  process.exitCode = 1;
});
