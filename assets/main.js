/* ─── STATE ──────────────────────────────────────────────────────────────────
   Tracks where the visitor is in the experience and what's currently playing.
─────────────────────────────────────────────────────────────────────────── */
let currentPhotoIndex = 0;
let isFlipping = false;
let currentVideoIndex = 0;
let appState = 'curtain'; // 'curtain' | 'newspaper' | 'videos' | 'apology'
let volumeFadeInterval = null;
let musicStarted = false;

/* ─── DOM REFS ───────────────────────────────────────────────────────────────
─────────────────────────────────────────────────────────────────────────── */
const bgMusic          = document.getElementById('bgMusic');
const curtainSection   = document.getElementById('curtain-section');
const curtainLeft      = document.getElementById('curtain-left');
const curtainRight     = document.getElementById('curtain-right');
const newspaperSection = document.getElementById('newspaper-section');
const flipBook         = document.getElementById('flip-book');
const pageCurrent      = document.getElementById('page-current');
const pageNext         = document.getElementById('page-next');
const pageNumber       = document.getElementById('page-number');
const continueHint     = document.getElementById('continue-hint');
const videoSection     = document.getElementById('video-section');
const mainVideo        = document.getElementById('mainVideo');
const videoTitle       = document.getElementById('video-title');
const apologySection   = document.getElementById('apology-section');
const apologyRecipient = document.getElementById('apology-recipient');
const apologyParagraphs= document.getElementById('apology-paragraphs');
const apologySignature = document.getElementById('apology-signature');
const apologyOrnament  = document.getElementById('apology-ornament');
const overlay          = document.getElementById('transition-overlay');
const musicControls    = document.getElementById('music-controls');
const musicToggle      = document.getElementById('music-toggle');
const volumeSlider     = document.getElementById('volume-slider');
const zoneLeft         = document.getElementById('zone-left');
const zoneRight        = document.getElementById('zone-right');

/* ─── AUDIO SETUP ────────────────────────────────────────────────────────────
─────────────────────────────────────────────────────────────────────────── */
bgMusic.src = CONFIG.music.src;
bgMusic.volume = CONFIG.music.defaultVolume;
bgMusic.loop = false;

/* ─── SMOOTH VOLUME ──────────────────────────────────────────────────────────
   Fades bgMusic volume to `target` over `durationMs` milliseconds.
─────────────────────────────────────────────────────────────────────────── */
function smoothVolume(target, durationMs) {
  if (volumeFadeInterval !== null) {
    clearInterval(volumeFadeInterval);
    volumeFadeInterval = null;
  }

  const clampedTarget = Math.min(1, Math.max(0, target));
  const steps = Math.max(1, Math.round(durationMs / 50));
  const delta = (clampedTarget - bgMusic.volume) / steps;

  volumeFadeInterval = setInterval(() => {
    const next = bgMusic.volume + delta;
    if (
      (delta > 0 && next >= clampedTarget) ||
      (delta < 0 && next <= clampedTarget) ||
      delta === 0
    ) {
      bgMusic.volume = clampedTarget;
      clearInterval(volumeFadeInterval);
      volumeFadeInterval = null;
      // Sync the slider to the new settled volume
      volumeSlider.value = bgMusic.volume;
    } else {
      bgMusic.volume = Math.min(1, Math.max(0, next));
      volumeSlider.value = bgMusic.volume;
    }
  }, 50);
}

/* ─── FASHION FILLER TEXT ────────────────────────────────────────────────────
   Distinct passages used across the four layout types.
─────────────────────────────────────────────────────────────────────────── */
const fillerTexts = [
  'In a season defined by boldness and silhouette, she arrived as if the runway had been waiting for her all along. Every step deliberate. Every gaze, a story.',
  'The lights found her first. The cameras followed. Fashion, they say, is a language — and she speaks it fluently, effortlessly, in every frame.',
  'She does not walk runways. She commands them. Her presence rewrites the air in every room she enters, leaving an impression no photograph can fully capture.',
  'There is a particular kind of grace that cannot be taught. It is felt. It arrives quietly and announces itself loudly. She has always had it.',
  'Between the flash of cameras and the hush of an expectant crowd, she moves with the certainty of someone who has always known exactly where she belongs.',
  'Fashion is memory — it is the story of who we are becoming. In these pages, we celebrate a woman becoming everything the world never quite prepared itself for.',
  'The runway is unforgiving. It reveals everything. And she, with each measured step, chose to reveal strength, beauty, and an unapologetic self that stole every eye in the room.',
];

