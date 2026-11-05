/* ═══════════════════════════════════════════════════════════════════════════
   CINEMATIC RUNWAY TRIBUTE — main.js
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── STATE ─────────────────────────────────────────────────────────────── */
let currentPhotoIndex = 0;
let isFlipping        = false;
let currentVideoIndex = 0;
let appState          = 'curtain'; // curtain | newspaper | videos | apology
let volumeFadeTimer   = null;
let touchStartX       = 0;

/* ─── DOM REFS ──────────────────────────────────────────────────────────── */
const bgMusic           = document.getElementById('bgMusic');
const curtainSection    = document.getElementById('curtain-section');
const curtainLeft       = document.getElementById('curtain-left');
const curtainRight      = document.getElementById('curtain-right');
const newspaperSection  = document.getElementById('newspaper-section');
const flipBook          = document.getElementById('flip-book');
const pageCurrent       = document.getElementById('page-current');
const pageNext          = document.getElementById('page-next');
const pageNumberEl      = document.getElementById('page-number');
const continueHint      = document.getElementById('continue-hint');
const videoSection      = document.getElementById('video-section');
const mainVideo         = document.getElementById('mainVideo');
const videoTitleEl      = document.getElementById('video-title');
const apologySection    = document.getElementById('apology-section');
const apologyRecipient  = document.getElementById('apology-recipient');
const apologyParagraphs = document.getElementById('apology-paragraphs');
const apologySignature  = document.getElementById('apology-signature');
const apologyOrnament   = document.getElementById('apology-ornament');
const overlay           = document.getElementById('transition-overlay');
const musicControls     = document.getElementById('music-controls');
const musicToggle       = document.getElementById('music-toggle');
const volumeSlider      = document.getElementById('volume-slider');

/* ─── AUDIO ─────────────────────────────────────────────────────────────── */
bgMusic.src    = CONFIG.music.src;
bgMusic.volume = CONFIG.music.defaultVolume;
bgMusic.loop   = false;

function smoothVolume(target, durationMs) {
  if (volumeFadeTimer) { clearInterval(volumeFadeTimer); volumeFadeTimer = null; }
  const to    = Math.min(1, Math.max(0, target));
  const steps = Math.max(1, Math.round(durationMs / 50));
  const delta = (to - bgMusic.volume) / steps;
  volumeFadeTimer = setInterval(() => {
    const next = bgMusic.volume + delta;
    if ((delta > 0 && next >= to) || (delta < 0 && next <= to) || delta === 0) {
      bgMusic.volume = to;
      volumeSlider.value = to;
      clearInterval(volumeFadeTimer); volumeFadeTimer = null;
    } else {
      bgMusic.volume = Math.min(1, Math.max(0, next));
      volumeSlider.value = bgMusic.volume;
    }
  }, 50);
}

/* ─── SHOW / HIDE HELPERS ───────────────────────────────────────────────── */
function hide(el) { el.classList.add('hidden'); }
function show(el, displayValue) {
  el.classList.remove('hidden');
  if (displayValue) el.style.display = displayValue;
}


const fillerTexts = [
  'In a season defined by boldness and silhouette, she arrived as if the runway had been waiting for her all along. Every step deliberate. Every gaze, a story.',
  'The lights found her first. The cameras followed. Fashion, they say, is a language — and she speaks it fluently, effortlessly, in every frame.',
  'She does not walk runways. She commands them. Her presence rewrites the air in every room she enters, leaving an impression no photograph can fully capture.',
  'There is a particular kind of grace that cannot be taught. It is felt. It arrives quietly and announces itself loudly. She has always had it.',
  'Between the flash of cameras and the hush of an expectant crowd, she moves with the certainty of someone who has always known exactly where she belongs.',
  'Fashion is memory — it is the story of who we are becoming. In these pages, we celebrate a woman becoming everything the world never quite prepared itself for.',
  'The runway is unforgiving. It reveals everything. And she, with each measured step, chose to reveal strength, beauty, and an unapologetic self that stole every eye in the room.',
];
const pullquotes = [
  '"She does not merely wear fashion — she inhabits it."',
  '"Every walk a statement. Every frame, a legacy."',
  '"The camera found its muse and never looked away."',
  '"Grace is not learned. It is remembered."',
];

