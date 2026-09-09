/* ==========================================================
   QUIN RICHARDS — unified music player

   Same component as the dock on the Cue case study: identical
   structure, proportions, spacing and styling, so the player
   reads as one thing everywhere on the site. The dock CSS below
   is Cue's, verbatim; the site version adds a volume control and
   a compact/center layout toggle on top of it.

   - two layouts: center (default) + compact; the choice is saved
   - volume slider (saved)
   - cross-page continuity via sessionStorage (auto-resumes playing)
   - portable: injects its own styles + markup

   State keys are shared with the Cue dock so playback carries across.
   ========================================================== */
(function () {
  // The Cue page has its own integrated dock — don't add a second player there.
  if (document.querySelector('.dock')) return;

  var MUSIC = [
    { title: 'Woody',      src: 'assets/music/woody.m4a',      dur: 165 },
    { title: 'Leap',       src: 'assets/music/leap.m4a',       dur: 173 },
    { title: 'Flowershop', src: 'assets/music/flowershop.m4a', dur: 211 },
    { title: 'Copper',     src: 'assets/music/copper.m4a',     dur: 94  },
    { title: 'Lovelorn',   src: 'assets/music/lovelorn.m4a',   dur: 255 },
    { title: 'Child',      src: 'assets/music/child.m4a',      dur: 140 }
  ];
  var ART = 'assets/music/cover.jpg';
  var SS_STATE = 'qpState', LS_LAYOUT = 'qpLayout', LS_VOL = 'qpVol';

  function readState() { try { return JSON.parse(sessionStorage.getItem(SS_STATE)) || {}; } catch (e) { return {}; } }
  function saveState() {
    try { sessionStorage.setItem(SS_STATE, JSON.stringify({ i: idx, t: pos, playing: playing })); } catch (e) {}
  }
  function getVol() { var v = parseFloat(localStorage.getItem(LS_VOL)); return isNaN(v) ? 0.8 : Math.min(1, Math.max(0, v)); }
  function getLayout() { return localStorage.getItem(LS_LAYOUT) === 'compact' ? 'compact' : 'center'; }

  /* ---------- styles: Cue's dock, plus the two site-only controls ---------- */
  var css = [
    /* --- Cue dock, verbatim --- */
    '.qdock{position:fixed;left:0;right:0;bottom:16px;z-index:90;display:flex;justify-content:center;padding:0 16px;pointer-events:none;}',
    '.qdock .dock-inner{pointer-events:auto;width:min(720px,100%);display:flex;align-items:center;gap:15px;padding:10px 14px;border-radius:18px;position:relative;background:color-mix(in srgb,var(--surface) 60%,transparent);-webkit-backdrop-filter:blur(22px) saturate(170%);backdrop-filter:blur(22px) saturate(170%);border:1px solid color-mix(in srgb,var(--ink) 12%,transparent);box-shadow:0 18px 48px -18px rgba(20,15,10,.5);}',
    '.qdock .dock-progress{position:absolute;top:0;left:14px;right:14px;height:2px;border-radius:2px;background:color-mix(in srgb,var(--ink) 12%,transparent);display:none;overflow:hidden;}',
    '.qdock .dock-progress i{display:block;height:100%;width:0;background:var(--accent);}',
    '.qdock .dock-art{width:46px;height:46px;border-radius:9px;object-fit:cover;flex:none;box-shadow:0 4px 10px -4px rgba(0,0,0,.4);}',
    '.qdock .dock-meta{display:flex;flex-direction:column;min-width:0;width:150px;flex:none;}',
    '.qdock .dock-titlerow{display:flex;align-items:center;gap:7px;min-width:0;}',
    '.qdock .dock-title{font-family:var(--display);font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.qdock .dock-eq{display:none;gap:2px;align-items:flex-end;height:11px;}',
    '.player-on .qdock .dock-eq{display:flex;}',
    '.qdock .dock-eq i{width:2.5px;background:var(--accent);height:40%;border-radius:1px;}',
    '.player-on .qdock .dock-eq i{animation:qeq2 .9s ease-in-out infinite;}',
    '.player-on .qdock .dock-eq i:nth-child(2){animation-delay:.2s;}',
    '.player-on .qdock .dock-eq i:nth-child(3){animation-delay:.4s;}',
    '@keyframes qeq2{50%{height:100%;}}',
    '.qdock .dock-sub{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.qdock .dock-scrub{display:flex;align-items:center;gap:10px;flex:1;min-width:0;}',
    '.qdock .dock-time{font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums;width:30px;flex:none;}',
    '.qdock .dock-time.r{text-align:right;}',
    '.qdock .dock-bar{flex:1;height:4px;border-radius:999px;background:color-mix(in srgb,var(--ink) 14%,transparent);cursor:pointer;position:relative;}',
    '.qdock .dock-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:var(--accent);width:0;}',
    '.qdock .dock-ctl{display:flex;align-items:center;gap:6px;}',
    '.qdock .dock-ctl button{background:none;border:0;color:var(--ink);display:grid;place-items:center;padding:5px;border-radius:50%;cursor:pointer;}',
    '.qdock .dock-ctl svg{width:20px;height:20px;fill:currentColor;}',
    '.qdock .dock-play{width:40px;height:40px;background:var(--accent)!important;color:#2A2018!important;}',

    /* --- site-only: volume + layout toggle, built from the same parts --- */
    '.qdock .dock-vol{display:flex;align-items:center;gap:7px;flex:none;}',
    '.qdock .dock-vol svg{width:16px;height:16px;fill:var(--muted);flex:none;}',
    '.qdock .dock-vol input{-webkit-appearance:none;appearance:none;width:66px;height:4px;border-radius:999px;background:color-mix(in srgb,var(--ink) 14%,transparent);outline:none;cursor:pointer;flex:none;}',
    '.qdock .dock-vol input::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:12px;height:12px;border-radius:50%;background:var(--accent);border:0;cursor:pointer;}',
    '.qdock .dock-vol input::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:var(--accent);border:0;cursor:pointer;}',
    '.qdock .dock-layout svg{width:17px;height:17px;}',

    /* --- compact layout: the same dock, pinned left and stripped back --- */
    '.qdock.compact{justify-content:flex-start;}',
    '.qdock.compact .dock-inner{width:auto;max-width:calc(100vw - 32px);gap:11px;padding:8px 12px;}',
    '.qdock.compact .dock-scrub,.qdock.compact .dock-vol{display:none;}',
    '.qdock.compact .dock-progress{display:block;}',
    '.qdock.compact .dock-art{width:38px;height:38px;border-radius:8px;}',
    '.qdock.compact .dock-meta{width:118px;}',
    '.qdock.compact .dock-play{width:34px;height:34px;}',
    '.qdock.compact .dock-ctl svg{width:18px;height:18px;}',

    /* --- phones: match Cue's own small-screen dock --- */
    '@media(max-width:640px){',
    '  .qdock{padding:0 12px;bottom:12px;}',
    '  .qdock .dock-scrub,.qdock .dock-vol{display:none;}',
    '  .qdock .dock-progress{display:block;}',
    '  .qdock .dock-meta{flex:1;width:auto;}',
    '  .qdock .dock-ctl button.dock-prev{display:none;}',  /* like Cue; next stays so the six tracks are still skippable on a phone */
    '  .qdock.compact .dock-inner{max-width:calc(100vw - 24px);}',
    '  .qdock .dock-ctl button{padding:8px;}',
    '}',
    '@media(prefers-reduced-motion:reduce){.player-on .qdock .dock-eq i{animation:none;height:70%;}}'
  ].join('\n');

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- markup ---------- */
  var wrap = document.createElement('div');
  wrap.className = 'qdock ' + getLayout();
  wrap.setAttribute('aria-label', 'Music player');
  wrap.innerHTML =
    '<div class="dock-inner">' +
      '<div class="dock-progress" aria-hidden="true"><i class="q-prog"></i></div>' +
      '<img class="dock-art" src="' + ART + '" alt="" />' +
      '<div class="dock-meta">' +
        '<div class="dock-titlerow">' +
          '<span class="dock-title q-title">Woody</span>' +
          '<span class="dock-eq" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '</div>' +
        '<span class="dock-sub">Quintessential</span>' +
      '</div>' +
      '<div class="dock-scrub">' +
        '<span class="dock-time q-cur">0:00</span>' +
        '<div class="dock-bar q-bar" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i class="q-fill"></i></div>' +
        '<span class="dock-time r q-dur">0:00</span>' +
      '</div>' +
      '<div class="dock-vol">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z"/></svg>' +
        '<input class="q-vol" type="range" min="0" max="1" step="0.01" aria-label="Volume" />' +
      '</div>' +
      '<div class="dock-ctl">' +
        '<button class="dock-prev q-prev" type="button" aria-label="Previous"><svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>' +
        '<button class="dock-play q-play" type="button" aria-label="Play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>' +
        '<button class="dock-next q-next" type="button" aria-label="Next"><svg viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg></button>' +
        '<button class="dock-layout q-layout" type="button" aria-label="Switch player layout" title="Switch layout"><svg viewBox="0 0 24 24"><path d="M4 5h7v5H4zM13 14h7v5h-7z"/></svg></button>' +
      '</div>' +
    '</div>' +
    '<audio class="q-audio" preload="none"></audio>';
  document.body.appendChild(wrap);

  var $ = function (sel) { return wrap.querySelector(sel); };
  var audio = $('.q-audio'), titleEl = $('.q-title'), playBtn = $('.q-play'),
      curEl = $('.q-cur'), durEl = $('.q-dur'), barEl = $('.q-bar'),
      fillEl = $('.q-fill'), progEl = $('.q-prog'), vol = $('.q-vol');

  var idx = 0, playing = false, pos = 0, pendingSeek = 0, lastSave = 0;

  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  function progress() {
    var d = MUSIC[idx].dur || 1, f = Math.min(1, pos / d) * 100;
    fillEl.style.width = f + '%';
    progEl.style.width = f + '%';
    curEl.textContent = fmt(pos);
    barEl.setAttribute('aria-valuenow', Math.round(f));
  }
  function setIcon(p) {
    playBtn.innerHTML = p
      ? '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    playBtn.setAttribute('aria-label', p ? 'Pause' : 'Play');
  }
  function load(i) {
    idx = (i + MUSIC.length) % MUSIC.length;
    pos = 0;
    audio.src = MUSIC[idx].src;
    titleEl.textContent = MUSIC[idx].title;
    durEl.textContent = fmt(MUSIC[idx].dur);
    progress();
  }
  function play() {
    if (!audio.src) load(idx);
    var p = audio.play();
    if (p && p.then) {
      p.then(function () {
        playing = true; document.body.classList.add('player-on'); setIcon(true); saveState();
        if (window.__reelMute) window.__reelMute();
      }).catch(function () {
        playing = false; document.body.classList.remove('player-on'); setIcon(false);
      });
    } else {
      playing = true; document.body.classList.add('player-on'); setIcon(true);
    }
  }
  function pause() {
    audio.pause();
    playing = false;
    document.body.classList.remove('player-on');
    setIcon(false);
    saveState();
  }
  window.__stopMusic = pause;

  $('.q-prev').addEventListener('click', function () {
    if (pos > 3) { pos = 0; try { audio.currentTime = 0; } catch (e) {} progress(); return; }
    load(idx - 1); play();
  });
  $('.q-next').addEventListener('click', function () { load(idx + 1); play(); });
  playBtn.addEventListener('click', function () { playing ? pause() : play(); });

  /* scrub */
  function seekTo(ratio) {
    pos = Math.min(1, Math.max(0, ratio)) * (MUSIC[idx].dur || 0);
    try { if (audio.readyState > 0) audio.currentTime = pos; else pendingSeek = pos; } catch (e) { pendingSeek = pos; }
    progress();
  }
  barEl.addEventListener('click', function (e) {
    var r = barEl.getBoundingClientRect();
    seekTo((e.clientX - r.left) / r.width);
  });
  barEl.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { seekTo((pos + 5) / (MUSIC[idx].dur || 1)); }
    else if (e.key === 'ArrowLeft') { seekTo((pos - 5) / (MUSIC[idx].dur || 1)); }
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); playing ? pause() : play(); }
  });

  audio.addEventListener('loadedmetadata', function () {
    if (audio.duration) { MUSIC[idx].dur = audio.duration; durEl.textContent = fmt(audio.duration); }
    if (pendingSeek > 0 && pendingSeek < (audio.duration || 1e9)) {
      try { audio.currentTime = pendingSeek; } catch (e) {}
    }
    pendingSeek = 0;
    progress();
  });
  audio.addEventListener('timeupdate', function () {
    if (audio.currentTime) { pos = audio.currentTime; progress(); }
    var now = Date.now();
    if (now - lastSave > 1500) { lastSave = now; saveState(); }
  });
  audio.addEventListener('ended', function () { load(idx + 1); play(); });

  /* volume */
  audio.volume = getVol();
  vol.value = audio.volume;
  vol.addEventListener('input', function () {
    audio.volume = parseFloat(vol.value);
    try { localStorage.setItem(LS_VOL, String(audio.volume)); } catch (e) {}
  });

  /* layout toggle */
  $('.q-layout').addEventListener('click', function () {
    var next = wrap.classList.contains('center') ? 'compact' : 'center';
    wrap.classList.remove('center', 'compact');
    wrap.classList.add(next);
    try { localStorage.setItem(LS_LAYOUT, next); } catch (e) {}
  });

  /* persist on leave so the next page picks up where this one left off */
  window.addEventListener('pagehide', saveState);
  document.addEventListener('visibilitychange', function () { if (document.hidden) saveState(); });

  /* ---------- restore from the previous page ---------- */
  var s = readState();
  load(typeof s.i === 'number' ? s.i : 0);
  pos = s.t || 0;
  pendingSeek = pos;
  progress();
  setIcon(false);
  if (s.playing) { play(); }   // browsers may block autoplay; play() falls back to paused
})();
