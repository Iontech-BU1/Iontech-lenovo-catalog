/* Iontech Lenovo Catalog — offline-capable website (vanilla JS, no build step). */
(() => {
'use strict';

/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const peso = (n) => (n || n === 0) && n !== '' ? '₱' + Number(n).toLocaleString('en-PH', { maximumFractionDigits: 2 }) : '—';
const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const stamp = () => new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const num = (v) => { if (v === null || v === undefined || v === '') return null; const n = Number(String(v).replace(/[₱,\s]/g, '')); return isFinite(n) ? n : null; };
const ls = {
  get(k, d) { try { const v = localStorage.getItem('lc.' + k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem('lc.' + k, JSON.stringify(v)); } catch (_) {} }
};
const ss = {
  get(k) { try { return sessionStorage.getItem('lc.' + k); } catch (_) { return null; } },
  set(k, v) { try { v === null ? sessionStorage.removeItem('lc.' + k) : sessionStorage.setItem('lc.' + k, v); } catch (_) {} }
};
const ICON = {
  copy: '<svg viewBox="0 0 24 24"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>',
  gift: '<svg viewBox="0 0 24 24"><path d="M20 7h-2.2A3 3 0 0 0 12 3.8 3 3 0 0 0 6.2 7H4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zm-5-2a1 1 0 1 1 0 2h-2a2 2 0 0 1 2-2zM9 5a2 2 0 0 1 2 2H9a1 1 0 1 1 0-2zm2 15H6v-8h5v8zm0-10H5V9h6v1zm7 10h-5v-8h5v8zm1-10h-6V9h6v1z"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 12h8v2H8zm0 4h8v2H8z"/></svg>',
  pdf: '<svg viewBox="0 0 24 24"><path d="M20 2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14a2 2 0 0 0 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>',
  ext: '<svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>',
  bulb: '<svg viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19a7 7 0 0 0-4 12.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26A7 7 0 0 0 12 2z"/></svg>',
  ram: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M2 7h20v8h-2v2h-2v-2h-2v2h-2v-2h-4v2H8v-2H6v2H4v-2H2V7zm3 2v4h2V9H5zm4 0v4h2V9H9zm4 0v4h2V9h-2zm4 0v4h2V9h-2z"/></svg>',
  ssd: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 8h18v8H3V8zm2 2v4h9v-4H5zm11 1v2h2v-2h-2z"/></svg>'
};
const GROUPS = {
  'Processor': 'Performance', 'Display': 'Design', 'Operating System': 'Software', 'WLAN + Bluetooth': 'Connectivity',
  'Security Chip': 'Security & Privacy', 'Base Warranty': 'Service', 'Bundled Accessories': 'Accessories',
  'Display Size': 'Panel', 'Sync Technology': 'Features', 'Rear Ports': 'Connectivity', 'Stand': 'Design'
};
const CAT_OPTS = ['IdeaPad', 'Yoga', 'LOQ', 'Legion', 'Monitor'];
const RAM_OPTS = ['8GB', '16GB', '24GB', '32GB', 'Other'];
const GPU_OPTS = ['RTX 3050', 'RTX 4050', 'RTX 5050', 'RTX 5060', 'RTX 5070', 'RTX 5070 Ti', 'RTX 5080', 'Integrated', 'Other'];
const GPU_TIER = { 'Integrated': 0, 'RTX 3050': 1, 'RTX 4050': 2, 'RTX 5050': 2.5, 'RTX 5060': 3.5, 'RTX 5070': 4.5, 'RTX 5070 Ti': 5.2, 'RTX 5080': 6 };

/* ================= IndexedDB (key/value) ================= */
const idb = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      if (!('indexedDB' in window)) return rej(new Error('no idb'));
      const r = indexedDB.open('iontech-lenovo-catalog', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => { this._db = r.result; res(r.result); };
      r.onerror = () => rej(r.error);
    });
  },
  async get(k) { try { const db = await this.open(); return await new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); } catch (_) { return ls.get('idb.' + k, undefined); } },
  async set(k, v) { try { const db = await this.open(); await new Promise((res, rej) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); } catch (_) { ls.set('idb.' + k, v); } }
};

const ADMIN_MODE = window.CATALOG_ADMIN === true; // only true in the private Admin Tool copy

const DISCLAIMER = 'For internal sales and authorized dealer reference only. Pricing, product specifications, promotional offers, and availability are subject to change without prior notice. Please confirm the latest details with your Iontech sales representative prior to order placement.';

/* ================= state ================= */
const S = {
  data: null, meta: { baseVersion: null, dirty: false },
  tab: 'onhand', q: '', filters: { category: new Set(), cpu: new Set(), ram: new Set(), gpu: new Set() },
  sort: ls.get('sort', 'default'), view: ls.get('view', 'grid'),
  compare: ls.get('compare', []), recent: ls.get('recent', []),
  views: {}, priceLog: [], unseen: ls.get('unseen', 0),
  adminTab: 'products', adminQ: '', route: '', timer: null, importPreview: null
};
const P = () => (S.data && S.data.products) || [];
const byMtm = (m) => P().find(p => p.mtm === m);

async function saveCatalog() {
  await idb.set('catalog', { baseVersion: S.meta.baseVersion, dirty: S.meta.dirty, data: S.data });
}
function markEdited() {
  S.data.version = stamp();
  S.data.updatedAt = todayISO();
  S.meta.dirty = true;
  hayCache.clear();
  return saveCatalog();
}

/* ================= product helpers ================= */
const promoActive = (p) => !!(p.promoSrp && (!p.promoUntil || todayISO() <= p.promoUntil));
const effPrice = (p) => promoActive(p) ? p.promoSrp : (p.srp || 0);
const statusLabel = (p) => p.status === 'incoming' ? 'Incoming' : 'Onhand';
const specVal = (p, name) => { const s = (p.specs || []).find(x => x[0] === name); return s ? s[1] : ''; };
const ramKey = (p) => p.category === 'Monitor' || !p.ram ? null : ([8, 16, 24, 32].includes(p.ram) ? p.ram + 'GB' : 'Other');
const gpuKey = (p) => p.category === 'Monitor' || !p.gpu ? null : (GPU_OPTS.includes(p.gpu) ? p.gpu : 'Other');
const cpuKey = (p) => p.cpuBrand || null;
const thumb = (p) => (p.images && p.images[0]) || '';
const isLaptop = (p) => p.category !== 'Monitor';
const shareUrl = (p) => location.href.split('#')[0] + '#/p/' + encodeURIComponent(p.mtm);

const hayCache = new Map();
function hay(p) {
  let h = hayCache.get(p);
  if (!h) {
    const t = [p.mtm, p.model, p.name, p.category, p.cpu, p.cpuBrand, p.gpu, p.gpuDetail, p.quickSpecs, p.color, p.bundle, statusLabel(p),
      ramKey(p) || '', (p.specs || []).map(s => s[1]).join(' ')].join(' ').toLowerCase();
    h = { t, n: t.replace(/[\s\-_]/g, '') };
    hayCache.set(p, h);
  }
  return h;
}
function matches(p, q) {
  if (!q) return true;
  const h = hay(p);
  return q.toLowerCase().split(/\s+/).filter(Boolean).every(tok => h.t.includes(tok) || h.n.includes(tok.replace(/[\s\-_]/g, '')));
}
function passFilters(p, skip) {
  const f = S.filters;
  if (skip !== 'category' && f.category.size && !f.category.has(p.category)) return false;
  if (skip !== 'cpu' && f.cpu.size && !f.cpu.has(cpuKey(p))) return false;
  if (skip !== 'ram' && f.ram.size && !f.ram.has(ramKey(p))) return false;
  if (skip !== 'gpu' && f.gpu.size && !f.gpu.has(gpuKey(p))) return false;
  return true;
}
const inTab = (p, tab) => tab === 'all' || p.status === tab;
function sortList(list) {
  const catIdx = (c) => { const i = CAT_OPTS.indexOf(c); return i < 0 ? 99 : i; };
  const s = S.sort, a = list.slice();
  const cmp = {
    'price-asc': (x, y) => effPrice(x) - effPrice(y),
    'price-desc': (x, y) => effPrice(y) - effPrice(x),
    'category': (x, y) => catIdx(x.category) - catIdx(y.category) || effPrice(x) - effPrice(y),
    'newest': (x, y) => String(y.added || '').localeCompare(String(x.added || '')) || (y.order ?? 0) - (x.order ?? 0),
    'availability': (x, y) => (x.status === 'onhand' ? 0 : 1) - (y.status === 'onhand' ? 0 : 1) || (x.order ?? 0) - (y.order ?? 0),
    'default': (x, y) => (x.order ?? 0) - (y.order ?? 0)
  }[s] || ((x, y) => (x.order ?? 0) - (y.order ?? 0));
  return a.sort(cmp);
}

/* ================= UI utilities ================= */
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}
async function copyText(text, msg = 'Copied to clipboard') {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch (_) {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast(msg); } catch (e) { toast('Copy failed'); }
    ta.remove();
  }
}
function openModal(html, opts = {}) {
  const m = $('#modal'), c = $('#modalCard');
  c.innerHTML = html; c.style.maxWidth = opts.width || '';
  m.hidden = false; document.body.style.overflow = 'hidden';
  const f = c.querySelector('[autofocus]'); if (f) setTimeout(() => f.focus(), 30);
  return c;
}
function closeModal() { $('#modal').hidden = true; $('#modalCard').innerHTML = ''; document.body.style.overflow = ''; }
function confirmBox(title, body, okLabel = 'Confirm', danger = true) {
  return new Promise(res => {
    const c = openModal(`<div class="modal-head"><h3>${esc(title)}</h3><button class="close-x" data-x>&times;</button></div>
      <div class="modal-body">${body}</div>
      <div class="modal-foot"><button class="btn" data-x>Cancel</button><button class="btn ${danger ? 'btn-red' : 'btn-dark'}" data-ok>${esc(okLabel)}</button></div>`, { width: '460px' });
    c.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { closeModal(); res(false); });
    c.querySelector('[data-ok]').onclick = () => { closeModal(); res(true); };
  });
}
function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function imgTag(src, alt, cls = '') {
  if (!src) return `<div class="img-fallback ${cls}">LENOVO</div>`;
  return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" class="${cls}" onerror="this.outerHTML='<div class=&quot;img-fallback&quot;>LENOVO</div>'">`;
}
function closeMenus() { $$('.menu').forEach(m => m.remove()); }
function popMenu(anchor, items) {
  closeMenus();
  const m = document.createElement('div'); m.className = 'menu';
  m.innerHTML = items.map((it, i) => `<button data-i="${i}">${esc(it[0])}</button>`).join('');
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect();
  const w = 230, left = Math.min(Math.max(8, r.left + window.scrollX), window.scrollX + document.documentElement.clientWidth - w - 8);
  m.style.left = left + 'px'; m.style.top = (r.bottom + window.scrollY + 4) + 'px';
  if (r.bottom + 170 > window.innerHeight) m.style.top = (r.top + window.scrollY - m.offsetHeight - 4) + 'px';
  m.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; items[+b.dataset.i][1](); closeMenus(); };
  setTimeout(() => document.addEventListener('click', closeMenus, { once: true }), 0);
}

/* ================= copy text ================= */
function productText(p, withDP) {
  const L = [];
  L.push(`${p.model}${p.name && p.name !== p.model ? ' (' + p.name + ')' : ''}`);
  L.push(`MTM: ${p.mtm}`);
  L.push(`Category: ${p.category}`);
  if (p.quickSpecs) L.push(`Specs: ${p.quickSpecs}`);
  if (p.color) L.push(`Color: ${p.color}`);
  if (promoActive(p)) { L.push(`SRP: ${peso(p.srp)}`); L.push(`Promo SRP: ${peso(p.promoSrp)}${p.promoUntil ? ' (until ' + p.promoUntil + ')' : ''}`); }
  else L.push(`SRP: ${peso(p.srp)}`);
  if (withDP) L.push(`DP: ${peso(p.dp)}`);
  if (p.bundle) L.push(`Bundle: ${p.bundle}`);
  L.push(`Availability: ${statusLabel(p)}${p.status === 'incoming' && p.eta ? ' (ETA ' + p.eta + ')' : ''}`);
  if (p.psrefUrl) L.push(`Full specs: ${p.psrefUrl}`);
  return L.join('\n');
}
const quickSpecsLine = (p) => (p.quickSpecs || '').split('|').map(s => s.trim()).filter(Boolean).join(' | ');
function quickCopyText(p) {
  const L = [`${p.model} (${p.mtm})`, quickSpecsLine(p)];
  L.push(promoActive(p) ? `SRP: ${peso(p.srp)} | Promo SRP: ${peso(p.promoSrp)} | DP: ${peso(p.dp)}` : `SRP: ${peso(p.srp)} | DP: ${peso(p.dp)}`);
  return L.filter(Boolean).join('\n');
}
function specsCopyText(p) {
  // Spec name and value separated by a tab (pastes into Excel as two columns); multi-line values get one line each.
  const L = [`${p.name || p.model} (${p.mtm})`];
  (p.specs || []).forEach(([n, val]) => String(val).split('\n').forEach((line, i) => L.push((i ? '' : n) + '\t' + line)));
  return L.join('\n');
}
function copyMenu(anchor, p) {
  popMenu(anchor, [
    ['Copy details (with DP)', () => copyText(productText(p, true))],
    ['Copy for customer (no DP)', () => copyText(productText(p, false))],
    ['Copy MTM only', () => copyText(p.mtm, 'MTM copied')],
    ['Copy share link', () => copyText(shareUrl(p), 'Link copied')]
  ]);
}

