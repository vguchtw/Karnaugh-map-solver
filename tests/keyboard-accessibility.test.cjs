'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'solver.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1);

class Element {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.style = {};
    this.value = '';
    this.textContent = '';
    this.tabIndex = -1;
    this.classes = new Set();
    this.classList = {
      toggle: (name, enabled) => {
        if (enabled) this.classes.add(name);
        else this.classes.delete(name);
      },
      contains: name => this.classes.has(name),
    };
  }
  set textContent(value) { this._textContent = String(value); }
  get textContent() { return this._textContent; }
  set innerHTML(value) {
    this.children = [];
    this._html = value;
  }
  get innerHTML() { return this._html || ''; }
  appendChild(child) { this.children.push(child); return child; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }
  emit(type, props = {}) {
    let prevented = false;
    const event = {target: this, preventDefault() { prevented = true; }, ...props};
    for (const handler of this.listeners.get(type) || []) handler(event);
    return { prevented };
  }
}

function boot() {
  const ids = ['var-count', 'method', 'output-type', 'kmap-container',
    'result', 'diagram-container', 'code-container', 'code-output'];
  const elements = new Map(ids.map(id => [id, new Element('div')]));
  elements.get('var-count').value = '4';
  elements.get('method').value = 'SOP';
  elements.get('output-type').value = 'text';
  const document = {
    getElementById(id) {
      assert.ok(elements.has(id), 'unexpected element ' + id);
      return elements.get(id);
    },
    createElement(tag) { return new Element(tag); },
  };
  vm.runInNewContext(scripts[0][1], {document}, {filename: 'solver.html'});
  const cells = () => elements.get('kmap-container').children[0].children
    .flatMap(row => row.children);
  return {cells, elements};
}

test('all four-variable cells are keyboard focusable, named and expose state', () => {
  const {cells} = boot();
  assert.equal(cells().length, 16);
  for (const [index, cell] of cells().entries()) {
    assert.equal(cell.tabIndex, 0, 'cell ' + index + ' is keyboard focusable');
    assert.equal(cell.getAttribute('role'), 'checkbox');
    assert.match(cell.getAttribute('aria-label') || '', /^Minterm \d+/);
    assert.equal(cell.getAttribute('aria-checked'), 'false');
  }
});

test('Space and Enter toggle exactly once and synchronize expression and ARIA', () => {
  const {cells, elements} = boot();
  const first = cells()[0];
  assert.match(elements.get('result').textContent, /: 0$/);
  const event = first.emit('keydown', {key: ' '});
  assert.equal(event.prevented, true, 'Space must not scroll the page');
  assert.equal(first.textContent, '1');
  assert.equal(first.getAttribute('aria-checked'), 'true');
  assert.equal(first.classList.contains('active'), true);
  assert.doesNotMatch(elements.get('result').textContent, /: 0$/);
  first.emit('keydown', {key: 'Enter'});
  assert.equal(first.textContent, '0');
  assert.equal(first.getAttribute('aria-checked'), 'false');
  assert.match(elements.get('result').textContent, /: 0$/);
});

test('unrelated keys do not change cell state; mouse clicks still work', () => {
  const {cells} = boot();
  const cell = cells()[2];
  const event = cell.emit('keydown', {key: 'ArrowRight'});
  assert.equal(event.prevented, false);
  assert.equal(cell.textContent, '0');
  cell.emit('click');
  assert.equal(cell.textContent, '1');
  assert.equal(cell.getAttribute('aria-checked'), 'true');
});

test('changing to six variables creates 64 accessible interactive cells', () => {
  const {cells, elements} = boot();
  const select = elements.get('var-count');
  select.value = '6';
  select.emit('change');
  assert.equal(cells().length, 64);
  const last = cells()[63];
  assert.equal(last.tabIndex, 0);
  assert.equal(last.getAttribute('role'), 'checkbox');
  assert.match(last.getAttribute('aria-label') || '', /^Minterm \d+/);
  last.emit('keydown', {key: 'Enter'});
  assert.equal(last.getAttribute('aria-checked'), 'true');
});

test('keyboard focus is visibly highlighted in CSS', () => {
  assert.match(html, /\.karnaugh-solver td:focus-visible\s*\{/);
});
