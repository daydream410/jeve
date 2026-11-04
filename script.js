/**
 * Cico x Jeje - Soft Blossom Romance
 */

const CONFIG = {
  yourName: 'Cico',
  partnerName: 'Jeje',
  cityA: 'Surabaya',
  cityB: 'Purworejo',
  askQuestion: 'Jeje, would you be mine?',
  celebrateTitle: 'Makasih, Jeje.',
  celebrateMessage:
    'Aku bahagia banget. Dari jokes “ngeeengg” di hutan, streak TikTok, sampai tawa kamu di call Discord — semuanya bikin aku makin yakin. Malamnya… jangan berhenti, ya?',
  musicTitle: 'YouTube soundtrack',
  youtubeVideoId: 'ueABCC8eF6o',
  youtubeUrl: 'https://www.youtube.com/watch?v=ueABCC8eF6o',
  musicVolume: 10, // 0-100
  noFleeMax: 5, // hilang total di percobaan ke-5
};

const SCENES = [
  { name: 'gate', label: '' },
  { name: 'intro', label: 'pembuka' },
  { name: 'game', label: 'pemanasan' },
  { name: 'story', label: 'bab 1 · awal kita' },
  { name: 'map', label: 'bab 2 · jarak' },
  { name: 'letter', label: 'bab 3 · surat' },
  { name: 'promise', label: 'bab 4 · janji' },
  { name: 'pause', label: '' },
  { name: 'ask', label: 'the important part' },
  { name: 'celebrate', label: 'hari kita' },
];

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initMobileViewport();
  applyConfig();
  initScenes();
  initGames();
  initLetter();
  initAskButtons();
  initMusic();
  initConfetti();
  initCelebrate();
});

function initMobileViewport() {
  const root = document.documentElement;
  const sync = () => {
    const height = window.visualViewport?.height || window.innerHeight;
    root.style.setProperty('--vvh', `${Math.round(height)}px`);
  };
  sync();
  window.visualViewport?.addEventListener('resize', sync);
  window.addEventListener('orientationchange', () => {
    window.setTimeout(sync, 250);
  });
}

function scrollPageToTop() {
  const root = document.scrollingElement || document.documentElement;
  root.scrollTop = 0;
  document.body.scrollTop = 0;
}

function applyConfig() {
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('name-you', CONFIG.yourName);
  setText('name-partner', CONFIG.partnerName);
  setText('city-a-label', CONFIG.cityA);
  setText('city-b-label', CONFIG.cityB);
  setText('ask-question', CONFIG.askQuestion);
  setText('celebrate-title', CONFIG.celebrateTitle);
  setText('celebrate-message', CONFIG.celebrateMessage);
}

function initScenes() {
  document.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      goToScene(btn.getAttribute('data-next'));
    });
  });
}

let sceneSwitching = false;
const SCENE_EXIT_MS = 450;

function goToScene(name) {
  const target = document.querySelector(`.scene[data-scene="${name}"]`);
  const current = document.querySelector('.scene.scene-active');
  if (!target || target === current || sceneSwitching) return;

  sceneSwitching = true;
  if (current) current.classList.add('scene-leaving');
  if (current?.dataset.scene === 'game') stopCatchGame();

  window.setTimeout(() => {
    if (current) {
      current.classList.remove('scene-active', 'scene-leaving');
      current.hidden = true;
    }
    target.hidden = false;
    void target.offsetWidth;
    target.classList.add('scene-active');
    scrollPageToTop();

    updateJourney(name);
    onEnterScene(name);
    sceneSwitching = false;
  }, current && !prefersReducedMotion ? SCENE_EXIT_MS : 0);
}

function onEnterScene(name) {
  if (name === 'game') startGames();
  if (name === 'story') {
    revealSequence('#story-stack .story-line', {
      interval: 1150,
      button: 'story-continue',
    });
  }
  if (name === 'map') playMapAnimation();
  if (name === 'letter') startLetter();
  if (name === 'promise') {
    revealSequence('#promise-list .promise-item', {
      interval: 1300,
      startDelay: 500,
      button: 'promise-continue',
    });
  }
  if (name === 'pause') startPause();
  if (name === 'ask') {
    requestAnimationFrame(() => {
      window.__prepareAskLayout?.();
    });
  }
  if (name === 'celebrate') {
    triggerConfetti();
    window.setTimeout(triggerConfetti, 1600);
  }
}