function getFillerText(index) {
  return fillerTexts[index % fillerTexts.length];
}

/* ─── BUILD PAGE ─────────────────────────────────────────────────────────────
   Renders a photo page into `containerEl` using one of four rotating layouts.
─────────────────────────────────────────────────────────────────────────── */
function buildPage(index, containerEl) {
  const photo = CONFIG.photos[index];
  const layoutIndex = index % 4;
  const layouts = ['layout-hero', 'layout-split', 'layout-portrait', 'layout-editorial'];
  const layoutClass = layouts[layoutIndex];

  containerEl.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = layoutClass;

  if (layoutClass === 'layout-hero') {
    buildHeroLayout(wrapper, photo, index);
  } else if (layoutClass === 'layout-split') {
    buildSplitLayout(wrapper, photo, index);
  } else if (layoutClass === 'layout-portrait') {
    buildPortraitLayout(wrapper, photo, index);
  } else {
    buildEditorialLayout(wrapper, photo, index);
  }

  containerEl.appendChild(wrapper);

  // Dynamically set flip-book min-height to match the rendered page height
  requestAnimationFrame(() => {
    const h = wrapper.offsetHeight || 520;
    flipBook.style.minHeight = h + 'px';
    containerEl.style.minHeight = h + 'px';
  });

  // Page number and continue hint
  pageNumber.textContent = 'Page ' + (index + 1) + ' of ' + CONFIG.photos.length;
  if (index === CONFIG.photos.length - 1) {
    continueHint.style.display = 'inline';
  } else {
    continueHint.style.display = 'none';
  }
}

function makePhoto(src, alt) {
  const wrap = document.createElement('div');
  wrap.className = 'page-photo-wrap';
  const img = document.createElement('img');
  img.className = 'page-photo';
  img.src = src;
  img.alt = alt || '';
  img.loading = 'eager';
  wrap.appendChild(img);
  return wrap;
}

function makeHeadline(text) {
  const el = document.createElement('h2');
  el.className = 'page-headline';
  el.textContent = text;
  return el;
}

function makeCaption(text) {
  const el = document.createElement('p');
  el.className = 'page-caption';
  el.textContent = text;
  return el;
}

function makeDate(text) {
  const el = document.createElement('p');
  el.className = 'page-date';
  el.textContent = text;
  return el;
}

function makeOrnament() {
  const el = document.createElement('p');
  el.className = 'page-ornament';
  el.textContent = '— ✦ —';
  return el;
}

function makePullquote(text) {
  const el = document.createElement('blockquote');
  el.className = 'page-pullquote';
  el.textContent = text;
  return el;
}

function makeBody(text) {
  const el = document.createElement('p');
  el.className = 'page-body';
  el.textContent = text;
  return el;
}

function buildHeroLayout(wrapper, photo, index) {
  const photoWrap = makePhoto(photo.src, photo.headline);

  const textDiv = document.createElement('div');
  textDiv.className = 'page-text';
  textDiv.appendChild(makeHeadline(photo.headline));
  textDiv.appendChild(makeOrnament());
  textDiv.appendChild(makeCaption(photo.caption));
  textDiv.appendChild(makeDate(photo.date));
  const body = makeBody(getFillerText(index));
  body.classList.add('page-body');
  textDiv.appendChild(body);

  wrapper.appendChild(photoWrap);
  wrapper.appendChild(textDiv);
}

function buildSplitLayout(wrapper, photo, index) {
  const photoWrap = makePhoto(photo.src, photo.headline);

  const textDiv = document.createElement('div');
  textDiv.className = 'page-text';
  textDiv.appendChild(makeHeadline(photo.headline));
  textDiv.appendChild(makeDate(photo.date));
  textDiv.appendChild(makeOrnament());
  textDiv.appendChild(makeCaption(photo.caption));
  textDiv.appendChild(makePullquote('"She does not merely wear fashion — she inhabits it."'));
  textDiv.appendChild(makeBody(getFillerText(index + 1)));

  wrapper.appendChild(photoWrap);
  wrapper.appendChild(textDiv);
}

function buildPortraitLayout(wrapper, photo, index) {
  const headlineEl = makeHeadline(photo.headline);
  headlineEl.style.textAlign = 'center';
  wrapper.appendChild(headlineEl);

  wrapper.appendChild(makeOrnament());

  const photoWrap = makePhoto(photo.src, photo.headline);
  wrapper.appendChild(photoWrap);

  const textDiv = document.createElement('div');
  textDiv.className = 'page-text';
  textDiv.appendChild(makeCaption(photo.caption));
  textDiv.appendChild(makeDate(photo.date));
  textDiv.appendChild(makeBody(getFillerText(index + 2)));

  wrapper.appendChild(textDiv);
}

