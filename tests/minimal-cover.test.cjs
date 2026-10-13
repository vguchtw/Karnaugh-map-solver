'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

// Evaluate the real browser solver, stopping before DOM event registration.
const html = fs.readFileSync(path.join(__dirname, '..', 'solver.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1);
const script = scripts[0][1];
const marker = script.indexOf('// UI bindings');
assert.ok(marker > 0);
const context = {};
vm.runInNewContext(script.slice(0, marker) + `
  globalThis.__solverTest = {
    setVariables(n) { numVars = n; },
    computeSOP, computePOS, findPrimeImplicants, selectPrimeImplicants
  };
})();`, context, { filename: 'solver.html' });
const logic = context.__solverTest;

function matches(term, minterm, vars) {
  const bits = minterm.toString(2).padStart(vars, '0');
  return [...term].every((bit, index) => bit === '-' || bit === bits[index]);
}
function validate(minterms, vars) {
  logic.setVariables(vars);
  const sop = logic.computeSOP(minterms);
  const pos = logic.computePOS(minterms);
  for (let m = 0; m < 1 << vars; m++) {
    const expected = minterms.includes(m);
    const sopValue = sop.type === 'const' ? sop.value === '1' : sop.terms.some(t => matches(t, m, vars));
    const posValue = pos.type === 'const' ? pos.value === '1' : !pos.terms.some(t => matches(t, m, vars));
    assert.equal(sopValue, expected, `SOP vars=${vars} m=${m}`);
    assert.equal(posValue, expected, `POS vars=${vars} m=${m}`);
  }
  return { sop, pos };
}

test('four-variable counterexample uses four SOP implicants, not five', () => {
  const ones = [1, 2, 4, 5, 6, 8, 9, 10];
  assert.equal(validate(ones, 4).sop.terms.length, 4);
});
test('all 2/3-variable truth tables preserve SOP/POS truth values', () => {
  for (const vars of [2, 3]) {
    for (let mask = 0; mask < 1 << (1 << vars); mask++) {
      const ones = Array.from({ length: 1 << vars }, (_, i) => i).filter(i => mask & (1 << i));
      validate(ones, vars);
    }
  }
});
test('sampled 4/5/6-variable truth tables preserve truth values and repeatability', () => {
  let seed = 0x9e3779b9;
  const next = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0; };
  for (const [vars, count] of [[4, 200], [5, 100], [6, 40]]) {
    for (let trial = 0; trial < count; trial++) {
      const ones = Array.from({ length: 1 << vars }, (_, i) => i).filter(() => next() % 5 < 2);
      const before = ones.join(',');
      const { sop, pos } = validate(ones, vars);
      assert.equal(ones.join(','), before);
      const again = validate(ones, vars);
      assert.equal(again.sop.value, sop.value);
      assert.equal(again.pos.value, pos.value);
    }
  }
});
test('four-variable selected covers match an independent exact-cover oracle', () => {
  let seed = 123456789;
  const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
  for (let trial = 0; trial < 250; trial++) {
    const mask = next() & 0xffff;
    const ones = Array.from({ length: 16 }, (_, i) => i).filter(i => mask & (1 << i));
    if (!ones.length || ones.length === 16) continue;
    const primes = logic.findPrimeImplicants(ones, 4);
    if (primes.length > 17) continue;
    const chosen = logic.selectPrimeImplicants(primes, ones);
    const cost = arr => [arr.length, arr.reduce((n, p) => n + p.term.replace(/-/g, '').length, 0)];
    let oracle = [Infinity, Infinity];
    for (let subset = 1; subset < 1 << primes.length; subset++) {
      const selected = primes.filter((_, i) => subset & (1 << i));
      if (selected.length > oracle[0]) continue;
      if (!ones.every(m => selected.some(p => matches(p.term, m, 4)))) continue;
      const score = cost(selected);
      if (score[0] < oracle[0] || (score[0] === oracle[0] && score[1] < oracle[1])) oracle = score;
    }
    assert.deepEqual(cost(chosen), oracle, `mask=${mask}`);
  }
});


test('structured and deterministic six-variable maps preserve SOP/POS equivalence', () => {
  const all = Array.from({ length: 64 }, (_, i) => i);
  const samples = [
    [], all, [29], all.filter(i => i !== 29),
    all.filter(i => i % 2 === 0),
    all.filter(i => i % 2 === 1),
    all.filter(i => i < 32),
    all.filter(i => i.toString(2).replace(/0/g, '').length % 2 === 0),
  ];
  let seed = 0x05c4ea17;
  const next = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0; };
  for (let k = 0; k < 48; k++) {
    const threshold = k % 3 + 2;
    samples.push(all.filter(() => next() % 7 < threshold));
  }
  for (const ones of samples) {
    const { sop, pos } = validate(ones, 6);
    const again = validate(ones, 6);
    assert.deepEqual([...again.sop.terms], [...sop.terms]);
    assert.deepEqual([...(again.pos.terms || [])], [...(pos.terms || [])]);
  }
});