function updateJourney(name) {
  const idx = SCENES.findIndex((s) => s.name === name);
  const fill = document.getElementById('journey-fill');
  const label = document.getElementById('chapter-label');
  const pct = idx <= 0 ? 0 : (idx / (SCENES.length - 1)) * 100;

  document.body.dataset.scene = name;
  if (fill) fill.style.width = `${pct}%`;
  if (label) label.textContent = SCENES[idx]?.label ?? '';
}

/* ---------- Reveal helpers ---------- */
const sequenceTimers = new Map();

function revealSequence(selector, { interval = 1000, startDelay = 350, button } = {}) {
  sequenceTimers.get(selector)?.forEach((id) => clearTimeout(id));
  const timers = [];
  sequenceTimers.set(selector, timers);

  const items = [...document.querySelectorAll(selector)];
  const btn = button ? document.getElementById(button) : null;
  items.forEach((el) => el.classList.remove('is-visible'));
  if (btn) btn.disabled = true;

  const step = prefersReducedMotion ? 120 : interval;
  items.forEach((el, i) => {
    timers.push(setTimeout(() => el.classList.add('is-visible'), startDelay + i * step));
  });
  timers.push(
    setTimeout(() => {
      if (btn) btn.disabled = false;
    }, startDelay + items.length * step)
  );
}

/* ---------- Letter (typewriter) ---------- */
let letterTimer = 0;
let letterFinish = null;

function initLetter() {
  const card = document.getElementById('letter-card');
  if (!card) return;
  card.querySelectorAll('[data-type]').forEach((el) => {
    el.dataset.full = el.textContent.trim();
  });
  card.addEventListener('click', () => letterFinish?.());
}

function startLetter() {
  const card = document.getElementById('letter-card');
  const btn = document.getElementById('letter-continue');
  const skip = document.getElementById('letter-skip');
  if (!card) return;

  clearTimeout(letterTimer);
  const parts = [...card.querySelectorAll('[data-type]')];
  parts.forEach((el) => {
    el.textContent = '';
    el.classList.remove('is-typing', 'is-done');
  });
  if (btn) btn.disabled = true;
  if (skip) skip.hidden = false;

  const done = () => {
    clearTimeout(letterTimer);
    parts.forEach((el) => {
      el.textContent = el.dataset.full;
      el.classList.remove('is-typing');
      el.classList.add('is-done');
    });
    if (btn) btn.disabled = false;
    if (skip) skip.hidden = true;
    letterFinish = null;
  };
  letterFinish = done;

  if (prefersReducedMotion) {
    done();
    return;
  }

  let p = 0;
  let c = 0;
  const typeNext = () => {
    const el = parts[p];
    if (!el) {
      done();
      return;
    }
    const full = el.dataset.full;
    el.classList.add('is-typing');
    c += 1;
    el.textContent = full.slice(0, c);

    if (c < full.length) {
      const ch = full[c - 1];
      const pauseAfter = /[.,?!—…]/.test(ch) ? 340 : 0;
      letterTimer = setTimeout(typeNext, 54 + pauseAfter);
    } else {
      el.classList.remove('is-typing');
      el.classList.add('is-done');
      p += 1;
      c = 0;
      letterTimer = setTimeout(typeNext, 950);
    }
  };

  letterTimer = setTimeout(typeNext, 900);
}

/* ---------- Pause before the question ---------- */
function startPause() {
  revealSequence('#scene-pause .pause-line', { interval: 1700, startDelay: 700 });
  const cta = document.getElementById('pause-cta');
  const lines = document.querySelectorAll('#scene-pause .pause-line').length;
  if (!cta) return;
  cta.classList.remove('is-visible');
  const step = prefersReducedMotion ? 120 : 1700;
  window.setTimeout(() => cta.classList.add('is-visible'), 700 + lines * step + 400);
}

/* ---------- Celebrate ---------- */
function initCelebrate() {
  const stamp = document.getElementById('date-stamp');
  if (stamp) {
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    stamp.textContent = `mulai hari ini · ${today}`;
  }

  document.getElementById('replay-btn')?.addEventListener('click', () => {
    goToScene('intro');
  });
}