/* ─── PAGE BUILDERS ─────────────────────────────────────────────────────── */
function makeEl(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls)  el.className = cls;
  if (text) el.textContent = text;
  return el;
}
function makePhoto(src, alt) {
  const wrap = makeEl('div', 'page-photo-wrap');
  const img  = makeEl('img', 'page-photo');
  img.src = src; img.alt = alt || '';
  // fetchpriority tells the browser this image matters
  img.setAttribute('fetchpriority', 'high');
  img.decoding = 'async';
  wrap.appendChild(img);
  return wrap;
}

function buildLayout(photo, index) {
  const layout = ['layout-hero','layout-split','layout-portrait','layout-editorial'][index % 4];
  const wrap   = makeEl('div', layout);
  const filler = fillerTexts[index % fillerTexts.length];
  const pq     = pullquotes[index % pullquotes.length];

  const photo_el = makePhoto(photo.src, photo.headline);
  const hl       = makeEl('h2',        'page-headline',  photo.headline);
  const cap      = makeEl('p',         'page-caption',   photo.caption);
  const dt       = makeEl('p',         'page-date',      photo.date);
  const orn      = makeEl('p',         'page-ornament',  '— ✦ —');
  const body     = makeEl('p',         'page-body',      filler);
  const pqEl     = makeEl('blockquote','page-pullquote', pq);

  const txt = makeEl('div', 'page-text');

  if (layout === 'layout-hero') {
    txt.append(hl, orn, cap, dt, body);
    wrap.append(photo_el, txt);
  } else if (layout === 'layout-split') {
    txt.append(hl, dt, orn, cap, pqEl, makeEl('p','page-body', fillerTexts[(index+1)%fillerTexts.length]));
    wrap.append(photo_el, txt);
  } else if (layout === 'layout-portrait') {
    const hl2 = makeEl('h2','page-headline', photo.headline);
    hl2.style.textAlign = 'center';
    const txt2 = makeEl('div','page-text');
    txt2.append(cap, dt, makeEl('p','page-body', fillerTexts[(index+2)%fillerTexts.length]));
    wrap.append(hl2, makeEl('p','page-ornament','— ✦ —'), photo_el, txt2);
  } else { // editorial
    txt.append(hl, dt, pqEl, cap, makeEl('p','page-body', fillerTexts[(index+3)%fillerTexts.length]));
    wrap.append(txt, photo_el);
  }
  return wrap;
}

/* ─── PRE-RENDER ALL PAGES ──────────────────────────────────────────────── */
// Build every page layout now and store the DOM nodes.
// The nodes live in a visible (but off-screen) container so the browser
// actually loads and decodes every image before the curtain opens.
const prebuiltPages = [];

const preloadShelf = document.createElement('div');
preloadShelf.id = 'preload-shelf';
preloadShelf.setAttribute('aria-hidden', 'true');
// Visible to the browser engine but off-screen for the user
preloadShelf.style.cssText = [
  'position:fixed',
  'top:0',
  'left:-9999px',
  'width:900px',
  'height:auto',
  'overflow:hidden',
  'visibility:hidden',
  'pointer-events:none',
  'z-index:-1',
].join(';');
document.body.appendChild(preloadShelf);

CONFIG.photos.forEach((photo, i) => {
  const node = buildLayout(photo, i);
  preloadShelf.appendChild(node); // triggers network requests for each <img>
  prebuiltPages.push(node);
});

/* ─── SHOW PAGE (no-clone, move the node) ──────────────────────────────── */
// We MOVE the pre-built node into pageCurrent (and back when done).
// Moving a DOM node that already has its image loaded means zero re-fetch.
let currentPageNode = null; // the node currently living in pageCurrent
let nextPageNode    = null; // the node currently living in pageNext

