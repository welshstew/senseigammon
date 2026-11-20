/* Countdown timer with presets, big digits and a gentle (mutable) chime. */
(function () {
  'use strict';
  var digits = document.getElementById('digits');
  var bar = document.getElementById('bar');
  var status = document.getElementById('timer-status');
  var startBtn = document.getElementById('start-btn');
  var resetBtn = document.getElementById('reset-btn');
  var muteBtn = document.getElementById('mute-btn');
  var presets = document.getElementById('presets');
  var customInput = document.getElementById('custom-mins');
  var customBtn = document.getElementById('custom-btn');
  var stage = document.getElementById('stage');

  var total = 5 * 60 * 1000;   // ms
  var remaining = total;
  var endAt = 0;
  var tick = null;
  var muted = false;

  SG.bindFullscreenButton(document.getElementById('fs-btn'), stage);

  function fmt(ms) {
    var s = Math.ceil(ms / 1000);
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function paint() {
    digits.textContent = fmt(remaining);
    bar.style.width = (total ? (remaining / total) * 100 : 0) + '%';
    document.title = (tick ? fmt(remaining) + ' · ' : '') + 'Countdown timer — Sensei Gammon';
  }

  function running() { return tick !== null; }

  function start() {
    if (remaining <= 0) reset();
    SG.unlockAudio();           // must happen on a user gesture
    endAt = Date.now() + remaining;
    digits.classList.remove('is-done');
    tick = setInterval(update, 200);
    startBtn.textContent = '⏸ Pause';
    status.textContent = 'Timer started';
    paint();
  }

  function pause() {
    clearInterval(tick);
    tick = null;
    remaining = Math.max(0, endAt - Date.now());
    startBtn.textContent = '▶ Resume';
    status.textContent = 'Timer paused';
    paint();
  }

  function update() {
    remaining = Math.max(0, endAt - Date.now());
    if (remaining <= 0) finish();
    paint();
  }

  function finish() {
    clearInterval(tick);
    tick = null;
    remaining = 0;
    digits.classList.add('is-done');
    startBtn.textContent = '▶ Start again';
    status.textContent = 'Time’s up!';
    if (!muted) SG.chime();
  }

  function reset() {
    clearInterval(tick);
    tick = null;
    remaining = total;
    digits.classList.remove('is-done');
    startBtn.textContent = '▶ Start';
    status.textContent = '';
    paint();
  }

  function setMinutes(mins) {
    total = Math.round(mins * 60 * 1000);
    presets.querySelectorAll('.chip').forEach(function (c) {
      c.setAttribute('aria-pressed', Number(c.dataset.mins) === mins ? 'true' : 'false');
    });
    reset();
  }

  function toggleMute() {
    muted = !muted;
    muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    muteBtn.textContent = muted ? '🔕 Sound off' : '🔔 Sound on';
  }

  presets.addEventListener('click', function (e) {
    var b = e.target.closest('[data-mins]');
    if (b) setMinutes(Number(b.dataset.mins));
  });
  customBtn.addEventListener('click', function () {
    var v = Math.min(99, Math.max(1, parseInt(customInput.value, 10) || 1));
    customInput.value = v;
    setMinutes(v);
  });
  customInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') customBtn.click(); });
  startBtn.addEventListener('click', function () { running() ? pause() : start(); });
  resetBtn.addEventListener('click', reset);
  muteBtn.addEventListener('click', toggleMute);

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || SG.isTyping(e)) return;
    var k = e.key;
    if (k === ' ' || k === 'Spacebar') { e.preventDefault(); running() ? pause() : start(); }
    else if (k === 'r' || k === 'R') reset();
    else if (k === 'm' || k === 'M') toggleMute();
    else if (k === 'f' || k === 'F') SG.toggleFullscreen(stage);
  });
  document.addEventListener('keyup', function (e) {
    if ((e.key === ' ' || e.key === 'Spacebar') && !SG.isTyping(e)) e.preventDefault();
  });

  paint();
})();