function buildEditorialLayout(wrapper, photo, index) {
  const textDiv = document.createElement('div');
  textDiv.className = 'page-text';
  textDiv.appendChild(makeHeadline(photo.headline));
  textDiv.appendChild(makeDate(photo.date));
  textDiv.appendChild(makePullquote('"Every walk a statement. Every frame, a legacy."'));
  textDiv.appendChild(makeCaption(photo.caption));
  textDiv.appendChild(makeBody(getFillerText(index + 3)));

  const photoWrap = makePhoto(photo.src, photo.headline);

  wrapper.appendChild(textDiv);
  wrapper.appendChild(photoWrap);
}

/* ─── PAGE FLIP ──────────────────────────────────────────────────────────────
   Handles the 3D page-turn animation between photos.
─────────────────────────────────────────────────────────────────────────── */
function goToPage(direction) {
  if (isFlipping) return;

  const nextIndex = currentPhotoIndex + direction;

  if (nextIndex < 0) return; // Already on the first page

  if (nextIndex >= CONFIG.photos.length) {
    if (direction === 1) {
      triggerVideoTransition();
    }
    return;
  }

  isFlipping = true;

  // Use pre-built cached page — image is already loaded
  pageNext.innerHTML = '';
  pageNext.appendChild(prebuiltPages[nextIndex].cloneNode(true));
  pageNext.style.zIndex = '1';
  pageCurrent.style.zIndex = '2';

  // Trigger simultaneous flip animations
  pageCurrent.classList.add('flipping-out');
  pageNext.classList.add('flipping-in');

  setTimeout(() => {
    // Swap content: move what was "next" into "current"
    pageCurrent.innerHTML = pageNext.innerHTML;
    pageCurrent.className = 'page';
    pageNext.innerHTML = '';
    pageNext.className = 'page';
    pageCurrent.style.zIndex = '';
    pageNext.style.zIndex = '';

    currentPhotoIndex = nextIndex;
    isFlipping = false;

    // Recalculate flip-book height after swap
    requestAnimationFrame(() => {
      const firstChild = pageCurrent.firstElementChild;
      if (firstChild) {
        const h = firstChild.offsetHeight || 520;
        flipBook.style.minHeight = h + 'px';
        pageCurrent.style.minHeight = h + 'px';
      }
    });

    pageNumber.textContent = 'Page ' + (currentPhotoIndex + 1) + ' of ' + CONFIG.photos.length;
    if (currentPhotoIndex === CONFIG.photos.length - 1) {
      continueHint.style.display = 'inline';
    } else {
      continueHint.style.display = 'none';
    }
    updateNavButtons();
    // Scroll back to top of page so the new page is fully visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 620); // Slightly over --flip-duration to let the animation complete cleanly
}

/* ─── CURTAIN ────────────────────────────────────────────────────────────────
─────────────────────────────────────────────────────────────────────────── */
function openCurtain() {
  curtainLeft.classList.add('open');
  curtainRight.classList.add('open');

  // Start music after the user gesture
  bgMusic.play().catch(() => {
    // Autoplay blocked — music will start when user interacts with controls
  });
  musicStarted = true;

  // Transition curtain → newspaper after the CSS transition finishes (2s)
  setTimeout(() => {
    curtainSection.style.display = 'none';
    appState = 'newspaper';
    document.body.classList.add('state-newspaper');

    // Reveal newspaper with a gentle fade
    newspaperSection.style.display = 'flex';
    newspaperSection.style.opacity = '0';
    requestAnimationFrame(() => {
      newspaperSection.style.transition = 'opacity 0.8s ease';
      newspaperSection.style.opacity = '1';
    });

    // Show music controls
    musicControls.style.display = 'flex';

    // Show first page using pre-built cache
    showPage(0, pageCurrent);
  }, 2100);
}

curtainSection.addEventListener('click', openCurtain, { once: true });

/* ─── CLICK ZONES (desktop navigation) ──────────────────────────────────────
   Navigation is via keyboard arrows and touch swipe.
   Click zones kept for JS refs but hidden via CSS.
─────────────────────────────────────────────────────────────────────────── */
function updateNavButtons() { /* no-op — buttons removed */ }

if (zoneLeft) {
  zoneLeft.addEventListener('click', () => {
    if (appState === 'newspaper') goToPage(-1);
  });
}

if (zoneRight) {
  zoneRight.addEventListener('click', () => {
    if (appState === 'newspaper') goToPage(1);
  });
}

/* ─── KEYBOARD NAVIGATION ────────────────────────────────────────────────────
─────────────────────────────────────────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (appState !== 'newspaper') return;
  if (e.key === 'ArrowRight') goToPage(1);
  if (e.key === 'ArrowLeft')  goToPage(-1);
});

/* ─── TOUCH / SWIPE NAVIGATION ───────────────────────────────────────────────
─────────────────────────────────────────────────────────────────────────── */
let touchStartX = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (appState !== 'newspaper') return;
  const deltaX = e.changedTouches[0].clientX - touchStartX;
  if (deltaX < -50) goToPage(1);   // swipe left → next
  if (deltaX > 50)  goToPage(-1);  // swipe right → prev
}, { passive: true });