function mountPage(index, container) {
  // Return any existing node back to the shelf before replacing
  if (container === pageCurrent && currentPageNode) {
    preloadShelf.appendChild(currentPageNode);
  }
  if (container === pageNext && nextPageNode) {
    preloadShelf.appendChild(nextPageNode);
  }

  const node = prebuiltPages[index];
  container.innerHTML = '';
  container.appendChild(node);

  if (container === pageCurrent) currentPageNode = node;
  if (container === pageNext)    nextPageNode    = node;

  pageNumberEl.textContent  = 'Page ' + (index + 1) + ' of ' + CONFIG.photos.length;
  if (index === CONFIG.photos.length - 1) { show(continueHint); } else { hide(continueHint); }
}

/* ─── PAGE FLIP ─────────────────────────────────────────────────────────── */
function goToPage(direction) {
  if (isFlipping) return;

  const nextIndex = currentPhotoIndex + direction;
  if (nextIndex < 0) return;
  if (nextIndex >= CONFIG.photos.length) {
    if (direction === 1) triggerVideoTransition();
    return;
  }

  isFlipping = true;
  mountPage(nextIndex, pageNext);

  pageCurrent.style.zIndex = '2';
  pageNext.style.zIndex    = '1';

  pageCurrent.classList.add('flipping-out');
  pageNext.classList.add('flipping-in');

  setTimeout(() => {
    // After animation: make nextIndex the current page
    // Move the next node into current slot
    const incomingNode = prebuiltPages[nextIndex];

    // Return current node to shelf
    if (currentPageNode) preloadShelf.appendChild(currentPageNode);
    pageCurrent.innerHTML = '';
    pageCurrent.appendChild(incomingNode);
    currentPageNode = incomingNode;

    // Clear next slot
    pageNext.innerHTML = '';
    nextPageNode = null;

    pageCurrent.className = 'page';
    pageNext.className    = 'page';
    pageCurrent.style.zIndex = '';
    pageNext.style.zIndex    = '';

    currentPhotoIndex = nextIndex;
    isFlipping        = false;

    pageNumberEl.textContent   = 'Page ' + (currentPhotoIndex + 1) + ' of ' + CONFIG.photos.length;
    if (currentPhotoIndex === CONFIG.photos.length - 1) { show(continueHint); } else { hide(continueHint); }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 650);
}

/* ─── CURTAIN ───────────────────────────────────────────────────────────── */
function openCurtain() {
  curtainLeft.classList.add('open');
  curtainRight.classList.add('open');

  bgMusic.play().catch(() => {/* autoplay blocked — user can hit play */});

  setTimeout(() => {
    curtainSection.style.display = 'none';
    appState = 'newspaper';
    document.body.classList.add('state-newspaper');

    show(newspaperSection);
    newspaperSection.style.opacity  = '0';
    newspaperSection.style.transition = 'opacity 0.8s ease';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      newspaperSection.style.opacity = '1';
    }));

    show(musicControls, 'flex');

    // Mount first page — images already loaded in preloadShelf
    mountPage(0, pageCurrent);
  }, 2200);
}

curtainSection.addEventListener('click', openCurtain, { once: true });

/* ─── KEYBOARD ──────────────────────────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (appState !== 'newspaper') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown')  goToPage(1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')    goToPage(-1);
});

/* ─── TOUCH SWIPE ───────────────────────────────────────────────────────── */
document.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (appState !== 'newspaper') return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (dx < -50) goToPage(1);
  if (dx >  50) goToPage(-1);
}, { passive: true });

/* ─── OVERLAY HELPERS ───────────────────────────────────────────────────── */
function fadeOverlayIn(cb, holdMs) {
  overlay.classList.remove('fade-out');
  overlay.classList.add('fade-in');
  setTimeout(cb || (() => {}), holdMs || 1000);
}
function fadeOverlayOut(delayMs) {
  setTimeout(() => {
    overlay.classList.remove('fade-in');
    overlay.classList.add('fade-out');
  }, delayMs || 0);
}