/* ---------- Map ---------- */
let mapAnimRaf = 0;
let mapAnimTimers = [];

function clearMapTimers() {
  if (mapAnimRaf) cancelAnimationFrame(mapAnimRaf);
  mapAnimRaf = 0;
  mapAnimTimers.forEach((id) => clearTimeout(id));
  mapAnimTimers = [];
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function playMapAnimation() {
  clearMapTimers();

  const map = document.querySelector('.distance-map');
  const path = document.getElementById('heart-path');
  const glow = document.getElementById('heart-path-glow');
  const heart = document.getElementById('traveling-heart');
  const trails = [...document.querySelectorAll('.trail-heart')];
  const pins = document.querySelectorAll('.city-pin');
  const linkLabel = document.getElementById('map-link-label');

  if (!path || !heart) return;

  const travelers = [
    { el: heart, delay: 0, scale: 1.08 },
    ...trails.map((el, i) => ({
      el,
      delay: 0.08 + i * 0.07, // fraction of total duration behind leader
      scale: 0.72 - i * 0.08,
    })),
  ];

  map?.classList.remove('is-connected');
  path.classList.remove('is-drawn');
  glow?.classList.remove('is-drawn');
  heart.classList.remove('is-moving');
  travelers.forEach(({ el }) => {
    el.classList.remove('is-moving');
    el.style.opacity = '0';
    el.setAttribute('transform', 'translate(56, 140)');
  });
  pins.forEach((p) => p.classList.remove('is-visible'));

  if (linkLabel) {
    linkLabel.textContent = 'connecting…';
    linkLabel.classList.remove('is-ready');
  }

  void path.getBoundingClientRect();

  pins.forEach((p, idx) => {
    mapAnimTimers.push(
      setTimeout(() => p.classList.add('is-visible'), 120 + idx * 180)
    );
  });

  // Line draws slowly; heart follows the same curve
  mapAnimTimers.push(
    setTimeout(() => {
      path.classList.add('is-drawn');
      glow?.classList.add('is-drawn');
    }, 280)
  );

  const travelMs = 5200;
  const travelStartDelay = 700;
  const pathLen = path.getTotalLength();

  mapAnimTimers.push(
    setTimeout(() => {
      travelers.forEach(({ el }) => el.classList.add('is-moving'));

      const startedAt = performance.now();

      const tick = (now) => {
        const elapsed = now - startedAt;
        let allDone = true;

        travelers.forEach(({ el, delay, scale }) => {
          const local = (elapsed / travelMs) - delay;
          if (local <= 0) {
            el.style.opacity = '0';
            allDone = false;
            return;
          }

          const raw = Math.min(1, local);
          const t = easeInOutCubic(raw);
          const pt = path.getPointAtLength(t * pathLen);
          const bob = 1 + Math.sin(t * Math.PI * 4) * 0.08;

          el.setAttribute(
            'transform',
            `translate(${pt.x}, ${pt.y}) scale(${scale * bob})`
          );
          el.style.opacity =
            raw < 0.05 ? String(raw / 0.05) : raw > 0.97 ? '0.85' : '1';

          if (raw < 1) allDone = false;
        });

        if (!allDone) {
          mapAnimRaf = requestAnimationFrame(tick);
        } else {
          map?.classList.add('is-connected');
          if (linkLabel) {
            linkLabel.textContent = 'connected ♡';
            linkLabel.classList.add('is-ready');
          }
        }
      };

      mapAnimRaf = requestAnimationFrame(tick);
    }, travelStartDelay)
  );
}

/* ---------- Yes / No ---------- */
function initAskButtons() {
  const yesBtn = document.getElementById('btn-yes');
  const noBtn = document.getElementById('btn-no');
  const playground = document.getElementById('ask-playground');
  if (!yesBtn || !noBtn || !playground) return;

  let fleeCount = 0;
  let isMoving = false;
  const MOVE_MS = 720;
  const taunts = [
    'You sure…?',
    'Nice try~',
    'Aku sedih nih…',
    'Last chance?',
  ];

  yesBtn.addEventListener('click', () => goToScene('celebrate'));

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  function placeNoInsidePlayground(startCentered = true) {
    const pw = playground.clientWidth;
    const ph = playground.clientHeight;
    const w = noBtn.offsetWidth || 110;
    const h = noBtn.offsetHeight || 48;
    const maxX = Math.max(0, pw - w);
    const maxY = Math.max(0, ph - h);

    let x = clamp(parseFloat(noBtn.style.left) || 0, 0, maxX);
    let y = clamp(parseFloat(noBtn.style.top) || 0, 0, maxY);
    if (startCentered) {
      const playRect = playground.getBoundingClientRect();
      const yesRect = yesBtn.getBoundingClientRect();
      const yesRight = yesRect.right - playRect.left;
      const yesBottom = yesRect.bottom - playRect.top;
      if (pw >= 560 && pw - yesRight >= w + 24) {
        x = Math.min(maxX, yesRight + (pw - yesRight - w) / 2);
        y = clamp(yesRect.top - playRect.top + (yesRect.height - h) / 2, 0, maxY);
      } else {
        x = clamp(pw / 2 - w / 2, 0, maxX);
        y = Math.min(maxY, yesBottom + 18);
      }
    }

    noBtn.style.position = 'absolute';
    noBtn.style.left = `${x}px`;
    noBtn.style.top = `${y}px`;
    noBtn.style.right = 'auto';
    noBtn.style.bottom = 'auto';
    noBtn.style.margin = '0';
    noBtn.style.zIndex = '3';
  }

  function clampInPlayground(x, y, scale) {
    const pw = playground.clientWidth;
    const ph = playground.clientHeight;
    const w = noBtn.offsetWidth || 110;
    const h = noBtn.offsetHeight || 48;
    const insetX = ((1 - scale) * w) / 2;
    const insetY = ((1 - scale) * h) / 2;
    const pad = 8;

    // Soft ceiling: avoid the very bottom 18% of playground
    const maxYLimit = ph * 0.78 - h;

    return {
      x: clamp(x, pad - insetX, Math.max(pad, pw - w - pad + insetX)),
      y: clamp(y, pad - insetY, Math.max(pad, Math.min(maxYLimit, ph - h - pad) + insetY)),
    };
  }

  function pickSoftTarget(pointerX, pointerY, scale) {
    const pw = playground.clientWidth;
    const ph = playground.clientHeight;
    const w = noBtn.offsetWidth || 110;
    const h = noBtn.offsetHeight || 48;
    const playRect = playground.getBoundingClientRect();

    // Pointer relative to playground
    const localPX = pointerX - playRect.left;
    const localPY = pointerY - playRect.top;

    const curX = noBtn.style.left ? parseFloat(noBtn.style.left) : noBtn.offsetLeft;
    const curY = noBtn.style.top ? parseFloat(noBtn.style.top) : noBtn.offsetTop;

    let best = null;
    let bestScore = -Infinity;

    // Sample candidates across the playground (favor mid/upper)
    for (let i = 0; i < 16; i++) {
      const x = Math.random() * Math.max(1, pw - w);
      const y = Math.random() * Math.max(1, ph * 0.72 - h); // stay out of bottom zone

      const cx = x + w / 2;
      const cy = y + h / 2;
      const distPointer = Math.hypot(cx - localPX, cy - localPY);
      const distCurrent = Math.hypot(x - curX, y - curY);

      if (distCurrent < 70) continue;
      if (distPointer < 90 && i < 12) continue; // prefer away from finger/cursor

      // Prefer horizontal escape a bit more (feels less "falls down")
      const horizontalBonus = Math.abs(x - curX) * 0.15;
      const score = distPointer + distCurrent * 0.85 + horizontalBonus;

      if (score > bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }

    if (!best) {
      // Guaranteed hop: left/right + slight up
      const dir = localPX > pw / 2 ? -1 : 1;
      best = {
        x: curX + dir * (80 + Math.random() * 70),
        y: curY - (30 + Math.random() * 50),
      };
    }

    return clampInPlayground(best.x, best.y, scale);
  }

  const flee = (e) => {
    if (fleeCount >= CONFIG.noFleeMax || isMoving) return;

    fleeCount += 1;
    isMoving = true;

    const progress = fleeCount / CONFIG.noFleeMax;
    const scale = Math.max(0.3, 1 - progress * 0.7);
    const opacity = Math.max(0.28, 1 - progress * 0.6);

    noBtn.style.setProperty('--no-scale', String(scale));
    noBtn.style.setProperty('--no-opacity', String(opacity));
    noBtn.classList.add('is-shrinking', 'is-fleeing');

    if (fleeCount < CONFIG.noFleeMax && taunts[fleeCount - 1]) {
      noBtn.textContent = taunts[fleeCount - 1];
    }

    if (getComputedStyle(noBtn).position !== 'absolute') {
      noBtn.style.transition = 'none';
      placeNoInsidePlayground(true);
      void noBtn.offsetWidth;
      noBtn.style.transition = '';
    }

    let pointerX;
    let pointerY;
    if (e?.touches?.[0]) {
      pointerX = e.touches[0].clientX;
      pointerY = e.touches[0].clientY;
    } else if (typeof e?.clientX === 'number') {
      pointerX = e.clientX;
      pointerY = e.clientY;
    } else {
      const r = noBtn.getBoundingClientRect();
      pointerX = r.left + r.width / 2;
      pointerY = r.top + r.height / 2;
    }

    const { x, y } = pickSoftTarget(pointerX, pointerY, scale);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        noBtn.style.left = `${x}px`;
        noBtn.style.top = `${y}px`;
      });
    });

    if (fleeCount >= CONFIG.noFleeMax) {
      noBtn.classList.add('is-vanished');
      noBtn.style.pointerEvents = 'none';
      noBtn.style.setProperty('--no-scale', '0');
      noBtn.style.setProperty('--no-opacity', '0');
      noBtn.setAttribute('aria-hidden', 'true');
      noBtn.tabIndex = -1;
      yesBtn.classList.add('is-spotlight');
      playground.classList.add('is-yes-only');
    }

    window.setTimeout(() => {
      isMoving = false;
    }, MOVE_MS);
  };

  // Prepare absolute layout when ask scene opens
  const prepareAskLayout = () => {
    fleeCount = 0;
    isMoving = false;
    noBtn.textContent = 'Nope';
    noBtn.classList.remove('is-shrinking', 'is-fleeing', 'is-vanished');
    noBtn.style.removeProperty('--no-scale');
    noBtn.style.removeProperty('--no-opacity');
    noBtn.style.pointerEvents = '';
    noBtn.removeAttribute('aria-hidden');
    noBtn.tabIndex = 0;
    yesBtn.classList.remove('is-spotlight');
    playground.classList.remove('is-yes-only');
    noBtn.style.transition = 'none';
    placeNoInsidePlayground(true);
    void noBtn.offsetWidth;
    noBtn.style.transition = '';
  };

  // Expose for goToScene
  window.__prepareAskLayout = prepareAskLayout;

  window.addEventListener('orientationchange', () => {
    window.setTimeout(() => {
      if (document.body.dataset.scene !== 'ask') return;
      if (noBtn.classList.contains('is-vanished')) return;
      noBtn.style.transition = 'none';
      placeNoInsidePlayground(true);
      void noBtn.offsetWidth;
      noBtn.style.transition = '';
    }, 280);
  });

  // Desktop: hover flees. Mobile: touch/click only (no sticky hover).
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover) {
    noBtn.addEventListener('mouseenter', flee);
  }

  noBtn.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'mouse' && canHover) return; // mouse uses mouseenter
      e.preventDefault();
      flee(e);
    },
    { passive: false }
  );

  noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!canHover) flee(e);
  });
}

