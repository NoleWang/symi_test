(() => {
  'use strict';

  const SIZE = 4;
  const WIN_VALUE = 2048;

  const boardEl = document.getElementById('board');
  const tilesEl = document.getElementById('tiles');
  const gridBgEl = document.getElementById('grid-bg');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const overlayEl = document.getElementById('overlay');
  const overlayTextEl = document.getElementById('overlay-text');
  const overlayBtnEl = document.getElementById('overlay-btn');
  const overlayBtn2El = document.getElementById('overlay-btn-2');

  const rootStyle = getComputedStyle(document.documentElement);
  const CELL = parseFloat(rootStyle.getPropertyValue('--cell-size'));
  const GAP = parseFloat(rootStyle.getPropertyValue('--gap'));

  let board = [];
  let tiles = [];
  let score = 0;
  let best = parseInt(localStorage.getItem('2048-best') || '0', 10);
  let nextId = 1;
  let won = false;
  let over = false;

  const tileEls = new Map(); // tile id -> DOM element

  function createBoard() {
    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  }

  function pos(r, c) {
    return { left: GAP + c * (CELL + GAP), top: GAP + r * (CELL + GAP) };
  }

  function spawnTile() {
    const empty = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!board[r][c]) empty.push([r, c]);
      }
    }
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const tile = { id: nextId++, value: Math.random() < 0.9 ? 2 : 4, row: r, col: c, isNew: true, isMerged: false };
    board[r][c] = tile;
    tiles.push(tile);
  }

  function removeTile(tile) {
    tiles = tiles.filter(t => t.id !== tile.id);
    board[tile.row][tile.col] = null;
  }

  function rebuildBoard() {
    createBoard();
    for (const t of tiles) board[t.row][t.col] = t;
  }

  function move(dir) {
    if (over) return;
    const { dr, dc } = dir;
    let moved = false;

    const lineSpecs = [];
    if (dc !== 0) {
      for (let r = 0; r < SIZE; r++) {
        const entries = [];
        for (let i = 0; i < SIZE; i++) {
          const c = dc === 1 ? SIZE - 1 - i : i;
          entries.push({ tile: board[r][c], row: r, col: c });
        }
        lineSpecs.push(entries);
      }
    } else {
      for (let c = 0; c < SIZE; c++) {
        const entries = [];
        for (let i = 0; i < SIZE; i++) {
          const r = dr === 1 ? SIZE - 1 - i : i;
          entries.push({ tile: board[r][c], row: r, col: c });
        }
        lineSpecs.push(entries);
      }
    }

    for (const entries of lineSpecs) {
      const present = entries.filter(e => e.tile !== null);
      let target = 0;
      for (let i = 0; i < present.length; i++) {
        const { tile } = present[i];
        const next = present[i + 1];
        const dest = entries[target];
        if (next && next.tile && tile.value === next.tile.value) {
          tile.value *= 2;
          score += tile.value;
          tile.isMerged = true;
          removeTile(next.tile);
          i++;
          moved = true; // a merge always counts as a move, even in place
          tile.row = dest.row;
          tile.col = dest.col;
          target++;
        } else {
          if (tile.row !== dest.row || tile.col !== dest.col) moved = true;
          tile.row = dest.row;
          tile.col = dest.col;
          target++;
        }
      }
    }

    if (moved) {
      rebuildBoard();
      spawnTile();
      render();
      updateScore();
      checkEnd();
    }
  }

  function render() {
    const seen = new Set();
    for (const t of tiles) {
      seen.add(t.id);
      let el = tileEls.get(t.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'tile';
        tileEls.set(t.id, el);
        tilesEl.appendChild(el);
      }
      const p = pos(t.row, t.col);
      el.style.left = p.left + 'px';
      el.style.top = p.top + 'px';
      el.dataset.value = t.value > WIN_VALUE ? 'super' : String(t.value);
      el.textContent = t.value;
      const digits = String(t.value).length;
      el.style.fontSize = digits <= 2 ? '' : digits === 3 ? '34px' : digits === 4 ? '28px' : '22px';
      el.classList.toggle('tile-new', !!t.isNew);
      el.classList.toggle('tile-merged', !!t.isMerged);
      t.isNew = false;
      t.isMerged = false;
    }
    for (const [id, el] of tileEls) {
      if (!seen.has(id)) {
        el.remove();
        tileEls.delete(id);
      }
    }
  }

  function updateScore() {
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      localStorage.setItem('2048-best', String(best));
    }
    bestEl.textContent = best;
    scoreEl.classList.remove('score-pop');
    void scoreEl.offsetWidth; // restart animation
    scoreEl.classList.add('score-pop');
  }

  function checkEnd() {
    if (!won && tiles.some(t => t.value >= WIN_VALUE)) {
      won = true;
      showOverlay('You Win! 🎉', 'Keep Going', 'New Game');
      return;
    }
    if (isGameOver()) {
      over = true;
      showOverlay('Game Over', null, 'Try Again');
    }
  }

  function isGameOver() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = board[r][c];
        if (!v) return false;
        if (c + 1 < SIZE && board[r][c + 1] && board[r][c + 1].value === v.value) return false;
        if (r + 1 < SIZE && board[r + 1][c] && board[r + 1][c].value === v.value) return false;
      }
    }
    return true;
  }

  function showOverlay(text, btn1, btn2) {
    overlayTextEl.textContent = text;
    overlayBtnEl.textContent = btn1 || '';
    overlayBtnEl.style.display = btn1 ? 'inline-block' : 'none';
    overlayBtn2El.textContent = btn2 || '';
    overlayBtn2El.style.display = btn2 ? 'inline-block' : 'none';
    overlayEl.classList.remove('hidden');
  }

  function hideOverlay() {
    overlayEl.classList.add('hidden');
  }

  function newGame() {
    createBoard();
    tiles = [];
    tileEls.forEach(el => el.remove());
    tileEls.clear();
    score = 0;
    won = false;
    over = false;
    hideOverlay();
    spawnTile();
    spawnTile();
    updateScore();
    render();
  }

  // ---- Input ----
  const KEYMAP = {
    ArrowLeft: { dr: 0, dc: -1 },
    ArrowRight: { dr: 0, dc: 1 },
    ArrowUp: { dr: -1, dc: 0 },
    ArrowDown: { dr: 1, dc: 0 },
    a: { dr: 0, dc: -1 }, A: { dr: 0, dc: -1 },
    d: { dr: 0, dc: 1 }, D: { dr: 0, dc: 1 },
    w: { dr: -1, dc: 0 }, W: { dr: -1, dc: 0 },
    s: { dr: 1, dc: 0 }, S: { dr: 1, dc: 0 }
  };

  document.addEventListener('keydown', (e) => {
    const dir = KEYMAP[e.key];
    if (dir) {
      e.preventDefault();
      move(dir);
    }
  });

  // Touch swipe
  let touchStart = null;
  boardEl.addEventListener('touchstart', (e) => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  boardEl.addEventListener('touchmove', (e) => {
    if (touchStart) e.preventDefault();
  }, { passive: false });

  boardEl.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < 24) return;
    if (ax > ay) move(dx > 0 ? { dr: 0, dc: 1 } : { dr: 0, dc: -1 });
    else move(dy > 0 ? { dr: 1, dc: 0 } : { dr: -1, dc: 0 });
  }, { passive: true });

  document.getElementById('new-game').addEventListener('click', newGame);
  overlayBtnEl.addEventListener('click', newGame);
  overlayBtn2El.addEventListener('click', newGame);

  // ---- Init ----
  gridBgEl.innerHTML = '<div></div>'.repeat(SIZE * SIZE);
  bestEl.textContent = best;
  newGame();
})();
