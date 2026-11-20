/* Team generator. Names live in memory only — never stored. */
(function () {
  'use strict';
  var el = SG.el;
  var namesBox = document.getElementById('names');
  var amount = document.getElementById('amount');
  var headcount = document.getElementById('headcount');
  var makeBtn = document.getElementById('make-btn');
  var board = document.getElementById('team-board');
  var stage = document.getElementById('stage');

  var COLOURS = ['#c7372a', '#2459c4', '#1d7f3c', '#e0a412', '#7a3fb5', '#d9641a', '#0b6e69', '#b0306b'];
  var TEAM_NAMES = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Teal', 'Pink'];

  SG.bindFullscreenButton(document.getElementById('fs-btn'), stage);

  function names() {
    var seen = new Set();
    return namesBox.value.split(/[\n,]+/).map(function (n) { return n.trim(); }).filter(function (n) {
      if (!n || seen.has(n.toLowerCase())) return false;
      seen.add(n.toLowerCase());
      return true;
    });
  }

  function mode() {
    return document.querySelector('input[name="mode"]:checked').value;
  }

  function make() {
    var people = names();
    var numbered = false;
    if (!people.length) {
      var n = Math.min(60, Math.max(2, parseInt(headcount.value, 10) || 30));
      people = [];
      for (var i = 1; i <= n; i++) people.push('Pupil ' + i);
      numbered = true;
    }
    var amt = Math.max(1, parseInt(amount.value, 10) || 2);
    var teamCount = mode() === 'count' ? amt : Math.ceil(people.length / amt);
    teamCount = Math.max(1, Math.min(teamCount, people.length));

    var shuffled = SG.shuffle(people);
    var teams = [];
    for (var t = 0; t < teamCount; t++) teams.push([]);
    shuffled.forEach(function (p, idx) { teams[idx % teamCount].push(p); });

    var cols = el('div', { class: 'team-cols' }, teams.map(function (members, t) {
      var label = t < TEAM_NAMES.length ? 'Team ' + TEAM_NAMES[t] : 'Team ' + (t + 1);
      return el('section', { class: 'team-col', style: { '--team-colour': COLOURS[t % COLOURS.length] } },
        el('h3', { text: label + ' (' + members.length + ')' }),
        el('ul', null, members.map(function (m) { return el('li', { text: m }); }))
      );
    }));

    board.replaceChildren(
      el('p', { class: 'board-counter' },
        el('span', { text: teamCount + ' teams · ' + people.length + (numbered ? ' pupils' : ' names') }),
        el('span', { text: numbered ? 'Numbered (no names entered)' : '' })),
      cols,
      el('div', { class: 'controls' },
        el('button', { type: 'button', class: 'btn btn--coral', text: '🔁 Shuffle again', onclick: make }))
    );
  }

  makeBtn.addEventListener('click', make);
  document.querySelectorAll('input[name="mode"]').forEach(function (r) {
    r.addEventListener('change', function () {
      amount.value = mode() === 'count' ? '4' : '5';
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || SG.isTyping(e)) return;
    if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); make(); }
    else if (e.key === 'f' || e.key === 'F') SG.toggleFullscreen(stage);
  });
  document.addEventListener('keyup', function (e) {
    if ((e.key === ' ' || e.key === 'Spacebar') && !SG.isTyping(e)) e.preventDefault();
  });
})();
