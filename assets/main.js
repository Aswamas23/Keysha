/* ═══════════════════════════════════════════════════════════════════════
   CINEMATIC RUNWAY TRIBUTE  —  main.js
   ═══════════════════════════════════════════════════════════════════════ */

/* ── DOM ──────────────────────────────────────────────────────────────── */
const bgMusic        = document.getElementById('bgMusic');
const curtainOverlay = document.getElementById('curtain-overlay');
const curtainLeft    = document.getElementById('curtain-left');
const curtainRight   = document.getElementById('curtain-right');
const newspaperWrap  = document.getElementById('newspaper-wrap');
const pageStage      = document.getElementById('page-stage');
const pageA          = document.getElementById('page-a');
const pageB          = document.getElementById('page-b');
const pgNum          = document.getElementById('pg-num');
const pgPrev         = document.getElementById('pg-prev');
const pgNext         = document.getElementById('pg-next');
const videoWrap      = document.getElementById('video-wrap');
const mainVideo      = document.getElementById('main-video');
const videoLabel     = document.getElementById('video-label');
const apologyWrap    = document.getElementById('apology-wrap');
const apoRecipient   = document.getElementById('apo-recipient');
const apoBody        = document.getElementById('apo-body');
const apoSig         = document.getElementById('apo-sig');
const apoOrn         = document.getElementById('apo-orn');
const fadeOverlay    = document.getElementById('fade-overlay');
const musicWidget    = document.getElementById('music-widget');
const musicBtn       = document.getElementById('music-btn');
const volSlider      = document.getElementById('vol-slider');

/* ── STATE ────────────────────────────────────────────────────────────── */
let photoIdx    = 0;
let videoIdx    = 0;
let flipping    = false;
let appState    = 'curtain';   // curtain | newspaper | video | apology
let volTimer    = null;
let activePage  = pageA;       // which div is currently "front"
let standbyPage = pageB;       // which div sits behind

/* ── AUDIO ────────────────────────────────────────────────────────────── */
bgMusic.src    = CONFIG.music.src;
bgMusic.volume = CONFIG.music.defaultVolume;

function fadeVol(to, ms) {
  if (volTimer) { clearInterval(volTimer); volTimer = null; }
  to = Math.min(1, Math.max(0, to));
  const steps = Math.max(1, Math.round(ms / 50));
  const delta = (to - bgMusic.volume) / steps;
  volTimer = setInterval(() => {
    const v = bgMusic.volume + delta;
    if ((delta >= 0 && v >= to) || (delta < 0 && v <= to)) {
      bgMusic.volume = to; volSlider.value = to;
      clearInterval(volTimer); volTimer = null;
    } else {
      bgMusic.volume = Math.min(1, Math.max(0, v));
      volSlider.value = bgMusic.volume;
    }
  }, 50);
}

/* ── FADE OVERLAY ─────────────────────────────────────────────────────── */
function blackOut(cb, holdMs) {
  fadeOverlay.classList.add('black');
  setTimeout(cb, holdMs || 900);
}
function clearBlack(delayMs) {
  setTimeout(() => fadeOverlay.classList.remove('black'), delayMs || 0);
}

/* ── PAGE CONTENT BUILDERS ────────────────────────────────────────────── */
const FILLERS = [
  'In a season defined by boldness and silhouette, she arrived as if the runway had been waiting for her all along. Every step deliberate. Every gaze, a story.',
  'The lights found her first. The cameras followed. Fashion is a language — and she speaks it fluently, effortlessly, in every frame.',
  'She does not walk runways. She commands them. Her presence rewrites the air in every room she enters, leaving an impression no photograph can fully capture.',
  'There is a particular kind of grace that cannot be taught. It is felt. It arrives quietly and announces itself loudly. She has always had it.',
  'Between the flash of cameras and the hush of an expectant crowd, she moves with the certainty of someone who has always known exactly where she belongs.',
  'Fashion is memory — the story of who we are becoming. In these pages, we celebrate a woman becoming everything the world never quite prepared itself for.',
  'The runway is unforgiving. It reveals everything. And she chose to reveal strength, beauty, and an unapologetic self that stole every eye in the room.',
];
const PULLQUOTES = [
  '"She does not merely wear fashion — she inhabits it."',
  '"Every walk a statement. Every frame, a legacy."',
  '"The camera found its muse and never looked away."',
  '"Grace is not learned. It is remembered."',
];

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls)  e.className   = cls;
  if (text) e.textContent = text;
  return e;
}

