/* ==========================================================
   QUIN RICHARDS — shared site behavior
   ========================================================== */

/* ==========================================================
   THEME — light / dark, site-wide.
   The toggle is injected into every nav so no page has to carry it.
   Choice persists in localStorage ('qrTheme', shared with cue.html);
   until someone picks a side we follow the OS.
   The <head> script sets data-theme early so there's no flash.
   ========================================================== */
(function () {
  var KEY = 'qrTheme';
  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>';

  function stored() {
    try { var t = localStorage.getItem(KEY); return (t === 'dark' || t === 'light') ? t : null; }
    catch (e) { return null; }
  }
  function system() {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  function effective() { return stored() || system(); }

  var btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.type = 'button';
  btn.title = 'Switch theme';

  function paint(mode) {
    btn.innerHTML = mode === 'dark' ? SUN : MOON;
    btn.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  function apply(mode, remember) {
    document.documentElement.setAttribute('data-theme', mode);
    paint(mode);
    if (remember) { try { localStorage.setItem(KEY, mode); } catch (e) {} }
  }

  paint(effective());
  btn.addEventListener('click', function () {
    apply(effective() === 'dark' ? 'light' : 'dark', true);
  });

  /* follow the OS as long as the visitor hasn't chosen for themselves */
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) { if (!stored()) paint(e.matches ? 'dark' : 'light'); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* drop it in beside the Resume pill */
  var cta = document.querySelector('.nav-inner .nav-cta');
  var host = cta ? cta.parentNode : document.querySelector('.nav-inner');
  if (host) {
    if (host.classList && !host.classList.contains('nav-right')) host.classList.add('nav-right');
    var burger = host.querySelector('.nav-burger');
    if (burger) host.insertBefore(btn, burger); else host.appendChild(btn);
  }

  /* Resume moves into the mobile menu, since the header pill hides on small screens */
  var links = document.querySelector('.nav-links');
  if (links && !links.querySelector('.nav-resume')) {
    var r = document.createElement('button');
    r.type = 'button';
    r.className = 'nav-resume';
    r.setAttribute('data-resume', '');
    r.textContent = 'Resume';
    links.appendChild(r);
  }
})();

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

/* ==========================================================
   MISSING ART — if an image hasn't been dropped in yet, fall back to
   the poster-style placeholder instead of a broken-image icon.
   ========================================================== */
(function () {
  function placehold(img) {
    var frame = img.parentNode;
    if (!frame || frame.querySelector('.ph')) return;
    var ph = document.createElement('div');
    ph.className = 'ph';
    ph.textContent = img.getAttribute('alt') || 'Image coming soon';
    img.remove();
    frame.appendChild(ph);
  }
  document.querySelectorAll('.j-media img, .cs-shot img, .cs-hero-img img, .qcard .qimg img, .t5img img, .entry-thumb img')
    .forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) placehold(img);
      else img.addEventListener('error', function () { placehold(img); });
    });
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

  // Phones (iOS Safari especially) won't render a PDF inside an iframe — they
  // just show an empty box. On narrow screens hand over a real link instead.
  function smallScreen() {
    return window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
  }
  function showLinkCard() {
    frame.style.display = 'none';
    missing.style.display = 'grid';
    missing.innerHTML =
      '<span>Résumé — one page, PDF</span>' +
      '<a class="modal-dl" href="' + RESUME_SRC + '" target="_blank" rel="noopener">Open résumé</a>';
  }

  function open() {
    lastFocus = document.activeElement;
    modal.classList.add('open');
    document.body.classList.add('modal-lock');
    if (!loaded) {
      // check the pdf exists before pointing the iframe at it
      fetch(RESUME_SRC, { method: 'HEAD' }).then(function (r) {
        if (!r.ok) { showMissing(); return; }
        if (smallScreen()) { showLinkCard(); return; }
        frame.src = RESUME_SRC; frame.style.display = 'block'; missing.style.display = 'none';
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

/* JUKEBOX moved to js/player.js (portable, cross-page player). */

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
