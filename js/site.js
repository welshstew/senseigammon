/* Sensei Gammon — shared helpers used by every page.
   No cookies, no storage, no tracking. Everything stays in memory. */
(function () {
  'use strict';

  var AGE_BANDS = [
    { id: '8-11', label: '8–11' },
    { id: '11-14', label: '11–14' },
    { id: '14-17', label: '14–17' }
  ];

  var sitePromise = null;

  /** Load a JSON file from /content/ (relative path, works on any host). */
  function loadJSON(name) {
    return fetch('content/' + name, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error('Could not load content/' + name + ' (' + res.status + ')');
      return res.json();
    });
  }

  function site() {
    if (!sitePromise) {
      sitePromise = loadJSON('site.json').catch(function () { return {}; });
    }
    return sitePromise;
  }

  function coffeeUrl(cfg) {
    var name = (cfg && cfg.buyMeACoffeeUsername ? String(cfg.buyMeACoffeeUsername) : 'BMC_USERNAME').trim();
    return 'https://buymeacoffee.com/' + encodeURIComponent(name || 'BMC_USERNAME');
  }

  /** Point every <a data-coffee> at the Buy Me a Coffee page from site.json. */
  function applyCoffeeLinks(root) {
    return site().then(function (cfg) {
      var url = coffeeUrl(cfg);
      (root || document).querySelectorAll('a[data-coffee]').forEach(function (a) {
        a.href = url;
        a.rel = 'noopener';
        a.target = '_blank';
      });
    });
  }

  /** Fisher–Yates shuffle (returns a new array). */
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /** Tiny element builder: el('p', {class: 'x'}, 'text', childNode) */
  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x) node.append(x); });
      else node.append(c);
    }
    return node;
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function toggleFullscreen(target) {
    if (fullscreenElement()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    var req = target.requestFullscreen || target.webkitRequestFullscreen;
    if (req) {
      var p = req.call(target);
      if (p && p.catch) p.catch(function () { /* user agent refused; ignore */ });
    }
  }

  /** Wire a fullscreen button and keep its label in sync. */
  function bindFullscreenButton(button, target) {
    function sync() {
      var on = !!fullscreenElement();
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.innerHTML = on ? '⤡ Exit fullscreen' : '⛶ Fullscreen';
    }
    if (!(target.requestFullscreen || target.webkitRequestFullscreen)) {
      button.hidden = true;
      return;
    }
    button.addEventListener('click', function () { toggleFullscreen(target); });
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    sync();
  }

  /** True when a key press should be left alone (typing in a field). */
  function isTyping(e) {
    var t = e.target;
    if (!t || !t.tagName) return false;
    var tag = t.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
  }

  /** Accept a list (["8-11","11-14"]), a single value, or a comma string ("8-11, 11-14"). */
  function toList(v) {
    if (Array.isArray(v)) return v.map(function (x) { return String(x).trim(); }).filter(Boolean);
    if (v === undefined || v === null || v === '') return [];
    return String(v).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  }

  /** Make a content path relative to the site root ("/printables/x.pdf" -> "printables/x.pdf"). */
  function relPath(p) {
    p = String(p || '').trim();
    if (/^[a-z]+:\/\//i.test(p)) return p;   // full URL: leave alone
    return p.replace(/^(\.\/|\/)+/, '');
  }

  function ageLabel(id) {
    for (var i = 0; i < AGE_BANDS.length; i++) if (AGE_BANDS[i].id === id) return AGE_BANDS[i].label;
    return id;
  }

  function loadError(container, err) {
    var isFile = location.protocol === 'file:';
    container.replaceChildren(
      el('div', { class: 'notice', role: 'alert' },
        el('p', { text: 'Sorry — Sensei couldn’t load the content for this page.' }),
        isFile
          ? el('p', { text: 'It looks like the page was opened straight from a file. Please run a local web server (see README) and try again.' })
          : el('p', { text: 'Please refresh the page. If it keeps happening, a content file may have a typo (check for missing commas or quote marks).' })
      )
    );
    if (window.console) console.warn(err);
  }

  /** Gentle chime using Web Audio (no sound files needed). */
  var audioCtx = null;
  function unlockAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function chime() {
    var ctx = unlockAudio();
    if (!ctx) return;
    var notes = [659.25, 783.99, 1046.5]; // E5, G5, C6
    var now = ctx.currentTime;
    notes.forEach(function (freq, i) {
      var start = now + i * 0.28;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.2);
    });
  }

  window.SG = {
    AGE_BANDS: AGE_BANDS,
    loadJSON: loadJSON,
    site: site,
    coffeeUrl: coffeeUrl,
    applyCoffeeLinks: applyCoffeeLinks,
    shuffle: shuffle,
    el: el,
    toggleFullscreen: toggleFullscreen,
    bindFullscreenButton: bindFullscreenButton,
    isTyping: isTyping,
    ageLabel: ageLabel,
    toList: toList,
    relPath: relPath,
    loadError: loadError,
    unlockAudio: unlockAudio,
    chime: chime
  };

  function init() {
    applyCoffeeLinks();
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