/* ---------- YouTube music ---------- */
let ytPlayer = null;
let ytReady = false;
let ytUserPaused = false;

function initMusic() {
  const toggle = document.getElementById('music-toggle');
  const panel = document.getElementById('music-panel');
  const iframe = document.getElementById('yt-iframe');
  const hint = document.getElementById('music-hint');
  if (!toggle || !iframe) return;

  const isFile = window.location.protocol === 'file:';
  if (isFile && hint) hint.hidden = false;

  const params = new URLSearchParams({
    enablejsapi: '1',
    autoplay: '1',
    mute: '1', // muted first so browsers allow autoplay
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    loop: '1',
    playlist: CONFIG.youtubeVideoId,
  });
  if (!isFile) params.set('origin', window.location.origin);

  iframe.src = `https://www.youtube-nocookie.com/embed/${CONFIG.youtubeVideoId}?${params.toString()}`;

  function setMusicUi(playing) {
    toggle.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-label', playing ? 'Jeda musik' : 'Putar musik');
  }

  function applyVolumeAndUnmute() {
    if (!ytPlayer) return;
    try {
      ytPlayer.unMute();
      ytPlayer.setVolume(CONFIG.musicVolume);
    } catch {
      /* ignore */
    }
  }

  function tryPlay(withSound) {
    if (!ytReady || !ytPlayer || typeof ytPlayer.playVideo !== 'function') return false;
    if (ytUserPaused) return false;
    try {
      ytPlayer.playVideo();
      if (withSound) applyVolumeAndUnmute();
      setMusicUi(true);
      return true;
    } catch {
      return false;
    }
  }

  function createPlayer() {
    if (ytPlayer || typeof YT === 'undefined' || !YT.Player) return;
    ytPlayer = new YT.Player(iframe, {
      events: {
        onReady: () => {
          ytReady = true;
          // Autoplay: start muted (allowed), then unmute to volume 10
          try {
            ytPlayer.mute();
            ytPlayer.setVolume(CONFIG.musicVolume);
            ytPlayer.playVideo();
            setMusicUi(true);
          } catch {
            /* ignore */
          }
          // Attempt unmute shortly after (works on some browsers)
          window.setTimeout(() => {
            if (!ytUserPaused) applyVolumeAndUnmute();
          }, 250);
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) {
            setMusicUi(true);
            if (!ytUserPaused) applyVolumeAndUnmute();
          }
          if (e.data === YT.PlayerState.PAUSED) setMusicUi(false);
          if (e.data === YT.PlayerState.ENDED) {
            try {
              ytPlayer.playVideo();
            } catch {
              /* ignore */
            }
          }
        },
        onError: () => {
          if (hint) hint.hidden = false;
          setMusicUi(false);
        },
      },
    });
  }

  const prevReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof prevReady === 'function') prevReady();
    createPlayer();
  };

  if (window.YT && window.YT.Player) {
    createPlayer();
  } else if (!document.getElementById('yt-api-script')) {
    const tag = document.createElement('script');
    tag.id = 'yt-api-script';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  // Unlock sound on first user gesture (browser autoplay policy)
  const unlockSound = () => {
    if (ytUserPaused) return;
    tryPlay(true);
  };
  ['pointerdown', 'touchstart', 'keydown'].forEach((evt) => {
    document.addEventListener(evt, unlockSound, { once: true, passive: true });
  });

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panel) {
      const open = panel.hasAttribute('hidden');
      if (open) {
        panel.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
      }
    }

    if (isFile) {
      window.open(CONFIG.youtubeUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!ytReady || !ytPlayer || typeof ytPlayer.getPlayerState !== 'function') {
      ytUserPaused = false;
      return;
    }

    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      ytUserPaused = true;
      ytPlayer.pauseVideo();
      setMusicUi(false);
    } else {
      ytUserPaused = false;
      applyVolumeAndUnmute();
      ytPlayer.playVideo();
      setMusicUi(true);
    }
  });
}

