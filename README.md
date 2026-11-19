# SERENE — working prototype

Patient management for incontinence care, plus the two features that needed
proving: **live screencast support** and **guided on-platform help**.

Plain HTML, CSS and JavaScript. No build step, no framework, no backend, no
database. Open `index.html` and it runs.

---

## 1. What is in here

```
index.html          the app (caregiver)
agent.html          the support console (Ontex specialist)
css/app.css         design tokens + the ten screens, responsive
css/features.css    guided help and the support call
js/data.js          icons, mock data, signalling config
js/app.js           router + the ten screens
js/guide.js         guided help
js/call.js          the support call, caller side (incl. the redaction)
js/agent.js         the support call, specialist side
js/peerjs.min.js    vendored, so the site needs no CDN at runtime
assets/             drop your product photos and tutorial clips here
```

**Breakpoints** — desktop ≥ 1180 px (sidebar), tablet 700–1179 px and mobile
< 700 px (app bar, tab bar, floating buttons). Same markup throughout; the
tables fold into stacked cards on the two smaller sizes.

---

## 2. Hosting it — GitHub Pages

**Screen capture and microphone only work on HTTPS**, or on `localhost`. That
single rule decides the hosting: you need a real HTTPS URL for a two-laptop
test, and GitHub Pages gives you one for free with no configuration.

```bash
cd serene
git init
git add .
git commit -m "SERENE prototype"
git branch -M main
git remote add origin https://github.com/<you>/serene.git
git push -u origin main
```

Then on github.com: **Settings → Pages → Source: Deploy from a branch →
`main` / `(root)` → Save.** A minute later it is live at

```
https://<you>.github.io/serene/
https://<you>.github.io/serene/agent.html
```

Nothing else to install or pay for. Every push updates the site.

**Working on it locally** — `python3 -m http.server 8080` in this folder, then
`http://localhost:8080`. Everything works, because browsers treat `localhost`
as secure. A second laptop cannot use that address, which is why the live test
below uses the Pages URL.

---

## 3. Testing the support call on two laptops

You need two machines, each with Chrome or Edge, and headphones on at least
one of them or the microphones will howl. They do **not** need to be on the
same network.

**Laptop A — the caregiver**

1. Open `https://<you>.github.io/serene/`
2. Click **Call support** (top right; the blue bubble on tablet and phone)
3. Leave **Share my screen** on and click **Join support room**
4. Allow the microphone
5. In the share picker choose the **"This tab" / Chrome tab** option and pick
   the SERENE tab — see the note below
6. Read out the six-character **room code** on screen

**Laptop B — the specialist**

7. Open `https://<you>.github.io/serene/agent.html`
8. Type the room code, click **Join call**, allow the microphone

They are now connected: audio both ways, and laptop A's screen appears on
laptop B with every patient name, age, room number and photo blocked out.
Either side can hang up; the other is told.

You can also rehearse it alone in two windows on one laptop — mute the
speakers, or you will get feedback.

### Why "This tab" matters

When you share the tab, SERENE knows exactly where every piece of patient data
sits on screen and paints over it in the picture it sends. If you instead share
a whole window or a whole monitor, those coordinates no longer line up, so
SERENE falls back to blurring the patient data on your own screen before it is
captured. Nothing identifying is ever sent either way; the difference is only
whether *you* also see the blur.

### If it will not connect

The two browsers find each other through the free public PeerJS broker. Only
tiny connection messages pass through it — the audio and video go straight
between the two machines. If it is ever slow or down, run your own in ten
seconds and point both pages at it:

```bash
npx peerjs --port 9000          # on one of the laptops, or any machine
```

then add `?broker=<that machine's address>:9000` to **both** URLs:

```
https://<you>.github.io/serene/?broker=192.168.1.20:9000
https://<you>.github.io/serene/agent.html?broker=192.168.1.20:9000
```

Note that a plain `http://` broker will be blocked by an `https://` page, so
for that combination run both laptops from `localhost` on the same network, or
put the broker behind HTTPS.

---

## 4. How the patient data is hidden

This is the part worth explaining in the report, because it is not the obvious
approach.

A screen share normally sends the raw pixels of your screen, and there is no
way to subtract something afterwards. So SERENE never sends the raw pixels.

1. Every element holding personal data is marked `data-sensitive` in the
   markup — patient names, ages, room numbers and photos.
2. During a call the captured tab is drawn into an off-screen `<canvas>`,
   frame by frame.
3. Before each frame is handed on, the app asks the browser where every
   `data-sensitive` element currently is (`getBoundingClientRect`), scales
   those boxes from CSS pixels to captured pixels, and paints solid blocks
   over them. A "Patient data hidden by SERENE" marker is burned in too, so it
   survives any recording the specialist makes.
4. **The canvas is what the peer connection streams.** The real pixels never
   leave the device, so there is nothing on the specialist's side to leak,
   intercept or switch off.

The caregiver still sees their own screen normally — only the outgoing picture
is redacted. The specialist keeps everything they actually need: the visit
schedule, the nurse names, absorbency levels, stock figures, the whole
workflow. They just cannot see who the patients are.

Verified end to end: with a real call running between two browsers, every
patient name and room number sampled from the specialist's received video came
back as the redaction block, while ordinary screen content came through
untouched.

---

## 5. Guided help

Point at a button marked with a tip and a short video explains it, with the
button spotlit and the rest of the screen dimmed. Picture-in-picture and
fullscreen are on the player, and the footer toggle turns the whole feature
off — it is remembered on that device.

There is no hover on a touch screen, so on tablet and phone the **?** in the
app bar turns on help mode and the next tap on a highlighted control opens its
tip instead of activating it.

**Adding the video.** One clip is used for every tip — only the title and the
sentence under the player change per button. Put your file here:

```
assets/tutorial.mp4
```

That is the only video the app looks for. Until it is there the player shows a
placeholder rather than breaking, so the rest of the feature still demos. If
you later want a different clip per screen, change `GUIDE_VIDEO` at the top of
`js/data.js` into a lookup on `state.route`.

**Adding a tip to another button** — put three attributes on it, nothing else:

```html
<button data-guide
        data-guide-title="Record new stock"
        data-guide-text="Scan or type what arrived.">Add stock</button>
```

---

## 6. Product photos

The twelve real product shots are already in `assets/products/`, pulled from
the Figma file and cut out onto transparency so they sit on the absorbency
tint of each card:

```
essential-light-pads   discreet-light-pads   discreet-underwear
sensitive-form         sensitive-belt        sensitive-pants
slip-all-in-one        care-net-pants        protect-bed-chair
men-shaped             men-pants             rectangular
```

To swap one, drop a PNG with the same name over it. A missing file falls back
to a tinted placeholder rather than a broken image.

---

## 7. Known limits

- **Chrome or Edge.** Safari does not support `getDisplayMedia` the same way
  and will not share a tab; Firefox has no `preferCurrentTab`, so it always
  takes the window-sharing fallback path.
- **One specialist per room.** The room code is the whole queue.
- The queue, the "7 calls handled" figures and the patient records are mock
  data held in `js/data.js`. Nothing is stored anywhere; a refresh resets it.
- Patient photos are drawn as coloured initials, so there is no real face in
  the prototype even before redaction.