/* ================= card ================= */
function card(p) {
  const promo = promoActive(p), inCmp = S.compare.includes(p.mtm);
  const statusTag = p.status === 'incoming' ? `<span class="tag tag-incoming">${p.eta ? 'ETA ' + esc(fmtDate(p.eta)) : 'Incoming'}</span>` : (S.q ? '<span class="tag tag-onhand">Onhand</span>' : '');
  return `<article class="card" data-mtm="${esc(p.mtm)}">
    <a class="card-img" href="#/p/${encodeURIComponent(p.mtm)}" aria-label="${esc(p.model)} details">${imgTag(thumb(p), p.model)}
      <div class="card-badges"><span class="tag tag-cat">${esc(p.category)}</span>${statusTag}${promo ? '<span class="tag tag-promo">Promo</span>' : ''}</div></a>
    <div class="card-body">
      <a class="card-title" href="#/p/${encodeURIComponent(p.mtm)}" title="${esc(p.model)}">${esc(p.model)}</a>
      <span class="mtm" data-copy-mtm="${esc(p.mtm)}" title="Copy MTM">${esc(p.mtm)} ${ICON.copy}</span>
      <div class="qs-text" title="${esc(quickSpecsLine(p))}">${esc(quickSpecsLine(p))}</div>
      <div class="bundle">${p.bundle ? ICON.gift + `<span title="${esc(p.bundle)}">${esc(p.bundle)}</span>` : ''}</div>
      <div class="prices">
        <div class="price${promo ? ' promo' : ''}"><span class="lbl">${promo ? 'Promo SRP <s>' + peso(p.srp) + '</s>' : 'SRP'}</span><span class="val">${peso(promo ? p.promoSrp : p.srp)}</span></div>
        <div class="price dp"><span class="lbl">DP</span><span class="val">${peso(p.dp)}</span></div>
      </div>
    </div>
    <div class="card-actions">
      <button class="btn btn-sm" data-quickcopy="${esc(p.mtm)}" title="Copy model, MTM, specs and prices">${ICON.copy.replace('<svg', '<svg class="ico" style="width:15px;height:15px"')} Copy</button>
      <button class="btn btn-sm cmp-toggle ${inCmp ? 'on' : ''}" data-cmp="${esc(p.mtm)}">${inCmp ? '✓ Added' : '+ Compare'}</button>
    </div>
  </article>`;
}
function fmtDate(d) { try { return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (_) { return d; } }

/* ================= catalog view ================= */
function renderCatalog() {
  const v = $('#view');
  const all = P();
  const q = S.q.trim();
  const counts = { onhand: 0, incoming: 0, all: 0 };
  all.forEach(p => { if (matches(p, q) && passFilters(p)) { counts[p.status] = (counts[p.status] || 0) + 1; counts.all++; } });
  const base = all.filter(p => inTab(p, S.tab) && matches(p, q));
  const list = sortList(base.filter(p => passFilters(p)));
  const otherTab = S.tab === 'onhand' ? 'incoming' : S.tab === 'incoming' ? 'onhand' : null;
  const otherN = otherTab ? counts[otherTab] : 0;

  const opt = (key, value, label) => {
    const n = base.filter(p => passFilters(p, key) && ({ category: p.category, cpu: cpuKey(p), ram: ramKey(p), gpu: gpuKey(p) }[key]) === value).length;
    return `<label class="fopt ${n ? '' : 'zero'}"><input type="checkbox" data-f="${key}" value="${esc(value)}" ${S.filters[key].has(value) ? 'checked' : ''}> ${esc(label || value)} <span class="n">${n}</span></label>`;
  };
  const cats = [...new Set([...CAT_OPTS, ...all.map(p => p.category)])];
  const activeChips = Object.entries(S.filters).flatMap(([k, set]) => [...set].map(v => `<button class="chip" data-unf="${k}" data-v="${esc(v)}"><b>${{ category: 'Category', cpu: 'CPU', ram: 'RAM', gpu: 'GPU' }[k]}:</b> ${esc(v)} ✕</button>`));
  const recent = S.recent.map(byMtm).filter(Boolean).slice(0, 8);

  v.innerHTML = `
    <div class="tabs" role="tablist">
      <a class="tab ${S.tab === 'onhand' ? 'active' : ''}" href="#/onhand" role="tab">Onhand<span class="count">${counts.onhand || 0}</span></a>
      <a class="tab ${S.tab === 'incoming' ? 'active' : ''}" href="#/incoming" role="tab">Incoming<span class="count">${counts.incoming || 0}</span></a>
    </div>
    ${recent.length && !q ? `<section class="recent"><div class="section-title" style="margin-top:0"><h3>Recently viewed</h3><button class="btn btn-sm btn-ghost" id="clearRecent">Clear</button></div>
      <div class="recent-row">${recent.map(p => `<a class="recent-item" href="#/p/${encodeURIComponent(p.mtm)}">${imgTag(thumb(p), p.model)}<div><div class="t">${esc(p.model)}</div><div class="m">${esc(p.mtm)} · ${peso(effPrice(p))}</div></div></a>`).join('')}</div></section>` : ''}
    <div class="catalog">
      <aside class="filters" id="filters" aria-label="Filters">
        <div class="filters-head"><h3>Filters</h3><div><button class="btn btn-sm btn-ghost" id="resetF">Reset</button><button class="btn btn-sm filter-btn" id="closeF">Done</button></div></div>
        <div class="fgroup"><h4>Product Category</h4>${cats.map(c => opt('category', c)).join('')}</div>
        <div class="fgroup"><h4>CPU Brand</h4>${opt('cpu', 'AMD')}${opt('cpu', 'Intel')}</div>
        <div class="fgroup"><h4>Memory (RAM)</h4>${RAM_OPTS.map(r => opt('ram', r, r === 'Other' ? 'Other configurations' : r)).join('')}</div>
        <div class="fgroup"><h4>Graphics (GPU)</h4>${GPU_OPTS.map(g => opt('gpu', g, g === 'Integrated' ? 'Integrated Graphics' : g === 'Other' ? 'Other GPU options' : g)).join('')}</div>
      </aside>
      <section>
        <div class="toolbar">
          <button class="btn btn-sm filter-btn" id="openF"><svg class="ico" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M3 5h18v2H3zm4 6h10v2H7zm3 6h4v2h-4z"/></svg> Filters${activeChips.length ? ' (' + activeChips.length + ')' : ''}</button>
          <span class="result-count">${list.length} product${list.length === 1 ? '' : 's'}</span>
          <span class="spacer"></span>
          <button class="btn btn-sm" id="exportBtn" title="Download all models"><svg class="ico" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg> Export</button>
          <select id="sortSel" aria-label="Sort by">
            ${[['default', 'Sort: Price list order'], ['price-asc', 'Price: Low to High'], ['price-desc', 'Price: High to Low'], ['category', 'Category'], ['newest', 'Newest Arrival'], ['availability', 'Availability']].map(([k, l]) => `<option value="${k}" ${S.sort === k ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
          <button class="btn btn-sm ${S.view === 'grid' ? 'on' : ''}" data-view="grid" aria-label="Grid view" title="Grid view">▦</button>
          <button class="btn btn-sm ${S.view === 'list' ? 'on' : ''}" data-view="list" aria-label="List view" title="List view">☰</button>
        </div>
        ${activeChips.length ? `<div class="chips" style="margin-bottom:12px">${activeChips.join('')}</div>` : ''}
        ${q && otherN ? `<div class="search-note">${otherN} more match${otherN === 1 ? '' : 'es'} for “${esc(q)}” in <a href="#/${otherTab}">${otherTab === 'incoming' ? 'Incoming' : 'Onhand'}</a>.</div>` : ''}
        ${list.length ? `<div class="grid ${S.view}">${list.map(card).join('')}</div>`
          : `<div class="empty"><h3>No products found</h3><p>${q ? 'Try a different search term, or ' : ''}clear some filters.</p><button class="btn" id="resetF2">Clear search &amp; filters</button></div>`}
      </section>
    </div>`;

  v.querySelectorAll('[data-f]').forEach(cb => cb.onchange = () => {
    const set = S.filters[cb.dataset.f]; cb.checked ? set.add(cb.value) : set.delete(cb.value);
    const open = $('#filters').classList.contains('open'); renderCatalog(); if (open) openFilters();
  });
  v.querySelectorAll('[data-unf]').forEach(b => b.onclick = () => { S.filters[b.dataset.unf].delete(b.dataset.v); renderCatalog(); });
  const reset = () => { Object.values(S.filters).forEach(s => s.clear()); S.q = ''; $('#search').value = ''; syncSearchClear(); renderCatalog(); };
  $('#resetF').onclick = () => { Object.values(S.filters).forEach(s => s.clear()); renderCatalog(); };
  if ($('#resetF2')) $('#resetF2').onclick = reset;
  $('#sortSel').onchange = (e) => { S.sort = e.target.value; ls.set('sort', S.sort); renderCatalog(); };
  v.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { S.view = b.dataset.view; ls.set('view', S.view); renderCatalog(); });
  $('#openF').onclick = openFilters;
  $('#exportBtn').onclick = (e) => { e.stopPropagation(); popMenu(e.currentTarget, [['Excel (.xlsx) - all models', exportAllExcel], ['PDF - all models', exportAllPdf]]); };
  $('#closeF').onclick = closeFilters;
  if ($('#clearRecent')) $('#clearRecent').onclick = () => { S.recent = []; ls.set('recent', []); renderCatalog(); };
}
function openFilters() {
  $('#filters').classList.add('open');
  if (!$('.filter-backdrop')) { const b = document.createElement('div'); b.className = 'filter-backdrop'; b.onclick = closeFilters; document.body.appendChild(b); }
}
function closeFilters() { const f = $('#filters'); if (f) f.classList.remove('open'); $$('.filter-backdrop').forEach(b => b.remove()); }

/* ================= compare tray ================= */
function toggleCompare(mtm) {
  const i = S.compare.indexOf(mtm);
  if (i >= 0) S.compare.splice(i, 1);
  else { if (S.compare.length >= 4) { toast('You can compare up to 4 models'); return; } S.compare.push(mtm); }
  ls.set('compare', S.compare);
  updateCompareUI();
}
function updateCompareUI() {
  const n = S.compare.length;
  [['#navCompareCount', n], ['#bnCompareCount', n]].forEach(([s, c]) => { const e = $(s); e.hidden = !c; e.textContent = c; });
  $$('[data-cmp]').forEach(b => { const on = S.compare.includes(b.dataset.cmp); b.classList.toggle('on', on); b.textContent = on ? '✓ Added' : '+ Compare'; });
  const tray = $('#compareTray');
  const show = !!n && S.route !== 'compare' && S.route !== 'admin';
  document.body.classList.toggle('has-tray', show);
  if (!show) { tray.hidden = true; return; }
  tray.hidden = false;
  tray.innerHTML = `<div class="slots">${S.compare.map(m => { const p = byMtm(m); return p ? `<span class="slot">${esc(p.model)}<button data-rmcmp="${esc(m)}" aria-label="Remove">&times;</button></span>` : ''; }).join('')}</div>
    <a class="btn btn-sm btn-red" href="#/compare">Compare ${n}/4</a>`;
  tray.querySelectorAll('[data-rmcmp]').forEach(b => b.onclick = () => toggleCompare(b.dataset.rmcmp));
}

/* ================= detail view ================= */
function trackView(p) {
  S.recent = [p.mtm, ...S.recent.filter(m => m !== p.mtm)].slice(0, 12); ls.set('recent', S.recent);
  S.views[p.mtm] = (S.views[p.mtm] || 0) + 1; idb.set('views', S.views);
}
function alternatives(p) {
  const pr = effPrice(p) || 1;
  return P().filter(x => x.mtm !== p.mtm && isLaptop(x) === isLaptop(p)).map(x => {
    let s = 0; const why = [];
    if (x.category === p.category) s += 2;
    const d = (effPrice(x) - pr) / pr; s += Math.max(0, 3 - Math.abs(d) * 10);
    if (isLaptop(p)) {
      const gt = Math.abs((GPU_TIER[x.gpu] ?? 1) - (GPU_TIER[p.gpu] ?? 1)); s += Math.max(0, 2 - gt);
      if (x.ram === p.ram) s += 1;
      if (x.cpuBrand === p.cpuBrand) s += .5;
      if (x.gpu === p.gpu) why.push('same ' + (x.gpu === 'Integrated' ? 'integrated graphics' : x.gpu));
      else if ((GPU_TIER[x.gpu] ?? 0) > (GPU_TIER[p.gpu] ?? 0)) why.push('faster GPU (' + x.gpu + ')');
      if (x.ram && x.ram !== p.ram) why.push(x.ram + 'GB RAM');
    }
    if (x.status === 'onhand') s += .7;
    const diff = effPrice(x) - effPrice(p);
    why.unshift(diff === 0 ? 'same price' : (diff < 0 ? peso(-diff) + ' cheaper' : peso(diff) + ' more'));
    why.push(statusLabel(x).toLowerCase());
    return { x, s, why: why.join(' · ') };
  }).sort((a, b) => b.s - a.s).slice(0, 4);
}
function renderDetail(mtm) {
  const p = byMtm(mtm), v = $('#view');
  if (!p) { v.innerHTML = `<div class="empty"><h3>Product not found</h3><p>MTM ${esc(mtm)} isn't in the current price list.</p><a class="btn" href="#/onhand">Back to catalog</a></div>`; return; }
  trackView(p);
  const promo = promoActive(p), imgs = p.images && p.images.length ? p.images : [''];
  const up = p.upgrade;
  const slotsVis = (total, free) => total ? `<div class="slots-vis" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<i class="${i >= total - free ? 'free' : ''}"></i>`).join('')}</div>` : '';
  let lastGroup = '';
  const specRows = (p.specs || []).map(([n, val]) => {
    const g = GROUPS[n]; let head = '';
    if (g && g !== lastGroup) { lastGroup = g; head = `<tr class="grp"><td colspan="2">${esc(g)}</td></tr>`; }
    return head + `<tr><th>${esc(n)}</th><td>${esc(val)}</td></tr>`;
  }).join('');
  const alts = alternatives(p);
  v.innerHTML = `
    <div class="crumbs"><a href="#/${p.status}">${statusLabel(p)}</a> › <span>${esc(p.category)}</span> › <span>${esc(p.model)}</span></div>
    <div class="detail">
      <div>
        <div class="panel">
          <div class="gallery-main" id="gal">${imgs.map((s, i) => s ? `<img src="${esc(s)}" alt="${esc(p.model)} image ${i + 1}" ${i ? 'loading="lazy"' : ''} onerror="this.style.display='none'">` : '<div class="img-fallback">LENOVO</div>').join('')}</div>
          ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((s, i) => `<button data-g="${i}" class="${i ? '' : 'active'}" aria-label="Image ${i + 1}"><img src="${esc(s)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
        </div>
      </div>
      <div class="detail-head">
        <div class="card-badges" style="position:static"><span class="tag tag-cat">${esc(p.category)}</span><span class="tag tag-${p.status}">${statusLabel(p)}</span>${promo ? '<span class="tag tag-promo">Promo</span>' : ''}</div>
        <h1>${esc(p.name && p.name !== p.model ? p.name : p.model)}</h1>
        <div class="sub">${esc(p.model)}${p.color ? ' · ' + esc(p.color) : ''}</div>
        <span class="mtm" data-copy-mtm="${esc(p.mtm)}" title="Copy MTM">MTM ${esc(p.mtm)} ${ICON.copy}</span>
        ${p.status === 'incoming' ? (p.eta ? `<div style="margin-top:12px"><div class="eta">Incoming · expected ${esc(fmtDate(p.eta))}</div><div class="countdown" id="countdown"></div></div>` : `<div class="eta" style="margin-top:12px">Incoming</div>`) : ''}
        <div class="prices ${promo ? 'cols-3' : 'cols-2'}" style="margin-top:14px">
          <div class="price"><span class="lbl">SRP</span><span class="val ${promo ? 'strike' : ''}">${peso(p.srp)}</span></div>
          ${promo ? `<div class="price promo"><span class="lbl">Promo SRP</span><span class="val">${peso(p.promoSrp)}</span>${p.promoUntil ? `<span class="small muted">until ${esc(fmtDate(p.promoUntil))}</span>` : ''}</div>` : ''}
          <div class="price dp"><span class="lbl">DP</span><span class="val">${peso(p.dp)}</span></div>
        </div>
        ${p.bundle ? `<div class="bundle" style="margin-top:10px">${ICON.gift}<span><b>Bundle:</b> ${esc(p.bundle)}</span></div>` : ''}
        <div class="qs-text" style="margin-top:10px">${esc(quickSpecsLine(p))}</div>
        <div class="btn-row">
          <button class="btn btn-red" id="dCopy">${ICON.copy.replace('<svg', '<svg class="ico" style="width:16px;height:16px"')} Copy specs &amp; prices</button>
          <button class="btn cmp-toggle ${S.compare.includes(p.mtm) ? 'on' : ''}" data-cmp="${esc(p.mtm)}">${S.compare.includes(p.mtm) ? '✓ Added' : '+ Compare'}</button>
          <button class="btn" id="dShare">Share / QR</button>
        </div>
        <h3 style="margin-top:20px">Additional resources</h3>
        <div class="res-links">
          ${p.psrefUrl ? `<a class="res-link" href="${esc(p.psrefUrl)}" target="_blank" rel="noopener">${ICON.doc}<span>Full product specifications sheet<small>Lenovo PSREF</small></span></a>` : ''}
          ${p.specSheet && p.specSheet.data ? `<a class="res-link" href="#" id="dLocalPdf">${ICON.pdf}<span>${esc(p.specSheet.name || 'Specification sheet')}<small>Uploaded spec sheet · available offline</small></span></a>` : ''}
          ${p.datasheetUrl ? `<a class="res-link" href="${esc(p.datasheetUrl)}" target="_blank" rel="noopener">${ICON.pdf}<span>PDF datasheet download<small>Lenovo marketing datasheet</small></span></a>` : ''}
        </div>
      </div>
    </div>
    ${up ? `<div class="section-title"><h2>Upgradeability</h2></div>
    <div class="panel">
      <div class="upg">
        <div class="upg-box"><h4>${ICON.ram} RAM configuration</h4>${slotsVis(up.ramSlots, up.ramSlotsFree)}
          <dl class="kv"><dt>Installed</dt><dd>${esc(up.ramInstalled)}</dd><dt>Slots</dt><dd>${up.ramSlots ? `${up.ramSlotsFree} of ${up.ramSlots} free` : 'None (soldered)'}</dd><dt>Maximum</dt><dd>${esc(up.ramMax)}</dd></dl></div>
        <div class="upg-box"><h4>${ICON.ssd} SSD configuration</h4>${slotsVis(up.ssdSlots, up.ssdSlotsFree)}
          <dl class="kv"><dt>Installed</dt><dd>${esc(up.ssdInstalled)}</dd><dt>Slots</dt><dd>${up.ssdSlots ? `${up.ssdSlotsFree} of ${up.ssdSlots} free` : '—'}</dd><dt>Maximum</dt><dd>${esc(up.ssdMax)}</dd></dl></div>
      </div>
      ${up.recommendation ? `<div class="rec">${ICON.bulb}<div><b>Upgrade recommendation:</b> ${esc(up.recommendation)}</div></div>` : ''}
    </div>` : ''}
    ${alts.length ? `<section class="alts"><div class="section-title"><h2>Suggested alternatives</h2><span class="small muted">Matched on category, price, GPU and memory</span></div>
      <div class="alt-grid">${alts.map(a => `<a class="alt" href="#/p/${encodeURIComponent(a.x.mtm)}">${imgTag(thumb(a.x), a.x.model)}<div><b>${esc(a.x.model)}</b><div class="small">${peso(effPrice(a.x))}</div><div class="why">${esc(a.why)}</div></div></a>`).join('')}</div></section>` : ''}
    ${specRows ? `<div class="section-title"><h2>Complete specifications</h2><button class="btn btn-sm" id="copySpecs">Copy specs</button></div>
      <div class="panel" style="padding:0;overflow:hidden"><table class="specs-table">${specRows}</table></div>` : ''}
  `;
  const gal = $('#gal');
  v.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { gal.scrollTo({ left: gal.clientWidth * +b.dataset.g, behavior: 'smooth' }); });
  gal.addEventListener('scroll', () => { const i = Math.round(gal.scrollLeft / gal.clientWidth); v.querySelectorAll('[data-g]').forEach(b => b.classList.toggle('active', +b.dataset.g === i)); }, { passive: true });
  $('#dCopy').onclick = () => copyText(quickCopyText(p), 'Specs, SRP and DP copied');
  $('#dShare').onclick = () => shareModal(p);
  if ($('#copySpecs')) $('#copySpecs').onclick = () => copyText(specsCopyText(p), 'Specifications copied');
  if ($('#dLocalPdf')) $('#dLocalPdf').onclick = (e) => { e.preventDefault(); openDataUrl(p.specSheet.data); };
  if ($('#countdown')) startCountdown(p.eta);
  window.scrollTo(0, 0);
}
function openDataUrl(dataUrl) {
  fetch(dataUrl).then(r => r.blob()).then(b => { const u = URL.createObjectURL(b); window.open(u, '_blank'); });
}
function startCountdown(eta) {
  const el = $('#countdown'); if (!el) return;
  const tick = () => {
    const ms = new Date(eta + 'T00:00:00').getTime() - Date.now();
    if (ms <= 0) { el.innerHTML = '<div><b>Due</b><span>arriving</span></div>'; return; }
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
    el.innerHTML = `<div><b>${d}</b><span>days</span></div><div><b>${h}</b><span>hours</span></div><div><b>${m}</b><span>mins</span></div>`;
  };
  tick(); S.timer = setInterval(tick, 30000);
}