/* ---------- Mini games ---------- */
const QUIZ = [
  {
    q: 'Kita kenal pertama kali di mana?',
    options: [
      { text: 'Map hutan Roblox', correct: true },
      { text: 'Kantor / kampus', correct: false },
      { text: 'Tinder… hehe', correct: false },
    ],
    wrong: 'Hehe bukan itu~ ingat hutan yang random itu?',
    right: 'Yess! Hutan itu + jokes “ngeeengg” ♡',
  },
  {
    q: 'Setelah chat Discord, kita jaga streak di mana?',
    options: [
      { text: 'WhatsApp status', correct: false },
      { text: 'TikTok (API streak)', correct: true },
      { text: 'Duolingo owl', correct: false },
    ],
    wrong: 'Bukan~ yang bikin aku tiap hari mikirin kamu~',
    right: 'Betul. Streak-nya lucu, tapi penting banget.',
  },
];

let gamesReady = false;
let catchTimer = null;
let catchSpawn = null;
let catchScore = 0;
let catchRafs = new Set();
let catchActive = false;

function cancelCatchRafs() {
  catchRafs.forEach((id) => cancelAnimationFrame(id));
  catchRafs.clear();
}

function showGamePanel(id) {
  ['game-quiz', 'game-catch', 'game-dial', 'game-done'].forEach((pid) => {
    const el = document.getElementById(pid);
    if (!el) return;
    el.hidden = pid !== id;
  });
}

