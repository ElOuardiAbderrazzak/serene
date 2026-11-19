/* SERENE — icons + mock data. No network, no backend. */

/* Where the two browsers find each other. Default is the free public PeerJS
   broker, which needs no account and no server of ours. If it is ever slow or
   down, run your own (`npx peer --port 9000`) and add ?broker=host:port to the
   URL on BOTH pages. Only tiny connection messages pass through it — audio and
   video go straight between the two machines. */
/* One tutorial clip is used for every guided-help tip. The title and the
   explanation under the player change per button; the footage does not. */
const GUIDE_VIDEO = 'assets/tutorial.mp4';

const SIGNAL = (() => {
  const h = new URLSearchParams(location.search).get('broker');
  if (!h) return {};
  const [host, port] = h.split(':');
  return { host, port: Number(port) || 443, path: '/', secure: location.protocol === 'https:' };
})();

const ICONS = {
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/>',
  patients:'<circle cx="9" cy="8" r="3.4"/><path d="M3 20c0-3.3 2.7-5.4 6-5.4s6 2.1 6 5.4"/><path d="M16.5 5.5a3 3 0 0 1 0 5.6"/><path d="M18 20c0-2.6-1-4.3-2.5-5.2"/>',
  visits:'<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/><path d="M8.5 15h3"/>',
  orders:'<path d="M4 7h16l-1.3 12.2a2 2 0 0 1-2 1.8H7.3a2 2 0 0 1-2-1.8z"/><path d="M8.5 7a3.5 3.5 0 1 1 7 0"/>',
  items:'<path d="M4 6h16M4 12h16M4 18h10"/><circle cx="19" cy="18" r="2"/>',
  inventory:'<path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5z"/><path d="M3 8.5 12 13l9-4.5M12 13v7"/>',
  invoices:'<path d="M6 3h9l4 4v14H6z"/><path d="M14.5 3v4.5H19"/><path d="M9 13h6M9 17h4"/>',
  products:'<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7"/><path d="M3 12h18"/>',
  account:'<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5c0-3.8 3.4-6.2 7.5-6.2s7.5 2.4 7.5 6.2"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 18.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  phone:'<path d="M7.5 3.5h-3A1.5 1.5 0 0 0 3 5.2C3.4 12.6 11.4 20.6 18.8 21a1.5 1.5 0 0 0 1.7-1.5v-3a1.5 1.5 0 0 0-1.2-1.5l-2.6-.5a1.5 1.5 0 0 0-1.5.6l-.9 1.2a12.6 12.6 0 0 1-5.6-5.6l1.2-.9a1.5 1.5 0 0 0 .6-1.5l-.5-2.6a1.5 1.5 0 0 0-1.5-1.2z"/>',
  bell:'<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9z"/><path d="M13.7 19a2 2 0 0 1-3.4 0"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  alert:'<path d="M12 3.5 21 19.5H3z"/><path d="M12 9.5v4M12 16.5h.01"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.2 1.8"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>',
  mic:'<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v4"/><path d="M8.5 22h7"/>',
  'mic-off':'<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v4"/><path d="M8.5 22h7"/><path d="M4 3l16 18"/>',
  screen:'<rect x="2" y="4" width="20" height="13" rx="2.5"/><path d="M8.5 21h7"/><path d="M12 17v4"/>',
  'screen-off':'<rect x="2" y="4" width="20" height="13" rx="2.5"/><path d="M8.5 21h7"/><path d="M12 17v4"/><path d="M4 3l16 18"/>',
  shield:'<path d="M12 2.5 19.5 5.7v5.6c0 4.7-3.2 8.6-7.5 9.9-4.3-1.3-7.5-5.2-7.5-9.9V5.7z"/><path d="m9.2 12.1 2 2 3.6-3.8"/>',
  eye:'<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.8"/>',
  pip:'<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><rect x="12" y="11" width="7.5" height="6" rx="1.5"/>',
  fullscreen:'<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/>',
  play:'<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.8"/><path d="M12 17.5h.01"/>',
  back:'<path d="M15 5 8 12l7 7"/>',
  lock:'<rect x="4.5" y="10" width="15" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
};

