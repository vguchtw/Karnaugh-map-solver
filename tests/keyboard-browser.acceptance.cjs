'use strict';

// Optional real-Chrome acceptance; intentionally not part of the dependency-free Node suite.
// Usage: CHROME_PATH=<chrome> PUPPETEER_MODULE=<installed-puppeteer-path> node tests/keyboard-browser.acceptance.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require(process.env.PUPPETEER_MODULE || 'puppeteer');

async function main() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vgm-kmap-browser-'));
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH || undefined,
      headless: true,
      userDataDir: profile,
      timeout: 20000,
      args: ['--disable-gpu', '--disable-extensions', '--no-first-run',
        '--disable-background-networking', '--disable-component-update'],
    });
    const page = await browser.newPage();
    await page.setViewport({width: 1200, height: 900});
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(String(error)));
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'solver.html')).href, {
      waitUntil: 'load', timeout: 20000,
    });

    const cellSelector = '#kmap-container td';
    const describe = async () => page.$$eval(cellSelector, cells =>
      cells.map(cell => ({
        role: cell.getAttribute('role'),
        label: cell.getAttribute('aria-label'),
        checked: cell.getAttribute('aria-checked'),
        tabindex: cell.tabIndex,
        text: cell.textContent,
      })));
    const assertMap = async expected => {
      const cells = await describe();
      assert.equal(cells.length, expected);
      assert.ok(cells.every(cell => cell.role === 'checkbox' &&
        cell.tabindex === 0 && cell.checked === 'false' && cell.text === '0'));
      const names = new Set(cells.map(cell => cell.label));
      assert.equal(names.size, expected, 'all minterm labels must be unique');
      for (let minterm = 0; minterm < expected; minterm++) {
        assert.ok(names.has('Minterm ' + minterm), 'missing minterm ' + minterm);
      }
    };
    await assertMap(16);

    await page.focus('#output-type');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() =>
      document.activeElement === document.querySelector('#reset-map')), true,
      'Tab must reach the native Clear map button');
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() =>
      document.activeElement === document.querySelector('#kmap-container td'));
    assert.equal(firstFocused, true, 'Tab must focus the first map cell');
    const focus = await page.$eval(cellSelector, cell => ({
      outline: getComputedStyle(cell).outlineStyle,
      width: getComputedStyle(cell).outlineWidth,
      focusVisible: cell.matches(':focus-visible'),
    }));
    assert.equal(focus.focusVisible, true, 'keyboard focus must use :focus-visible');
    assert.notEqual(focus.outline, 'none', 'focus ring must be visible');
    assert.equal(focus.width, '3px');

    await page.keyboard.press('Space');
    assert.equal((await describe())[0].checked, 'true');
    assert.equal((await describe())[0].text, '1');
    const expression = await page.$eval('#result', cell => cell.textContent);
    assert.doesNotMatch(expression, /: 0$/);
    await page.keyboard.press('Enter');
    assert.equal((await describe())[0].checked, 'false');
    await page.keyboard.press('a');
    assert.equal((await describe())[0].checked, 'false');
    await page.click(cellSelector);
    assert.equal((await describe())[0].checked, 'true', 'mouse click must remain functional');

    await page.select('#var-count', '6');
    await assertMap(64);
    await page.focus('#reset-map');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() =>
      document.activeElement === document.querySelector('#kmap-container td')), true);
    await page.keyboard.press('Enter');
    assert.equal((await describe())[0].checked, 'true');
    await page.focus('#reset-map');
    await page.keyboard.press('Enter');
    await assertMap(64);
    assert.equal(await page.$eval('#var-count', el => el.value), '6',
      'Clear map must preserve variable count');
    assert.deepEqual(pageErrors, [], 'no uncaught browser errors');
    console.log('KARNAUGH_REAL_CHROME_KEYBOARD_PASS ' + JSON.stringify({
      initialMinterms: 16, expandedMinterms: 64,
      tabFocus: true, visibleFocus: true, spaceEnter: true,
      uniqueNames: true, mouseCompatible: true, keyboardClear: true, pageErrors,
    }));
  } finally {
    if (browser) await browser.close();
    fs.rmSync(profile, {recursive: true, force: true});
  }
}
main().catch(error => {
  console.error('KARNAUGH_REAL_CHROME_KEYBOARD_FAIL', error.stack || error);
  process.exitCode = 1;
});
