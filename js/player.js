/* ==========================================================
   QUIN RICHARDS — unified music player
   - two layouts: center (default) + compact; user toggles (saved)
   - volume slider (saved)
   - cross-page continuity via sessionStorage (auto-resume playing)
   - portable: injects its own styles + markup
   State keys shared with the Cue dock so playback carries across.
   ========================================================== */
(function () {
  // The Cue page has its own integrated demo dock — don't add a 2nd player there.
  if (document.querySelector('.dock')) return;

  var MUSIC = [
    { src: 'assets/music/woody.m4a',      title: 'Woody' },
    { src: 'assets/music/leap.m4a',       title: 'Leap' },
    { src: 'assets/music/flowershop.m4a', title: 'Flowershop' },
    { src: 'assets/music/copper.m4a',     title: 'Copper' },
    { src: 'assets/music/lovelorn.m4a',   title: 'Lovelorn' },
    { src: 'assets/music/child.m4a',      title: 'Child' }
  ];
  var SS_STATE = 'qpState', LS_LAYOUT = 'qpLayout', LS_VOL = 'qpVol';

  function readState() { try { return JSON.parse(sessionStorage.getItem(SS_STATE)) || {}; } catch (e) { return {}; } }
  function saveState() { try { sessionStorage.setItem(SS_STATE, JSON.stringify({ i: idx, t: audio.currentTime || pendingSeek || 0, playing: playing })); } catch (e) {} }
  function getVol() { var v = parseFloat(localStorage.getItem(LS_VOL)); return (isNaN(v) ? 0.8 : Math.min(1, Math.max(0, v))); }
  function getLayout() { return localStorage.getItem(LS_LAYOUT) === 'compact' ? 'compact' : 'center'; }

  /* ---------- styles ---------- */
  var css =
  '.qplayer{position:fixed;z-index:90;font-family:var(--body,sans-serif);}' +
  '.qplayer.center{left:50%;bottom:22px;transform:translateX(-50%);}' +
  '.qplayer.compact{left:18px;bottom:18px;}' +
  '.qp-bar{display:flex;align-items:center;gap:12px;background:var(--paper,#F2E9D5);border:1.5px solid var(--ink,#211C17);border-radius:999px;box-shadow:6px 7px 0 rgba(33,28,23,.14);padding:9px 15px;max-width:min(580px,calc(100vw - 26px));}' +
  '.qplayer.compact .qp-bar{gap:8px;padding:7px 12px;box-shadow:5px 6px 0 rgba(33,28,23,.14);}' +
  '.qp-btn{width:34px;height:34px;border-radius:50%;border:1.5px solid var(--ink,#211C17);background:transparent;color:var(--ink,#211C17);display:grid;place-items:center;cursor:pointer;flex:none;padding:0;transition:background .15s ease,color .15s ease;}' +
  '.qp-btn:hover{background:var(--ink,#211C17);color:var(--paper,#F2E9D5);}' +
  '.qp-btn svg{width:15px;height:15px;fill:currentColor;pointer-events:none;}' +
  '.qp-play{background:var(--red,#D9472B);border-color:var(--ink,#211C17);color:#fff;}' +
  '.qp-play:hover{background:var(--ink,#211C17);color:#fff;}' +
  '.qplayer.compact .qp-btn{width:30px;height:30px;}' +
  '.qp-meta{display:flex;flex-direction:column;line-height:1.12;min-width:0;}' +
  '.qp-label{font-family:var(--display,sans-serif);font-weight:600;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted,#6F6555);}' +
  '.qp-track{font-family:var(--display,sans-serif);font-weight:600;font-size:13px;color:var(--ink,#211C17);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;}' +
  '.qplayer.compact .qp-track{max-width:96px;font-size:12px;}' +
  '.qp-vwrap{display:flex;align-items:center;gap:7px;flex:none;}' +
  '.qp-vwrap svg{width:15px;height:15px;fill:var(--muted,#6F6555);flex:none;}' +
  '.qp-vol{-webkit-appearance:none;appearance:none;width:76px;height:4px;border-radius:999px;background:var(--line,#D8C9AC);outline:none;cursor:pointer;flex:none;}' +
  '.qplayer.compact .qp-vol{width:54px;}' +
  '.qp-vol::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:13px;height:13px;border-radius:50%;background:var(--ink,#211C17);border:2px solid var(--paper,#F2E9D5);cursor:pointer;}' +
  '.qp-vol::-moz-range-thumb{width:13px;height:13px;border-radius:50%;background:var(--ink,#211C17);border:2px solid var(--paper,#F2E9D5);cursor:pointer;}' +
  '.qp-eq{display:flex;align-items:flex-end;gap:2px;height:14px;width:16px;flex:none;}' +
  '.qp-eq i{width:3px;height:4px;background:var(--red,#D9472B);border-radius:2px;transition:height .2s ease;}' +
  '.qplayer.playing .qp-eq i{animation:qpEq .9s ease-in-out infinite;}' +
  '.qplayer.playing .qp-eq i:nth-child(2){animation-delay:.15s;} .qplayer.playing .qp-eq i:nth-child(3){animation-delay:.3s;}' +
  '@keyframes qpEq{0%,100%{height:4px;}50%{height:13px;}}' +
  '.qplayer.compact .qp-label{display:none;}' +
  '@media (max-width:560px){.qplayer.center{left:12px;right:12px;bottom:14px;transform:none;}.qplayer.center .qp-bar{max-width:none;justify-content:center;}.qp-label{display:none;}.qp-vol{width:56px;}}' +
  '@media (prefers-reduced-motion: reduce){.qplayer.playing .qp-eq i{animation:none;height:9px;}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- markup ---------- */
  var wrap = document.createElement('div');
  wrap.className = 'qplayer ' + getLayout();
  wrap.setAttribute('aria-label', 'Music player');
  wrap.innerHTML =
    '<div class="qp-bar">' +
      '<button class="qp-btn qp-prev" type="button" aria-label="Previous track"><svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>' +
      '<button class="qp-btn qp-play" type="button" aria-label="Play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>' +
      '<button class="qp-btn qp-next" type="button" aria-label="Next track"><svg viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg></button>' +
      '<span class="qp-eq" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<div class="qp-meta"><span class="qp-label">Quintessential</span><span class="qp-track">Woody</span></div>' +
      '<div class="qp-vwrap"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z"/></svg>' +
        '<input class="qp-vol" type="range" min="0" max="1" step="0.01" aria-label="Volume"></div>' +
      '<button class="qp-btn qp-toggle" type="button" aria-label="Switch player layout" title="Switch layout"><svg viewBox="0 0 24 24"><path d="M4 5h7v5H4zM13 14h7v5h-7z"/></svg></button>' +
    '</div>' +
    '<audio class="qp-audio" preload="none"></audio>';
  document.body.appendChild(wrap);

  var audio   = wrap.querySelector('.qp-audio');
  var trackEl = wrap.querySelector('.qp-track');
  var playBtn = wrap.querySelector('.qp-play');
  var vol     = wrap.querySelector('.qp-vol');
  var idx = 0, playing = false, pendingSeek = 0, lastSave = 0;

  function setIcon(p) {
    playBtn.innerHTML = p
      ? '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    playBtn.setAttribute('aria-label', p ? 'Pause' : 'Play');
  }
  function load(i) {
    idx = (i + MUSIC.length) % MUSIC.length;
    audio.src = MUSIC[idx].src;
    trackEl.textContent = MUSIC[idx].title;
  }
  function play() {
    if (!audio.src) load(idx);
    var p = audio.play();
    if (p && p.then) {
      p.then(function () {
        playing = true; wrap.classList.add('playing'); setIcon(true); saveState();
        if (window.__reelMute) window.__reelMute();
      }).catch(function () {
        playing = false; wrap.classList.remove('playing'); setIcon(false);
      });
    } else {
      playing = true; wrap.classList.add('playing'); setIcon(true);
    }
  }
  function pause() {
    audio.pause(); playing = false; wrap.classList.remove('playing'); setIcon(false); saveState();
  }
  window.__stopMusic = pause;

  wrap.querySelector('.qp-prev').addEventListener('click', function () { load(idx - 1); play(); });
  wrap.querySelector('.qp-next').addEventListener('click', function () { load(idx + 1); play(); });
  playBtn.addEventListener('click', function () { playing ? pause() : play(); });

  audio.addEventListener('loadedmetadata', function () {
    if (pendingSeek > 0 && pendingSeek < (audio.duration || 1e9)) {
      try { audio.currentTime = pendingSeek; } catch (e) {}
    }
    pendingSeek = 0;
  });
  audio.addEventListener('ended', function () { load(idx + 1); play(); });
  audio.addEventListener('timeupdate', function () {
    var now = Date.now();
    if (now - lastSave > 1500) { lastSave = now; saveState(); }
  });

  /* volume */
  audio.volume = getVol();
  vol.value = audio.volume;
  vol.addEventListener('input', function () {
    audio.volume = parseFloat(vol.value);
    try { localStorage.setItem(LS_VOL, String(audio.volume)); } catch (e) {}
  });

  /* layout toggle */
  wrap.querySelector('.qp-toggle').addEventListener('click', function () {
    var next = wrap.classList.contains('center') ? 'compact' : 'center';
    wrap.classList.remove('center', 'compact'); wrap.classList.add(next);
    try { localStorage.setItem(LS_LAYOUT, next); } catch (e) {}
  });

  /* persist on leave so the next page can resume */
  window.addEventListener('pagehide', saveState);
  document.addEventListener('visibilitychange', function () { if (document.hidden) saveState(); });

  /* ---------- restore from previous page ---------- */
  var s = readState();
  load(typeof s.i === 'number' ? s.i : 0);
  pendingSeek = s.t || 0;
  setIcon(false);
  if (s.playing) { play(); }   // browsers may block autoplay; play() falls back to paused
})();