function setGameHeader(eyebrow, title, lede) {
  const e = document.getElementById('game-eyebrow');
  const t = document.getElementById('game-title');
  const l = document.getElementById('game-lede');
  if (e) e.textContent = eyebrow;
  if (t) t.innerHTML = title;
  if (l) l.textContent = lede;
}

function initGames() {
  // wire dial once
  const dial = document.getElementById('love-dial');
  const dialNum = document.getElementById('dial-number');
  const dialNote = document.getElementById('dial-note');
  const dialSubmit = document.getElementById('dial-submit');
  if (!dial || !dialSubmit) return;

  const syncDial = () => {
    const v = Number(dial.value);
    if (dialNum) dialNum.textContent = String(v);
    if (v < 80) {
      dialNote.textContent = 'Hmm… masih setengah-setengah. Kayak streak yang putus~';
      dialSubmit.disabled = true;
    } else if (v < 95) {
      dialNote.textContent = 'Makin jujur… dikit lagi, jangan malu~';
      dialSubmit.disabled = true;
    } else if (v < 100) {
      dialNote.textContent = 'hayolo gabole nanggung';
      dialSubmit.disabled = true;
    } else {
      dialNote.textContent = 'Oke. Kejujuran ini aku terima ♡';
      dialSubmit.disabled = false;
    }
  };

  dial.addEventListener('input', syncDial);
  syncDial();

  dialSubmit.addEventListener('click', () => {
    setGameHeader('pemanasan selesai', 'Oke, cukup mainnya', 'Sekarang cerita yang beneran.');
    showGamePanel('game-done');
  });

  gamesReady = true;
}

