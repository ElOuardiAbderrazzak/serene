/* SERENE — live screencast support call (caller side).
   Signalling: PeerJS public broker. No backend, no database.

   HOW THE REDACTION WORKS
   -----------------------
   We capture this tab with getDisplayMedia, then draw each frame into a
   <canvas>. Before handing the frame on we paint an opaque block over every
   [data-sensitive] element, using its live getBoundingClientRect() scaled from
   CSS pixels to captured pixels. The peer connection streams the CANVAS, not
   the raw capture, so the real pixels never leave the device.
   The caller still sees their own screen normally.

   If the caller picks a window or a whole monitor instead of this tab, those
   coordinates no longer mean anything, so we fall back to blurring the real
   DOM before the frame is captured. Privacy holds either way.             */

const ROOM_PREFIX = 'serene-';
const SPECIALIST  = { name: 'Tom Verbeke', role: 'Technical specialist', initials: 'TV' };

const Call = {
  active: false,
  isOverlayOwner: false,
  share: true,
  room: null,
  peer: null, conn: null, mediaCall: null,
  display: null, mic: null, outbound: null,
  canvas: null, ctx: null, srcVideo: null, raf: null,
  tabAligned: true,
  t0: 0, tick: null, waitTick: null,

  /* ------------------------------------------------------------------ */
  init() {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="scrim" id="call-scrim"></div>

      <section class="sheet" id="call-consent" role="dialog" aria-label="Call live support">
        <div class="grabber"></div>
        <header class="sheet-head">
          <span class="sheet-badge">${icon('phone', 20)}</span>
          <div class="titles"><h3>Call live support</h3><p>Audio only, no camera</p></div>
          <button class="guide-close" data-close aria-label="Close">${icon('close', 16)}</button>
        </header>
        <div class="sheet-body">
          <p class="t-body dim">A technical specialist will join you in a private room.
             You can keep working while you talk.</p>

          <button class="share-opt" id="share-opt" aria-pressed="true">
            <span class="ico" id="share-icon">${icon('screen', 24)}</span>
            <span class="txt"><b>Share my screen</b><span id="share-sub">The specialist sees what you see</span></span>
            <span class="switch is-on" id="share-switch"><span></span></span>
          </button>

          <div class="privacy-note" id="privacy-note">
            ${icon('shield', 18)}
            <span>Patient names, ages, room numbers and photos are covered before the picture
              leaves this device. <a href="#" class="link" id="see-preview">See what they'll see</a></span>
          </div>
        </div>
        <footer class="sheet-foot">
          <button class="btn btn-ghost" data-close>Cancel</button>
          <button class="btn btn-primary" id="join-room">Join support room</button>
        </footer>
      </section>

      <section class="sheet is-fullscreen" id="call-waiting" role="dialog" aria-label="Support room">
        <div class="grabber"></div>
        <div class="waiting">
          <div class="halo"><span class="core">${icon('phone', 26)}</span></div>
          <div>
            <h2 class="t-h2">Waiting for a specialist</h2>
            <p class="t-body muted" id="wait-eta">A specialist joins in about 2 minutes</p>
          </div>
          <div class="progress"><i id="wait-bar"></i></div>

          <div class="roomcode-wrap" style="width:100%;max-width:320px">
            <label>Room code — give this to the specialist</label>
            <div class="roomcode" id="room-code">······</div>
            <button class="btn btn-ghost btn-sm btn-block" id="copy-room">Copy code</button>
          </div>

          <div class="waiting-chips">
            <span class="chip chip-ok" id="chip-mic"><i class="dot"></i>Microphone on</span>
            <span class="chip chip-brand" id="chip-share">${icon('screen', 14)} Screen shares when they join</span>
          </div>
          <span class="conn-state" id="conn-state"><i class="dot"></i>Connecting to the support service…</span>
        </div>
        <footer class="sheet-foot"><button class="btn btn-ghost" id="leave-room">Leave room</button></footer>
      </section>

      <section class="sheet" id="call-preview" role="dialog" aria-label="What the specialist sees">
        <div class="grabber"></div>
        <header class="sheet-head">
          <span class="sheet-badge">${icon('eye', 20)}</span>
          <div class="titles"><h3>What the specialist sees</h3><p>Live view of your screen</p></div>
          <button class="guide-close" data-close-preview aria-label="Close">${icon('close', 16)}</button>
        </header>
        <div class="sheet-body preview-wrap">
          <div class="preview-stage" id="preview-stage">
            <span class="preview-live"><i class="dot"></i>LIVE</span>
          </div>
          <div class="masked-note">${icon('shield', 18)}
            <span id="preview-note">Patient names, ages, room numbers and photos are covered in the
              shared picture. The specialist sees the screen you work in, not who the patients are.</span>
          </div>
        </div>
        <footer class="sheet-foot"><button class="btn btn-ghost" data-close-preview>Close preview</button></footer>
      </section>

      <section class="sheet" id="call-ended" role="dialog" aria-label="Call ended">
        <div class="grabber"></div>
        <div class="ended">
          <span class="tick">${icon('check', 26)}</span>
          <div><h2 class="t-h2">Call ended</h2>
            <p class="t-body muted" id="ended-sub">—</p></div>
          <span class="chip" id="ended-share">${icon('screen-off', 14)} Screen sharing stopped</span>
        </div>
        <div class="ended-foot">
          <span class="t-sm-m dim">Was this helpful?</span>
          <div class="choices">
            <button class="btn btn-ghost" data-done>Yes, it helped</button>
            <button class="btn btn-ghost" data-done>Not really</button>
          </div>
          <button class="btn btn-primary btn-block" data-done>Done</button>
        </div>
      </section>

      <div class="callbar is-hidden" id="callbar">
        <span class="avatar avatar-lg" style="background:var(--b600);width:44px;height:44px">${SPECIALIST.initials}</span>
        <span class="who"><b>${SPECIALIST.name}</b><span>${SPECIALIST.role}</span></span>
        <span class="timer" id="call-timer">00:00</span>
        <span class="sep"></span>
        <span class="state" id="call-state"><i class="dot"></i><span>Sharing your screen</span></span>
        <button class="btn btn-dark" id="bar-preview">${icon('eye', 16)} What they see</button>
        <button class="round" id="bar-mic" aria-label="Mute">${icon('mic', 18)}</button>
        <button class="btn btn-danger" id="bar-end">End call</button>
      </div>`);

    this.scrim = document.getElementById('call-scrim');
    const on = (id, ev, fn) => { const e = document.getElementById(id); if (e) e.addEventListener(ev, fn); };

    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => this.close()));
    document.querySelectorAll('[data-close-preview]').forEach(b => b.addEventListener('click', () => this.showPreview(false)));
    document.querySelectorAll('[data-done]').forEach(b => b.addEventListener('click', () => this.close()));

    on('share-opt', 'click', () => this.setShare(!this.share));
    on('see-preview', 'click', e => { e.preventDefault(); this.previewBeforeCall(); });
    on('join-room', 'click', () => this.join());
    on('leave-room', 'click', () => this.close());
    on('copy-room', 'click', () => {
      navigator.clipboard?.writeText(this.room || '');
      document.getElementById('copy-room').textContent = 'Copied';
      setTimeout(() => { const b = document.getElementById('copy-room'); if (b) b.textContent = 'Copy code'; }, 1400);
    });
    on('bar-preview', 'click', () => this.showPreview(true));
    on('bar-mic', 'click', () => this.toggleMic());
    on('bar-end', 'click', () => this.hangUp());

    const d = document.getElementById('call-support-desktop');
    const f = document.getElementById('call-support-fab');
    if (d) d.addEventListener('click', () => this.active ? this.showPreview(true) : this.open());
    if (f) f.addEventListener('click', () => this.active ? this.showPreview(true) : this.open());
  },

  /* ---------------- consent ---------------- */
  open() {
    this.isOverlayOwner = true;
    Guide.close();
    this.scrim.classList.add('is-open');
    document.getElementById('call-consent').classList.add('is-open');
  },
  close() {
    this.isOverlayOwner = false;
    this.scrim.classList.remove('is-open');
    ['call-consent', 'call-waiting', 'call-preview', 'call-ended']
      .forEach(id => document.getElementById(id).classList.remove('is-open'));
    if (!this.active) this.teardown();
  },
  setShare(on) {
    this.share = on;
    const opt = document.getElementById('share-opt');
    opt.setAttribute('aria-pressed', String(on));
    document.getElementById('share-switch').classList.toggle('is-on', on);
    document.getElementById('share-icon').innerHTML = icon(on ? 'screen' : 'screen-off', 24);
    document.getElementById('share-sub').textContent = on
      ? 'The specialist sees what you see'
      : 'The specialist will not see your screen';
    document.getElementById('privacy-note').innerHTML = on
      ? `${icon('shield', 18)}<span>Patient names, ages, room numbers and photos are covered before the
         picture leaves this device. <a href="#" class="link" id="see-preview">See what they'll see</a></span>`
      : `${icon('shield', 18)}<span>Nothing from your screen is shared. You can still describe the
         problem out loud and turn sharing on later from the call bar.</span>`;
    const sp = document.getElementById('see-preview');
    if (sp) sp.addEventListener('click', e => { e.preventDefault(); this.previewBeforeCall(); });
  },

  /* ---------------- join ---------------- */
  async join() {
    this.room = (Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 4)).toUpperCase();
    document.getElementById('room-code').textContent = this.room;
    document.getElementById('call-consent').classList.remove('is-open');
    document.getElementById('call-waiting').classList.add('is-open');
    this.setConn('Connecting to the support service…', '');
    this.startWaitBar();

    document.getElementById('chip-share').innerHTML = this.share
      ? `${icon('screen', 14)} Screen shares when they join`
      : `${icon('screen-off', 14)} Screen sharing off`;
    document.getElementById('chip-share').className = this.share ? 'chip chip-brand' : 'chip';

    /* microphone first — the call is audio either way */
    try {
      this.mic = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      document.getElementById('chip-mic').className = 'chip chip-warn';
      document.getElementById('chip-mic').innerHTML = `<i class="dot"></i>Microphone blocked`;
    }

    /* screen capture, while we still have the click gesture */
    if (this.share) {
      try {
        this.display = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'browser', frameRate: 15 },
          audio: false, preferCurrentTab: true, selfBrowserSurface: 'include', surfaceSwitching: 'exclude'
        });
        this.display.getVideoTracks()[0].addEventListener('ended', () => this.stopSharing());
        await this.buildMaskedStream();
      } catch (e) {
        this.share = false;
        document.getElementById('chip-share').className = 'chip';
        document.getElementById('chip-share').innerHTML = `${icon('screen-off', 14)} Screen sharing off`;
      }
    }

    this.connect();
  },

  /* ---------------- the redaction pipeline ---------------- */
  async buildMaskedStream() {
    const track = this.display.getVideoTracks()[0];
    const s = track.getSettings();
    const W = s.width || 1280, H = s.height || 720;

    /* a tab capture maps 1:1 to this viewport; anything else does not */
    this.tabAligned = (s.displaySurface || 'browser') === 'browser';
    document.body.classList.toggle('redact-fallback', !this.tabAligned);

    this.srcVideo = document.createElement('video');
    this.srcVideo.srcObject = this.display;
    this.srcVideo.muted = true; this.srcVideo.playsInline = true;
    await this.srcVideo.play().catch(() => {});

    this.canvas = document.createElement('canvas');
    this.canvas.width = W; this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    const roundRect = (c, x, y, w, h, r) => {
      r = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r); c.closePath();
    };

    const paint = () => {
      const ctx = this.ctx, cw = this.canvas.width, ch = this.canvas.height;
      try { ctx.drawImage(this.srcVideo, 0, 0, cw, ch); } catch (_) {}

      if (this.tabAligned) {
        const sx = cw / window.innerWidth, sy = ch / window.innerHeight;
        ctx.fillStyle = '#c9d6e0';
        document.querySelectorAll('[data-sensitive]').forEach(el => {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) return;
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          roundRect(ctx, (r.left - 5) * sx, (r.top - 3) * sy,
                         (r.width + 10) * sx, (r.height + 6) * sy, 5 * sx);
          ctx.fill();
        });
        /* a standing watermark so the specialist knows it is deliberate */
        ctx.fillStyle = 'rgba(20,26,33,.82)';
        roundRect(ctx, 14 * sx, (window.innerHeight - 42) * sy, 320 * sx, 28 * sy, 14 * sx);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.round(13 * sy)}px Figtree, system-ui, sans-serif`;
        ctx.fillText('Patient data hidden by SERENE', 28 * sx, (window.innerHeight - 23) * sy);
      }
    };

    /* Drive the repaint from decoded video frames, not requestAnimationFrame:
       rAF stops when the tab is not foregrounded, which would freeze the
       picture the specialist sees. The slow interval is a heartbeat so the
       stream keeps moving even if the caller switches tabs. */
    if ('requestVideoFrameCallback' in this.srcVideo) {
      const loop = () => { paint(); this.vfc = this.srcVideo.requestVideoFrameCallback(loop); };
      this.vfc = this.srcVideo.requestVideoFrameCallback(loop);
    } else {
      this.drawTimer = setInterval(paint, 1000 / 15);
    }
    this.heartbeat = setInterval(paint, 1000);
    paint();

    const vid = this.canvas.captureStream(15).getVideoTracks();
    /* screen content: tell the encoder to keep resolution rather than frame
       rate, otherwise small text turns to mush on a constrained link */
    vid.forEach(t => { try { t.contentHint = 'detail'; } catch (_) {} });
    const aud = this.mic ? this.mic.getAudioTracks() : [];
    this.outbound = new MediaStream([...vid, ...aud]);
  },

  /* ---------------- peer connection ---------------- */
  connect() {
    if (typeof Peer === 'undefined') {
      this.setConn('Support service unavailable — peerjs did not load', 'err');
      return;
    }
    this.peer = new Peer(ROOM_PREFIX + this.room, Object.assign({ debug: 1 }, SIGNAL));

    this.peer.on('open', () => this.setConn('Waiting for a specialist to join', ''));
    this.peer.on('error', err => {
      this.setConn('Could not reach the support service (' + (err.type || 'error') + ')', 'err');
    });

    /* The specialist knocks on the data channel first and tells us their id,
       then WE place the media call. That order matters: in WebRTC only the
       side making the offer can add a video track, and the screen is ours to
       send. If the specialist dialled us, the answer could carry audio only. */
    this.peer.on('connection', conn => {
      this.conn = conn;
      conn.on('open', () => this.setConn('Specialist joining…', ''));
      conn.on('data', msg => {
        if (msg && msg.type === 'hello') this.dial(msg.peerId);
        if (msg && msg.type === 'end') this.hangUp();
      });
      conn.on('close', () => { if (this.active) this.hangUp(); });
    });
  },

  dial(specialistId) {
    const give = this.outbound || this.mic || new MediaStream();
    const mc = this.peer.call(specialistId, give);
    if (!mc) { this.setConn('Could not open the call', 'err'); return; }
    this.mediaCall = mc;
    mc.on('stream', remote => this.goLive(remote));
    mc.on('close', () => { if (this.active) this.hangUp(); });
  },

  goLive(remoteStream) {
    if (this.active) return;
    this.active = true;
    clearInterval(this.waitTick);

    const a = document.createElement('audio');
    a.srcObject = remoteStream; a.autoplay = true; a.id = 'remote-audio';
    document.body.appendChild(a);

    this.close();
    document.body.classList.add('in-call');
    document.getElementById('callbar').classList.remove('is-hidden');

    const st = document.getElementById('call-state');
    st.innerHTML = this.share
      ? `<i class="dot"></i><span>Sharing your screen</span>`
      : `<i class="dot" style="background:var(--n400);animation:none"></i><span>Audio only</span>`;
    document.getElementById('bar-preview').style.display = this.share ? '' : 'none';

    const d = document.getElementById('call-support-desktop');
    if (d) { d.className = 'live-pill'; d.innerHTML = `<i class="dot"></i>${this.share ? 'Sharing screen' : 'On a call'}`; }
    const f = document.getElementById('call-support-fab');
    if (f) f.style.background = 'var(--ok)';

    this.t0 = Date.now();
    this.tick = setInterval(() => {
      const s = Math.floor((Date.now() - this.t0) / 1000);
      document.getElementById('call-timer').textContent =
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }, 500);
  },

  toggleMic() {
    if (!this.mic) return;
    const t = this.mic.getAudioTracks()[0];
    t.enabled = !t.enabled;
    const b = document.getElementById('bar-mic');
    b.classList.toggle('is-off', !t.enabled);
    b.innerHTML = icon(t.enabled ? 'mic' : 'mic-off', 18);
  },

  stopSharing() {
    this.share = false;
    const st = document.getElementById('call-state');
    if (st) st.innerHTML = `<i class="dot" style="background:var(--n400);animation:none"></i><span>Audio only</span>`;
    const bp = document.getElementById('bar-preview');
    if (bp) bp.style.display = 'none';
  },

  hangUp() {
    const secs = this.t0 ? Math.floor((Date.now() - this.t0) / 1000) : 0;
    const wasSharing = this.share;
    try { this.conn && this.conn.open && this.conn.send({ type: 'end' }); } catch (_) {}
    this.teardown();
    this.active = false;
    document.body.classList.remove('in-call');
    document.getElementById('callbar').classList.add('is-hidden');

    const d = document.getElementById('call-support-desktop');
    if (d) { d.className = 'btn btn-primary btn-sm'; d.style.borderRadius = '999px';
             d.innerHTML = `${icon('phone', 16)} Call support`; }
    const f = document.getElementById('call-support-fab');
    if (f) f.style.background = '';

    document.getElementById('ended-sub').textContent =
      `${Math.floor(secs / 60)} min ${secs % 60} s with ${SPECIALIST.name}`;
    document.getElementById('ended-share').innerHTML = wasSharing
      ? `${icon('screen-off', 14)} Screen sharing stopped`
      : `${icon('phone', 14)} Audio only call`;
    this.isOverlayOwner = true;
    this.scrim.classList.add('is-open');
    document.getElementById('call-ended').classList.add('is-open');
  },

  teardown() {
    clearInterval(this.tick); clearInterval(this.waitTick);
    clearInterval(this.drawTimer); clearInterval(this.heartbeat);
    try { this.vfc && this.srcVideo && this.srcVideo.cancelVideoFrameCallback(this.vfc); } catch (_) {}
    this.vfc = null;
    document.body.classList.remove('redact-fallback');
    [this.display, this.mic, this.outbound].forEach(s => s && s.getTracks().forEach(t => t.stop()));
    this.display = this.mic = this.outbound = null;
    try { this.mediaCall && this.mediaCall.close(); } catch (_) {}
    try { this.conn && this.conn.close(); } catch (_) {}
    try { this.peer && this.peer.destroy(); } catch (_) {}
    this.peer = this.mediaCall = this.conn = null;
    document.getElementById('remote-audio')?.remove();
    this.t0 = 0;
  },

  /* ---------------- preview ---------------- */
  showPreview(on) {
    const stage = document.getElementById('preview-stage');
    const sheet = document.getElementById('call-preview');
    if (on) {
      stage.querySelectorAll('canvas,video').forEach(n => n.remove());
      if (this.canvas) stage.appendChild(this.canvas);
      this.scrim.classList.add('is-open');
      this.isOverlayOwner = true;
      sheet.classList.add('is-open');
    } else {
      sheet.classList.remove('is-open');
      if (this.active) { this.scrim.classList.remove('is-open'); this.isOverlayOwner = false; }
      if (this.canvas && this.canvas.parentElement === stage) stage.removeChild(this.canvas);
    }
  },

  /* let the caller see the redaction before agreeing to anything */
  async previewBeforeCall() {
    try {
      this.display = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser', frameRate: 15 },
        audio: false, preferCurrentTab: true, selfBrowserSurface: 'include'
      });
      await this.buildMaskedStream();
      document.getElementById('call-consent').classList.remove('is-open');
      this.showPreview(true);
      document.getElementById('preview-note').textContent = this.tabAligned
        ? 'This is the picture the specialist receives. Patient names, ages, room numbers and photos are painted over before it is sent.'
        : 'You shared a window rather than this tab, so SERENE blurred the patient data on screen instead. Nothing identifying is sent either way.';
    } catch (_) {}
  },

  /* ---------------- small helpers ---------------- */
  setConn(text, kind) {
    const e = document.getElementById('conn-state');
    if (!e) return;
    e.className = 'conn-state' + (kind === 'err' ? ' is-err' : text.startsWith('Waiting') ? ' is-live' : '');
    e.innerHTML = `<i class="dot"></i>${text}`;
  },
  startWaitBar() {
    let p = 8;
    const bar = document.getElementById('wait-bar');
    bar.style.width = p + '%';
    clearInterval(this.waitTick);
    this.waitTick = setInterval(() => { p = Math.min(94, p + 3); bar.style.width = p + '%'; }, 1200);
  }
};