/* ================= share / QR ================= */
function qrSvg(text) {
  const { QRCode, QRErrorCorrectLevel } = window.QRCodeLib;
  const q = new QRCode(-1, QRErrorCorrectLevel.M); q.addData(text); q.make();
  const n = q.getModuleCount(), pad = 2; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + pad},${r + pad}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + pad * 2} ${n + pad * 2}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
}
function shareModal(p) {
  const url = shareUrl(p); const svg = qrSvg(url);
  const c = openModal(`<div class="modal-head"><h3>Share ${esc(p.model)}</h3><button class="close-x" data-x>&times;</button></div>
    <div class="modal-body"><div class="qr">${svg}</div>
      <p class="small muted" style="text-align:center;margin:0 0 12px">Scan to open this product on another device.</p>
      <div style="display:flex;gap:8px"><input type="text" readonly value="${esc(url)}" id="shareUrl"><button class="btn btn-dark" id="shCopy">Copy link</button></div>
      <div class="btn-row">${navigator.share ? '<button class="btn btn-red" id="shNative">Share…</button>' : ''}<button class="btn" id="shQr">Download QR</button><button class="btn" id="shText">Copy specs &amp; prices</button></div>
    </div>`, { width: '420px' });
  c.querySelector('[data-x]').onclick = closeModal;
  $('#shCopy').onclick = () => copyText(url, 'Link copied');
  $('#shText').onclick = () => copyText(productText(p, false) + '\n' + url);
  $('#shQr').onclick = () => download(new Blob([svg], { type: 'image/svg+xml' }), `${p.mtm}-qr.svg`);
  if ($('#shNative')) $('#shNative').onclick = () => navigator.share({ title: p.model, text: productText(p, false), url }).catch(() => {});
}