function icon(name, size = 20, cls = '') {
  const p = ICONS[name] || '';
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${p}</svg>`;
}

/* ---------- absorbency ---------- */
const LEVELS = ['Normal', 'Plus', 'Extra', 'Extra Plus', 'Ultra', 'Super', 'Maxi'];
const absClass = l => 'abs abs-' + String(l).toLowerCase().replace(/\s+/g, '');
const absPill = l => `<span class="abs-pill ${absClass(l)}"><i class="dot"></i>${l}</span>`;

/* ---------- the signed-in user ----------
   photo: drop a square image at assets/people/nurse.jpg and set
   photo:'nurse' to use it. Left null, the app shows her initials. */
const ME = { name: 'An Vermeulen', role: 'Head caregiver', org: 'WZC Sint-Jozef, Kortrijk',
             initials: 'AV', photo: null };

/* ---------- patients (everything here is personal data) ----------
   `photo` points at assets/people/<photo>.jpg. Faces are personal data, so
   the avatars carry data-sensitive and are covered during a support call. */
const PATIENTS = [
  { id:'p1', name:'Marie Dubois',      room:'204', age:78, visit:'Today at 09:30',     nurse:'An Vermeulen', level:'Extra Plus', status:'Scheduled', items:4, photo:'p1-marie-dubois' },
  { id:'p2', name:'Jan Peeters',       room:'112', age:83, visit:'Today at 10:15',     nurse:'An Vermeulen', level:'Ultra',      status:'Scheduled', items:3, photo:'p2-jan-peeters' },
  { id:'p3', name:'Luc Vandenberghe',  room:'115', age:69, visit:'Today at 11:00',     nurse:'Tom Claeys',   level:'Extra',      status:'Scheduled', items:5, photo:'p3-luc-vandenberghe' },
  { id:'p4', name:'Sofie Claes',       room:'221', age:74, visit:'Today at 13:30',     nurse:'Tom Claeys',   level:'Plus',       status:'Scheduled', items:2, photo:'p4-sofie-claes' },
  { id:'p5', name:'Fatima El Amrani',  room:'308', age:71, visit:'Today at 14:45',     nurse:'An Vermeulen', level:'Super',      status:'Scheduled', items:4, photo:'p5-fatima-el-amrani' },
  { id:'p6', name:'Ahmed Benali',      room:'103', age:80, visit:'Fri 21 Nov at 09:00', nurse:'Lies Maes',   level:'Maxi',       status:'Completed', items:3, photo:'p6-ahmed-benali' },
  { id:'p7', name:'Greta Janssens',    room:'310', age:86, visit:'Fri 21 Nov at 10:30', nurse:'Lies Maes',   level:'Normal',     status:'Completed', items:2, photo:'p7-greta-janssens' },
  { id:'p8', name:'Pieter De Smet',    room:'207', age:77, visit:'Fri 21 Nov at 11:15', nurse:'Tom Claeys',  level:'Extra',      status:'Completed', items:4, photo:'p8-pieter-de-smet' }
];

/* ---------- products ---------- */
const PRODUCTS = [
  { id:'pr1',  name:'Serene Essential Light Pads',      range:'Essential', level:'Normal',     pack:'28 per pack', img:'essential-light-pads' },
  { id:'pr2',  name:'Serene Discreet Light Pads',       range:'Discreet',  level:'Normal',     pack:'24 per pack', img:'discreet-light-pads' },
  { id:'pr3',  name:'Serene Discreet Premium Underwear',range:'Discreet',  level:'Plus',       pack:'14 per pack', img:'discreet-underwear' },
  { id:'pr4',  name:'Serene Sensitive Shaped Pads',     range:'Sensitive', level:'Extra',      pack:'21 per pack', img:'sensitive-form' },
  { id:'pr5',  name:'Serene Sensitive Belted',          range:'Sensitive', level:'Extra Plus', pack:'20 per pack', img:'sensitive-belt' },
  { id:'pr6',  name:'Serene Sensitive Adult Pants',     range:'Sensitive', level:'Ultra',      pack:'16 per pack', img:'sensitive-pants' },
  { id:'pr7',  name:'Serene Slip All-in-one',           range:'Slip',      level:'Super',      pack:'18 per pack', img:'slip-all-in-one' },
  { id:'pr8',  name:'Serene Care Net Fixation Pants',   range:'Care',      level:'Normal',     pack:'5 per pack',  img:'care-net-pants' },
  { id:'pr9',  name:'Serene Protect Bed & Chair',       range:'Protect',   level:'Maxi',       pack:'30 per pack', img:'protect-bed-chair' },
  { id:'pr10', name:'Serene For Men Shaped',            range:'For Men',   level:'Plus',       pack:'20 per pack', img:'men-shaped' },
  { id:'pr11', name:'Serene For Men Protective Pants',  range:'For Men',   level:'Plus',       pack:'14 per pack', img:'men-pants' },
  { id:'pr12', name:'Serene Rectangular & Anatomical',  range:'Essential', level:'Extra',      pack:'30 per pack', img:'rectangular' }
];

/* ---------- inventory ---------- */
const INVENTORY = [
  { id:'pr5', name:'Serene Sensitive Belted',       level:'Extra Plus', stock:12, min:20, loc:'Store A — shelf 3' },
  { id:'pr7', name:'Serene Slip All-in-one',        level:'Super',      stock:6,  min:24, loc:'Store A — shelf 1' },
  { id:'pr9', name:'Serene Protect Bed & Chair',    level:'Maxi',       stock:0,  min:12, loc:'Store B — pallet 2' },
  { id:'pr6', name:'Serene Sensitive Adult Pants',  level:'Ultra',      stock:18, min:24, loc:'Store A — shelf 4' },
  { id:'pr1', name:'Serene Essential Light Pads',   level:'Normal',     stock:64, min:30, loc:'Store A — shelf 2' },
  { id:'pr4', name:'Serene Sensitive Shaped Pads',  level:'Extra',      stock:41, min:24, loc:'Store A — shelf 3' },
  { id:'pr3', name:'Serene Discreet Underwear',     level:'Plus',       stock:29, min:18, loc:'Store B — shelf 1' },
  { id:'pr8', name:'Serene Care Net Pants',         level:'Normal',     stock:35, min:15, loc:'Store B — shelf 2' }
];

/* ---------- orders ---------- */
const ORDERS = [
  { id:'ORD-2411-018', date:'20 Nov 2026', lines:6,  units:148, total:'€412,60', status:'Pending' },
  { id:'ORD-2411-017', date:'18 Nov 2026', lines:4,  units:96,  total:'€268,00', status:'Approved' },
  { id:'ORD-2411-016', date:'15 Nov 2026', lines:9,  units:214, total:'€587,40', status:'Completed' },
  { id:'ORD-2411-015', date:'12 Nov 2026', lines:3,  units:60,  total:'€168,90', status:'Completed' },
  { id:'ORD-2411-014', date:'08 Nov 2026', lines:7,  units:172, total:'€470,25', status:'Completed' },
  { id:'ORD-2411-013', date:'04 Nov 2026', lines:5,  units:120, total:'€331,00', status:'Completed' }
];

/* ---------- item lists (per patient) ---------- */
const ITEM_LISTS = [
  { patient:'p1', items:[ {p:'pr5', qty:2, when:'Morning'}, {p:'pr9', qty:1, when:'Night'}, {p:'pr8', qty:1, when:'Morning'}, {p:'pr4', qty:2, when:'Afternoon'} ] },
  { patient:'p2', items:[ {p:'pr6', qty:3, when:'All day'}, {p:'pr9', qty:1, when:'Night'}, {p:'pr8', qty:1, when:'Morning'} ] },
  { patient:'p3', items:[ {p:'pr4', qty:2, when:'Morning'}, {p:'pr5', qty:1, when:'Afternoon'}, {p:'pr8', qty:1, when:'Morning'}, {p:'pr9', qty:1, when:'Night'}, {p:'pr1', qty:2, when:'Evening'} ] },
  { patient:'p4', items:[ {p:'pr3', qty:2, when:'All day'}, {p:'pr1', qty:1, when:'Evening'} ] },
  { patient:'p5', items:[ {p:'pr7', qty:3, when:'All day'}, {p:'pr9', qty:1, when:'Night'}, {p:'pr8', qty:1, when:'Morning'}, {p:'pr4', qty:1, when:'Afternoon'} ] }
];

/* ---------- visits ---------- */
const VISITS = [
  { time:'09:30', patient:'p1', status:'Completed', items:4 },
  { time:'10:15', patient:'p2', status:'Completed', items:3 },
  { time:'11:00', patient:'p3', status:'Scheduled', items:5 },
  { time:'13:30', patient:'p4', status:'Scheduled', items:2 },
  { time:'14:45', patient:'p5', status:'Scheduled', items:4 },
  { time:'16:00', patient:'p6', status:'Scheduled', items:3 },
  { time:'16:45', patient:'p7', status:'Scheduled', items:2 },
  { time:'17:30', patient:'p8', status:'Scheduled', items:4 }
];

const STATUS_CLASS = {
  Pending:'chip-warn', Approved:'chip-brand', Scheduled:'chip-brand',
  Completed:'chip-ok', 'Low stock':'chip-warn', 'Out of stock':'chip-danger'
};

const STATS = [
  { icon:'patients',  label:'Active patients',  value:'128', foot:'+6 since last week', footClass:'muted' },
  { icon:'visits',    label:'Visits today',     value:'8',   foot:'3 completed',        footClass:'muted' },
  { icon:'orders',    label:'Pending orders',   value:'12',  foot:'4 awaiting approval', footClass:'warn' },
  { icon:'inventory', label:'Low stock items',  value:'5',   foot:'1 out of stock',      footClass:'danger' }
];

const NAV = [
  { id:'home',      label:'Home',       icon:'home' },
  { id:'patients',  label:'Patients',   icon:'patients' },
  { id:'visits',    label:'Visits',     icon:'visits' },
  { id:'orders',    label:'Orders',     icon:'orders' },
  { id:'items',     label:'Item lists', icon:'items' },
  { id:'inventory', label:'Inventory',  icon:'inventory' },
  { id:'invoices',  label:'Invoices',   icon:'invoices' }
];
const NAV_FOOT = [
  { id:'products',  label:'Products',   icon:'products' },
  { id:'settings',  label:'Settings',   icon:'settings' }
];
/* the five that fit a phone tab bar */
const TABS = ['inventory', 'items', 'patients', 'visits', 'orders'];

const PAGE_TITLES = {
  home:      ['Good morning, An', 'Thursday 20 November, 8 visits today. 3 patients need attention'],
  patients:  ['Patients', '128 active, 3 need attention'],
  visits:    ['Visits', '8 scheduled today'],
  orders:    ['Orders', '12 pending, 4 awaiting approval'],
  items:     ['Item lists', 'Per-patient product lists'],
  inventory: ['Inventory', '5 items below minimum'],
  invoices:  ['Invoices', 'Restricted'],
  products:  ['Products', '12 products across 6 ranges'],
  account:   ['Account', 'Your profile and organisation'],
  settings:  ['Settings', 'Preferences for this device']
};