/* ─── OVERLAY HELPERS ────────────────────────────────────────────────────────
─────────────────────────────────────────────────────────────────────────── */
function fadeOverlayIn(cb, delay) {
  overlay.classList.remove('fade-out');
  overlay.classList.add('fade-in');
  setTimeout(cb || (() => {}), delay || 1000);
}

function fadeOverlayOut(delay) {
  setTimeout(() => {
    overlay.classList.remove('fade-in');
    overlay.classList.add('fade-out');
  }, delay || 0);
}

/* ─── PHOTO → VIDEO TRANSITION ───────────────────────────────────────────────
─────────────────────────────────────────────────────────────────────────── */
function triggerVideoTransition() {
  appState = 'transitioning';

  // Fade to black
  fadeOverlayIn(() => {
    // Hide newspaper
    newspaperSection.style.display = 'none';
    document.body.classList.remove('state-newspaper');

    // Show video section (hidden behind overlay)
    videoSection.style.display = 'flex';
    videoSection.style.opacity = '0';

    appState = 'videos';
    currentVideoIndex = 0;
    playNextVideo();

    // Fade overlay out to reveal the video section
    setTimeout(() => {
      videoSection.style.transition = 'opacity 0.8s ease';
      videoSection.style.opacity = '1';
      fadeOverlayOut(0);
    }, 800);
  }, 1000);
}

/* ─── VIDEO PLAYER ───────────────────────────────────────────────────────────
─────────────────────────────────────────────────────────────────────────── */
function loadVideo(index) {
  const v = CONFIG.videos[index];
  mainVideo.src = v.src;
  videoTitle.textContent = v.title;
  mainVideo.load();
  mainVideo.play().catch(() => {
    // Autoplay may be blocked; video controls are visible so user can start manually
  });
}

function playNextVideo() {
  if (currentVideoIndex >= CONFIG.videos.length) {
    triggerApologyTransition();
    return;
  }
  loadVideo(currentVideoIndex);
}

// Duck music when a video starts playing
mainVideo.addEventListener('play', () => {
  if (currentVideoIndex >= CONFIG.videos.length) return;
  const v = CONFIG.videos[currentVideoIndex];
  const targetVol = (v.hasAudio && !mainVideo.muted)
    ? CONFIG.music.videoPlayingVolume
    : CONFIG.music.videoMutedVolume;
  smoothVolume(targetVol, CONFIG.music.fadeOutDuration);
});

// Restore music and advance when a video ends
mainVideo.addEventListener('ended', () => {
  smoothVolume(CONFIG.music.defaultVolume, CONFIG.music.fadeInDuration);
  currentVideoIndex++;

  if (currentVideoIndex < CONFIG.videos.length) {
    // Brief black transition between videos
    fadeOverlayIn(() => {
      loadVideo(currentVideoIndex);
      setTimeout(() => fadeOverlayOut(0), 400);
    }, 500);
  } else {
    triggerApologyTransition();
  }
});

/* ─── VIDEO → APOLOGY TRANSITION ─────────────────────────────────────────────
─────────────────────────────────────────────────────────────────────────── */
function triggerApologyTransition() {
  appState = 'transitioning';

  // Restore music to default before apology section
  smoothVolume(CONFIG.music.defaultVolume, CONFIG.music.fadeInDuration);

  fadeOverlayIn(() => {
    videoSection.style.display = 'none';
    apologySection.style.display = 'flex';
    apologySection.style.opacity = '0';
    appState = 'apology';

    setTimeout(() => {
      apologySection.style.transition = 'opacity 0.8s ease';
      apologySection.style.opacity = '1';
      fadeOverlayOut(0);

      // Begin staggered reveal of apology text
      setTimeout(revealApology, 500);
    }, 600);
  }, 1200);
}