/* ================= compare view ================= */
function renderCompare() {
  const v = $('#view');
  const items = S.compare.map(byMtm).filter(Boolean);
  const hasMon = items.some(p => !isLaptop(p)), hasLap = items.some(isLaptop);
  const rows = [
    ['Availability', p => statusLabel(p) + (p.eta ? ' · ETA ' + p.eta : '')],
    ['Category', p => p.category],
    ['SRP', p => peso(p.srp)],
    ...(items.some(promoActive) ? [['Promo SRP', p => promoActive(p) ? peso(p.promoSrp) : '—']] : []),
    ['DP', p => peso(p.dp)],
    ['Bundle', p => p.bundle || '—'],
    ...(hasLap ? [
      ['Processor', p => specVal(p, 'Processor') || p.cpu || '—'],
      ['Graphics', p => p.gpuDetail || '—'],
      ['Memory', p => specVal(p, 'Memory') || '—'],
      ['Max memory', p => p.upgrade ? p.upgrade.ramMax : '—'],
      ['Free RAM slots', p => p.upgrade ? (p.upgrade.ramSlots ? `${p.upgrade.ramSlotsFree} of ${p.upgrade.ramSlots}` : 'Soldered') : '—'],
      ['Storage', p => specVal(p, 'Storage') || '—'],
      ['Max storage', p => p.upgrade ? p.upgrade.ssdMax : '—'],
      ['Free SSD slots', p => p.upgrade ? `${p.upgrade.ssdSlotsFree} of ${p.upgrade.ssdSlots}` : '—'],
      ['Battery', p => specVal(p, 'Battery') || '—'],
      ['Keyboard', p => specVal(p, 'Keyboard') || '—'],
      ['Wireless', p => specVal(p, 'WLAN + Bluetooth') || '—'],
      ['Operating system', p => specVal(p, 'Operating System') || '—'],
      ['Software', p => specVal(p, 'Bundled Software') || '—'],
    ] : []),
    ['Display', p => p.display || '—'],
    ...(hasMon ? [
      ['Panel', p => specVal(p, 'Panel') || '—'], ['Resolution', p => specVal(p, 'Resolution') || '—'],
      ['Refresh rate', p => specVal(p, 'Refresh Rate') || '—'], ['Response time', p => specVal(p, 'Response Time') || '—'],
      ['Stand', p => specVal(p, 'Stand') || '—'],
    ] : []),
    ['Ports', p => specVal(p, 'Standard Ports') || specVal(p, 'Rear Ports') || '—'],
    ['Weight', p => specVal(p, 'Weight') || '—'],
    ['Warranty', p => [specVal(p, 'Base Warranty'), specVal(p, 'Included Upgrade')].filter(x => x && x !== 'None').join('\n+ ') || '—'],
    ['Color', p => p.color || specVal(p, 'Case Color') || '—'],
  ];
  const onlyDiff = ls.get('cmpOnlyDiff', false);
  const avail = P().filter(p => !S.compare.includes(p.mtm));
  v.innerHTML = `<div class="section-title" style="margin-top:0"><h1>Quick Compare</h1>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${items.length < 4 ? `<select id="cmpAdd" style="width:auto"><option value="">+ Add a model…</option>${avail.map(p => `<option value="${esc(p.mtm)}">${esc(p.model)} — ${esc(p.mtm)}</option>`).join('')}</select>` : ''}
      ${items.length ? `<label class="fopt" style="margin:0"><input type="checkbox" id="onlyDiff" ${onlyDiff ? 'checked' : ''}> Only differences</label><button class="btn btn-sm" id="cmpCopy">Copy table</button><button class="btn btn-sm btn-ghost" id="cmpClear">Clear all</button>` : ''}</div></div>
    ${items.length ? `<div class="cmp-wrap"><table class="cmp">
      <thead><tr><th></th>${items.map(p => `<td><button class="rm" data-rmcmp="${esc(p.mtm)}" aria-label="Remove">&times;</button>${imgTag(thumb(p), p.model)}<a href="#/p/${encodeURIComponent(p.mtm)}"><b>${esc(p.model)}</b></a><div class="small muted">${esc(p.mtm)}</div></td>`).join('')}</tr></thead>
      <tbody>${rows.map(([label, fn]) => { const vals = items.map(p => String(fn(p))); const diff = items.length > 1 && new Set(vals).size > 1; if (onlyDiff && !diff) return ''; return `<tr class="${diff ? 'diff' : ''}"><th>${esc(label)}</th>${vals.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`; }).join('')}</tbody>
    </table></div><p class="small muted">Highlighted rows differ between models.</p>`
      : `<div class="empty"><h3>No models selected</h3><p>Tap “+ Compare” on up to 4 products, or add one above.</p><a class="btn" href="#/onhand">Browse catalog</a></div>`}`;
  v.querySelectorAll('[data-rmcmp]').forEach(b => b.onclick = () => { toggleCompare(b.dataset.rmcmp); renderCompare(); });
  if ($('#cmpAdd')) $('#cmpAdd').onchange = (e) => { if (e.target.value) { toggleCompare(e.target.value); renderCompare(); } };
  if ($('#onlyDiff')) $('#onlyDiff').onchange = (e) => { ls.set('cmpOnlyDiff', e.target.checked); renderCompare(); };
  if ($('#cmpClear')) $('#cmpClear').onclick = () => { S.compare = []; ls.set('compare', []); updateCompareUI(); renderCompare(); };
  if ($('#cmpCopy')) $('#cmpCopy').onclick = () => copyText(['Spec\t' + items.map(p => p.model + ' (' + p.mtm + ')').join('\t'), ...rows.map(([l, fn]) => l + '\t' + items.map(p => String(fn(p)).replace(/\n/g, '; ')).join('\t'))].join('\n'), 'Comparison copied (paste into Excel)');
}

/* ================= change log line ================= */
function logLine(e) {
  if (e.type === 'new') return `<div><b>New:</b> ${esc(e.name)} <span class="muted">(${esc(e.mtm)})</span> <span class="small muted">· ${esc(e.date)}</span></div>`;
  if (e.type === 'removed') return `<div><b>Removed:</b> ${esc(e.name)} <span class="muted">(${esc(e.mtm)})</span> <span class="small muted">· ${esc(e.date)}</span></div>`;
  if (e.type === 'status') return `<div><b>${esc(e.name)}</b> is now <b>${esc(e.to)}</b> <span class="small muted">· ${esc(e.date)}</span></div>`;
  const up = (e.to || 0) > (e.from || 0);
  return `<div><b>${esc(e.name)}</b> <span class="muted">${esc(e.mtm)}</span><br>${esc(e.field)}: ${peso(e.from)} → <b class="${up ? 'up' : 'down'}">${peso(e.to)}</b> <span class="small muted">· ${esc(e.date)}</span></div>`;
}

/* ================= price change detection ================= */
function diffCatalog(oldD, newD) {
  const out = [], date = todayISO();
  const om = new Map((oldD.products || []).map(p => [p.mtm, p]));
  const nm = new Map((newD.products || []).map(p => [p.mtm, p]));
  for (const [m, n] of nm) {
    const o = om.get(m);
    if (!o) { out.push({ type: 'new', mtm: m, name: n.model, date }); continue; }
    [['srp', 'SRP'], ['promoSrp', 'Promo SRP'], ['dp', 'DP']].forEach(([k, label]) => {
      if ((num(o[k]) || null) !== (num(n[k]) || null)) out.push({ type: 'price', mtm: m, name: n.model, field: label, from: o[k], to: n[k], date });
    });
    if (o.status !== n.status) out.push({ type: 'status', mtm: m, name: n.model, to: statusLabel(n), date });
  }
  for (const [m, o] of om) if (!nm.has(m)) out.push({ type: 'removed', mtm: m, name: o.model, date });
  return out;
}
async function recordChanges(changes, notify) {
  if (!changes.length) return;
  S.priceLog = [...changes, ...S.priceLog].slice(0, 200); await idb.set('priceLog', S.priceLog);
  S.unseen += changes.length; ls.set('unseen', S.unseen); updateBell();
  if (notify) {
    const prices = changes.filter(c => c.type === 'price').length;
    const msg = `${prices} price update${prices === 1 ? '' : 's'}${changes.length - prices ? ', ' + (changes.length - prices) + ' other change' + (changes.length - prices === 1 ? '' : 's') : ''}`;
    toast('Price list updated: ' + msg);
    try {
      if ('Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) reg.showNotification('Lenovo price list updated', { body: msg, icon: 'icons/icon-192.png', tag: 'price-update' });
      }
    } catch (_) {}
  }
}
function updateBell() { const b = $('#bellBadge'); b.hidden = !S.unseen; b.textContent = S.unseen > 99 ? '99+' : S.unseen; }
function bellModal() {
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const c = openModal(`<div class="modal-head"><h3>Price updates</h3><button class="close-x" data-x>&times;</button></div>
    <div class="modal-body"><div class="log" style="max-height:55vh">${S.priceLog.length ? S.priceLog.slice(0, 80).map(logLine).join('') : '<p class="muted">No changes yet. When a new price list is published you’ll see price, promo and availability changes here.</p>'}</div></div>
    <div class="modal-foot">${perm === 'default' ? '<button class="btn" id="enableNotif">Enable device notifications</button>' : perm === 'granted' ? '<span class="small muted" style="margin-right:auto">Device notifications are on</span>' : ''}<button class="btn btn-dark" data-x>Done</button></div>`, { width: '520px' });
  c.querySelectorAll('[data-x]').forEach(b => b.onclick = closeModal);
  if ($('#enableNotif')) $('#enableNotif').onclick = async () => { const r = await Notification.requestPermission(); toast(r === 'granted' ? 'Notifications enabled' : 'Notifications not allowed'); closeModal(); };
  S.unseen = 0; ls.set('unseen', 0); updateBell();
}

