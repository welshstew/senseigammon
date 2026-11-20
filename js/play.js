/* Activity presentation view: play.html?a=<activity id>
   One engine for every activity type. Content comes from /content/<file>.json */
(function () {
  'use strict';
  var el = SG.el;

  var TEAM_COLOURS = [
    { name: 'Red', colour: '#c7372a' },
    { name: 'Blue', colour: '#2459c4' },
    { name: 'Green', colour: '#1d7f3c' },
    { name: 'Yellow', colour: '#e0a412' },
    { name: 'Purple', colour: '#7a3fb5' },
    { name: 'Orange', colour: '#d9641a' }
  ];

  /* ------------------------------------------------------------------
     Activity types. Each one says which file to load and how to draw
     an item. Add a new type here and a matching entry in activities.json.
     ------------------------------------------------------------------ */
  var TYPES = {
    riddles: {
      file: 'riddles.json', title: 'Riddles', emoji: '🤔', noun: 'Riddle',
      valid: function (it) { return it.question && it.answer; },
      body: function (it) { return [el('p', { class: 'big-text', text: it.question })]; },
      reveal: function (it) { return [el('p', { class: 'answer', text: it.answer })]; }
    },

    scramble: {
      file: 'scramble.json', title: 'Word scramble', emoji: '🔤', noun: 'Word',
      valid: function (it) { return it.word && String(it.word).replace(/\s/g, '').length > 1; },
      body: function (it, ctx) {
        var word = cleanWord(it.word);
        if (!ctx.scrambled) ctx.scrambled = scrambleWord(word);
        var nodes = [
          el('div', { class: 'tiles', 'aria-label': 'Scrambled letters: ' + ctx.scrambled.split('').join(' ') },
            ctx.scrambled.split('').map(function (ch) { return el('span', { class: 'tile', 'aria-hidden': 'true', text: ch }); }))
        ];
        if (!ctx.revealed) nodes.push(scrambleTimer(it, ctx));
        if (ctx.hintShown && it.hint) nodes.push(el('p', { class: 'hint', text: '💡 ' + it.hint }));
        return nodes;
      },
      reveal: function (it) {
        var word = cleanWord(it.word);
        return [el('div', { class: 'tiles tiles--answer', 'aria-label': 'Answer: ' + word },
          word.split('').map(function (ch, i) {
            return el('span', { class: 'tile', 'aria-hidden': 'true', style: { animationDelay: (i * 60) + 'ms' }, text: ch });
          }))];
      },
      hasHint: function (it) { return !!it.hint; }
    },

    'would-you-rather': {
      file: 'would-you-rather.json', title: 'Would you rather…', emoji: '⚖️', noun: 'Question',
      noReveal: true,
      valid: function (it) { return it.optionA && it.optionB; },
      body: function (it) {
        return [
          el('p', { class: 'wyr-lead', text: 'Would you rather…' }),
          el('div', { class: 'wyr' },
            el('div', { class: 'wyr-option wyr-a' }, el('span', { class: 'wyr-letter', text: 'A' }), el('span', { text: it.optionA })),
            el('div', { class: 'wyr-or', 'aria-hidden': 'true', text: 'OR' }),
            el('div', { class: 'wyr-option wyr-b' }, el('span', { class: 'wyr-letter', text: 'B' }), el('span', { text: it.optionB }))
          )
        ];
      }
    },

    'odd-one-out': {
      file: 'odd-one-out.json', title: 'Odd one out', emoji: '🔍', noun: 'Puzzle',
      valid: function (it) { return SG.toList(it.options).length >= 3 && it.answer; },
      body: function (it, ctx) {
        if (!ctx.order) ctx.order = SG.shuffle(SG.toList(it.options));
        var answer = String(it.answer).trim().toLowerCase();
        return [
          el('p', { class: 'wyr-lead', text: 'Which one is the odd one out?' }),
          el('div', { class: 'odd-grid' }, ctx.order.map(function (opt) {
            var isAnswer = String(opt).trim().toLowerCase() === answer;
            var cls = 'odd-item' + (ctx.revealed ? (isAnswer ? ' is-answer' : ' is-other') : '');
            return el('div', { class: cls }, (ctx.revealed && isAnswer ? '✓ ' : '') + opt);
          }))
        ];
      },
      reveal: function (it) {
        return it.explanation ? [el('p', { class: 'answer-note', text: it.explanation })] : [];
      }
    },

    emoji: {
      file: 'emoji.json', title: 'Emoji puzzles', emoji: '😎', noun: 'Puzzle',
      valid: function (it) { return it.emojis && it.answer; },
      body: function (it, ctx) {
        var nodes = [
          el('p', { class: 'wyr-lead', text: 'What saying or phrase is this?' }),
          el('p', { class: 'emoji-line', role: 'img', 'aria-label': 'Emoji clue', text: it.emojis })
        ];
        if (ctx.hintShown && it.hint) nodes.push(el('p', { class: 'hint', text: '💡 ' + it.hint }));
        return nodes;
      },
      reveal: function (it) { return [el('p', { class: 'answer', text: it.answer })]; },
      hasHint: function (it) { return !!it.hint; }
    },

    quiz: {
      file: 'quiz.json', title: 'Quick-fire quiz', emoji: '⚡', noun: 'Question',
      scoreboard: true,
      valid: function (it) { return it.question && it.answer; },
      body: function (it) { return [el('p', { class: 'big-text', text: it.question })]; },
      reveal: function (it) { return [el('p', { class: 'answer', text: it.answer })]; }
    }
  };

  /* ------------------------------------------------------------------ */

  var params = new URLSearchParams(location.search);
  var id = params.get('a') || '';
  var type = TYPES[id];

  var board = document.getElementById('board');
  var layout = document.getElementById('layout');
  var controls = document.getElementById('controls');
  var stage = document.getElementById('stage');
  var titleEl = document.getElementById('activity-title');
  var ageSwitch = document.getElementById('age-switch');
  var fsBtn = document.getElementById('fs-btn');
  var backLink = document.getElementById('back-link');

  var allItems = [];
  var items = [];
  var index = 0;
  var ctx = {};           // per-item state (revealed, hint, timers…)
  var ended = false;
  var band = '';          // '' = all ages
  var coffeeHref = SG.coffeeUrl({});

  // Back link keeps the homepage filters and remembers this activity
  (function () {
    var back = new URLSearchParams();
    ['time', 'age', 'group', 'energy'].forEach(function (k) { if (params.get(k)) back.set(k, params.get(k)); });
    if (id) back.set('last', id);
    backLink.href = 'index.html?' + back.toString().replace(/%2C/g, ',');
  })();

  SG.bindFullscreenButton(fsBtn, stage);
  SG.site().then(function (cfg) { coffeeHref = SG.coffeeUrl(cfg); });

  if (!type) {
    titleEl.textContent = 'Filler not found';
    board.replaceChildren(
      el('p', { class: 'big-text', text: 'Hmm, Sensei can’t find that filler.' }),
      el('a', { class: 'btn', href: 'index.html', text: '← Back to all fillers' })
    );
    document.getElementById('kbd-hint').hidden = true;
    ageSwitch.hidden = true;
    return;
  }

  /* --------------------------- Controls ----------------------------- */
  var prevBtn = el('button', { type: 'button', class: 'btn btn--ghost', text: '← Previous' });
  var hintBtn = el('button', { type: 'button', class: 'btn btn--mustard', text: '💡 Hint' });
  var revealBtn = el('button', { type: 'button', class: 'btn btn--coral', text: 'Reveal answer' });
  var nextBtn = el('button', { type: 'button', class: 'btn', text: 'Next →' });
  prevBtn.addEventListener('click', prev);
  hintBtn.addEventListener('click', showHint);
  revealBtn.addEventListener('click', toggleReveal);
  nextBtn.addEventListener('click', next);
  controls.append(prevBtn, hintBtn, revealBtn, nextBtn);
  if (type.noReveal) {
    revealBtn.remove();
    document.getElementById('kbd-hint').innerHTML =
      '<kbd>Space</kbd> or <kbd>→</kbd> next · <kbd>←</kbd> back · <kbd>F</kbd> fullscreen';
  } else if (type.hasHint) {
    document.getElementById('kbd-hint').innerHTML =
      '<kbd>Space</kbd> or <kbd>→</kbd> next · <kbd>←</kbd> back · <kbd>H</kbd> hint · <kbd>R</kbd> reveal · <kbd>F</kbd> fullscreen';
  }

  /* --------------------------- Age switch --------------------------- */
  function buildAgeSwitch() {
    var options = [{ id: '', label: 'All ages' }].concat(SG.AGE_BANDS);
    ageSwitch.replaceChildren();
    options.forEach(function (o) {
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': o.id === band ? 'true' : 'false', text: o.label });
      b.addEventListener('click', function () {
        band = o.id;
        ageSwitch.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        start();
      });
      ageSwitch.append(b);
    });
  }

  /* --------------------------- Scoreboard --------------------------- */
  var teams = [];
  var scoreboardEl = null;

  function buildScoreboard() {
    layout.className = 'quiz-layout';
    var select = el('select', { id: 'team-count' });
    for (var n = 2; n <= 6; n++) select.append(el('option', { value: String(n), text: String(n) }));
    select.value = '4';
    select.addEventListener('change', function () { setTeamCount(parseInt(select.value, 10)); });

    var list = el('ul', { class: 'teams', id: 'team-list' });
    var reset = el('button', { type: 'button', class: 'btn btn--ghost btn--small', text: 'Reset scores' });
    reset.addEventListener('click', function () { teams.forEach(function (t) { t.score = 0; }); drawTeams(); });

    scoreboardEl = el('aside', { class: 'scoreboard', 'aria-labelledby': 'score-title' },
      el('div', { class: 'scoreboard-head' },
        el('h2', { id: 'score-title', text: '🏆 Scores' }),
        el('label', { for: 'team-count' }, 'Teams', select)
      ),
      list,
      el('div', { class: 'row', style: { marginTop: '0.75rem' } }, reset)
    );
    layout.append(scoreboardEl);
    setTeamCount(4);
  }

  function setTeamCount(n) {
    while (teams.length < n) {
      var c = TEAM_COLOURS[teams.length];
      teams.push({ name: c.name, colour: c.colour, score: 0 });
    }
    teams.length = n;
    drawTeams();
  }

  function drawTeams() {
    var list = document.getElementById('team-list');
    list.replaceChildren();
    teams.forEach(function (t, i) {
      var score = el('span', { class: 'team-score', 'aria-live': 'polite', text: String(t.score) });
      var minus = el('button', { type: 'button', class: 'score-btn', 'aria-label': 'Take a point from ' + t.name, text: '−' });
      var plus = el('button', { type: 'button', class: 'score-btn score-btn--plus', 'aria-label': 'Give a point to ' + t.name, text: '+' });
      minus.addEventListener('click', function () { if (teams[i].score > 0) teams[i].score--; score.textContent = String(teams[i].score); });
      plus.addEventListener('click', function () { teams[i].score++; score.textContent = String(teams[i].score); });
      list.append(el('li', { class: 'team', style: { '--team-colour': t.colour } },
        el('span', { class: 'team-name', text: t.name }), minus, score, plus));
    });
  }

  /* --------------------------- Helpers ------------------------------ */
  function cleanWord(w) { return String(w).replace(/\s+/g, '').toUpperCase(); }

  function scrambleWord(word) {
    if (new Set(word.split('')).size < 2) return word;
    var s = word;
    for (var tries = 0; tries < 30 && s === word; tries++) s = SG.shuffle(word.split('')).join('');
    return s;
  }

  function paintTimer(node, left) {
    node.textContent = left > 0 ? '⏱ ' + left + 's' : '⏰ Time’s up!';
    node.classList.toggle('is-low', left > 0 && left <= 10);
    node.classList.toggle('is-done', left <= 0);
  }

  function scrambleTimer(it, c) {
    var secs = parseInt(it.seconds, 10) || 45;
    if (c.timeLeft === undefined) c.timeLeft = secs;
    var node = el('p', { class: 'mini-timer', role: 'timer', 'aria-label': 'Time left' });
    paintTimer(node, c.timeLeft);
    if (!c.interval && c.timeLeft > 0) {
      c.interval = setInterval(function () {
        c.timeLeft--;
        if (c.timeLeft <= 0) { clearInterval(c.interval); c.interval = null; }
        var live = board.querySelector('.mini-timer');
        if (live) paintTimer(live, c.timeLeft);
      }, 1000);
    }
    return node;
  }

  function resetCtx() {
    if (ctx.interval) clearInterval(ctx.interval);
    ctx = {};
  }

  function filtered() {
    return allItems.filter(function (it) {
      if (!band) return true;
      var ages = SG.toList(it.ages);
      return !ages.length || ages.indexOf(band) !== -1;
    });
  }

  /* --------------------------- Flow --------------------------------- */
  function start() {
    resetCtx();
    items = SG.shuffle(filtered());
    index = 0;
    ended = false;
    draw();
  }

  function draw() {
    if (ended) return drawEnd();
    controls.hidden = false;
    if (!items.length) {
      board.replaceChildren(
        el('p', { class: 'big-text', text: 'No ' + type.title.toLowerCase().replace('…', '') + ' for this age band yet.' }),
        el('p', { text: 'Try “All ages”, or add some to content/' + type.file + '.' })
      );
      controls.hidden = true;
      return;
    }
    var it = items[index];
    var counter = el('div', { class: 'board-counter' },
      el('span', { text: type.noun + ' ' + (index + 1) + ' of ' + items.length }),
      el('span', { text: band ? 'Ages ' + SG.ageLabel(band) : 'All ages' })
    );
    var body = el('div', { class: 'board-body' }, type.body(it, ctx));
    if (ctx.revealed && type.reveal) body.append.apply(body, type.reveal(it, ctx));
    board.replaceChildren(counter, body);

    prevBtn.disabled = index === 0;
    nextBtn.textContent = index === items.length - 1 ? 'Finish 🎉' : 'Next →';
    revealBtn.textContent = ctx.revealed ? 'Hide answer' : 'Reveal answer';
    var canHint = type.hasHint && type.hasHint(it) && !ctx.revealed;
    hintBtn.hidden = !canHint;
    hintBtn.disabled = !!ctx.hintShown;
  }

  function drawEnd() {
    resetCtx();
    controls.hidden = true;
    var playAgain = el('button', { type: 'button', class: 'btn btn--coral', text: '🔁 Play again' });
    playAgain.addEventListener('click', function () { start(); nextBtn.focus(); });

    var extra = null;
    if (type.scoreboard && teams.length) {
      var top = Math.max.apply(null, teams.map(function (t) { return t.score; }));
      var winners = teams.filter(function (t) { return t.score === top; });
      extra = el('p', { class: 'big-text' },
        top === 0 ? 'No points yet — that’s a draw!' :
        winners.length === 1 ? '🏆 Team ' + winners[0].name + ' wins with ' + top + '!' :
        'It’s a tie between ' + winners.map(function (w) { return w.name; }).join(' and ') + '!');
    }

    board.replaceChildren(
      el('div', { class: 'board-body end-screen' },
        el('div', { class: 'end-emoji', 'aria-hidden': 'true', text: '🎉' }),
        el('h2', { text: 'That’s all of them — well done!' }),
        extra,
        el('div', { class: 'controls' },
          playAgain,
          el('a', { class: 'btn btn--ghost', href: backLink.getAttribute('href'), text: '← Back to all fillers' })
        ),
        el('p', { class: 'coffee-line' },
          'Did that help? Sensei runs on coffee — ',
          el('a', { href: coffeeHref, target: '_blank', rel: 'noopener', text: 'buy one here ☕' }),
          ' (totally optional!)')
      )
    );
    playAgain.focus();
  }

  function next() {
    if (ended || !items.length) return;
    if (index >= items.length - 1) { ended = true; draw(); return; }
    resetCtx();
    index++;
    draw();
  }

  function prev() {
    if (!items.length) return;
    if (ended) { ended = false; index = items.length - 1; resetCtx(); draw(); return; }
    if (index === 0) return;
    resetCtx();
    index--;
    draw();
  }

  function toggleReveal() {
    if (ended || type.noReveal || !items.length) return;
    ctx.revealed = !ctx.revealed;
    if (ctx.revealed && ctx.interval) { clearInterval(ctx.interval); ctx.interval = null; }
    draw();
  }

  function showHint() {
    if (ended || !items.length) return;
    var it = items[index];
    if (!type.hasHint || !type.hasHint(it) || ctx.revealed) return;
    ctx.hintShown = true;
    draw();
  }

  /* --------------------------- Keyboard ----------------------------- */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || SG.isTyping(e)) return;
    var k = e.key;
    if (k === ' ' || k === 'Spacebar' || k === 'ArrowRight') {
      e.preventDefault();
      if (!ended) next();
    } else if (k === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (k === 'r' || k === 'R') {
      toggleReveal();
    } else if (k === 'h' || k === 'H') {
      showHint();
    } else if (k === 'f' || k === 'F') {
      SG.toggleFullscreen(stage);
    }
  });
  // Stop Space from also "clicking" whichever button has focus.
  document.addEventListener('keyup', function (e) {
    if ((e.key === ' ' || e.key === 'Spacebar') && !SG.isTyping(e)) e.preventDefault();
  });

  /* --------------------------- Load --------------------------------- */
  var initialAge = params.get('age') || '';
  if (initialAge && initialAge.indexOf(',') === -1 && SG.AGE_BANDS.some(function (b) { return b.id === initialAge; })) {
    band = initialAge;
  }

  Promise.all([
    SG.loadJSON('activities.json').catch(function () { return { items: [] }; }),
    SG.loadJSON(type.file)
  ]).then(function (res) {
    var meta = (res[0].items || []).filter(function (a) { return a.id === id; })[0] || {};
    var title = meta.title || type.title;
    var emoji = meta.emoji || type.emoji;
    titleEl.replaceChildren(el('span', { 'aria-hidden': 'true', text: emoji }), el('span', { text: title }));
    document.title = title + ' — Sensei Gammon';

    allItems = (res[1].items || []).filter(function (it) { return it && type.valid(it); });
    buildAgeSwitch();
    if (type.scoreboard) buildScoreboard();
    start();
  }).catch(function (err) {
    titleEl.textContent = type.title;
    controls.hidden = true;
    SG.loadError(board, err);
  });
})();