/* ─── PHOTO → VIDEO TRANSITION ─────────────────────────────────────────── */
function triggerVideoTransition() {
  appState = 'transitioning';
  fadeOverlayIn(() => {
    hide(newspaperSection);
    document.body.classList.remove('state-newspaper');

    show(videoSection, 'flex');
    videoSection.style.opacity   = '0';
    videoSection.style.transition = 'opacity 0.8s ease';

    appState = 'videos';
    currentVideoIndex = 0;
    playNextVideo();

    setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        videoSection.style.opacity = '1';
        fadeOverlayOut(0);
      }));
    }, 800);
  }, 1000);
}

/* ─── VIDEO PLAYER ──────────────────────────────────────────────────────── */
function loadVideo(index) {
  const v = CONFIG.videos[index];
  mainVideo.src = v.src;
  videoTitleEl.textContent = v.title || '';
  mainVideo.load();
  mainVideo.play().catch(() => {/* blocked — controls visible */});
}

function playNextVideo() {
  if (currentVideoIndex >= CONFIG.videos.length) {
    triggerApologyTransition();
    return;
  }
  loadVideo(currentVideoIndex);
}

mainVideo.addEventListener('play', () => {
  if (currentVideoIndex >= CONFIG.videos.length) return;
  const v = CONFIG.videos[currentVideoIndex];
  const vol = (v.hasAudio && !mainVideo.muted)
    ? CONFIG.music.videoPlayingVolume
    : CONFIG.music.videoMutedVolume;
  smoothVolume(vol, CONFIG.music.fadeOutDuration);
});

mainVideo.addEventListener('ended', () => {
  smoothVolume(CONFIG.music.defaultVolume, CONFIG.music.fadeInDuration);
  currentVideoIndex++;
  if (currentVideoIndex < CONFIG.videos.length) {
    fadeOverlayIn(() => {
      loadVideo(currentVideoIndex);
      setTimeout(() => fadeOverlayOut(0), 400);
    }, 500);
  } else {
    triggerApologyTransition();
  }
});

/* ─── VIDEO → APOLOGY TRANSITION ───────────────────────────────────────── */
function triggerApologyTransition() {
  appState = 'transitioning';
  smoothVolume(CONFIG.music.defaultVolume, CONFIG.music.fadeInDuration);
  fadeOverlayIn(() => {
    hide(videoSection);
    show(apologySection, 'flex');
    apologySection.style.opacity    = '0';
    apologySection.style.transition = 'opacity 0.8s ease';
    appState = 'apology';
    setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        apologySection.style.opacity = '1';
        fadeOverlayOut(0);
        setTimeout(revealApology, 600);
      }));
    }, 600);
  }, 1200);
}

/* ─── APOLOGY REVEAL ────────────────────────────────────────────────────── */
function revealApology() {
  const msg = CONFIG.apologyMessage;
  apologyRecipient.textContent = msg.recipient;
  apologyParagraphs.innerHTML  = '';
  apologySignature.textContent = msg.signature;

  setTimeout(() => apologyRecipient.classList.add('visible'), 200);

  msg.paragraphs.forEach((text, i) => {
    const p = makeEl('p', 'apology-paragraph', text);
    apologyParagraphs.appendChild(p);
    setTimeout(() => p.classList.add('visible'), 700 + i * 500);
  });

  const done = 700 + msg.paragraphs.length * 500;
  setTimeout(() => apologySignature.classList.add('visible'), done + 400);
  setTimeout(() => apologyOrnament.classList.add('visible'),  done + 1000);
}

/* ─── MUSIC CONTROLS ────────────────────────────────────────────────────── */
musicToggle.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play().catch(() => {});
    musicToggle.innerHTML = '&#9646;&#9646;';
    musicToggle.setAttribute('aria-label', 'Pause music');
  } else {
    bgMusic.pause();
    musicToggle.innerHTML = '&#9654;';
    musicToggle.setAttribute('aria-label', 'Play music');
  }
});

volumeSlider.addEventListener('input', () => {
  if (volumeFadeTimer) { clearInterval(volumeFadeTimer); volumeFadeTimer = null; }
  bgMusic.volume = parseFloat(volumeSlider.value);
});

bgMusic.addEventListener('volumechange', () => {
  if (document.activeElement !== volumeSlider) {
    volumeSlider.value = bgMusic.volume;
  }
});