/* ================= admin ================= */
async function sha256(t) {
  if (!(window.crypto && crypto.subtle)) throw new Error('Admin sign-in needs HTTPS (or localhost).');
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
}
const isAdmin = () => ss.get('admin') === (S.data && S.data.adminPinHash);
function renderAdmin() {
  const v = $('#view');
  if (!isAdmin()) {
    v.innerHTML = `<div class="login"><h1 style="margin-bottom:6px">Admin sign-in</h1><p class="muted">Enter the admin PIN to manage products, prices and shipments.</p>
      <form class="panel" id="loginF"><div class="field"><label class="fl" for="pin">Admin PIN</label><input type="password" id="pin" autocomplete="current-password" autofocus required></div>
      <button class="btn btn-red" style="width:100%">Sign in</button><p class="small muted" id="loginMsg" style="margin:10px 0 0"></p></form></div>`;
    $('#loginF').onsubmit = async (e) => {
      e.preventDefault();
      try { const h = await sha256($('#pin').value.trim()); if (h === S.data.adminPinHash) { ss.set('admin', h); renderAdmin(); } else { $('#loginMsg').textContent = 'Incorrect PIN.'; } }
      catch (err) { $('#loginMsg').textContent = err.message; }
    };
    setTimeout(() => $('#pin') && $('#pin').focus(), 50);
    return;
  }
  const tabs = [['products', 'Products'], ['shipments', 'Incoming shipments'], ['io', 'Import / Export'], ['settings', 'Settings']];
  v.innerHTML = `<div class="admin-top"><h1>Admin</h1><span class="spacer"></span><button class="btn btn-sm" id="lockBtn">Sign out</button></div>
    ${S.meta.dirty ? `<div class="banner" style="margin:0 0 12px"><div><b>Unpublished changes on this device.</b> Other users won't see them until you publish: download <code>products.json</code> and replace <code>data/products.json</code> on your web host.</div><button class="btn btn-sm btn-dark" id="pubBtn">Download products.json</button></div>` : ''}
    <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${S.adminTab === k ? 'active' : ''}" data-at="${k}">${l}</button>`).join('')}</div>
    <div id="adminBody"></div>`;
  v.querySelectorAll('[data-at]').forEach(b => b.onclick = () => { S.adminTab = b.dataset.at; renderAdmin(); });
  $('#lockBtn').onclick = () => { ss.set('admin', null); renderAdmin(); };
  if ($('#pubBtn')) $('#pubBtn').onclick = exportJson;
  ({ products: adminProducts, shipments: adminShipments, io: adminIO, settings: adminSettings })[S.adminTab]();
}
function adminProducts() {
  const b = $('#adminBody');
  const q = S.adminQ.toLowerCase();
  const list = sortList(P()).sort((x, y) => (x.status === y.status ? 0 : x.status === 'onhand' ? -1 : 1)).filter(p => !q || hay(p).t.includes(q));
  b.innerHTML = `<div class="toolbar"><input type="search" class="in" id="aq" placeholder="Filter products…" value="${esc(S.adminQ)}" style="max-width:320px"><span class="spacer"></span><button class="btn btn-red" id="addP">+ Add product</button></div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th></th><th>MTM</th><th>Model</th><th>Category</th><th>Status</th><th style="text-align:right">SRP</th><th style="text-align:right">Promo</th><th style="text-align:right">DP</th><th></th></tr></thead>
    <tbody>${list.map(p => `<tr><td>${imgTag(thumb(p), '')}</td><td><b>${esc(p.mtm)}</b></td><td>${esc(p.model)}</td><td>${esc(p.category)}</td><td><span class="tag tag-${p.status}">${statusLabel(p)}</span></td>
      <td class="num">${peso(p.srp)}</td><td class="num">${promoActive(p) ? peso(p.promoSrp) : (p.promoSrp ? '<span class="muted">expired</span>' : '—')}</td><td class="num">${peso(p.dp)}</td>
      <td><button class="btn btn-sm" data-edit="${esc(p.mtm)}">Edit</button> <button class="btn btn-sm btn-danger" data-del="${esc(p.mtm)}">Delete</button></td></tr>`).join('')}</tbody></table></div>
    <p class="small muted">${P().length} products.</p>`;
  $('#aq').oninput = (e) => { S.adminQ = e.target.value; const pos = e.target.selectionStart; adminProducts(); const n = $('#aq'); n.focus(); n.setSelectionRange(pos, pos); };
  $('#addP').onclick = () => editProduct(null);
  b.querySelectorAll('[data-edit]').forEach(x => x.onclick = () => editProduct(byMtm(x.dataset.edit)));
  b.querySelectorAll('[data-del]').forEach(x => x.onclick = async () => {
    const p = byMtm(x.dataset.del);
    if (await confirmBox('Delete product?', `<p>Remove <b>${esc(p.model)}</b> (${esc(p.mtm)}) from the catalog?</p>`, 'Delete')) {
      S.data.products = P().filter(y => y !== p); S.compare = S.compare.filter(m => m !== p.mtm); ls.set('compare', S.compare);
      await markEdited(); await recordChanges([{ type: 'removed', mtm: p.mtm, name: p.model, date: todayISO() }], false); toast('Product deleted'); renderAdmin();
    }
  });
}
function specsToText(specs) { return (specs || []).map(([n, v]) => n + ': ' + String(v).split('\n').join('\n  ')).join('\n'); }
function textToSpecs(t) {
  const out = [];
  String(t || '').split('\n').forEach(line => {
    if (/^\s{2,}\S/.test(line) && out.length) { out[out.length - 1][1] += '\n' + line.trim(); return; }
    const i = line.indexOf(':'); if (i < 1) return;
    out.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
  });
  return out;
}
function resizeImage(file, max = 1100) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = rej; img.src = r.result;
    };
    r.onerror = rej; r.readAsDataURL(file);
  });
}
const fileToDataUrl = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
function editProduct(p) {
  const isNew = !p;
  const d = p ? JSON.parse(JSON.stringify(p)) : { mtm: '', model: '', name: '', category: 'IdeaPad', status: 'onhand', images: [], specs: [], upgrade: null, added: todayISO() };
  const up = d.upgrade || {};
  const cats = [...new Set([...CAT_OPTS, ...P().map(x => x.category)])];
  const f = (id, label, val, type = 'text', extra = '') => `<div class="field"><label class="fl" for="${id}">${label}</label><input type="${type}" id="${id}" value="${esc(val ?? '')}" ${extra}></div>`;
  const c = openModal(`<div class="modal-head"><h3>${isNew ? 'Add product' : 'Edit ' + esc(d.model)}</h3><button class="close-x" data-x>&times;</button></div>
    <form class="modal-body" id="pf">
      <div class="grid3">
        ${f('e_mtm', 'MTM *', d.mtm, 'text', 'required')}
        <div class="field"><label class="fl" for="e_cat">Category</label><select id="e_cat">${cats.map(x => `<option ${x === d.category ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
        <div class="field"><label class="fl" for="e_status">Inventory</label><select id="e_status"><option value="onhand" ${d.status === 'onhand' ? 'selected' : ''}>On Hand</option><option value="incoming" ${d.status === 'incoming' ? 'selected' : ''}>Incoming</option></select></div>
      </div>
      <div class="grid2">${f('e_model', 'Model name *', d.model, 'text', 'required')}${f('e_name', 'Full product name', d.name)}</div>
      <div class="field"><label class="fl" for="e_qs">Key / quick specifications (separate with |)</label><input type="text" id="e_qs" value="${esc(d.quickSpecs || '')}"></div>
      <div class="grid3">${f('e_srp', 'SRP (₱)', d.srp, 'number', 'step="any" min="0"')}${f('e_promo', 'Promo SRP (₱)', d.promoSrp, 'number', 'step="any" min="0"')}${f('e_dp', 'DP (₱)', d.dp, 'number', 'step="any" min="0"')}</div>
      <div class="grid3">${f('e_promoUntil', 'Promo valid until', d.promoUntil, 'date')}${f('e_color', 'Color', d.color)}${f('e_eta', 'ETA (incoming only)', d.eta, 'date')}</div>
      <div class="grid2">${f('e_bundle', 'Bundled items', d.bundle)}${f('e_added', 'Date added (for Newest sort)', d.added, 'date')}</div>
      <h3 style="margin:8px 0 10px">Filters</h3>
      <div class="grid2">
        <div class="field"><label class="fl" for="e_cpub">CPU brand</label><select id="e_cpub"><option value="">—</option>${['AMD', 'Intel'].map(x => `<option ${x === d.cpuBrand ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        ${f('e_cpu', 'CPU', d.cpu)}
        ${f('e_ram', 'RAM (GB)', d.ram, 'number', 'min="0"')}
        <div class="field"><label class="fl" for="e_gpu">GPU</label><input type="text" id="e_gpu" list="gpuList" value="${esc(d.gpu || '')}"><datalist id="gpuList">${GPU_OPTS.map(g => `<option value="${g}">`).join('')}</datalist></div>
      </div>
      <div class="grid2">${f('e_gpud', 'GPU details', d.gpuDetail)}${f('e_disp', 'Display', d.display)}</div>
      <h3 style="margin:8px 0 10px">Links</h3>
      ${f('e_psref', 'Full specifications link (PSREF)', d.psrefUrl, 'url')}
      <div class="grid2">${f('e_ds', 'PDF datasheet link', d.datasheetUrl, 'url')}${f('e_pp', 'Lenovo product page link', d.productUrl, 'url')}</div>
      <h3 style="margin:8px 0 10px">Images</h3>
      <div class="img-list" id="imgList"></div>
      <div style="display:flex;gap:8px;margin-top:8px"><input type="url" id="imgUrl" placeholder="Paste image URL"><button type="button" class="btn" id="imgAdd">Add</button></div>
      <label class="dropzone" id="imgDrop" style="display:block;margin-top:8px">Upload images (drag & drop or tap) <input type="file" accept="image/*" multiple id="imgFile" hidden></label>
      <h3 style="margin:16px 0 10px">Specification sheet (PDF)</h3>
      <div id="sheetInfo" class="small" style="margin-bottom:6px"></div>
      <label class="dropzone" style="display:block">Upload spec sheet PDF (stored with the catalog, works offline) <input type="file" accept="application/pdf" id="sheetFile" hidden></label>
      <h3 style="margin:16px 0 10px">Upgradeability ${d.category === 'Monitor' ? '<span class="small muted">(laptops only)</span>' : ''}</h3>
      <div class="grid2">${f('u_ri', 'Installed RAM', up.ramInstalled)}${f('u_rm', 'Maximum RAM', up.ramMax)}</div>
      <div class="grid2">${f('u_rs', 'RAM slots (total)', up.ramSlots, 'number', 'min="0"')}${f('u_rf', 'RAM slots free', up.ramSlotsFree, 'number', 'min="0"')}</div>
      <div class="grid2">${f('u_si', 'Installed SSD', up.ssdInstalled)}${f('u_sm', 'Maximum storage', up.ssdMax)}</div>
      <div class="grid2">${f('u_ss', 'SSD slots (total)', up.ssdSlots, 'number', 'min="0"')}${f('u_sf', 'SSD slots free', up.ssdSlotsFree, 'number', 'min="0"')}</div>
      <div class="field"><label class="fl" for="u_rec">Upgrade recommendation</label><textarea id="u_rec" rows="2">${esc(up.recommendation || '')}</textarea></div>
      <h3 style="margin:8px 0 6px">Complete specifications</h3>
      <p class="small muted" style="margin:0 0 6px">One per line as <code>Name: value</code>. Indent a line with two spaces to continue the previous value.</p>
      <textarea id="e_specs" rows="10" style="font-family:ui-monospace,Consolas,monospace;font-size:13px">${esc(specsToText(d.specs))}</textarea>
    </form>
    <div class="modal-foot"><button class="btn" data-x>Cancel</button><button class="btn btn-red" id="saveP">${isNew ? 'Add product' : 'Save changes'}</button></div>`, { width: '820px' });
  const renderImgs = () => {
    $('#imgList').innerHTML = (d.images || []).map((s, i) => `<div class="im"><img src="${esc(s)}" alt=""><button type="button" data-rmimg="${i}" aria-label="Remove image">&times;</button></div>`).join('') || '<span class="small muted">No images.</span>';
    $$('[data-rmimg]').forEach(b => b.onclick = () => { d.images.splice(+b.dataset.rmimg, 1); renderImgs(); });
  };
  const renderSheet = () => { $('#sheetInfo').innerHTML = d.specSheet ? `Attached: <b>${esc(d.specSheet.name)}</b> <button type="button" class="btn btn-sm btn-ghost" id="rmSheet">Remove</button>` : '<span class="muted">No spec sheet uploaded.</span>'; if ($('#rmSheet')) $('#rmSheet').onclick = () => { delete d.specSheet; renderSheet(); }; };
  renderImgs(); renderSheet();
  const addFiles = async (files) => { for (const file of files) { if (!file.type.startsWith('image/')) continue; try { d.images.push(await resizeImage(file)); } catch (_) { toast('Could not read ' + file.name); } } renderImgs(); };
  $('#imgAdd').onclick = () => { const u = $('#imgUrl').value.trim(); if (u) { d.images.push(u); $('#imgUrl').value = ''; renderImgs(); } };
  $('#imgFile').onchange = (e) => addFiles(e.target.files);
  const dz = $('#imgDrop');
  dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('drag'); };
  dz.ondragleave = () => dz.classList.remove('drag');
  dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove('drag'); addFiles(e.dataTransfer.files); };
  $('#sheetFile').onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast('PDF is over 8 MB — link to it instead'); return; }
    if (file.size > 3 * 1024 * 1024) toast('Large PDF: it makes products.json bigger for everyone');
    d.specSheet = { name: file.name, data: await fileToDataUrl(file) }; renderSheet();
  };
  c.querySelectorAll('[data-x]').forEach(b => b.onclick = closeModal);
  $('#saveP').onclick = async () => {
    const val = (id) => $('#' + id).value.trim();
    const mtm = val('e_mtm').toUpperCase(), model = val('e_model');
    if (!mtm || !model) { toast('MTM and model name are required'); return; }
    if (P().some(x => x.mtm === mtm && x !== p)) { toast('Another product already uses MTM ' + mtm); return; }
    const before = p ? JSON.parse(JSON.stringify(p)) : null;
    Object.assign(d, {
      mtm, id: mtm, model, name: val('e_name') || model, category: val('e_cat'), status: val('e_status'),
      quickSpecs: val('e_qs'), srp: num(val('e_srp')) || 0, promoSrp: num(val('e_promo')), dp: num(val('e_dp')) || 0,
      promoUntil: val('e_promoUntil') || '', color: val('e_color'), eta: val('e_status') === 'incoming' ? val('e_eta') : '', bundle: val('e_bundle'), added: val('e_added') || todayISO(),
      cpuBrand: val('e_cpub'), cpu: val('e_cpu'), ram: num(val('e_ram')), gpu: val('e_gpu'), gpuDetail: val('e_gpud'), display: val('e_disp'),
      psrefUrl: val('e_psref'), datasheetUrl: val('e_ds'), productUrl: val('e_pp') || ('https://www.lenovo.com/ph/en/search?text=' + mtm),
      specs: textToSpecs($('#e_specs').value)
    });
    const u = { ramInstalled: val('u_ri'), ramMax: val('u_rm'), ramSlots: num(val('u_rs')) || 0, ramSlotsFree: num(val('u_rf')) || 0, ssdInstalled: val('u_si'), ssdMax: val('u_sm'), ssdSlots: num(val('u_ss')) || 0, ssdSlotsFree: num(val('u_sf')) || 0, recommendation: val('u_rec') };
    d.upgrade = (u.ramInstalled || u.ramMax || u.ssdInstalled || u.ssdMax) ? u : null;
    if (isNew) { d.order = Math.max(-1, ...P().map(x => x.order ?? 0)) + 1; d.views = 0; S.data.products.push(d); }
    else Object.assign(p, d);
    if (before && before.mtm !== mtm) { S.compare = S.compare.map(m => m === before.mtm ? mtm : m); ls.set('compare', S.compare); }
    await markEdited();
    await recordChanges(before ? diffCatalog({ products: [before] }, { products: [d] }).filter(x => x.type !== 'new' && x.type !== 'removed') : [{ type: 'new', mtm, name: model, date: todayISO() }], false);
    closeModal(); toast(isNew ? 'Product added' : 'Changes saved'); renderAdmin();
  };
}
function adminShipments() {
  const b = $('#adminBody');
  const inc = P().filter(p => p.status === 'incoming'), onh = P().filter(p => p.status === 'onhand');
  b.innerHTML = `<p class="muted" style="margin-top:0">Items listed here show under <b>Incoming Inventory</b>. The ETA is optional — when set, the product page shows an arrival countdown; when blank it just says “Incoming”.</p>
    <div class="table-wrap"><table class="tbl"><thead><tr><th></th><th>MTM</th><th>Model</th><th>ETA (optional)</th><th>Shipment ref / notes</th><th></th></tr></thead><tbody>
    ${inc.map(p => `<tr><td>${imgTag(thumb(p), '')}</td><td><b>${esc(p.mtm)}</b></td><td>${esc(p.model)}</td>
      <td><input type="date" data-eta="${esc(p.mtm)}" value="${esc(p.eta || '')}" style="width:160px"></td>
      <td><input type="text" data-ref="${esc(p.mtm)}" value="${esc(p.shipmentRef || '')}" placeholder="e.g. PO-1234 / container no." style="min-width:200px"></td>
      <td><button class="btn btn-sm btn-dark" data-arrive="${esc(p.mtm)}">Mark as arrived</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">No incoming items.</td></tr>'}
    </tbody></table></div>
    <div class="panel" style="margin-top:16px"><h3 style="margin-bottom:10px">Add an existing product to an incoming shipment</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><select id="toInc" style="max-width:420px"><option value="">Choose an on-hand product…</option>${onh.map(p => `<option value="${esc(p.mtm)}">${esc(p.model)} — ${esc(p.mtm)}</option>`).join('')}</select>
      <button class="btn" id="toIncBtn">Move to Incoming</button><button class="btn btn-red" id="newInc">+ New incoming product</button></div></div>`;
  b.querySelectorAll('[data-eta]').forEach(i => i.onchange = async () => { byMtm(i.dataset.eta).eta = i.value; await markEdited(); toast('ETA saved'); });
  b.querySelectorAll('[data-ref]').forEach(i => i.onchange = async () => { byMtm(i.dataset.ref).shipmentRef = i.value.trim(); await markEdited(); toast('Shipment note saved'); });
  b.querySelectorAll('[data-arrive]').forEach(x => x.onclick = async () => {
    const p = byMtm(x.dataset.arrive);
    p.status = 'onhand'; p.eta = ''; p.added = todayISO(); await markEdited();
    await recordChanges([{ type: 'status', mtm: p.mtm, name: p.model, to: 'On Hand', date: todayISO() }], false);
    toast(p.model + ' moved to On Hand'); renderAdmin();
  });
  $('#toIncBtn').onclick = async () => { const m = $('#toInc').value; if (!m) return; const p = byMtm(m); p.status = 'incoming'; await markEdited(); toast(p.model + ' moved to Incoming'); renderAdmin(); };
  $('#newInc').onclick = () => editProduct(null) || setTimeout(() => { const s = $('#e_status'); if (s) s.value = 'incoming'; }, 0);
}

/* ---------- Excel import / export ---------- */
const XCOLS = [
  ['Status', p => statusLabel(p)], ['Category', p => p.category], ['Model', p => p.model], ['MTM', p => p.mtm], ['Full Name', p => p.name],
  ['Specifications', p => p.quickSpecs], ['Color', p => p.color], ['SRP', p => p.srp], ['Promo SRP', p => p.promoSrp], ['Promo Until', p => p.promoUntil],
  ['DP', p => p.dp], ['Bundle', p => p.bundle], ['ETA', p => p.eta], ['Shipment Ref', p => p.shipmentRef], ['Date Added', p => p.added],
  ['CPU Brand', p => p.cpuBrand], ['CPU', p => p.cpu], ['RAM (GB)', p => p.ram], ['GPU', p => p.gpu], ['GPU Details', p => p.gpuDetail], ['Display', p => p.display],
  ['RAM Installed', p => p.upgrade && p.upgrade.ramInstalled], ['RAM Slots', p => p.upgrade && p.upgrade.ramSlots], ['RAM Slots Free', p => p.upgrade && p.upgrade.ramSlotsFree], ['Max RAM', p => p.upgrade && p.upgrade.ramMax],
  ['SSD Installed', p => p.upgrade && p.upgrade.ssdInstalled], ['SSD Slots', p => p.upgrade && p.upgrade.ssdSlots], ['SSD Slots Free', p => p.upgrade && p.upgrade.ssdSlotsFree], ['Max Storage', p => p.upgrade && p.upgrade.ssdMax],
  ['Upgrade Recommendation', p => p.upgrade && p.upgrade.recommendation],
  ['PSREF Link', p => p.psrefUrl], ['Datasheet Link', p => p.datasheetUrl], ['Product Page Link', p => p.productUrl], ['Image URLs', p => (p.images || []).filter(s => !s.startsWith('data:')).join(' ; ')]
];
function exportExcel() {
  const list = sortList(P());
  const rows = [XCOLS.map(c => c[0]), ...list.map(p => XCOLS.map(c => { const v = c[1](p); return v === undefined || v === null ? '' : v; }))];
  const specRows = [['MTM', 'Spec', 'Value']]; list.forEach(p => (p.specs || []).forEach(([n, v]) => specRows.push([p.mtm, n, v])));
  const blob = XLSXLite.write([
    { name: 'Products', rows, widths: XCOLS.map(c => ['Specifications', 'Upgrade Recommendation', 'Image URLs', 'PSREF Link', 'Datasheet Link', 'Product Page Link'].includes(c[0]) ? 50 : c[0] === 'Model' || c[0] === 'Full Name' ? 26 : 14) },
    { name: 'Specs', rows: specRows, widths: [14, 28, 80] }
  ]);
  download(blob, `Lenovo Catalog ${todayISO()}.xlsx`);
}
function exportPricelist() {
  const head = ['Category', 'Model', 'MTM', 'Specifications', 'Color', 'SRP', 'Promo SRP', 'Price', 'Bundle'];
  const sheet = (status, name) => {
    const list = sortList(P().filter(p => p.status === status));
    const rows = [head, ...list.map(p => [p.category === 'Monitor' ? 'Visuals' : p.category, p.model, p.mtm, p.quickSpecs, p.color, p.srp, promoActive(p) ? p.promoSrp : '', p.dp, p.bundle])];
    rows.push([], [], ['Links to Full specifications'], ...list.map(p => [p.model, p.mtm, p.psrefUrl]));
    return { name, rows, widths: [12, 24, 14, 80, 14, 10, 10, 10, 28] };
  };
  download(XLSXLite.write([sheet('onhand', 'Onhand'), sheet('incoming', 'Incoming')]), `${S.data.priceListName || 'Pricelist'} (export ${todayISO()}).xlsx`);
}
function exportTemplate() {
  download(XLSXLite.write([{ name: 'Products', rows: [XCOLS.map(c => c[0]), ['On Hand', 'IdeaPad', 'IdeaPad Slim 3 15AMN8', '82XQ01YCPH', 'IdeaPad Slim 3 15AMN8', '15.6" FHD | R3 30 | 8GB | 256GB | Win11', 'Arctic Grey', 44995, '', '', 38245, 'B210 Backpack']], widths: XCOLS.map(() => 16) }, { name: 'Specs', rows: [['MTM', 'Spec', 'Value']] }]), 'Lenovo Catalog Template.xlsx');
}
function exportJson() {
  const blob = new Blob([JSON.stringify(S.data, null, 1)], { type: 'application/json' });
  download(blob, 'products.json');
  toast('products.json downloaded — upload it to data/ on your host');
}
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
function parseWorkbook(sheets) {
  // Returns { format, items:[partial products], specs: {mtm:[[n,v]]} }
  const prod = sheets.find(s => /^products$/i.test(s.name));
  if (prod && (prod.rows[0] || []).some(h => norm(h) === 'mtm')) {
    const H = (prod.rows[0] || []).map(norm), idx = (n) => H.indexOf(norm(n));
    const items = prod.rows.slice(1).filter(r => r && r[idx('MTM')]).map(r => {
      const g = (n) => { const i = idx(n); return i < 0 ? undefined : r[i]; };
      const it = { mtm: String(g('MTM')).trim().toUpperCase() };
      const set = (k, v, f = (x) => x) => { if (v !== undefined) it[k] = v === '' ? '' : f(v); };
      set('status', g('Status'), v => /incom/i.test(v) ? 'incoming' : 'onhand');
      set('category', g('Category'), v => /visual/i.test(v) ? 'Monitor' : String(v).trim());
      set('model', g('Model'), String); set('name', g('Full Name'), String); set('quickSpecs', g('Specifications'), String); set('color', g('Color'), String);
      set('srp', g('SRP'), num); set('promoSrp', g('Promo SRP'), num); set('promoUntil', g('Promo Until'), excelDate); set('dp', g('DP') !== undefined ? g('DP') : g('Dealer Price'), num);
      set('bundle', g('Bundle'), String); set('eta', g('ETA'), excelDate); set('shipmentRef', g('Shipment Ref'), String); set('added', g('Date Added'), excelDate);
      set('cpuBrand', g('CPU Brand'), String); set('cpu', g('CPU'), String); set('ram', g('RAM (GB)'), num); set('gpu', g('GPU'), String); set('gpuDetail', g('GPU Details'), String); set('display', g('Display'), String);
      set('psrefUrl', g('PSREF Link'), String); set('datasheetUrl', g('Datasheet Link'), String); set('productUrl', g('Product Page Link'), String);
      if (g('Image URLs')) it.imageUrls = String(g('Image URLs')).split(/\s*;\s*/).filter(Boolean);
      const u = { ramInstalled: g('RAM Installed'), ramSlots: num(g('RAM Slots')), ramSlotsFree: num(g('RAM Slots Free')), ramMax: g('Max RAM'), ssdInstalled: g('SSD Installed'), ssdSlots: num(g('SSD Slots')), ssdSlotsFree: num(g('SSD Slots Free')), ssdMax: g('Max Storage'), recommendation: g('Upgrade Recommendation') };
      if (u.ramInstalled || u.ssdInstalled || u.ramMax || u.ssdMax) it.upgrade = Object.fromEntries(Object.entries(u).map(([k, v]) => [k, v ?? (/Slots/.test(k) ? 0 : '')]));
      return it;
    });
    const specs = {};
    const sp = sheets.find(s => /^specs$/i.test(s.name));
    if (sp) sp.rows.slice(1).forEach(r => { if (r && r[0] && r[1]) (specs[String(r[0]).trim().toUpperCase()] = specs[String(r[0]).trim().toUpperCase()] || []).push([String(r[1]), String(r[2] ?? '')]); });
    return { format: 'Catalog export', items, specs };
  }
  // Iontech price list format: one sheet per status with Category | Model | MTM | Specifications | Color | SRP | Promo SRP | Price | Bundle
  const items = [];
  for (const s of sheets) {
    const hr = s.rows.findIndex(r => r && r.some(h => norm(h) === 'mtm'));
    if (hr < 0) continue;
    const H = s.rows[hr].map(norm), idx = (...ns) => { for (const n of ns) { const i = H.indexOf(norm(n)); if (i >= 0) return i; } return -1; };
    const status = /incom/i.test(s.name) ? 'incoming' : 'onhand';
    const links = {};
    let end = s.rows.length;
    s.rows.forEach((r, ri) => {
      if (r && /links to full spec/i.test(String(r[0] || ''))) end = Math.min(end, ri);
      if (ri > end && r && r[1] && (r[2] || s.links[ri + ',2'])) links[String(r[1]).trim().toUpperCase()] = s.links[ri + ',2'] || String(r[2]).trim();
    });
    for (let ri = hr + 1; ri < end; ri++) {
      const r = s.rows[ri]; if (!r) continue;
      const mtm = r[idx('MTM')]; if (!mtm) continue;
      const g = (...n) => { const i = idx(...n); return i < 0 ? undefined : r[i]; };
      const it = { mtm: String(mtm).trim().toUpperCase(), status };
      if (g('Category') !== undefined) it.category = /visual/i.test(g('Category')) ? 'Monitor' : String(g('Category')).trim();
      if (g('Model') !== undefined) it.model = String(g('Model')).trim();
      it.quickSpecs = String(g('Specifications', 'Specs') || '').replace(/Wi"11/g, 'Win11').replace(/(\d+(?:\.\d+)?)N /g, '$1" ').trim();
      it.color = g('Color') ? String(g('Color')) : '';
      it.srp = num(g('SRP')) || 0; it.promoSrp = num(g('Promo SRP')); it.dp = num(g('Price', 'Dealer Price', 'DP')) || 0; it.bundle = g('Bundle') ? String(g('Bundle')) : '';
      items.push(it);
    }
    items.filter(it => it.status === status).forEach(it => { if (links[it.mtm]) it.psrefUrl = links[it.mtm]; });
  }
  return { format: 'Price list', items, specs: {} };
}
function excelDate(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (typeof v === 'number') { const d = new Date(Math.round((v - 25569) * 864e5)); return d.toISOString().slice(0, 10); }
  const s = String(v).trim(); const d = new Date(s); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : (isNaN(d) ? s : d.toISOString().slice(0, 10));
}
function guessFields(it) {
  const t = (it.quickSpecs || '') + ' ' + (it.model || '');
  const g = {};
  if (it.category !== 'Monitor') {
    if (/ryzen|\bR[3579]\b|RAI|AMD/i.test(t)) g.cpuBrand = 'AMD'; else if (/intel|core|i[3579]-|ultra/i.test(t)) g.cpuBrand = 'Intel';
    const ram = /(\d+)x(\d+)GB/i.exec(t) || /\|\s*(\d+)GB\s*\|/i.exec(t); if (ram) g.ram = ram[2] ? +ram[1] * +ram[2] : +ram[1];
    const gpu = /RTX\s*(\d{4})\s*(Ti)?/i.exec(t); g.gpu = gpu ? 'RTX ' + gpu[1] + (gpu[2] ? ' Ti' : '') : 'Integrated';
  }
  return g;
}
function adminIO() {
  const b = $('#adminBody');
  b.innerHTML = `<div class="dash-grid" style="margin-top:0">
    <div class="panel"><h3>Export</h3><p class="small muted">Download the current catalog.</p>
      <div class="btn-row"><button class="btn btn-dark" id="xExcel">Export catalog (.xlsx)</button><button class="btn" id="xPl">Export as price list (.xlsx)</button><button class="btn" id="xTpl">Blank template</button></div>
      <h3 style="margin-top:18px">Publish to everyone</h3>
      <p class="small muted">The website reads <code>data/products.json</code> from your web host. After editing, download it and replace that file on the host — everyone sees the update on their next visit (devices that were offline update when they reconnect).</p>
      <div class="btn-row"><button class="btn btn-red" id="xJson">Download products.json</button><label class="btn">Restore from products.json<input type="file" accept=".json,application/json" id="iJson" hidden></label></div>
    </div>
    <div class="panel"><h3>Bulk import from Excel</h3>
      <p class="small muted">Accepts the monthly Iontech price list (sheets <i>Onhand</i> / <i>Incoming</i> with Category, Model, MTM, Specifications, Color, SRP, Promo SRP, Price, Bundle) or a catalog export from this site. Products are matched by MTM; existing PSREF specs, images and upgrade data are kept.</p>
      <label class="dropzone" id="xDrop" style="display:block">Drop an .xlsx file here or tap to choose<input type="file" accept=".xlsx" id="iExcel" hidden></label>
      <div id="importPreview"></div>
    </div></div>`;
  $('#xExcel').onclick = exportExcel; $('#xPl').onclick = exportPricelist; $('#xTpl').onclick = exportTemplate; $('#xJson').onclick = exportJson;
  $('#iJson').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const d = JSON.parse(await f.text()); if (!Array.isArray(d.products)) throw new Error('No products array');
      if (await confirmBox('Replace catalog?', `<p>Replace the catalog on this device with <b>${d.products.length}</b> products from ${esc(f.name)}?</p>`, 'Replace')) {
        const ch = diffCatalog(S.data, d); S.data = Object.assign({ adminPinHash: S.data.adminPinHash }, d); await markEdited(); await recordChanges(ch, false); toast('Catalog restored'); renderAdmin(); }
    } catch (err) { toast('Invalid products.json: ' + err.message); }
  };
  const handle = async (file) => {
    if (!file) return;
    try {
      const sheets = await XLSXLite.read(await file.arrayBuffer());
      const parsed = parseWorkbook(sheets);
      if (!parsed.items.length) { $('#importPreview').innerHTML = '<p class="muted">No product rows with an MTM column were found.</p>'; return; }
      showImportPreview(parsed, file.name);
    } catch (err) { $('#importPreview').innerHTML = `<p style="color:#b00020">Could not read file: ${esc(err.message)}</p>`; }
  };
  $('#iExcel').onchange = (e) => handle(e.target.files[0]);
  const dz = $('#xDrop');
  dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('drag'); };
  dz.ondragleave = () => dz.classList.remove('drag');
  dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove('drag'); handle(e.dataTransfer.files[0]); };
}
function showImportPreview(parsed, fname) {
  const existing = new Map(P().map(p => [p.mtm, p]));
  const inFile = new Set(parsed.items.map(i => i.mtm));
  const news = parsed.items.filter(i => !existing.has(i.mtm));
  const upd = parsed.items.filter(i => existing.has(i.mtm));
  const missing = P().filter(p => !inFile.has(p.mtm));
  const priceChanges = upd.flatMap(i => { const o = existing.get(i.mtm); return [['srp', 'SRP'], ['promoSrp', 'Promo'], ['dp', 'DP']].filter(([k]) => i[k] !== undefined && (num(i[k]) || null) !== (num(o[k]) || null)).map(([k, l]) => `${o.model} (${o.mtm}) ${l}: ${peso(o[k])} → ${peso(i[k])}`); });
  const box = $('#importPreview');
  box.innerHTML = `<div class="preview-box" style="margin-top:12px"><b>${esc(fname)}</b> · ${esc(parsed.format)} format<br>
    ${parsed.items.length} rows · <b>${news.length}</b> new · <b>${upd.length}</b> existing · <b>${priceChanges.length}</b> price changes
    ${news.length ? `<p style="margin:8px 0 2px"><b>New:</b> ${news.map(n => esc(n.mtm)).join(', ')}</p>` : ''}
    ${priceChanges.length ? `<p style="margin:8px 0 2px"><b>Price changes:</b></p><div class="small">${priceChanges.map(esc).join('<br>')}</div>` : ''}
    ${missing.length ? `<p style="margin:8px 0 2px"><b>Not in this file:</b> ${missing.map(m => esc(m.mtm)).join(', ')}</p>` : ''}</div>
    ${missing.length ? `<label class="fopt"><input type="checkbox" id="rmMissing"> Remove the ${missing.length} product(s) not in this file</label>` : ''}
    <div class="btn-row"><button class="btn btn-red" id="applyImport">Apply import</button><button class="btn" id="cancelImport">Cancel</button></div>`;
  $('#cancelImport').onclick = () => { box.innerHTML = ''; };
  $('#applyImport').onclick = async () => {
    const before = JSON.parse(JSON.stringify({ products: P() }));
    let order = Math.max(-1, ...P().map(x => x.order ?? 0));
    for (const it of parsed.items) {
      const o = existing.get(it.mtm);
      const imgs = it.imageUrls; delete it.imageUrls;
      const specs = parsed.specs[it.mtm];
      if (o) {
        Object.entries(it).forEach(([k, v]) => { if (v !== undefined) o[k] = v; });
        if (imgs && imgs.length) o.images = [...imgs, ...(o.images || []).filter(s => s.startsWith('data:'))];
        if (specs && specs.length) o.specs = specs;
        if (it.status === 'onhand' && before.products.find(x => x.mtm === it.mtm).status === 'incoming') { o.added = todayISO(); o.eta = ''; }
      } else {
        const np = Object.assign({ id: it.mtm, name: it.model, category: 'IdeaPad', status: 'onhand', images: imgs || [], specs: specs || [], upgrade: null, eta: '', added: todayISO(), views: 0,
          productUrl: 'https://www.lenovo.com/ph/en/search?text=' + it.mtm, gpuDetail: '', display: '', datasheetUrl: '', psrefUrl: '' }, guessFields(it), it);
        np.order = ++order; S.data.products.push(np);
      }
    }
    if ($('#rmMissing') && $('#rmMissing').checked) S.data.products = P().filter(p => inFile.has(p.mtm));
    if (parsed.format === 'Price list') { const m = /PL\s*-\s*(.+)\.xlsx$/i.exec(fname); S.data.priceListName = fname.replace(/\.xlsx$/i, ''); }
    await markEdited();
    await recordChanges(diffCatalog(before, S.data), false);
    toast(`Imported ${parsed.items.length} rows`); renderAdmin();
  };
}
function adminSettings() {
  const b = $('#adminBody');
  b.innerHTML = `<div class="dash-grid" style="margin-top:0">
    <form class="panel" id="pinF"><h3 style="margin-bottom:10px">Change admin PIN</h3>
      <div class="field"><label class="fl" for="p0">Current PIN</label><input type="password" id="p0" required></div>
      <div class="grid2"><div class="field"><label class="fl" for="p1">New PIN (min 6 characters)</label><input type="password" id="p1" minlength="6" required></div><div class="field"><label class="fl" for="p2">Repeat new PIN</label><input type="password" id="p2" minlength="6" required></div></div>
      <button class="btn btn-dark">Update PIN</button><p class="small muted" style="margin-bottom:0">The PIN is stored as a SHA-256 hash inside products.json, so publish after changing it. It keeps casual users out of the admin screens; for real protection put the site behind your host's password / access control.</p></form>
    <div class="panel"><h3 style="margin-bottom:10px">Live website</h3>
      <div class="field"><label class="fl" for="liveUrl">Live site address (so this tool starts from the published catalog)</label><input type="url" id="liveUrl" placeholder="https://your-username.github.io/lenovo-catalog" value="${esc(ls.get('liveUrl', ''))}"></div>
      <button class="btn" id="liveSave">Save address</button>
      <h3 style="margin:18px 0 10px">Catalog</h3>
      <div class="field"><label class="fl" for="plName">Price list name</label><input type="text" id="plName" value="${esc(S.data.priceListName || '')}"></div>
      <button class="btn" id="plSave">Save name</button>
      <h3 style="margin:18px 0 8px">Offline images</h3>
      <p class="small muted">Thumbnails are saved automatically. Save every gallery image so product pages look complete offline.</p>
      <button class="btn" id="cacheAll">Save all product images for offline</button> <span class="small" id="cacheProg"></span>
      <h3 style="margin:18px 0 8px">Local changes</h3>
      <p class="small muted">Status: ${S.meta.dirty ? '<b>unpublished edits on this device</b>' : 'in sync with the published catalog'}.</p>
      <button class="btn btn-danger" id="discard" ${S.meta.dirty ? '' : 'disabled'}>Discard local edits &amp; reload published catalog</button>
    </div></div>`;
  $('#pinF').onsubmit = async (e) => {
    e.preventDefault();
    try {
      if (await sha256($('#p0').value.trim()) !== S.data.adminPinHash) { toast('Current PIN is incorrect'); return; }
      if ($('#p1').value.trim() !== $('#p2').value.trim()) { toast('New PINs do not match'); return; }
      S.data.adminPinHash = await sha256($('#p1').value.trim()); ss.set('admin', S.data.adminPinHash);
      await markEdited(); toast('PIN updated — publish products.json to apply it everywhere'); renderAdmin();
    } catch (err) { toast(err.message); }
  };
  $('#liveSave').onclick = () => { ls.set('liveUrl', $('#liveUrl').value.trim()); toast('Saved — the published catalog will load next time'); refreshFromNetwork(); };
  $('#plSave').onclick = async () => { S.data.priceListName = $('#plName').value.trim(); await markEdited(); toast('Saved'); renderAdmin(); };
  $('#cacheAll').onclick = async () => { const urls = [...new Set(P().flatMap(p => p.images || []).filter(u => /^https?:/.test(u)))]; await cacheImages(urls, (d, t) => { $('#cacheProg').textContent = `${d}/${t}`; }); $('#cacheProg').textContent = `Done — ${urls.length} images saved`; };
  $('#discard').onclick = async () => {
    if (!(await confirmBox('Discard local edits?', '<p>Your unpublished changes on this device will be lost and the published catalog will be loaded.</p>', 'Discard'))) return;
    try { const r = await fetch('data/products.json', { cache: 'no-store' }); const d = await r.json(); if (!d.products) throw 0;
      S.data = d; S.meta = { baseVersion: d.version, dirty: false }; hayCache.clear(); await saveCatalog(); toast('Published catalog loaded'); renderAdmin();
    } catch (_) { toast('Could not load the published catalog (offline?)'); }
  };
}


/* ================= export all models (Excel / PDF) ================= */
function exportRows() {
  const groups = [['onhand', 'Onhand'], ['incoming', 'Incoming']].map(([k, l]) => [l, sortList(P().filter(p => p.status === k))]);
  const anyPromo = P().some(promoActive);
  return { groups, anyPromo };
}
function exportAllExcel() {
  if (!window.XLSXLite) { toast('Excel export not available'); return; }
  const { groups, anyPromo } = exportRows();
  const head = ['Category', 'Model', 'MTM', 'Specifications', 'Color', 'SRP', ...(anyPromo ? ['Promo SRP'] : []), 'DP', 'Bundle', 'Full Specs Link'];
  const widths = [11, 24, 14, 90, 14, 11, ...(anyPromo ? [11] : []), 11, 30, 60];
  const sheets = groups.filter(g => g[1].length).map(([name, list]) => ({
    name, widths,
    rows: [head, ...list.map(p => [p.category, p.model, p.mtm, quickSpecsLine(p), p.color || '', p.srp || '', ...(anyPromo ? [promoActive(p) ? p.promoSrp : ''] : []), p.dp || '', p.bundle || '', p.psrefUrl || '']), [], ['Disclaimer: ' + DISCLAIMER]]
  }));
  download(XLSXLite.write(sheets), `Lenovo Price List ${todayISO()}.xlsx`);
  toast('Excel file downloaded');
}
function exportAllPdf() {
  const { groups, anyPromo } = exportRows();
  // Helvetica widths (ASCII 32-126), 1/1000 em
  const HW = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  const clean = (s) => String(s ?? '').replace(/₱/g, 'PHP ').replace(/[“”″]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, '-').replace(/•/g, '-').replace(/[^\x20-\x7E]/g, '');
  const tw = (s, size, bold) => { let w = 0; for (const ch of s) w += HW[ch.charCodeAt(0) - 32] || 556; return w * size / 1000 * (bold ? 1.06 : 1); };
  const wrap = (s, width, size, bold) => {
    const out = []; let line = '';
    for (const word of clean(s).split(/\s+/).filter(Boolean)) {
      const t = line ? line + ' ' + word : word;
      if (tw(t, size, bold) <= width) line = t;
      else { if (line) out.push(line); line = word; while (tw(line, size, bold) > width) { let i = line.length; while (i > 1 && tw(line.slice(0, i), size, bold) > width) i--; out.push(line.slice(0, i)); line = line.slice(i); } }
    }
    if (line) out.push(line);
    return out.length ? out : [''];
  };
  const php = (n) => n ? 'PHP ' + Number(n).toLocaleString('en-US') : '-';
  const PW = 842, PH = 595, M = 28, FS = 7.5, LH = 9.5, PAD = 3;
  const cols = [['Model / MTM', 128], ['Specifications', 0], ['SRP', 62], ...(anyPromo ? [['Promo SRP', 62]] : []), ['DP', 62], ['Bundle', 104]];
  const fixed = cols.reduce((s, c) => s + c[1], 0); cols[1][1] = PW - 2 * M - fixed;
  const pages = []; let ops = [], y = 0;
  const esc2 = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const text = (x, yy, s, size, bold, rgb = '0.1 0.1 0.1') => ops.push(`BT ${rgb} rg /${bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(2)} ${yy.toFixed(2)} Td (${esc2(s)}) Tj ET`);
  const rect = (x, yy, w, h, rgb) => ops.push(`${rgb} rg ${x.toFixed(2)} ${yy.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  const title = 'Iontech - Lenovo Price List';
  const newPage = () => {
    if (ops.length) pages.push(ops);
    ops = []; y = PH - M;
    rect(0, PH - 40, PW, 40, '0.067 0.067 0.067');
    text(M, PH - 25, title, 13, true, '1 1 1');
    const d = clean('Generated ' + new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }));
    text(PW - M - tw(d, 8, false), PH - 24, d, 8, false, '0.85 0.85 0.85');
    rect(0, PH - 43, PW, 3, '0.886 0.137 0.102');
    y = PH - 58;
  };
  const headerRow = () => {
    rect(M, y - 14, PW - 2 * M, 14, '0.93 0.93 0.93');
    let x = M; cols.forEach(([l, w]) => { text(x + PAD, y - 10, l.toUpperCase(), 6.8, true, '0.3 0.3 0.3'); x += w; });
    y -= 14;
  };
  const cellsFor = (p) => [
    [[...wrap(p.model, cols[0][1] - 2 * PAD, FS, true), clean(p.mtm)], 'model'],
    [wrap(quickSpecsLine(p) + (p.color ? ' | ' + p.color : ''), cols[1][1] - 2 * PAD, FS, false), false],
    [[php(p.srp)], false],
    ...(anyPromo ? [[[promoActive(p) ? php(p.promoSrp) : '-'], 'promo']] : []),
    [[php(p.dp)], 'dp'],
    [wrap(p.bundle || '-', cols[cols.length - 1][1] - 2 * PAD, FS, false), false]
  ];
  // one row height for every model: the tallest row decides
  const maxLines = Math.max(2, ...groups.flatMap(g => g[1]).map(p => Math.max(...cellsFor(p).map(c => c[0].length))));
  const ROWH = maxLines * LH + 2 * PAD;
  const BOTTOM = 46;
  newPage();
  groups.forEach(([name, list]) => {
    if (!list.length) return;
    if (y - 36 - ROWH < BOTTOM) newPage();
    rect(M, y - 16, PW - 2 * M, 16, '0.886 0.137 0.102');
    text(M + 6, y - 11.5, `${name.toUpperCase()}  (${list.length} model${list.length === 1 ? '' : 's'})`, 9, true, '1 1 1');
    y -= 20; headerRow();
    list.forEach((p, i) => {
      const cells = cellsFor(p);
      const h = ROWH;
      if (y - h < BOTTOM) { newPage(); headerRow(); }
      if (i % 2) rect(M, y - h, PW - 2 * M, h, '0.975 0.975 0.975');
      ops.push(`0.88 0.88 0.88 RG 0.4 w ${M} ${(y - h).toFixed(2)} m ${PW - M} ${(y - h).toFixed(2)} l S`);
      let x = M;
      cells.forEach(([ls, kind], ci) => {
        const off = (maxLines - ls.length) * LH / 2;
        ls.forEach((s, li) => {
          const bold = (kind === 'model' && li < ls.length - 1) || kind === 'dp';
          const rgb = kind === 'model' && li === ls.length - 1 ? '0.4 0.4 0.4' : kind === 'promo' && s !== '-' ? '0.886 0.137 0.102' : '0.1 0.1 0.1';
          text(x + PAD, y - PAD - off - (li + 1) * LH + 2.2, s, FS, bold, rgb);
        });
        x += cols[ci][1];
      });
      y -= h;
    });
    y -= 12;
  });
  pages.push(ops);
  // footer page numbers
  const discLines = wrap(DISCLAIMER + ' Prices in Philippine Peso (PHP).', PW - 2 * M - 70, 6.8, false);
  pages.forEach((o, i) => {
    const s = `Page ${i + 1} of ${pages.length}`;
    o.push(`0.8 0.8 0.8 RG 0.5 w ${M} 38 m ${PW - M} 38 l S`);
    discLines.forEach((l, li) => o.push(`BT 0.35 0.35 0.35 rg /F1 6.8 Tf ${M} ${(29 - li * 8.5).toFixed(2)} Td (${esc2(l)}) Tj ET`));
    o.push(`BT 0.5 0.5 0.5 rg /F1 7 Tf ${(PW - M - tw(s, 7)).toFixed(2)} 29 Td (${s}) Tj ET`);
  });
  // assemble PDF
  const objs = [];
  const add = (s) => { objs.push(s); return objs.length; };
  const catalogId = add(''), pagesId = add('');
  const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const kids = [];
  pages.forEach(o => {
    const stream = o.join('\n');
    const cid = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${cid} 0 R >>`));
  });
  objs[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objs[pagesId - 1] = `<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
  let pdf = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  download(new Blob([pdf], { type: 'application/pdf' }), `Lenovo Price List ${todayISO()}.pdf`);
  toast('PDF downloaded');
}

/* ================= offline image cache ================= */
async function cacheImages(urls, onProgress) {
  if (!('caches' in window)) return;
  const c = await caches.open('img-v1'); let done = 0;
  const queue = urls.slice();
  const worker = async () => {
    while (queue.length) {
      const u = queue.shift();
      try { if (!(await c.match(u))) { const res = await fetch(u, { mode: new URL(u).origin === location.origin ? 'same-origin' : 'no-cors' }); await c.put(u, res); } } catch (_) {}
      done++; onProgress && onProgress(done, urls.length);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
}

/* ================= routing ================= */
function setNav(key) { $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === key)); }
function route() {
  if (S.timer) { clearInterval(S.timer); S.timer = null; }
  closeMenus(); closeFilters();
  if (!S.data) return;
  const h = decodeURIComponent(location.hash.replace(/^#/, '')) || '/onhand';
  const parts = h.split('/').filter(Boolean);
  const r = parts[0] || 'onhand';
  if (r === 'p' && parts[1]) { S.route = 'detail'; setNav('catalog'); renderDetail(parts.slice(1).join('/')); }
  else if (r === 'compare') { S.route = 'compare'; setNav('compare'); renderCompare(); }
  else if (r === 'admin' && ADMIN_MODE) { S.route = 'admin'; setNav('admin'); renderAdmin(); }
  else { S.route = 'catalog'; S.tab = r === 'incoming' ? 'incoming' : 'onhand'; setNav('catalog'); renderCatalog(); }
  updateCompareUI();
}

/* ================= global events ================= */
function syncSearchClear() { $('#searchClear').hidden = !$('#search').value; }
function bindGlobal() {
  const input = $('#search');
  input.addEventListener('input', () => {
    S.q = input.value; syncSearchClear();
    if (S.route !== 'catalog') { S.tab = S.tab || 'onhand'; location.hash = '#/' + S.tab; } else renderCatalog();
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { input.value = ''; S.q = ''; syncSearchClear(); renderCatalog(); } });
  $('#searchClear').onclick = () => { input.value = ''; S.q = ''; syncSearchClear(); if (S.route === 'catalog') renderCatalog(); input.focus(); };
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); }
    if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
  });
  document.addEventListener('click', (e) => {
    const cm = e.target.closest('[data-copy-mtm]'); if (cm) { e.preventDefault(); copyText(cm.dataset.copyMtm, 'MTM copied'); return; }
    const qc = e.target.closest('[data-quickcopy]'); if (qc) { e.preventDefault(); copyText(quickCopyText(byMtm(qc.dataset.quickcopy)), 'Model, MTM, specs & prices copied'); return; }
    const cb = e.target.closest('[data-cmp]'); if (cb) { e.preventDefault(); toggleCompare(cb.dataset.cmp); }
  });
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  $('#bellBtn').onclick = bellModal;
  window.addEventListener('hashchange', route);
  const net = () => { $('#netStatus').hidden = navigator.onLine; };
  window.addEventListener('online', () => { net(); refreshFromNetwork(); }); window.addEventListener('offline', net); net();
  window.addEventListener('beforeinstallprompt', (e) => e.preventDefault());
}
function showBanner(html, cls = '') { const b = $('#banner'); b.className = 'banner ' + cls; b.innerHTML = html; b.hidden = false; return b; }

/* ================= data loading ================= */
async function fetchPublished() {
  const live = ADMIN_MODE ? String(ls.get('liveUrl', '') || '').replace(/\/+$/, '') : '';
  if (live) { try { const r = await fetch(live + '/data/products.json', { cache: 'no-store' }); if (r.ok) { const d = await r.json(); if (Array.isArray(d.products)) return d; } } catch (_) {} }
  try { const r = await fetch('data/products.json', { cache: 'no-store' }); if (!r.ok) throw 0; const d = await r.json(); if (!Array.isArray(d.products)) throw 0; return d; }
  catch (_) {
    // Opened straight from disk (file://) — use the snapshot bundled in data/products.js
    const d = window.CATALOG_SNAPSHOT; return d && Array.isArray(d.products) && !S.data ? d : null;
  }
}
async function refreshFromNetwork() {
  const remote = await fetchPublished();
  if (!remote) return;
  if (!S.data) {
    S.data = remote; S.meta = { baseVersion: remote.version, dirty: false }; await saveCatalog(); route(); return;
  }
  if (S.meta.dirty && remote.version === S.data.version) { S.meta = { baseVersion: remote.version, dirty: false }; await saveCatalog(); if (S.route === 'admin') renderAdmin(); return; }
  if (remote.version === S.meta.baseVersion) return;
  if (!S.meta.dirty) {
    const changes = diffCatalog(S.data, remote);
    S.data = remote; S.meta = { baseVersion: remote.version, dirty: false }; hayCache.clear(); await saveCatalog();
    await recordChanges(changes, true); route(); precacheThumbs();
  } else {
    const b = showBanner(`<div><b>A newer price list has been published</b>, but this device has unpublished admin edits.</div><button class="btn btn-sm btn-dark" id="bLoad">Load published list</button><button class="btn btn-sm" id="bKeep">Keep my edits</button>`);
    $('#bKeep', b).onclick = () => { b.hidden = true; };
    $('#bLoad', b).onclick = async () => { const ch = diffCatalog(S.data, remote); S.data = remote; S.meta = { baseVersion: remote.version, dirty: false }; hayCache.clear(); await saveCatalog(); await recordChanges(ch, true); b.hidden = true; route(); };
  }
}
function precacheThumbs() {
  if (!navigator.onLine) return;
  const run = () => cacheImages([...new Set(P().map(thumb).filter(u => /^https?:/.test(u)))]);
  ('requestIdleCallback' in window) ? requestIdleCallback(run, { timeout: 4000 }) : setTimeout(run, 2000);
}
async function boot() {
  bindGlobal();
  S.views = (await idb.get('views')) || {};
  S.priceLog = (await idb.get('priceLog')) || [];
  updateBell();
  const local = await idb.get('catalog');
  if (local && local.data && Array.isArray(local.data.products)) {
    S.data = local.data; S.meta = { baseVersion: local.baseVersion, dirty: !!local.dirty };
    route();
  } else {
    $('#view').innerHTML = '<div class="empty"><h3>Loading catalog…</h3></div>';
  }
  await refreshFromNetwork();
  if (!S.data) $('#view').innerHTML = `<div class="empty"><h3>Catalog not available</h3><p>Connect to the internet once to download the catalog. After that it works offline.</p><button class="btn" onclick="location.reload()">Retry</button></div>`;
  else precacheThumbs();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing; if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            const b = showBanner('<div>A new version of this site is available.</div><button class="btn btn-sm btn-dark" id="swReload">Reload</button>', 'info');
            $('#swReload', b).onclick = () => location.reload();
          }
        });
      });
    }).catch(() => {});
  }
}
boot();
})();