function startGames() {
  if (!gamesReady) initGames();
  stopCatchGame();
  catchScore = 0;
  setGameHeader('pemanasan · 1/3', 'Kuis kecil-kecilan', 'Salah juga oke — coba lagi aja~');
  showGamePanel('game-quiz');
  renderQuiz(0);
}

function renderQuiz(index) {
  const item = QUIZ[index];
  const progress = document.getElementById('quiz-progress');
  const question = document.getElementById('quiz-question');
  const options = document.getElementById('quiz-options');
  const feedback = document.getElementById('quiz-feedback');
  if (!item || !options) return;

  if (progress) progress.textContent = `${index + 1} / ${QUIZ.length}`;
  if (question) question.textContent = item.q;
  if (feedback) {
    feedback.hidden = true;
    feedback.textContent = '';
    feedback.classList.remove('is-good', 'is-bad');
  }

  options.innerHTML = '';
  item.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-btn';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => {
      if (opt.correct) {
        [...options.querySelectorAll('button')].forEach((b) => {
          b.disabled = true;
        });
        btn.classList.add('is-correct');
        if (feedback) {
          feedback.hidden = false;
          feedback.textContent = item.right;
          feedback.classList.remove('is-bad');
          feedback.classList.add('is-good');
        }
        setTimeout(() => {
          if (index + 1 < QUIZ.length) renderQuiz(index + 1);
          else startCatchGame();
        }, 900);
      } else {
        btn.classList.add('is-wrong');
        btn.disabled = true;
        if (feedback) {
          feedback.hidden = false;
          feedback.textContent = item.wrong;
          feedback.classList.remove('is-good');
          feedback.classList.add('is-bad');
        }
      }
    });
    options.appendChild(btn);
  });
}

