/* SERENE — guided help.
   Desktop: point at a button marked data-guide.
   Touch:   there is no hover, so the ? in the app bar turns help mode on
            and the next tap on a marked element opens the tutorial. */

const Guide = {
  enabled: localStorage.getItem('serene.guide') !== 'off',
  helpMode: false,
  target: null,
  timer: null,

  init() {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="scrim" id="guide-scrim"></div>
      <i class="guide-caret" id="guide-caret"></i>
      <section class="guide-pop" id="guide-pop" role="dialog" aria-label="Guided help">
        <header class="guide-head">
          <span class="guide-badge">${icon('play', 16)}</span>
          <span class="label">Guided help</span>
          <button class="guide-close" id="guide-close" aria-label="Close">${icon('close', 16)}</button>
        </header>
        <div class="guide-video" id="guide-video">
          <video id="guide-v" playsinline preload="metadata"
                 poster="assets/tutorial-poster.jpg"></video>
          <div class="novideo" id="guide-novideo" hidden>
            ${icon('play', 22)}<span>Drop your clip at <b>assets/tutorial.mp4</b><br>to play it here</span>
          </div>
          <button class="guide-play" id="guide-playbtn" aria-label="Play">${icon('play', 20)}</button>
          <span class="guide-dur" id="guide-dur">0:10</span>
          <div class="guide-vctl">
            <button id="guide-pip" aria-label="Picture in picture">${icon('pip', 16)}</button>
            <button id="guide-full" aria-label="Fullscreen">${icon('fullscreen', 16)}</button>
          </div>
        </div>
        <div class="guide-text">
          <h4 id="guide-title">—</h4><p id="guide-sub">—</p>
        </div>
        <footer class="guide-foot">
          <div class="main">
            <b>Show tips automatically</b>
            <span id="guide-hint">—</span>
          </div>
          <button class="switch" id="guide-switch" role="switch"><span></span></button>
        </footer>
      </section>`);

    this.pop    = document.getElementById('guide-pop');
    this.scrim  = document.getElementById('guide-scrim');
    this.caret  = document.getElementById('guide-caret');
    this.video  = document.getElementById('guide-v');
    this.noVid  = document.getElementById('guide-novideo');

    document.getElementById('guide-close').onclick = () => this.close();
    this.scrim.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });

    /* The play button sits inside the video container, which is itself a
       click-to-play surface. Without stopping the bubble the click toggles
       twice and nothing happens, so the button stops it and the container
       ignores clicks that landed on a control. */
    document.getElementById('guide-playbtn').onclick = e => { e.stopPropagation(); this.play(); };
    document.getElementById('guide-video').onclick = e => {
      if (e.target.closest('.guide-vctl') || e.target.closest('#guide-playbtn')) return;
      this.play();
    };
    document.getElementById('guide-pip').onclick = async e => {
      e.stopPropagation();
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await this.video.requestPictureInPicture();
      } catch (_) {}
    };
    document.getElementById('guide-full').onclick = e => {
      e.stopPropagation();
      const v = this.video;
      (v.requestFullscreen || v.webkitEnterFullscreen || (() => {})).call(v);
    };

    const sw = document.getElementById('guide-switch');
    sw.onclick = () => this.setEnabled(!this.enabled);
    this.syncSwitch();

    this.video.addEventListener('playing', () => document.getElementById('guide-video').classList.add('is-playing'));
    this.video.addEventListener('pause',   () => document.getElementById('guide-video').classList.remove('is-playing'));
    this.video.addEventListener('error',   () => this.fallbackVideo());
    this.video.addEventListener('loadedmetadata', () => {
      const d = this.video.duration;
      if (isFinite(d)) document.getElementById('guide-dur').textContent =
        `${Math.floor(d / 60)}:${String(Math.round(d % 60)).padStart(2, '0')}`;
    });

    const hm = document.getElementById('help-mode');
    if (hm) hm.onclick = () => this.toggleHelpMode();

    window.addEventListener('resize', () => { if (this.target) this.position(); });
    window.addEventListener('scroll', () => { if (this.target) this.position(); }, true);
  },

  /* ---- enable / disable ---- */
  setEnabled(on) {
    this.enabled = on;
    localStorage.setItem('serene.guide', on ? 'on' : 'off');
    this.syncSwitch();
    if (!on) this.close();
    const s = document.getElementById('set-guide');
    if (s) { s.classList.toggle('is-on', on); s.setAttribute('aria-checked', String(on)); }
  },
  syncSwitch() {
    const sw = document.getElementById('guide-switch');
    sw.classList.toggle('is-on', this.enabled);
    sw.setAttribute('aria-checked', String(this.enabled));
    document.getElementById('guide-hint').textContent =
      this.enabled ? (this.touch() ? 'Tap ? then a highlighted button' : 'Point at a button to see its tip')
                   : 'Turned off — nothing will pop up';
  },

  touch: () => !window.matchMedia('(hover:hover) and (pointer:fine)').matches,

  toggleHelpMode() {
    this.helpMode = !this.helpMode;
    document.body.classList.toggle('help-mode', this.helpMode);
    const b = document.getElementById('help-mode');
    if (b) { b.classList.toggle('is-on', this.helpMode); b.setAttribute('aria-pressed', String(this.helpMode)); }
    if (!this.helpMode) this.close();
  },

  /* ---- bind the marked elements on the current screen ---- */
  rebind() {
    document.querySelectorAll('[data-guide]').forEach(el => {
      if (el.dataset.guideBound) return;
      el.dataset.guideBound = '1';
      el.addEventListener('mouseenter', () => {
        if (!this.enabled || this.touch() || Call.active) return;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.open(el), 320);
      });
      /* leaving the target starts a short close timer; entering the popup cancels it,
         so you can travel from the button to the popup without it vanishing */
      el.addEventListener('mouseleave', () => {
        clearTimeout(this.timer);
        if (this.target === el && !this.touch()) this.timer = setTimeout(() => this.close(), 280);
      });
      el.addEventListener('click', e => {
        if (!this.enabled) return;
        if (this.touch() && this.helpMode) { e.preventDefault(); e.stopPropagation(); this.open(el); }
      });
    });
  },

  /* ---- open / close ---- */
  open(el) {
    if (!this.enabled || Call.active) return;
    this.close(true);
    this.target = el;
    el.classList.add('guide-spotlight');
    document.getElementById('guide-title').textContent = el.dataset.guideTitle || 'How this works';
    document.getElementById('guide-sub').textContent   = el.dataset.guideText  || '';
    this.loadVideo();
    this.scrim.classList.add('is-open');
    this.pop.classList.add('is-open');
    this.position();
    this.pop.addEventListener('mouseleave', this._leave = () => {
      if (!this.touch()) this.timer = setTimeout(() => this.close(), 260);
    });
    this.pop.addEventListener('mouseenter', () => clearTimeout(this.timer));
  },

  close(silent) {
    clearTimeout(this.timer);
    if (this.target) this.target.classList.remove('guide-spotlight');
    this.target = null;
    this.pop.classList.remove('is-open');
    this.caret.classList.remove('is-open');
    this.scrim.classList.remove('is-open');
    try { this.video.pause(); } catch (_) {}
  },

  /* One clip is used for every tip — only the title and the text under it
     change per button. Load it once and keep it; swapping src on each open
     would restart the download and flash the player. */
  loadVideo() {
    this.noVid.hidden = true;
    document.getElementById('guide-playbtn').hidden = false;
    document.getElementById('guide-dur').hidden = false;
    this.video.style.visibility = 'visible';
    if (!this.video.getAttribute('src')) {
      this.video.src = GUIDE_VIDEO;
      this.video.load();
    } else {
      this.video.currentTime = 0;
    }
  },
  /* no clip in assets/ yet — show the placeholder instead of a broken player */
  fallbackVideo() {
    this.noVid.hidden = false;
    this.video.style.visibility = 'hidden';
    document.getElementById('guide-playbtn').hidden = true;
    document.getElementById('guide-dur').hidden = true;
    document.getElementById('guide-video').classList.remove('is-playing');
  },
  play() { this.video.paused ? this.video.play().catch(() => {}) : this.video.pause(); },

  /* ---- placement: below, else above, else beside ---- */
  position() {
    if (!this.target) return;
    const M = 12, GAP = 14;
    const r  = this.target.getBoundingClientRect();
    const pw = this.pop.offsetWidth, ph = this.pop.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;

    let mode = 'below';
    let top  = r.bottom + GAP;
    if (top + ph > vh - M) {
      if (r.top - GAP - ph > M) { mode = 'above'; top = r.top - GAP - ph; }
      else { mode = 'beside'; top = Math.min(Math.max(r.top, M), vh - ph - M); }
    }
    let left;
    if (mode === 'beside') {
      left = r.right + GAP + pw > vw - M ? r.left - GAP - pw : r.right + GAP;
      left = Math.min(Math.max(left, M), vw - pw - M);
    } else {
      left = Math.min(Math.max(r.left + r.width / 2 - 70, M), vw - pw - M);
    }

    this.pop.style.left = left + 'px';
    this.pop.style.top  = top + 'px';

    if (mode === 'below') {
      this.caret.style.left = (r.left + r.width / 2 - 9) + 'px';
      this.caret.style.top  = (top - 9) + 'px';
      this.caret.classList.add('is-open');
    } else {
      this.caret.classList.remove('is-open');
    }
  }
};
