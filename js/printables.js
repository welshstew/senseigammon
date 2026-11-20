/* Printables list, read from content/printables.json */
(function () {
  'use strict';
  var el = SG.el;
  var list = document.getElementById('printable-list');
  var ageSwitch = document.getElementById('age-switch');
  var items = [];
  var band = '';

  function asList(v) { return Array.isArray(v) ? v : (v ? [v] : []); }

  function buildSwitch() {
    [{ id: '', label: 'All ages' }].concat(SG.AGE_BANDS).forEach(function (o) {
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': o.id === band ? 'true' : 'false', text: o.label });
      b.addEventListener('click', function () {
        band = o.id;
        ageSwitch.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        render();
      });
      ageSwitch.append(b);
    });
  }

  function render() {
    var shown = items.filter(function (p) { return !band || asList(p.ages).indexOf(band) !== -1; });
    list.replaceChildren();
    if (!shown.length) {
      list.append(el('li', { class: 'printable' }, el('p', { text: 'No printables for this age band yet — check back soon!' })));
      return;
    }
    shown.forEach(function (p) {
      list.append(el('li', { class: 'printable' },
        el('div', null,
          el('h3', { text: p.title }),
          p.description ? el('p', { text: p.description }) : null,
          el('span', { class: 'tag tag--age', text: 'Ages ' + asList(p.ages).map(SG.ageLabel).join(', ') })
        ),
        el('a', { class: 'btn', href: p.pdf, target: '_blank', rel: 'noopener', text: '⬇ Download PDF' })
      ));
    });
  }

  buildSwitch();
  SG.loadJSON('printables.json').then(function (data) {
    items = (data.items || []).filter(function (p) { return p && p.title && p.pdf; });
    render();
  }).catch(function (err) { SG.loadError(list, err); });
})();
