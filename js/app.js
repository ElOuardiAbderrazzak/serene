/* SERENE — shell, router and the ten screens.
   Anything that is personal data carries data-sensitive so the screen-share
   redaction layer in call.js can find and cover it. */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const state = { route: 'home', itemPatient: 'p1', productLevel: 'all', query: '' };

const patientById = id => PATIENTS.find(p => p.id === id);
const productById = id => PRODUCTS.find(p => p.id === id);
const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

/* a patient avatar — identifying, so it is redacted during a call */
function pAvatar(p, size = 'md') {
  const hue = (p.name.charCodeAt(0) * 7) % 360;
  return `<span class="avatar avatar-${size}" data-sensitive
    style="background:hsl(${hue} 42% 72%)">${initials(p.name)}</span>`;
}
const statusChip = s => `<span class="chip ${STATUS_CLASS[s] || ''}"><i class="dot"></i>${s}</span>`;

/* guided-help hook: data-guide marks the element the tutorial explains */
const guide = (title, text) => `data-guide data-guide-title="${title}" data-guide-text="${text}"`;

/* ========================================================================
   SHELL
   ======================================================================== */
function shell() {
  const navLink = (n, active) => `
    <a class="nav-item ${active === n.id ? 'is-active' : ''}" href="#/${n.id}">
      ${icon(n.icon, 20)}<span>${n.label}</span>
    </a>`;

  return `
  <aside class="sidebar">
    <div class="brand"><span class="brand-mark">SERENE</span></div>
    ${NAV.map(n => navLink(n, state.route)).join('')}
    <div class="nav-spacer"></div>
    ${NAV_FOOT.map(n => navLink(n, state.route)).join('')}
  </aside>

  <div class="main">
    <header class="topbar">
      <div class="topbar-titles">
        <h1 id="page-title"></h1><p id="page-sub"></p>
      </div>
      <button class="btn btn-primary btn-sm" id="call-support-desktop"
        style="border-radius:999px">${icon('phone', 16)} Call support</button>
      <button class="icon-btn" aria-label="Notifications">${icon('bell', 18)}</button>
      <a class="user-chip" href="#/account">
        <span class="avatar avatar-sm" style="background:var(--b600)">${ME.initials}</span>
        <span class="cell-stack not-mobile">
          <span class="t-sm-m">${ME.name}</span>
          <span class="sub t-sm muted">Nurse</span>
        </span>
      </a>
    </header>

    <header class="appbar">
      <div class="appbar-titles">
        <h1 id="page-title-m"></h1><p id="page-sub-m"></p>
      </div>
      <button class="icon-btn help-mode-btn" id="help-mode" aria-pressed="false"
        aria-label="Guided help">${icon('help', 18)}</button>
      <button class="icon-btn" aria-label="Notifications">${icon('bell', 18)}</button>
      <a class="user-chip" href="#/account" aria-label="Account">
        <span class="avatar avatar-sm" style="background:var(--b600)">${ME.initials}</span>
      </a>
    </header>

    <main class="content" id="screen"></main>
  </div>

  <nav class="tabbar">
    ${TABS.map(id => {
      const n = [...NAV, ...NAV_FOOT].find(x => x.id === id);
      return `<a class="tab ${state.route === id ? 'is-active' : ''}" href="#/${id}">
        ${icon(n.icon, 22)}<span>${n.label}</span></a>`;
    }).join('')}
  </nav>

  <div class="fabs">
    <button class="fab fab-support" id="call-support-fab" aria-label="Call live support">
      ${icon('phone', 24)}</button>
    <button class="fab fab-add" aria-label="Add">${icon('plus', 24)}</button>
  </div>`;
}

/* ========================================================================
   SCREENS
   ======================================================================== */
