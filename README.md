# SERENE

A working prototype of a patient management platform for incontinence care,
built in plain HTML, CSS and JavaScript. No build step, no framework, no
backend, no database. Open `index.html` and it runs.

It exists to prove two features.

## Feature 1: live screencast support call

A caregiver can call a specialist and share their screen, with patient data
automatically blocked out before anything leaves the device.

Every element holding personal data (patient names, ages, room numbers,
photos) is marked `data-sensitive` in the markup. During a call, the shared
tab is drawn frame by frame into an off-screen canvas, solid blocks are
painted over every `data-sensitive` element's current position, and that
canvas, not the raw screen, is what gets streamed to the specialist. The real
pixels never leave the device.

The specialist still sees everything they need to help: the visit schedule,
nurse names, absorbency levels, stock figures. They just cannot see who the
patients are.

Open the app as the caregiver, click **Call support** and choose "This tab"
when sharing. Open `agent.html` as the specialist console to answer calls.

## Feature 2: guided on-platform help

Hover (or tap, on touch) any button marked with a tip, and a short video
explains it, with that button spotlit and the rest of the screen dimmed. One
video clip plays for every tip; only the title and sentence under it change
per button. The feature can be switched on or off from Settings.

To add a tip to a button, give it three attributes:

```html
<button data-guide
        data-guide-title="Record new stock"
        data-guide-text="Scan or type what arrived.">Add stock</button>
```

## Hosting it

Screen capture and microphone access only work on HTTPS, or on `localhost`.
GitHub Pages gives you a free HTTPS URL with no configuration, which is why
it's the host here.

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
`main` / `(root)` → Save.** A minute later it's live at:

```
https://<you>.github.io/serene/
https://<you>.github.io/serene/agent.html
```

Every push updates the site. To work on it locally, run
`python3 -m http.server 8080` in this folder and open
`http://localhost:8080`.

## Testing the support call

You need two machines, each with Chrome or Edge, and headphones on at least
one of them to avoid feedback. They don't need to be on the same network.

**Laptop A, the caregiver**
1. Open `https://<you>.github.io/serene/`
2. Click **Call support**, leave **Share my screen** on, click **Join support room**
3. Allow the microphone
4. In the share picker, choose the "This tab" option and pick the SERENE tab
5. Read out the six-character room code on screen

**Laptop B, the specialist**
6. Open `https://<you>.github.io/serene/agent.html`
7. Type the room code, click **Join call**, allow the microphone

They're now connected: audio both ways, and laptop A's screen appears on
laptop B with every patient name, age, room number and photo blocked out.

You can also rehearse it alone in two browser windows on one laptop; mute the
speakers first.

## After you change a file

GitHub Pages caches CSS and JS for a while, so a refresh can still show the
old version. The script and style tags carry a `?v=` number for that reason;
bump it in `index.html` and `agent.html` whenever you change a `.js` or
`.css` file so everyone gets the new one immediately.