function startCatchGame() {
  setGameHeader('pemanasan · 2/3', 'Tangkap hatinya!', 'Tap 8 hati sebelum hilang~');
  showGamePanel('game-catch');

  const arena = document.getElementById('catch-arena');
  const countEl = document.getElementById('catch-count');
  if (!arena) return;

  stopCatchGame();
  arena.innerHTML = '';
  catchScore = 0;
  catchActive = true;
  if (countEl) countEl.textContent = '0';

  const spawnOne = () => {
    if (!catchActive || catchScore >= 8) return;

    const heart = document.createElement('button');
    heart.type = 'button';
    heart.className = 'falling-heart';
    heart.setAttribute('aria-label', 'Hati');
    heart.textContent = Math.random() > 0.3 ? '♥' : '♡';

    const size = 28 + Math.random() * 14;
    heart.style.fontSize = `${size}px`;

    const arenaW = arena.clientWidth || 280;
    const arenaH = arena.clientHeight || 220;
    const edge = window.matchMedia('(pointer: coarse)').matches ? 36 : 16;
    const x = edge + Math.random() * Math.max(20, arenaW - edge * 2 - 28);
    heart.style.left = `${x}px`;
    heart.style.top = '0px';
    heart.style.transform = 'translate3d(0, -40px, 0) rotate(0deg)';

    const duration = 2600 + Math.random() * 1800;
    const startY = -40;
    const endY = arenaH + 50;
    const rot = -20 + Math.random() * 40;
    let rafId = 0;
    let startAt = 0;

    const tick = (now) => {
      if (!catchActive || !heart.isConnected || heart.classList.contains('is-caught')) {
        catchRafs.delete(rafId);
        return;
      }
      if (!startAt) startAt = now;
      const t = Math.min(1, (now - startAt) / duration);
      // ease-in so it feels like gravity
      const e = t * t;
      const y = startY + (endY - startY) * e;
      heart.style.transform = `translate3d(0, ${y}px, 0) rotate(${rot * t}deg)`;

      if (t < 1) {
        rafId = requestAnimationFrame(tick);
        catchRafs.add(rafId);
      } else {
        catchRafs.delete(rafId);
        heart.remove();
      }
    };

    heart.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!catchActive || heart.classList.contains('is-caught')) return;
      heart.classList.add('is-caught');
      catchScore += 1;
      if (countEl) countEl.textContent = String(catchScore);
      setTimeout(() => heart.remove(), 160);
      if (catchScore >= 8) {
        stopCatchGame();
        setTimeout(startDialGame, 350);
      }
    });

    arena.appendChild(heart);
    rafId = requestAnimationFrame(tick);
    catchRafs.add(rafId);
  };

  spawnOne();
  catchSpawn = setInterval(spawnOne, 480);
  catchTimer = setTimeout(() => {
    if (catchScore < 8) {
      stopCatchGame();
      startDialGame();
    }
  }, 24000);
}

function stopCatchGame() {
  catchActive = false;
  if (catchSpawn) clearInterval(catchSpawn);
  if (catchTimer) clearTimeout(catchTimer);
  catchSpawn = null;
  catchTimer = null;
  cancelCatchRafs();
}

function startDialGame() {
  stopCatchGame();
  setGameHeader('pemanasan · 3/3', 'Jujur-jujuran', 'Geser sampai hati kamu ikut ngaku.');
  showGamePanel('game-dial');
  const dial = document.getElementById('love-dial');
  if (dial) {
    dial.value = '72';
    dial.dispatchEvent(new Event('input'));
  }
}

let confettiCtx = null;
let confettiParticles = [];
let confettiRaf = null;

function initConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  confettiCtx = canvas.getContext('2d');
  resizeConfetti();
  window.addEventListener('resize', resizeConfetti);
}

function resizeConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const vv = window.visualViewport;
  canvas.width = Math.round(vv?.width || window.innerWidth);
  canvas.height = Math.round(vv?.height || window.innerHeight);
}

function triggerConfetti() {
  resizeConfetti();
  confettiParticles = [];

  const colors = ['#E87898', '#B83D62', '#FFD0DD', '#F5A3B8', '#FFE8EF', '#fff', '#FFC0CB'];
  const count = window.innerWidth < 520 ? 72 : 140;
  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 90,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: -2.2 + Math.random() * 4.4,
      vy: 2 + Math.random() * 3.8,
      rot: Math.random() * Math.PI,
      vr: -0.18 + Math.random() * 0.36,
    });
  }

  if (confettiRaf) cancelAnimationFrame(confettiRaf);
  animateConfetti();
}

function animateConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas || !confettiCtx) return;

  confettiCtx.clearRect(0, 0, canvas.width, canvas.height);

  let alive = false;
  for (const p of confettiParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.045;
    p.rot += p.vr;
    if (p.y < canvas.height + 40) alive = true;

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  }

  if (alive) {
    confettiRaf = requestAnimationFrame(animateConfetti);
  } else {
    confettiCtx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