const Screens = {

  home() {
    const attention = PATIENTS.slice(0, 3);
    const alerts = INVENTORY.filter(i => i.stock < i.min).slice(0, 4);
    return `
    <div class="stat-grid">
      ${STATS.map(s => `
        <div class="stat">
          <div class="stat-label">${icon(s.icon, 16)}<span class="t-cap">${s.label}</span></div>
          <div class="stat-value t-metric">${s.value}</div>
          <div class="stat-foot" style="color:var(--${s.footClass === 'warn' ? 'warn' : s.footClass === 'danger' ? 'danger' : 'n500'})">${s.foot}</div>
        </div>`).join('')}
    </div>

    <section class="section">
      <div class="section-head">
        <h2>Needs attention</h2><a class="link" href="#/patients">View all patients</a>
      </div>
      <div class="grid-cards">
        ${attention.map((p, i) => `
          <article class="card card-pad ${absClass(p.level)}"
            style="border-color:var(--bd)" ${i === 0 ? guide('Patients who need attention', 'Cards here are ordered by the next visit. Open one to see the full item list.') : ''}>
            <div class="cell-main">
              ${pAvatar(p, 'md')}
              <div class="cell-stack">
                <span class="t-h4" data-sensitive>${p.name}</span>
                <span class="sub" data-sensitive>Room ${p.room} (${p.age})</span>
              </div>
            </div>
            <div class="divider" style="margin:14px 0"></div>
            <div class="cell-main t-sm dim" style="gap:8px">
              ${icon('visits', 15)}<span>Next visit</span><b class="strong">${p.visit.replace('Today at ', 'Today ')}</b>
            </div>
            <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
              ${absPill(p.level)}<span class="t-sm muted" style="align-self:center">+${p.items - 1} more</span>
            </div>
          </article>`).join('')}
      </div>
    </section>

    <div class="two-col">
      <section class="section">
        <div class="section-head"><h2>Today's visits</h2><span class="t-sm muted">8 scheduled</span></div>
        <div class="list">
          ${VISITS.slice(0, 4).map(v => { const p = patientById(v.patient); return `
            <div class="row">
              <b class="t-body-m" style="color:var(--b700);flex:0 0 46px">${v.time}</b>
              ${pAvatar(p, 'md')}
              <div class="row-main">
                <div class="row-title" data-sensitive>${p.name}</div>
                <div class="row-sub" data-sensitive>Room ${p.room}, ${v.items} items</div>
              </div>
              ${statusChip(v.status)}
            </div>`; }).join('')}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Stock alerts</h2><a class="link" href="#/inventory">${alerts.length} items</a></div>
        <div class="list">
          ${alerts.map(a => `
            <div class="row ${absClass(a.level)}">
              <div class="row-main">
                <div class="row-title">${a.name}</div>
                <div class="row-sub">${a.stock} left</div>
              </div>
              ${statusChip(a.stock === 0 ? 'Out of stock' : 'Low stock')}
            </div>`).join('')}
        </div>
      </section>
    </div>`;
  },

  patients() {
    const q = state.query.toLowerCase();
    const rows = PATIENTS.filter(p => !q || p.name.toLowerCase().includes(q) || p.room.includes(q));
    return `
    <div class="toolbar">
      <label class="search">${icon('search', 18)}
        <input type="search" placeholder="Search patients by name or room"
          value="${state.query}" oninput="App.search(this.value)">
      </label>
      <button class="icon-btn" aria-label="Filter">${icon('filter', 18)}</button>
      <button class="btn btn-primary btn-sm" style="border-radius:999px"
        ${guide('Add a patient', 'Creates the record and the first item list in one step. You need the room number and the prescribed absorbency.')}>
        ${icon('plus', 16)} Add patient</button>
    </div>

    <table class="table">
      <thead><tr>
        <th>Patient</th><th>Next visit</th><th>Primary nurse</th><th>Item list</th><th>Status</th><th></th>
      </tr></thead>
      <tbody>
        ${rows.map(p => `
          <tr class="${absClass(p.level)}">
            <td class="td-label" data-label="Patient">
              <div class="cell-main">${pAvatar(p, 'md')}
                <div class="cell-stack">
                  <span class="t-body-m" data-sensitive>${p.name}</span>
                  <span class="sub" data-sensitive>Room ${p.room} (${p.age})</span>
                </div>
              </div>
            </td>
            <td class="td-label" data-label="Next visit">
              <div class="cell-stack"><span class="t-body-m">${p.visit}</span>
                <span class="sub">Next visit</span></div>
            </td>
            <td class="td-label" data-label="Primary nurse">
              <div class="cell-stack"><span class="t-body-m">${p.nurse}</span>
                <span class="sub">Primary nurse</span></div>
            </td>
            <td class="td-label" data-label="Item list">${absPill(p.level)}</td>
            <td class="td-label" data-label="Status">${statusChip(p.status)}</td>
            <td style="text-align:right;color:var(--n400)">${icon('chevron', 18)}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    ${rows.length ? '' : `<div class="empty"><div class="empty-icon">${icon('search', 26)}</div>
      <div><div class="t-h3">No patients match “${state.query}”</div>
      <p class="muted t-sm">Try a name or a room number.</p></div></div>`}`;
  },

  visits() {
    const days = ['Mon 17','Tue 18','Wed 19','Thu 20','Fri 21','Sat 22','Sun 23'];
    return `
    <div class="toolbar">
      <div style="display:flex;gap:6px;flex-wrap:wrap" ${guide('Pick a day', 'The selected day loads its visit round below. Days with unfinished visits show a dot.')}>
        ${days.map((d, i) => `
          <button class="chip ${i === 3 ? 'chip-brand' : ''}" style="${i === 3 ? 'font-weight:600' : ''}">
            ${d}${i < 3 ? '' : ''}</button>`).join('')}
      </div>
      <div style="flex:1"></div>
      <button class="btn btn-ghost btn-sm">${icon('plus', 16)} Add visit</button>
    </div>

    <section class="section">
      <div class="section-head"><h2>Thursday 20 November</h2><span class="t-sm muted">8 visits, 2 completed</span></div>
      <div class="list">
        ${VISITS.map(v => { const p = patientById(v.patient); return `
          <div class="row ${absClass(p.level)}">
            <b class="t-body-m" style="color:var(--b700);flex:0 0 46px">${v.time}</b>
            ${pAvatar(p, 'md')}
            <div class="row-main">
              <div class="row-title" data-sensitive>${p.name}</div>
              <div class="row-sub"><span data-sensitive>Room ${p.room}</span>, ${v.items} items</div>
            </div>
            ${absPill(p.level)}
            ${statusChip(v.status)}
          </div>`; }).join('')}
      </div>
    </section>`;
  },

  orders() {
    return `
    <div class="toolbar">
      <label class="search">${icon('search', 18)}
        <input type="search" placeholder="Search by order number"></label>
      <button class="btn btn-primary btn-sm" style="border-radius:999px"
        ${guide('Start a new order', 'Orders are built from the item lists of the patients you choose, so quantities are filled in for you.')}>
        ${icon('plus', 16)} New order</button>
    </div>

    <table class="table">
      <thead><tr><th>Order</th><th>Date</th><th>Lines</th><th>Units</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>
        ${ORDERS.map(o => `
          <tr>
            <td class="td-label" data-label="Order"><b class="t-body-m">${o.id}</b></td>
            <td class="td-label" data-label="Date">${o.date}</td>
            <td class="td-label" data-label="Lines">${o.lines}</td>
            <td class="td-label" data-label="Units">${o.units}</td>
            <td class="td-label" data-label="Total"><b class="t-body-m">${o.total}</b></td>
            <td class="td-label" data-label="Status">${statusChip(o.status)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
  },

  items() {
    const sel = ITEM_LISTS.find(l => l.patient === state.itemPatient) || ITEM_LISTS[0];
    const p = patientById(sel.patient);
    return `
    <div class="two-col two-col-items">
      <section class="section">
        <div class="section-head"><h2 style="font-size:19px">Patients</h2></div>
        <div class="list" ${guide('Choose a patient', 'Each patient has one item list. Pick a patient here and their products load on the right.')}>
          ${ITEM_LISTS.map(l => { const pp = patientById(l.patient); return `
            <button class="row ${absClass(pp.level)}" onclick="App.pickPatient('${l.patient}')"
              style="${l.patient === sel.patient ? 'background:var(--b50);border-color:var(--b400)' : ''}">
              ${pAvatar(pp, 'md')}
              <div class="row-main" style="text-align:left">
                <div class="row-title" data-sensitive>${pp.name}</div>
                <div class="row-sub">${l.items.length} products</div>
              </div>
            </button>`; }).join('')}
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 style="font-size:19px"><span data-sensitive>${p.name}</span></h2>
          ${absPill(p.level)}
        </div>
        <div class="card">
          ${sel.items.map((it, i) => { const pr = productById(it.p); return `
            <div class="setting">
              <span class="avatar avatar-md ${absClass(pr.level)}"
                style="background:var(--t);color:var(--n700);font-size:11px">${pr.range[0]}</span>
              <div class="setting-main">
                <div class="t-body-m">${pr.name}</div>
                <div class="t-sm muted">${it.when}, ${pr.pack}</div>
              </div>
              <span class="chip">${it.qty} per day</span>
              ${absPill(pr.level)}
            </div>`; }).join('')}
        </div>
      </section>
    </div>`;
  },

  inventory() {
    return `
    <div class="toolbar">
      <label class="search">${icon('search', 18)}
        <input type="search" placeholder="Search stock by product"></label>
      <button class="btn btn-primary btn-sm" style="border-radius:999px"
        ${guide('Record new stock', 'Scan or type what arrived. The count updates straight away and clears the low-stock alert.')}>
        ${icon('plus', 16)} Add stock</button>
    </div>

    <table class="table">
      <thead><tr><th>Product</th><th>Location</th><th>In stock</th><th>Minimum</th><th>Status</th></tr></thead>
      <tbody>
        ${INVENTORY.map(i => {
          const pct = Math.min(100, Math.round(i.stock / Math.max(i.min, 1) * 100));
          const st = i.stock === 0 ? 'Out of stock' : i.stock < i.min ? 'Low stock' : 'Completed';
          return `
          <tr class="${absClass(i.level)}">
            <td class="td-label" data-label="Product">
              <div class="cell-stack"><span class="t-body-m">${i.name}</span>
                <span class="sub">${absPill(i.level)}</span></div>
            </td>
            <td class="td-label" data-label="Location">${i.loc}</td>
            <td class="td-label" data-label="In stock">
              <div class="cell-stack" style="gap:5px;min-width:110px">
                <b class="t-body-m">${i.stock}</b>
                <span class="progress" style="height:5px;width:100px">
                  <i style="width:${pct}%;background:var(--${i.stock === 0 ? 'danger' : i.stock < i.min ? 'warn' : 'ok'})"></i>
                </span>
              </div>
            </td>
            <td class="td-label" data-label="Minimum">${i.min}</td>
            <td class="td-label" data-label="Status">${statusChip(st === 'Completed' ? 'Approved' : st)}</td>
          </tr>`; }).join('')}
      </tbody>
    </table>`;
  },

  invoices() {
    return `
    <div class="empty card" style="box-shadow:none">
      <div class="empty-icon">${icon('lock', 28)}</div>
      <div style="max-width:420px">
        <div class="t-h2">Invoices are restricted</div>
        <p class="muted" style="margin-top:8px">Your role does not include billing. An administrator at
          ${ME.org.split(',')[0]} can grant access, or you can ask Ontex support to open it for you.</p>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
        <button class="btn btn-primary"
          ${guide('Ask for access', 'This sends a request to your administrator. You keep working while it is reviewed.')}>
          Request access</button>
        <button class="btn btn-ghost" id="invoices-call">Ask support</button>
      </div>
    </div>`;
  },

  products() {
    const lv = state.productLevel;
    const list = lv === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.level === lv);
    return `
    <div class="toolbar" style="flex-wrap:wrap">
      <div style="display:flex;gap:6px;flex-wrap:wrap"
        ${guide('Filter by absorbency', 'Absorbency is colour-coded everywhere in SERENE, so the same colour on a card, a row or a chip always means the same level.')}>
        <button class="chip ${lv === 'all' ? 'chip-brand' : ''}" onclick="App.filterLevel('all')">All levels</button>
        ${LEVELS.map(l => `<button class="abs-pill ${absClass(l)}"
          style="${lv === l ? 'outline:2px solid var(--bd);outline-offset:1px' : ''}"
          onclick="App.filterLevel('${l}')"><i class="dot"></i>${l}</button>`).join('')}
      </div>
    </div>

    <div class="grid-cards">
      ${list.map(p => `
        <article class="pcard ${absClass(p.level)}">
          <div class="pcard-media">
            <span class="pcard-ph">${p.range}</span>
            <img src="assets/products/${p.img}.png" alt="" loading="lazy"
              style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:14px"
              onload="this.previousElementSibling.hidden=true"
              onerror="this.remove()">
          </div>
          <div class="pcard-body">
            <div class="t-h4">${p.name}</div>
            <div class="t-sm muted">${p.pack}</div>
            <div>${absPill(p.level)}</div>
          </div>
        </article>`).join('')}
    </div>`;
  },

  account() {
    return `
    <div class="two-col">
      <section class="card">
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:28px 24px">
          <span class="avatar avatar-xl" style="background:var(--b600)">${ME.initials}</span>
          <div style="text-align:center">
            <div class="t-h2">${ME.name}</div>
            <div class="t-sm muted">${ME.org}</div>
          </div>
          <span class="chip">${ME.role}</span>
          <button class="btn btn-ghost btn-block" style="margin-top:4px"
            ${guide('Edit your profile', 'Your name and role are shown to the Ontex specialist when you start a support call, so keep them current.')}>
            Edit profile</button>
        </div>
      </section>

      <section class="card">
        <div class="setting"><div class="setting-main">
          <div class="t-body-m">Organisation</div><div class="t-sm muted">${ME.org}</div></div></div>
        <div class="setting"><div class="setting-main">
          <div class="t-body-m">Customer number</div><div class="t-sm muted">ONX-4471-BE</div></div></div>
        <div class="setting"><div class="setting-main">
          <div class="t-body-m">Account manager</div><div class="t-sm muted">Tom Verbeke, Ontex</div></div>
          <button class="btn btn-ghost btn-sm">Contact</button></div>
        <div class="setting"><div class="setting-main">
          <div class="t-body-m">Sign out</div><div class="t-sm muted">On this device only</div></div>
          <button class="btn btn-ghost btn-sm">Sign out</button></div>
      </section>
    </div>`;
  },

  settings() {
    return `
    <section class="card" style="max-width:720px">
      <div class="setting">
        <div class="setting-main">
          <div class="t-body-m">Guided help</div>
          <div class="t-sm muted">Show a short video when you point at an important button</div>
        </div>
        <button class="switch ${Guide.enabled ? 'is-on' : ''}" id="set-guide"
          role="switch" aria-checked="${Guide.enabled}"><span></span></button>
      </div>

      <div class="setting" ${guide('Privacy during a support call', 'Patient names, ages, room numbers and photos are covered before the picture leaves this device. The specialist never receives them.')}>
        <div class="setting-main">
          <div class="t-body-m">Hide patient data during a support call</div>
          <div class="t-sm muted">Always on. Names, ages, rooms and photos are redacted in the shared picture</div>
        </div>
        <span class="chip chip-ok"><i class="dot"></i>Always on</span>
      </div>

      <div class="setting">
        <div class="setting-main">
          <div class="t-body-m">Microphone</div>
          <div class="t-sm muted">Used only while a support call is running</div>
        </div>
        <span class="chip">Ask each time</span>
      </div>

      <div class="setting">
        <div class="setting-main">
          <div class="t-body-m">Language</div><div class="t-sm muted">English</div>
        </div>
        <button class="btn btn-ghost btn-sm">Change</button>
      </div>

      <div class="setting">
        <div class="setting-main">
          <div class="t-body-m">About</div><div class="t-sm muted">SERENE prototype, build 0.4</div>
        </div>
      </div>
    </section>`;
  }
};

/* ========================================================================
   ROUTER
   ======================================================================== */
const App = {
  search(v) { state.query = v; const s = $('#screen'); s.innerHTML = Screens.patients();
              const i = $('#screen input[type=search]'); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } },
  pickPatient(id) { state.itemPatient = id; paint(); },
  filterLevel(l) { state.productLevel = l; paint(); },
  go(route) { location.hash = '#/' + route; }
};

function paint() {
  const r = state.route;
  Guide.close();                      // never leave a tip (and its scrim) over a new screen
  $('#screen').innerHTML = (Screens[r] || Screens.home)();
  const [t, s] = PAGE_TITLES[r] || PAGE_TITLES.home;
  $('#page-title').textContent = t;   $('#page-sub').textContent = s;
  $('#page-title-m').textContent = t; $('#page-sub-m').textContent = s;
  $$('.nav-item').forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#/' + r));
  $$('.tab').forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#/' + r));
  Guide.rebind();
  const ic = $('#invoices-call');
  if (ic) ic.addEventListener('click', () => Call.open());
}

function route() {
  const r = (location.hash.replace('#/', '') || 'home').split('?')[0];
  state.route = Screens[r] ? r : 'home';
  if (state.route !== 'patients') state.query = '';
  paint();
  window.scrollTo(0, 0);
}

function boot() {
  document.body.insertAdjacentHTML('afterbegin', `<div class="app">${shell()}</div>`);
  window.addEventListener('hashchange', route);
  Guide.init();
  Call.init();
  route();
}
document.addEventListener('DOMContentLoaded', boot);