/* ─── APOLOGY REVEAL ─────────────────────────────────────────────────────────
─────────────────────────────────────────────────────────────────────────── */
function revealApology() {
  const msg = CONFIG.apologyMessage;

  apologyRecipient.textContent = msg.recipient;
  apologyParagraphs.innerHTML = '';
  apologySignature.textContent = msg.signature;

  // Fade in recipient
  setTimeout(() => apologyRecipient.classList.add('visible'), 200);

  // Create and stagger paragraph elements
  msg.paragraphs.forEach((text, i) => {
    const p = document.createElement('p');
    p.className = 'apology-paragraph';
    p.textContent = text;
    apologyParagraphs.appendChild(p);

    setTimeout(() => p.classList.add('visible'), 600 + i * 500);
  });

  const paragraphDelay = 600 + msg.paragraphs.length * 500;

  // Signature
  setTimeout(() => apologySignature.classList.add('visible'), paragraphDelay + 400);

  // Ornament
  setTimeout(() => apologyOrnament.classList.add('visible'), paragraphDelay + 1000);
}

/* ─── MUSIC CONTROLS ─────────────────────────────────────────────────────────
─────────────────────────────────────────────────────────────────────────── */
musicToggle.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play().catch(() => {});
    musicToggle.innerHTML = '&#9646;&#9646;'; // Pause icon
    musicToggle.setAttribute('aria-label', 'Pause music');
  } else {
    bgMusic.pause();
    musicToggle.innerHTML = '&#9654;'; // Play icon
    musicToggle.setAttribute('aria-label', 'Play music');
  }
});

volumeSlider.addEventListener('input', () => {
  // Manual volume override — clear any active fade
  if (volumeFadeInterval !== null) {
    clearInterval(volumeFadeInterval);
    volumeFadeInterval = null;
  }
  bgMusic.volume = parseFloat(volumeSlider.value);
});

// Keep slider in sync if volume changes externally (e.g. from smoothVolume ticks)
bgMusic.addEventListener('volumechange', () => {
  // Only update slider if user isn't actively dragging it
  if (document.activeElement !== volumeSlider) {
    volumeSlider.value = bgMusic.volume;
  }
});

/* ─── INIT ───────────────────────────────────────────────────────────────────
   Pre-render ALL pages into a hidden off-screen container so every image
   is fully loaded by the browser before the curtain opens.
   During flips we just swap pre-built nodes — no on-demand building.
─────────────────────────────────────────────────────────────────────────── */

// Cache: array of pre-built wrapper divs, one per photo
const prebuiltPages = [];

// Off-screen container that forces the browser to load all images immediately
const preloadContainer = document.createElement('div');
preloadContainer.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:900px;visibility:hidden;pointer-events:none;';
document.body.appendChild(preloadContainer);

CONFIG.photos.forEach((photo, i) => {
  const wrapper = document.createElement('div');
  const layoutClass = ['layout-hero','layout-split','layout-portrait','layout-editorial'][i % 4];
  wrapper.className = layoutClass;

  if (layoutClass === 'layout-hero')         buildHeroLayout(wrapper, photo, i);
  else if (layoutClass === 'layout-split')   buildSplitLayout(wrapper, photo, i);
  else if (layoutClass === 'layout-portrait') buildPortraitLayout(wrapper, photo, i);
  else                                        buildEditorialLayout(wrapper, photo, i);

  // Force all images to load by putting them in the real DOM
  preloadContainer.appendChild(wrapper);
  prebuiltPages.push(wrapper);
});

// Show first page immediately (clone so the original stays in preloadContainer)
function showPage(index, containerEl) {
  containerEl.innerHTML = '';
  containerEl.appendChild(prebuiltPages[index].cloneNode(true));
  pageNumber.textContent = 'Page ' + (index + 1) + ' of ' + CONFIG.photos.length;
  continueHint.style.display = index === CONFIG.photos.length - 1 ? 'inline' : 'none';
}

showPage(0, pageCurrent);

// Preload video metadata
CONFIG.videos.forEach((vid) => {
  const v = document.createElement('video');
  v.preload = 'metadata';
  v.src = vid.src;
});