function buildPageContent(container, idx) {
  const photo   = CONFIG.photos[idx];
  const layout  = ['layout-hero','layout-split','layout-portrait','layout-editorial'][idx % 4];
  const filler  = FILLERS[idx % FILLERS.length];
  const pq      = PULLQUOTES[idx % PULLQUOTES.length];

  container.innerHTML = '';

  const wrap = el('div', 'pg-layout ' + layout);

  /* Photo */
  const photoWrap = el('div', 'pg-photo-wrap');
  const img = el('img', 'pg-photo');
  img.src  = photo.src;
  img.alt  = photo.headline;
  img.loading = 'eager';
  photoWrap.appendChild(img);

  /* Text block */
  const txt  = el('div', 'pg-text');
  const hl   = el('h2',        'pg-headline',  photo.headline);
  const cap  = el('p',         'pg-caption',   photo.caption);
  const dt   = el('p',         'pg-date',      photo.date);
  const orn  = el('p',         'pg-ornament',  '— ✦ —');
  const body = el('p',         'pg-body',      filler);
  const pqEl = el('blockquote','pg-pullquote', pq);

  if (layout === 'layout-hero') {
    txt.append(hl, orn, cap, dt, body);
    wrap.append(photoWrap, txt);
  } else if (layout === 'layout-split') {
    const body2 = el('p','pg-body', FILLERS[(idx+1) % FILLERS.length]);
    txt.append(hl, dt, orn, cap, pqEl, body2);
    wrap.append(photoWrap, txt);
  } else if (layout === 'layout-portrait') {
    const hl2  = el('h2','pg-headline', photo.headline);
    hl2.style.textAlign = 'center';
    const orn2 = el('p','pg-ornament','— ✦ —');
    const txt2 = el('div','pg-text');
    txt2.append(cap, dt, el('p','pg-body', FILLERS[(idx+2)%FILLERS.length]));
    wrap.append(hl2, orn2, photoWrap, txt2);
  } else {
    const body3 = el('p','pg-body', FILLERS[(idx+3)%FILLERS.length]);
    txt.append(hl, dt, pqEl, cap, body3);
    wrap.append(txt, photoWrap);
  }

  container.appendChild(wrap);
}

function updateFooter() {
  pgNum.textContent = (photoIdx + 1) + ' / ' + CONFIG.photos.length;
  pgPrev.classList.toggle('disabled', photoIdx === 0);
  // On last page pgNext label becomes "Continue"
  if (photoIdx === CONFIG.photos.length - 1) {
    pgNext.textContent = 'Continue ✦';
    pgNext.classList.remove('disabled');
  } else {
    pgNext.textContent = 'Next →';
    pgNext.classList.remove('disabled');
  }
}

/* ── PAGE FLIP ────────────────────────────────────────────────────────── */
function flipTo(newIdx) {
  if (flipping) return;
  if (newIdx < 0) return;

  if (newIdx >= CONFIG.photos.length) {
    startVideoSection();
    return;
  }

  flipping = true;

  // Build incoming content into standby page
  buildPageContent(standbyPage, newIdx);
  standbyPage.classList.remove('np-page--hidden');

  // Position standby behind active
  standbyPage.style.position = 'absolute';
  standbyPage.style.top  = '0';
  standbyPage.style.left = '0';
  standbyPage.style.right = '0';
  standbyPage.style.zIndex = '1';
  activePage.style.zIndex  = '2';

  // Kick off animations
  activePage.classList.add('flip-out');
  standbyPage.classList.add('flip-in');

  activePage.addEventListener('animationend', () => {
    // Swap roles
    activePage.classList.remove('flip-out');
    activePage.classList.add('np-page--hidden');
    activePage.style.zIndex   = '';
    activePage.style.position = '';

    standbyPage.classList.remove('flip-in');
    standbyPage.style.zIndex   = '';
    standbyPage.style.position = '';
    standbyPage.style.top  = '';
    standbyPage.style.left = '';
    standbyPage.style.right = '';

    // Swap references
    [activePage, standbyPage] = [standbyPage, activePage];

    photoIdx = newIdx;
    flipping = false;
    updateFooter();
  }, { once: true });
}

/* ── CURTAIN OPEN ─────────────────────────────────────────────────────── */
curtainOverlay.addEventListener('click', function onCurtainClick() {
  curtainOverlay.removeEventListener('click', onCurtainClick);

  curtainLeft.classList.add('open');
  curtainRight.classList.add('open');

  // Start music on user gesture
  bgMusic.play().catch(() => {});

  // After curtain finishes sliding (2s) show newspaper
  setTimeout(() => {
    curtainOverlay.style.display = 'none';
    appState = 'newspaper';

    // Build first page
    buildPageContent(activePage, 0);
    updateFooter();

    newspaperWrap.style.display = 'block';
    newspaperWrap.style.opacity = '0';
    newspaperWrap.style.transition = 'opacity .7s ease';
    // Double rAF to ensure transition fires
    requestAnimationFrame(() => requestAnimationFrame(() => {
      newspaperWrap.style.opacity = '1';
    }));

    musicWidget.style.display = 'flex';
  }, 2200);
});

/* ── NEWSPAPER NAVIGATION ─────────────────────────────────────────────── */
pgNext.addEventListener('click', () => {
  if (appState !== 'newspaper') return;
  flipTo(photoIdx + 1);
});
pgPrev.addEventListener('click', () => {
  if (appState !== 'newspaper') return;
  flipTo(photoIdx - 1);
});

