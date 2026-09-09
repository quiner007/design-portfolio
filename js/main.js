/* ==========================================================
   QUIN RICHARDS — shared site behavior
   ========================================================== */

/* ---------- mobile nav ---------- */
(function () {
  var burger = document.querySelector('.nav-burger');
  var links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
})();

/* ---------- reveal on scroll ---------- */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }
  window.addEventListener('load', function () {
    setTimeout(function () {
      var c = document.querySelector('.composition');
      if (c) c.classList.add('in');
    }, 120);
  });
})();

/* ==========================================================
   RESUME MODAL — opens resume in an on-page popup.
   Put your PDF at assets/resume.pdf
   ========================================================== */
(function () {
  var RESUME_SRC = 'assets/resume.pdf';
  var modal = document.getElementById('resumeModal');
  if (!modal) return;
  var frame = modal.querySelector('iframe');
  var missing = modal.querySelector('.modal-missing');
  var lastFocus = null;
  var loaded = false;

  function open() {
    lastFocus = document.activeElement;
    modal.classList.add('open');
    document.body.classList.add('modal-lock');
    if (!loaded) {
      // check the pdf exists before pointing the iframe at it
      fetch(RESUME_SRC, { method: 'HEAD' }).then(function (r) {
        if (r.ok) { frame.src = RESUME_SRC; frame.style.display = 'block'; missing.style.display = 'none'; }
        else { showMissing(); }
      }).catch(showMissing);
      loaded = true;
    }
    modal.querySelector('.modal-x').focus();
  }
  function showMissing() {
    frame.style.display = 'none';
    missing.style.display = 'grid';
  }
  function close() {
    modal.classList.remove('open');
    document.body.classList.remove('modal-lock');
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll('[data-resume]').forEach(function (btn) {
    btn.addEventListener('click', function (e) { e.preventDefault(); open(); });
  });
  modal.querySelector('.modal-x').addEventListener('click', close);
  modal.querySelector('.modal-backdrop').addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
})();

/* ==========================================================
   JUKEBOX — multi-track music player for Quin's songs.
   Drop mp3s in assets/music/ and list them here.
   Never autoplays; visitor presses play.
   ========================================================== */
var MUSIC = [
  { src: 'assets/music/woody.m4a',      title: 'Woody' },
  { src: 'assets/music/leap.m4a',       title: 'Leap' },
  { src: 'assets/music/flowershop.m4a', title: 'Flowershop' },
  { src: 'assets/music/copper.m4a',     title: 'Copper' },
  { src: 'assets/music/lovelorn.m4a',   title: 'Lovelorn' },
  { src: 'assets/music/child.m4a',      title: 'Child' }
];

(function () {
  var jukebox = document.getElementById('jukebox');
  if (!jukebox) return;
  var audio = document.getElementById('ambient');
  var trackEl = document.getElementById('jbTrack');
  var iconEl = document.getElementById('jbIcon');
  var t = 0, on = false;

  function setIcon(playing) {
    if (iconEl) iconEl.innerHTML = playing
      ? '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>'
      : '<path d="M8 5v14l11-7z"/>';
  }
  function load(i) {
    t = (i + MUSIC.length) % MUSIC.length;
    audio.src = MUSIC[t].src;
    if (trackEl) trackEl.textContent = MUSIC[t].title;
  }
  function play() {
    if (!audio.src) load(t);
    var p = audio.play();
    if (p && p.then) {
      p.then(function () {
        on = true; jukebox.classList.add('playing'); setIcon(true);
        if (window.__reelMute) window.__reelMute(); // mute video if music starts
      }).catch(function () {
        if (trackEl) trackEl.textContent = 'Add mp3s to assets/music';
      });
    }
  }
  window.__stopMusic = function () {
    audio.pause(); on = false; jukebox.classList.remove('playing'); setIcon(false);
  };

  document.getElementById('jbBtn').addEventListener('click', function () {
    if (on) { window.__stopMusic(); } else { play(); }
  });
  var next = document.getElementById('jbNext');
  var prev = document.getElementById('jbPrev');
  if (next) next.addEventListener('click', function () { load(t + 1); if (on) play(); });
  if (prev) prev.addEventListener('click', function () { load(t - 1); if (on) play(); });
  audio.addEventListener('ended', function () { load(t + 1); play(); });
  load(0);
})();

/* ==========================================================
   SHOWREEL — robust YouTube player w/ rotation.
   Uses direct youtube-nocookie embeds + postMessage control
   (no external API script, so it works in more environments).
   Pages call initReel(playlist) with their own clip list.
   ========================================================== */
function initReel(PLAYLIST) {
  var mount = document.getElementById('yt-mount');
  if (!mount || !PLAYLIST.length) return;

  var current = 0, muted = true, iframe = null;

  function embedURL(id) {
    return 'https://www.youtube-nocookie.com/embed/' + id +
      '?enablejsapi=1&autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&origin=' +
      encodeURIComponent(location.origin === 'null' ? 'https://example.com' : location.origin);
  }
  function cmd(func, args) {
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: args || [] }), '*');
  }
  function listen() {
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'reel' }), '*');
  }

  function build(i) {
    current = (i + PLAYLIST.length) % PLAYLIST.length;
    mount.innerHTML = '';
    iframe = document.createElement('iframe');
    iframe.src = embedURL(PLAYLIST[current].id);
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.title = PLAYLIST[current].title;
    iframe.addEventListener('load', function () { setTimeout(listen, 400); if (!muted) setTimeout(function(){ cmd('unMute'); }, 600); });
    mount.appendChild(iframe);
    updateUI();
  }

  function updateUI() {
    var pos = document.getElementById('queuePos');
    if (pos) pos.textContent = (current + 1) + ' / ' + PLAYLIST.length;
    var now = document.getElementById('nowPlaying');
    if (now) now.innerHTML = '<b>' + PLAYLIST[current].title + '</b> · ' + PLAYLIST[current].tag;
    document.querySelectorAll('.qitem').forEach(function (el, i) {
      el.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
  }

  /* queue */
  var list = document.getElementById('queueList');
  if (list) {
    PLAYLIST.forEach(function (clip, i) {
      var b = document.createElement('button');
      b.className = 'qitem'; b.type = 'button';
      b.setAttribute('aria-current', i === 0 ? 'true' : 'false');
      b.innerHTML = '<span class="qn">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span><span class="qt">' + clip.title + '</span><span class="qtag">' + clip.tag + '</span></span>';
      b.addEventListener('click', function () { build(i); });
      list.appendChild(b);
    });
  }

  /* controls */
  var playing = true;
  function setPlayIcon(p) {
    var el = document.getElementById('playIcon');
    if (el) el.innerHTML = p ? '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
  }
  var prevB = document.getElementById('prevBtn'), nextB = document.getElementById('nextBtn'),
      playB = document.getElementById('playBtn'), muteB = document.getElementById('muteBtn');
  if (prevB) prevB.addEventListener('click', function () { build(current - 1); });
  if (nextB) nextB.addEventListener('click', function () { build(current + 1); });
  if (playB) playB.addEventListener('click', function () {
    if (playing) { cmd('pauseVideo'); playing = false; } else { cmd('playVideo'); playing = true; }
    setPlayIcon(playing);
  });
  if (muteB) muteB.addEventListener('click', function () {
    if (muted) {
      cmd('unMute'); muted = false;
      document.getElementById('muteTxt').textContent = 'Mute';
      if (window.__stopMusic) window.__stopMusic();
    } else {
      cmd('mute'); muted = true;
      document.getElementById('muteTxt').textContent = 'Unmute';
    }
  });
  window.__reelMute = function () {
    cmd('mute'); muted = true;
    var t = document.getElementById('muteTxt'); if (t) t.textContent = 'Unmute';
  };

  /* listen for state from youtube: 0 = ended → rotate to next */
  window.addEventListener('message', function (e) {
    if (typeof e.data !== 'string') return;
    var d; try { d = JSON.parse(e.data); } catch (err) { return; }
    if (d && d.info && typeof d.info.playerState === 'number') {
      if (d.info.playerState === 0) { build(current + 1); }
      if (d.info.playerState === 1) { playing = true; setPlayIcon(true); }
      if (d.info.playerState === 2) { playing = false; setPlayIcon(false); }
    }
  });

  build(0);
}
