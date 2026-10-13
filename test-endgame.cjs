// Verifies the END-GAME paths of the REAL game.js: game-over detection,
// overlay display, input lockout after game over, and New Game reset.
'use strict';
const fs = require('fs');
const vm = require('vm');

function makeEl(id) {
  const el = {
    id, style: {}, dataset: {}, textContent: '', children: [], parent: null,
    classList: {
      _set: new Set(),
      toggle(c, on) { on ? this._set.add(c) : this._set.delete(c); },
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); },
    },
    appendChild(child) { child.parent = el; el.children.push(child); },
    remove() { if (el.parent) { const i = el.parent.children.indexOf(el); if (i >= 0) el.parent.children.splice(i, 1); } },
    addEventListener(ev, fn) { el._listeners = el._listeners || {}; (el._listeners[ev] = el._listeners[ev] || []).push(fn); },
    innerHTML: '', offsetWidth: 0,
  };
  return el;
}

const ids = ['board', 'tiles', 'grid-bg', 'score', 'best', 'overlay', 'overlay-text', 'overlay-btn', 'overlay-btn-2', 'new-game'];
const els = {};
for (const id of ids) els[id] = makeEl(id);

const docListeners = {};
const localStorage = {
  _s: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; },
  setItem(k, v) { this._s[k] = String(v); },
};

const document = {
  getElementById(id) { return els[id]; },
  addEventListener(ev, fn) { docListeners[ev] = fn; },
  createElement() { return makeEl('dyn'); },
};

const context = {
  document, localStorage,
  getComputedStyle: () => ({ getPropertyValue: (p) => (p === '--cell-size' ? '88px' : '16px') }),
  console, Math, Set, Map, String, Number, parseFloat, parseInt, Array, Object, Boolean, Symbol, JSON, Date,
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname + '/game.js', 'utf8'), context);

function press(key) { docListeners.keydown({ key, preventDefault() {} }); }
function fire(el, ev) { for (const fn of (el._listeners && el._listeners[ev]) || []) fn({}); }
function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }
function tileCount() { return els['tiles'].children.length; }

// --- Play random moves until game over ---
const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'];
let moves = 0;
while (!els['overlay'].classList.contains('hidden') === false && moves < 200000) {
  // loop until overlay visible
  press(keys[Math.floor(Math.random() * keys.length)]);
  moves++;
  if (els['overlay'].classList.contains('hidden') === false) break;
}
assert(!els['overlay'].classList.contains('hidden'), 'overlay never appeared after 200k moves');
assert(els['overlay-text'].textContent === 'Game Over', `expected "Game Over", got "${els['overlay-text'].textContent}"`);
assert(els['overlay-btn'].style.display === 'none', 'primary button should be hidden on game over');
assert(els['overlay-btn-2'].style.display === 'inline-block', 'Try Again button should be visible');
console.log(`Game over reached after ${moves} moves — overlay shown, buttons correct.`);

// --- Input lockout: moves after game over must not change the board ---
const frozenTiles = tileCount();
const frozenScore = els['score'].textContent;
for (let i = 0; i < 50; i++) press(keys[Math.floor(Math.random() * keys.length)]);
assert(tileCount() === frozenTiles, 'board changed after game over — input not locked');
assert(els['score'].textContent === frozenScore, 'score changed after game over — input not locked');
console.log('Input locked after game over (50 moves, board+score unchanged).');

// --- New Game button resets everything ---
fire(els['new-game'], 'click');
assert(els['overlay'].classList.contains('hidden'), 'overlay not hidden after New Game');
assert(tileCount() === 2, `expected 2 tiles after New Game, got ${tileCount()}`);
assert(String(els['score'].textContent) === '0', `score not reset, got ${els['score'].textContent}`);
console.log('New Game resets board to 2 tiles, score 0, overlay hidden.');

// --- Moves work again after reset ---
press('ArrowLeft');
assert(tileCount() === 3, `expected 3 tiles after one move post-reset, got ${tileCount()}`);
console.log('Game playable again after reset.');

console.log('PASS: end-game paths verified — game-over, lockout, reset, replay all work.');
