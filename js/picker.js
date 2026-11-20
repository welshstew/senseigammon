/* Random name picker. Names live in memory (the textarea) only — never stored. */
(function () {
  'use strict';
  var namesBox = document.getElementById('names');
  var removePicked = document.getElementById('remove-picked');
  var resetBtn = document.getElementById('reset-picks');
  var clearBtn = document.getElementById('clear-names');
  var pickBtn = document.getElementById('pick-btn');
  var picked = document.getElementById('picked');
  var countEl = document.getElementById('pick-count');
  var stage = document.getElementById('stage');

  var used = new Set();
  var spinning = false;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  SG.bindFullscreenButton(document.getElementById('fs-btn'), stage);

  function names() {
    var seen = new Set();
    return namesBox.value.split(/[\n,]+/).map(function (n) { return n.trim(); }).filter(function (n) {
      if (!n || seen.has(n.toLowerCase())) return false;
      seen.add(n.toLowerCase());
      return true;
    });
  }

  function pool() {
    var all = names();
    return removePicked.checked ? all.filter(function (n) { return !used.has(n); }) : all;
  }

  function updateCount() {
    var all = names();
    var left = pool().length;
    var text;
    if (!all.length) text = 'Add some names to start';
    else if (removePicked.checked) text = left + ' of ' + all.length + ' still to pick';
    else text = all.length + ' names in the hat';
    countEl.replaceChildren(SG.el('span', { text: text }));
    pickBtn.disabled = !all.length || spinning;
  }

  function pick() {
    if (spinning) return;
    var all = names();
    if (!all.length) { namesBox.focus(); return; }
    var p = pool();
    if (!p.length) {
      picked.className = 'picked-name';
      picked.textContent = 'Everyone’s had a turn! 🎉';
      return;
    }
    var choice = p[Math.floor(Math.random() * p.length)];
    if (removePicked.checked) used.add(choice);

    if (reduceMotion || all.length < 2) return land(choice);
    spinning = true;
    pickBtn.disabled = true;
    picked.className = 'picked-name is-spinning';
    var steps = 12, i = 0;
    (function spin() {
      picked.textContent = all[Math.floor(Math.random() * all.length)];
      i++;
      if (i < steps) setTimeout(spin, 40 + i * 8);
      else land(choice);
    })();
  }

  function land(name) {
    spinning = false;
    picked.className = 'picked-name is-final';
    picked.textContent = name;
    updateCount();
  }

  namesBox.addEventListener('input', function () {
    var current = new Set(names());
    used.forEach(function (n) { if (!current.has(n)) used.delete(n); });
    updateCount();
  });
  removePicked.addEventListener('change', updateCount);
  resetBtn.addEventListener('click', function () { used.clear(); picked.className = 'picked-name'; picked.textContent = '?'; updateCount(); });
  clearBtn.addEventListener('click', function () { namesBox.value = ''; used.clear(); picked.className = 'picked-name'; picked.textContent = '?'; updateCount(); namesBox.focus(); });
  pickBtn.addEventListener('click', pick);

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || SG.isTyping(e)) return;
    if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); pick(); }
    else if (e.key === 'f' || e.key === 'F') SG.toggleFullscreen(stage);
  });
  document.addEventListener('keyup', function (e) {
    if ((e.key === ' ' || e.key === 'Spacebar') && !SG.isTyping(e)) e.preventDefault();
  });

  updateCount();
})();
