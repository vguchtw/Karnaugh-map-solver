'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'solver.html'), 'utf8');

test('phone layout does not hide settings, map or output behind desktop-only fallback', () => {
  assert.doesNotMatch(html, /\.karnaugh-solver\s*>\s*\*:not\(\.mobile-fallback\)/,
    'old breakpoint hides every interactive control under 768px');
  assert.doesNotMatch(html, /requires a screen at least 768px wide/i,
    'do not tell phone users the solver is unavailable');
});

test('map has a horizontal scroll container for narrow layouts', () => {
  assert.match(html, /\.karnaugh-solver\s+#kmap-container\s*\{[^}]*overflow-x:\s*auto/s,
    'map scroller must contain an 8-column grid on narrow screens');
  assert.match(html, /@media\s*\(max-width:\s*767px\)/,
    'phone breakpoint must adjust spacing rather than suppress the solver');
});

test('mobile edit still preserves six-variable and keyboard accessibility hooks', () => {
  assert.match(html, /<option value="6">8×8<\/option>/);
  assert.match(html, /td\.setAttribute\('role', 'checkbox'\)/);
  assert.match(html, /td\.addEventListener\('keydown'/);
});