// Keyboard
document.addEventListener('keydown', e => {
  if (appState !== 'newspaper') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') flipTo(photoIdx + 1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   flipTo(photoIdx - 1);
});

// Touch swipe
let swipeStartX = 0;
document.addEventListener('touchstart', e => { swipeStartX = e.changedTouches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
  if (appState !== 'newspaper') return;
  const dx = e.changedTouches[0].clientX - swipeStartX;
  if (dx < -50) flipTo(photoIdx + 1);
  if (dx >  50) flipTo(photoIdx - 1);
}, { passive: true });

/* ── VIDEO SECTION ────────────────────────────────────────────────────── */
function startVideoSection() {
  appState = 'transitioning';
  blackOut(() => {
    newspaperWrap.style.display = 'none';
    appState = 'video';
    videoIdx = 0;
    loadVideo(videoIdx);

    videoWrap.style.display   = 'flex';
    videoWrap.style.opacity   = '0';
    videoWrap.style.transition = 'opacity .7s ease';
    clearBlack(200);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      videoWrap.style.opacity = '1';
    }));
  }, 900);
}

function loadVideo(idx) {
  const v = CONFIG.videos[idx];
  mainVideo.src            = v.src;
  videoLabel.textContent   = v.title || '';
  mainVideo.load();
  mainVideo.play().catch(() => {});
}

function advanceVideo() {
  videoIdx++;
  if (videoIdx < CONFIG.videos.length) {
    blackOut(() => {
      loadVideo(videoIdx);
      clearBlack(300);
    }, 500);
  } else {
    startApology();
  }
}

// Clicking the video element skips to next
mainVideo.addEventListener('click', () => {
  if (appState !== 'video') return;
  mainVideo.pause();
  advanceVideo();
});

// Natural end of video
mainVideo.addEventListener('ended', () => {
  if (appState !== 'video') return;
  fadeVol(CONFIG.music.defaultVolume, CONFIG.music.fadeInDuration);
  advanceVideo();
});

// Audio ducking when video plays
mainVideo.addEventListener('play', () => {
  if (appState !== 'video') return;
  const v = CONFIG.videos[videoIdx] || {};
  const target = (v.hasAudio && !mainVideo.muted)
    ? CONFIG.music.videoPlayingVolume
    : CONFIG.music.videoMutedVolume;
  fadeVol(target, CONFIG.music.fadeOutDuration);
});
mainVideo.addEventListener('pause', () => {
  if (appState !== 'video') return;
  fadeVol(CONFIG.music.defaultVolume, CONFIG.music.fadeInDuration);
});

/* ── APOLOGY ──────────────────────────────────────────────────────────── */
function startApology() {
  appState = 'transitioning';
  fadeVol(CONFIG.music.defaultVolume, CONFIG.music.fadeInDuration);
  blackOut(() => {
    videoWrap.style.display = 'none';
    appState = 'apology';

    apologyWrap.style.display   = 'flex';
    apologyWrap.style.opacity   = '0';
    apologyWrap.style.transition = 'opacity .8s ease';
    clearBlack(400);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      apologyWrap.style.opacity = '1';
      setTimeout(revealApology, 700);
    }));
  }, 1100);
}

function revealApology() {
  const msg = CONFIG.apologyMessage;
  apoRecipient.textContent = msg.recipient;
  apoBody.innerHTML = '';
  apoSig.textContent = msg.signature;

  setTimeout(() => apoRecipient.classList.add('visible'), 200);

  msg.paragraphs.forEach((txt, i) => {
    const p = el('p', 'apo-para', txt);
    apoBody.appendChild(p);
    setTimeout(() => p.classList.add('visible'), 700 + i * 520);
  });

  const end = 700 + msg.paragraphs.length * 520;
  setTimeout(() => apoSig.classList.add('visible'), end + 400);
  setTimeout(() => apoOrn.classList.add('visible'),  end + 900);
}

/* ── MUSIC CONTROLS ───────────────────────────────────────────────────── */
musicBtn.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play().catch(() => {});
    musicBtn.innerHTML = '&#9646;&#9646;';
    musicBtn.setAttribute('aria-label', 'Pause');
  } else {
    bgMusic.pause();
    musicBtn.innerHTML = '&#9654;';
    musicBtn.setAttribute('aria-label', 'Play');
  }
});

volSlider.addEventListener('input', () => {
  if (volTimer) { clearInterval(volTimer); volTimer = null; }
  bgMusic.volume = parseFloat(volSlider.value);
});

bgMusic.addEventListener('volumechange', () => {
  if (document.activeElement !== volSlider) volSlider.value = bgMusic.volume;
});

/* ── PRELOAD ALL IMAGES IN BACKGROUND ────────────────────────────────── */
// Kick off image fetches immediately so they're cached by the time the
// curtain opens. Use real Image objects — they fetch even off-screen.
CONFIG.photos.forEach(p => { const i = new Image(); i.src = p.src; });
