/* SERENE Support console — the specialist's side.
   Dials the caller's room over PeerJS, plays the audio both ways and shows
   the video it receives. That video has already been redacted on the caller's
   device: this side never holds the real pixels and cannot undo the masking. */

const ROOM_PREFIX = 'serene-';
const $ = id => document.getElementById(id);

const Agent = {
  peer: null, call: null, mic: null, t0: 0, tick: null,

  init() {
    $('pip').innerHTML  = icon('pip', 17);
    $('full').innerHTML = icon('fullscreen', 17);
    $('mic').innerHTML  = icon('mic', 20);
    $('wrap-tick').innerHTML = icon('check', 20);
    $('mask-note').innerHTML = icon('shield', 16) +
      '<span>Patient names, ages, room numbers and photos are hidden by the caller\'s device</span>';

    $('code').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().trim(); });
    $('code').addEventListener('keydown', e => { if (e.key === 'Enter') this.join(); });
    $('join').addEventListener('click', () => this.join());
    $('end').addEventListener('click', () => this.hangUp());
    $('mic').addEventListener('click', () => this.toggleMic());

    $('pip').addEventListener('click', async () => {
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await $('remote').requestPictureInPicture();
      } catch (_) {}
    });
    $('full').addEventListener('click', () => {
      const v = $('remote');
      (v.requestFullscreen || v.webkitEnterFullscreen || (() => {})).call(v);
    });

    $('followup').addEventListener('click', e => {
      const on = e.currentTarget.getAttribute('aria-checked') !== 'true';
      e.currentTarget.classList.toggle('is-on', on);
      e.currentTarget.setAttribute('aria-checked', String(on));
    });
    [$('wrap-save'), $('wrap-next')].forEach(b => b.addEventListener('click', () => this.backToQueue()));

    /* a room code can be handed over in the link: agent.html#7K2M9P */
    const h = location.hash.replace('#', '').toUpperCase();
    if (h) { $('code').value = h; }
  },

  setState(text, kind) {
    const e = $('state');
    e.className = 'conn-state' + (kind ? ' is-' + kind : '');
    e.innerHTML = `<i class="dot"></i>${text}`;
  },

  async join() {
    const code = $('code').value.trim().toUpperCase();
    if (!code) { this.setState('Enter the room code the caller gave you', 'err'); return; }
    if (typeof Peer === 'undefined') { this.setState('peerjs did not load — check the connection', 'err'); return; }

    $('join').disabled = true;
    this.setState('Asking for your microphone…', '');
    try {
      this.mic = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (_) {
      this.setState('A microphone is required for a support call', 'err');
      $('join').disabled = false; return;
    }

    this.setState('Connecting…', '');
    this.peer = new Peer(Object.assign({ debug: 1 }, SIGNAL));
    let answered = false;

    this.peer.on('error', err => {
      const t = err.type === 'peer-unavailable'
        ? 'No one is waiting in room ' + code
        : 'Connection problem (' + (err.type || 'error') + ')';
      this.setState(t, 'err');
      $('join').disabled = false;
    });

    /* We knock on the data channel and hand over our id. The caller then
       places the media call, because only the offering side can add a video
       track and the screen belongs to them. We just answer with our mic. */
    this.peer.on('open', id => {
      this.conn = this.peer.connect(ROOM_PREFIX + code, { reliable: true });
      this.conn.on('open', () => {
        this.conn.send({ type: 'hello', peerId: id });
        this.setState('Joining the caller…', '');
      });
      this.conn.on('data', m => { if (m && m.type === 'end') this.hangUp(); });
      this.conn.on('close', () => { if (this.t0) this.hangUp(); });

      setTimeout(() => {
        if (!answered) { this.setState('No answer from room ' + code, 'err'); $('join').disabled = false; }
      }, 15000);
    });

    this.peer.on('call', incoming => {
      answered = true;
      this.call = incoming;
      incoming.answer(this.mic);
      incoming.on('stream', remote => this.goLive(remote, code));
      incoming.on('close', () => this.hangUp());
      incoming.on('error', () => { this.setState('The call dropped', 'err'); $('join').disabled = false; });
    });
  },

  goLive(remote, code) {
    const v = $('remote');
    v.srcObject = remote;
    v.play().catch(() => {});

    const hasVideo = remote.getVideoTracks().length > 0;
    $('viewer-idle').hidden = hasVideo;
    v.hidden = !hasVideo;
    $('caller-label').textContent = hasVideo ? "Caller's screen — live" : 'Audio only';
    $('mask-note').style.display = hasVideo ? '' : 'none';

    $('caller-name').textContent = 'Caller in room ' + code;
    $('caller-org').textContent  = 'Identified by room code only';
    $('caller-initials').textContent = code.slice(0, 2);

    $('view-queue').hidden = true;
    $('view-call').hidden = false;

    this.t0 = Date.now();
    this.tick = setInterval(() => {
      const s = Math.floor((Date.now() - this.t0) / 1000);
      $('timer').textContent =
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }, 500);
  },

  toggleMic() {
    if (!this.mic) return;
    const t = this.mic.getAudioTracks()[0];
    t.enabled = !t.enabled;
    $('mic').innerHTML = icon(t.enabled ? 'mic' : 'mic-off', 20);
    $('mic').style.background = t.enabled ? '' : 'var(--danger-t)';
    $('mic').style.color = t.enabled ? '' : 'var(--danger)';
  },

  hangUp() {
    const secs = this.t0 ? Math.floor((Date.now() - this.t0) / 1000) : 0;
    clearInterval(this.tick);
    try { this.conn && this.conn.open && this.conn.send({ type: 'end' }); } catch (_) {}
    try { this.call && this.call.close(); } catch (_) {}
    try { this.conn && this.conn.close(); } catch (_) {}
    try { this.peer && this.peer.destroy(); } catch (_) {}
    this.mic && this.mic.getTracks().forEach(t => t.stop());
    this.call = this.peer = this.mic = this.conn = null;
    $('remote').srcObject = null;
    this.t0 = 0;

    $('wrap-sub').textContent = `${Math.floor(secs / 60)} min ${secs % 60} s`;
    $('wrap-scrim').classList.add('is-open');
    $('wrap').classList.add('is-open');
  },

  backToQueue() {
    $('wrap-scrim').classList.remove('is-open');
    $('wrap').classList.remove('is-open');
    $('view-call').hidden = true;
    $('view-queue').hidden = false;
    $('join').disabled = false;
    $('code').value = '';
    this.setState('Idle', '');
  }
};

document.addEventListener('DOMContentLoaded', () => Agent.init());
