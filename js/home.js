/* Homepage: filters, activity cards and the Random filler button. */
(function () {
  'use strict';
  var el = SG.el;

  var FILTERS = [
    { key: 'time', field: 'minutes', legend: 'Time', options: [
      { id: '2', label: '2 min' }, { id: '5', label: '5 min' },
      { id: '10', label: '10 min' }, { id: '15+', label: '15+ min' }
    ] },
    { key: 'age', field: 'ages', legend: 'Age band', options: SG.AGE_BANDS },
    { key: 'group', field: 'groups', legend: 'Group', options: [
      { id: 'class', label: 'Whole class' }, { id: 'teams', label: 'Teams' }, { id: 'solo', label: 'Quiet / solo' }
    ] },
    { key: 'energy', field: 'energy', legend: 'Energy', options: [
      { id: 'calm', label: '😌 Calm' }, { id: 'lively', label: '⚡ Lively' }
    ] }
  ];
  var LABELS = {
    groups: { class: 'Whole class', teams: 'Teams', solo: 'Quiet / solo' },
    energy: { calm: 'Calm', lively: 'Lively' }
  };

  var state = {};          // key -> Set of selected option ids
  var lastId = null;       // last activity opened (so Random never repeats it)
  var activities = [];

  var grid = document.getElementById('activity-grid');
  var filtersBox = document.getElementById('filters');
  var countEl = document.getElementById('result-count');
  var randomBtn = document.getElementById('random-btn');
  var randomNote = document.getElementById('random-note');
  var clearBtn = document.getElementById('clear-filters');

  var asList = SG.toList;

  function readUrl() {
    var params = new URLSearchParams(location.search);
    FILTERS.forEach(function (f) {
      var valid = f.options.map(function (o) { return o.id; });
      var raw = (params.get(f.key) || '').split(',').filter(function (v) { return valid.indexOf(v) !== -1; });
      state[f.key] = new Set(raw);
    });
    lastId = params.get('last');
  }

  function filterQuery() {
    var params = new URLSearchParams();
    FILTERS.forEach(function (f) {
      if (state[f.key].size) params.set(f.key, Array.from(state[f.key]).join(','));
    });
    return params;
  }

  function writeUrl() {
    var params = filterQuery();
    if (lastId) params.set('last', lastId);
    var qs = params.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  }

  function playUrl(id) {
    var params = filterQuery();
    params.set('a', id);
    return 'play.html?' + params.toString().replace(/%2C/g, ',');
  }

  function matches(activity) {
    return FILTERS.every(function (f) {
      var chosen = state[f.key];
      if (!chosen.size) return true;
      return asList(activity[f.field]).some(function (v) { return chosen.has(v); });
    });
  }

  function buildFilters() {
    filtersBox.replaceChildren();
    FILTERS.forEach(function (f) {
      var chips = el('div', { class: 'chips' });
      f.options.forEach(function (o) {
        var btn = el('button', {
          type: 'button',
          class: 'chip',
          'aria-pressed': state[f.key].has(o.id) ? 'true' : 'false',
          'data-key': f.key,
          'data-value': o.id,
          text: o.label
        });
        btn.addEventListener('click', function () {
          var set = state[f.key];
          if (set.has(o.id)) set.delete(o.id); else set.add(o.id);
          btn.setAttribute('aria-pressed', set.has(o.id) ? 'true' : 'false');
          randomNote.textContent = '';
          writeUrl();
          render();
        });
        chips.append(btn);
      });
      filtersBox.append(el('fieldset', { class: 'chip-group' }, el('legend', { text: f.legend }), chips));
    });
  }

  function minutesLabel(list) {
    var m = asList(list);
    if (!m.length) return '';
    if (m.length === 1) return m[0] + ' min';
    return m[0] + '–' + m[m.length - 1].replace('+', '') + (m[m.length - 1].indexOf('+') !== -1 ? '+' : '') + ' min';
  }

  function card(a) {
    var tags = [];
    var mins = minutesLabel(a.minutes);
    if (mins) tags.push(el('li', { class: 'tag tag--time' }, '⏱ ' + mins));
    tags.push(el('li', { class: 'tag tag--age' }, 'Ages ' + asList(a.ages).map(SG.ageLabel).join(', ')));
    asList(a.groups).forEach(function (g) { tags.push(el('li', { class: 'tag' }, LABELS.groups[g] || g)); });
    asList(a.energy).forEach(function (e) { tags.push(el('li', { class: 'tag tag--energy' }, LABELS.energy[e] || e)); });

    var link = el('a', { href: playUrl(a.id), text: a.title });
    link.addEventListener('click', function () { lastId = a.id; writeUrl(); });

    return el('li', null,
      el('article', { class: 'card' },
        el('div', { class: 'card-emoji', 'aria-hidden': 'true', text: a.emoji || '⭐' }),
        el('h3', null, link),
        el('p', { text: a.description || '' }),
        el('ul', { class: 'card-meta', 'aria-label': 'Details' }, tags)
      )
    );
  }

  function visible() { return activities.filter(matches); }

  function render() {
    var list = visible();
    grid.replaceChildren();
    if (!list.length) {
      grid.append(el('li', { style: { gridColumn: '1 / -1' } },
        el('div', { class: 'empty-state' },
          el('p', { text: 'No fillers match all of those filters. Try switching one off.' }),
          el('button', { type: 'button', class: 'btn btn--ghost', text: 'Clear filters', onclick: clearAll })
        )));
    } else {
      list.forEach(function (a) { grid.append(card(a)); });
    }
    var anyFilter = FILTERS.some(function (f) { return state[f.key].size; });
    countEl.textContent = anyFilter
      ? list.length + ' of ' + activities.length + ' fillers match'
      : activities.length + ' fillers';
    clearBtn.hidden = !anyFilter;
  }

  function clearAll() {
    FILTERS.forEach(function (f) { state[f.key].clear(); });
    filtersBox.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    randomNote.textContent = '';
    writeUrl();
    render();
  }

  function pickRandom() {
    var list = visible();
    if (!list.length) {
      randomNote.textContent = 'No fillers match your filters — try clearing one.';
      return;
    }
    var pool = list.filter(function (a) { return a.id !== lastId; });
    if (!pool.length) {
      var only = list[0];
      randomNote.replaceChildren(
        'Only “' + only.title + '” matches, and you just played it. Clear a filter for something new, or ',
        el('a', { href: playUrl(only.id), text: 'play it again' }), '.'
      );
      return;
    }
    var choice = pool[Math.floor(Math.random() * pool.length)];
    lastId = choice.id;
    writeUrl();
    randomBtn.disabled = true;
    randomBtn.textContent = '🎲 Rolling…';
    randomNote.textContent = (choice.emoji || '') + ' ' + choice.title + '!';
    setTimeout(function () { location.href = playUrl(choice.id); }, 450);
  }

  // Re-enable the button if the user comes back with the browser Back button.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    randomBtn.disabled = false;
    randomBtn.textContent = '🎲 Random filler';
  });

  randomBtn.addEventListener('click', pickRandom);
  clearBtn.addEventListener('click', clearAll);

  readUrl();
  buildFilters();
  randomBtn.disabled = true;

  SG.loadJSON('activities.json').then(function (data) {
    activities = (data.items || []).filter(function (a) { return a && a.id && a.title; });
    randomBtn.disabled = false;
    render();
  }).catch(function (err) {
    SG.loadError(grid, err);
  });
})();
