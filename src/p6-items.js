// ---------- game state, items, puzzles ----------
const G = { state: 'title', day: 1, maxDays: 5, seed: 1, code: '0000', time: 0, ending: null, nights: 0, got: {} };
const P = { x: 0, y: 0, z: 0, vy: 0, yaw: 0, pitch: 0, r: 0.3, h: 1.75, eye: 1.6, crouch: false, run: false, stepOff: 0, walkT: 0, inv: [null, null, null, null, null, null, null, null], sel: 0, hidden: null, busy: null, noise: 0, reload: 0, stunned: 0, lastStep: 0 };
const DIFF = { easy: { days: 7, speed: 0.82, hear: 0.8, sight: 0.85 }, normal: { days: 5, speed: 1, hear: 1, sight: 1 }, hard: { days: 3, speed: 1.15, hear: 1.2, sight: 1.15 } };
const ITEMS = {
  hairpin: { n: 'Hairpin', e: '📎', c: 0xc0c0c8, sh: 'pin' }, padkey: { n: 'Cellar Key', e: '🗝️', c: 0x9aa0a8, sh: 'key' }, redkey: { n: 'Red Key', e: '🗝️', c: 0xd03030, sh: 'key' },
  bluekey: { n: 'Blue Key', e: '🗝️', c: 0x3a6ae0, sh: 'key' }, greenkey: { n: 'Green Key', e: '🗝️', c: 0x35b060, sh: 'key' }, goldkey: { n: 'Gold Key', e: '🗝️', c: 0xe8c040, sh: 'key' },
  note: { n: 'Code Note', e: '📝', c: 0xe8dcb8, sh: 'paper' }, crowbar: { n: 'Crowbar', e: '🛠️', c: 0x9a2a2a, sh: 'bar' }, cutters: { n: 'Bolt Cutters', e: '✂️', c: 0xc05020, sh: 'cutters' },
  fuse: { n: 'Fuse', e: '🔌', c: 0xf0f0e0, sh: 'fuse' }, frontkey: { n: 'Front Door Key', e: '🔑', c: 0xf0d060, sh: 'key' }, carkey: { n: 'Car Key', e: '🚗', c: 0x30a0e0, sh: 'key' },
  battery: { n: 'Car Battery', e: '🔋', c: 0x2a2f38, sh: 'battery' }, fuel: { n: 'Fuel Can', e: '⛽', c: 0xc02020, sh: 'fuel' }, boatkey: { n: 'Boat Key', e: '⚓', c: 0x40c0c0, sh: 'key' },
  prop: { n: 'Propeller', e: '🌀', c: 0x9aa4b0, sh: 'prop' }, crossbow: { n: 'Crossbow', e: '🏹', c: 0x6a4a2a, sh: 'crossbow' }, bolts: { n: 'Bolts', e: '➶', c: 0x8a8a8a, sh: 'bolts', stack: true },
  flashlight: { n: 'Flashlight', e: '🔦', c: 0xe0e040, sh: 'light' }, bottle: { n: 'Bottle', e: '🍾', c: 0x3a8a4a, sh: 'bottle', throw: true }, teddy: { n: 'Teddy', e: '🧸', c: 0x9a6a3a, sh: 'teddy', throw: true },
};
const LOCKS = {                                                // what each lock needs (keys are used up, tools are not)
  pins: { need: ['hairpin'], use: ['hairpin'], hint: 'The door is locked. Maybe something thin could pick it.' },
  padlock: { need: ['padkey'], use: ['padkey'], hint: 'A padlock holds the cellar door shut. You need a key.' },
  red: { need: ['redkey'], use: ['redkey'], hint: 'Locked. It has a red keyhole.' }, blue: { need: ['bluekey'], use: ['bluekey'], hint: 'Locked. It has a blue keyhole.' },
  green: { need: ['greenkey'], use: ['greenkey'], hint: 'The shed is locked. It has a green keyhole.' }, gold: { need: ['goldkey'], use: ['goldkey'], hint: 'The back door is locked. It has a gold keyhole.' },
  boards: { need: ['crowbar'], use: [], hint: 'Boards are nailed across the door. You need something to pry them off.' },
  front: { need: ['frontkey', 'crowbar'], use: ['frontkey'], hint: 'The front door is locked and boarded up. You need its key and something to pry the boards.' },
};
// ---------- item models ----------
function itemMesh(id) {
  const it = ITEMS[id], g = new THREE.Group(), col = it.c;
  const M = (geo, c, o) => new THREE.Mesh(geo, MAT(c === undefined ? col : c, Object.assign({ map: null, roughness: 0.45, metalness: 0.45, emissive: c === undefined ? col : c, emissiveIntensity: 0.3 }, o || {})));
  const add = (m, x, y, z, rx, ry, rz) => { m.position.set(x || 0, y || 0, z || 0); m.rotation.set(rx || 0, ry || 0, rz || 0); g.add(m); return m; };
  switch (it.sh) {
    case 'key': add(M(new THREE.TorusGeometry(0.04, 0.014, 6, 12)), -0.09, 0, 0); add(M(new THREE.BoxGeometry(0.16, 0.016, 0.016)), 0.0, 0, 0); add(M(new THREE.BoxGeometry(0.014, 0.05, 0.014)), 0.06, -0.025, 0); add(M(new THREE.BoxGeometry(0.014, 0.035, 0.014)), 0.03, -0.018, 0); break;
    case 'pin': add(M(new THREE.BoxGeometry(0.14, 0.008, 0.012)), 0, 0, 0); add(M(new THREE.BoxGeometry(0.14, 0.008, 0.012)), 0, 0, 0.03); break;
    case 'paper': add(M(new THREE.BoxGeometry(0.17, 0.006, 0.12), col, { emissiveIntensity: 0.4, metalness: 0 }), 0, 0, 0); break;
    case 'bar': add(M(new THREE.BoxGeometry(0.42, 0.028, 0.028)), 0, 0, 0); add(M(new THREE.BoxGeometry(0.07, 0.028, 0.028)), 0.2, 0, 0.03, 0, 0.8, 0); break;
    case 'cutters': add(M(new THREE.BoxGeometry(0.42, 0.02, 0.02)), 0, 0, 0, 0, 0.12, 0); add(M(new THREE.BoxGeometry(0.42, 0.02, 0.02)), 0, 0, 0, 0, -0.12, 0); add(M(new THREE.BoxGeometry(0.07, 0.03, 0.05), 0x30343a), 0.2, 0, 0); break;
    case 'fuse': add(M(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 8), col, { metalness: 0 }), 0, 0, 0, 0, 0, Math.PI / 2); add(M(new THREE.CylinderGeometry(0.016, 0.016, 0.014, 8), 0xb0b0b0), -0.05, 0, 0, 0, 0, Math.PI / 2); add(M(new THREE.CylinderGeometry(0.016, 0.016, 0.014, 8), 0xb0b0b0), 0.05, 0, 0, 0, 0, Math.PI / 2); break;
    case 'battery': add(M(new THREE.BoxGeometry(0.24, 0.15, 0.16)), 0, 0, 0); add(M(new THREE.BoxGeometry(0.04, 0.03, 0.04), 0xd03030), -0.07, 0.09, 0); add(M(new THREE.BoxGeometry(0.04, 0.03, 0.04), 0x303030), 0.07, 0.09, 0); break;
    case 'fuel': add(M(new THREE.BoxGeometry(0.22, 0.3, 0.1)), 0, 0.02, 0); add(M(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6), 0xe0e0e0), 0.06, 0.2, 0, 0, 0, 0.5); break;
    case 'prop': for (let i = 0; i < 3; i++) add(M(new THREE.BoxGeometry(0.16, 0.012, 0.05)), Math.cos(i * 2.09) * 0.07, 0, Math.sin(i * 2.09) * 0.07, 0, -i * 2.09, 0.2); add(M(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8)), 0, 0, 0); break;
    case 'crossbow': add(M(new THREE.BoxGeometry(0.4, 0.04, 0.05)), 0, 0, 0); add(M(new THREE.BoxGeometry(0.03, 0.03, 0.38), 0x7a5a30), 0.16, 0, 0); add(M(new THREE.BoxGeometry(0.03, 0.03, 0.3), 0x7a5a30), -0.1, 0, 0); break;
    case 'bolts': for (let i = 0; i < 3; i++) add(M(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 5)), 0, 0, (i - 1) * 0.03, 0, 0, Math.PI / 2); break;
    case 'light': add(M(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8)), 0, 0, 0, 0, 0, Math.PI / 2); add(M(new THREE.CylinderGeometry(0.05, 0.03, 0.06, 8), 0xf0f0a0), 0.12, 0, 0, 0, 0, Math.PI / 2); break;
    case 'bottle': add(M(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), col, { transparent: true, opacity: 0.85 }), 0, 0, 0, 0, 0, Math.PI / 2); add(M(new THREE.CylinderGeometry(0.015, 0.02, 0.08, 6), col), 0.13, 0, 0, 0, 0, Math.PI / 2); break;
    case 'teddy': add(M(new THREE.SphereGeometry(0.07, 8, 6), col, { metalness: 0 }), 0, 0, 0); add(M(new THREE.SphereGeometry(0.05, 8, 6), col, { metalness: 0 }), 0.08, 0.05, 0); add(M(new THREE.SphereGeometry(0.02, 6, 5), col, { metalness: 0 }), 0.1, 0.1, 0.03); add(M(new THREE.SphereGeometry(0.02, 6, 5), col, { metalness: 0 }), 0.1, 0.1, -0.03); break;
  }
  return g;
}
// ---------- world items ----------
const WI = [], INV_SLOTS = 8;
function spawnItem(id, x, y, z, o = {}) {
  const mesh = itemMesh(id); mesh.position.set(x, y + 0.04, z); mesh.rotation.y = rnd() * 6.28; scene.add(mesh);
  const wi = { id, n: o.n || 1, mesh, x, y, z, cont: o.cont || null, by: y };
  wi.int = { kind: 'item', ref: wi, x, y: y + 0.12, z, r: 1.7 }; INTS.push(wi.int); WI.push(wi); return wi;
}
function removeWI(wi) { scene.remove(wi.mesh); const i = INTS.indexOf(wi.int); if (i >= 0) INTS.splice(i, 1); const k = WI.indexOf(wi); if (k >= 0) WI.splice(k, 1); }
function clearWI() { while (WI.length) removeWI(WI[0]); }
// ---------- inventory ----------
function invCount(id) { let n = 0; for (const s of P.inv) if (s && s.id === id) n += s.n || 1; return n; }
const invHas = id => P.inv.some(s => s && s.id === id);
function invGive(id, n = 1) {
  const it = ITEMS[id]; if (it.stack) { const s = P.inv.find(q => q && q.id === id); if (s) { s.n += n; renderBar(); return true; } }
  const k = P.inv.findIndex(s => !s); if (k < 0) return false; P.inv[k] = { id, n: it.stack ? n : 1 }; renderBar(); return true;
}
function invTake(id) { const k = P.inv.findIndex(s => s && s.id === id); if (k < 0) return false; P.inv[k] = null; renderBar(); return true; }
const held = () => P.inv[P.sel];
const heldId = () => { const s = P.inv[P.sel]; return s ? s.id : null; };
function renderBar() {
  const bar = $('bar'); if (!bar.children.length) for (let i = 0; i < INV_SLOTS; i++) { const d = document.createElement('div'); d.className = 'slot'; d.innerHTML = '<b>' + (i + 1) + '</b><span></span><small></small>'; d.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (G.state === 'play') selectSlot(i); }); bar.appendChild(d); }
  [...bar.children].forEach((d, i) => { const s = P.inv[i]; d.classList.toggle('on', i === P.sel); d.children[1].textContent = s ? ITEMS[s.id].e : ''; d.children[2].textContent = s ? ITEMS[s.id].n + (s.n > 1 ? ' x' + s.n : '') : ''; });
  const fire = $('tShoot'); if (fire) fire.style.display = heldId() === 'crossbow' ? 'flex' : 'none';
}
function selectSlot(i) { P.sel = clamp(i, 0, INV_SLOTS - 1); renderBar(); SFX.tick(0.6); }
let msgT = 0; function msg(t, ms = 2800) { const m = $('msg'); m.textContent = t; m.classList.add('on'); clearTimeout(msgT); msgT = setTimeout(() => m.classList.remove('on'), ms); }
// ---------- noise (the hunters listen) ----------
const NOISES = []; let noiseSerial = 0;
function makeNoise(x, y, z, r, who) { NOISES.push({ x, y, z, r, t: G.time, who: who || 'player', id: ++noiseSerial }); if (NOISES.length > 24) NOISES.shift(); if (!who) P.noise = Math.max(P.noise, Math.min(1, r / 13)); }
// ---------- opening, unlocking, taking ----------
function openContainer(c) {
  if (c.opened) return; c.opened = true; SFX.drawer(1, sp(c.x, c.y + 1, c.z).p); makeNoise(c.x, c.y, c.z, c.kind === 'chest' ? 5 : 4);
  const n = c.items.length; c.items.forEach((it, i) => { const off = (i - (n - 1) / 2) * 0.3, wi = spawnItem(it.id, c.anchor.x + c.al[0] * off, c.anchor.y, c.anchor.z + c.al[1] * off, { n: it.n, cont: c }); wi.it = it; });
  if (!n) msg('Empty.', 1200);
}
function pickUp(wi) {
  const it = ITEMS[wi.id];
  if (!invGive(wi.id, wi.n)) { msg('Your hands are full. Drop something first (Q).', 2200); SFX.locked(0.7); return; }
  if (wi.cont) { const k = wi.cont.items.indexOf(wi.it); if (k >= 0) wi.cont.items.splice(k, 1); }
  G.got[wi.id] = (G.got[wi.id] || 0) + (wi.n || 1); removeWI(wi); SFX.pickup(); msg('Picked up: ' + it.n + (wi.n > 1 ? ' x' + wi.n : ''), 1800); if (wi.id === 'note') readNote(); if (wi.id === 'crossbow') msg('Crossbow! Equip it and click to shoot. It needs bolts.', 3500);
  if (invHas('crossbow') && P.inv.findIndex(s => s && s.id === 'crossbow') >= 0 && wi.id === 'bolts') msg('Bolts picked up. Equip the crossbow and click to shoot.', 2800);
}
function dropHeld(throwIt) {
  if (P.hidden || P.busy) return; const s = held(); if (!s) return; const it = ITEMS[s.id];
  P.inv[P.sel] = null; renderBar();
  if (throwIt && it.throw) { launch(s.id, s.n); return; }
  const sp0 = dropSpot(), wi = spawnItem(s.id, sp0.x, sp0.y, sp0.z, { n: s.n }); SFX.drop(0.7, 0); makeNoise(sp0.x, sp0.y, sp0.z, 7); return wi;
}
function spotFree(x, z, y) {                                              // a place where a dropped item can rest and be picked up again
  const g = groundAt(x, z, y); if (g < -1e8 || Math.abs(g - y) > 0.3) return false;
  for (const so of near(x, z, 0.2)) { if (!so.on || so.top <= g + 0.3 || so.y0 >= g + 0.4) continue; const cx = clamp(x, so.x0, so.x1), cz = clamp(z, so.z0, so.z1); if ((x - cx) ** 2 + (z - cz) ** 2 < 0.04) return false; }
  return true;
}
function dropSpot() { const d = fwd(); for (const k of [0.75, 0.55, 0.35, 0.15]) { const x = P.x + d.x * k, z = P.z + d.z * k; if (spotFree(x, z, P.y)) return { x, z, y: groundAt(x, z, P.y) }; } return { x: P.x, z: P.z, y: P.y }; }
const fwd = () => ({ x: -Math.sin(P.yaw), z: -Math.cos(P.yaw) });
// thrown things fly and make a noise where they land
const FLY = [];
function launch(id, n) {
  const d = fwd(), cp = Math.cos(P.pitch), mesh = itemMesh(id); mesh.position.set(P.x, P.y + P.eye, P.z); scene.add(mesh);
  FLY.push({ id, n, mesh, x: P.x + d.x * 0.4, y: P.y + P.eye - 0.1, z: P.z + d.z * 0.4, vx: d.x * 9 * cp, vy: Math.sin(P.pitch) * 9 + 1.5, vz: d.z * 9 * cp, t: 0, lx: P.x, ly: P.y, lz: P.z }); SFX.tick(0.8);
}
function updateFly(dt) {
  for (let i = FLY.length - 1; i >= 0; i--) {
    const f = FLY[i]; f.t += dt; f.vy -= 14 * dt; if (spotFree(f.x, f.z, f.y)) { f.lx = f.x; f.ly = f.y; f.lz = f.z; } const nx = f.x + f.vx * dt, ny = f.y + f.vy * dt, nz = f.z + f.vz * dt; let hit = false;
    for (const s of near(nx, nz, 0.1)) { if (!s.on || nx < s.x0 - 0.05 || nx > s.x1 + 0.05 || nz < s.z0 - 0.05 || nz > s.z1 + 0.05 || ny < s.y0 || ny > s.top) continue; if (s.top - ny < 0.2 && f.vy < 0) { f.y = s.top; hit = true; break; } f.vx *= -0.3; f.vz *= -0.3; break; }
    if (!hit) { const gy = groundAt(nx, nz, f.y - 0.2); if (ny <= gy + 0.02 && gy > -1e8) { f.y = gy; hit = true; } else { f.x = nx; f.y = ny; f.z = nz; } } if (hit) { f.x = nx; f.z = nz; }
    f.mesh.position.set(f.x, f.y, f.z); f.mesh.rotation.x += dt * 8; f.mesh.rotation.z += dt * 6;
    if (hit || f.t > 4) {
      scene.remove(f.mesh); FLY.splice(i, 1); if (!spotFree(f.x, f.z, f.y)) { f.x = f.lx; f.z = f.lz; f.y = f.ly; }
      if (f.id === 'bottle') { SFX.clang(1, sp(f.x, f.y, f.z).p); makeNoise(f.x, f.y, f.z, 16, 'thrown'); msg('Crash!', 800); }
      else { SFX.drop(1, sp(f.x, f.y, f.z).p); makeNoise(f.x, f.y, f.z, 11, 'thrown'); spawnItem(f.id, f.x, f.y, f.z, { n: f.n }); }
    }
  }
}
// ---------- doors ----------
function playerInDoorway(d) { return Math.abs(P.x - d.cx) < 0.9 && Math.abs(P.z - d.cz) < 0.9 && Math.abs(P.y - d.y) < 1; }
function unlockDoor(d) {
  d.unlocked = true; if (d.lockMesh) { scene.remove(d.lockMesh); d.lockMesh = null; } if (d.planks) { for (const p of d.planks) scene.remove(p); d.planks = null; }
}
function useDoor(d) {
  const x = d.cx, z = d.cz, pan = sp(x, d.y + 1, z).p;
  if (d.unlocked) {
    if (d.id === 'g_front' && d.target === 0) { setDoor(d, true); SFX.doorOpen(1, pan); msg('The front door creaks open...', 1500); beginEnding('front'); return; }
    if (d.target) { if (playerInDoorway(d)) { msg("You're in the way.", 900); return; } setDoor(d, false); SFX.doorShut(0.8, pan); makeNoise(x, d.y, z, 6); }
    else { setDoor(d, true); SFX.doorOpen(0.9, pan); makeNoise(x, d.y, z, 4); }
    return;
  }
  if (d.lock === 'code') { openCodePad(d); return; }
  const L = LOCKS[d.lock]; const have = L.need.every(invHas);
  if (!have) { SFX.locked(); msg(L.hint, 3200); makeNoise(x, d.y, z, 3); return; }
  if (d.lock === 'pins') { startBusy('Picking the lock…', 2.6, () => finishUnlock(d), d, 'tick'); return; }
  if (d.lock === 'boards' || d.lock === 'front') { startBusy('Prying off the boards…', d.lock === 'front' ? 3.2 : 2.4, () => finishUnlock(d), d, 'hammer'); return; }
  finishUnlock(d);
}
function finishUnlock(d) {
  const L = LOCKS[d.lock]; for (const id of L.use) invTake(id); unlockDoor(d); SFX.unlock(); makeNoise(d.cx, d.y, d.cz, 6);
  if (d.lock === 'boards' || d.lock === 'front') { SFX.hammer(1, sp(d.cx, d.y + 1, d.cz).p); makeNoise(d.cx, d.y, d.cz, 14); }
  msg(d.id === 'g_front' ? 'Unlocked! Open it and run!' : 'Unlocked!', 1600);
  if (d.id !== 'g_front') { setDoor(d, true); SFX.doorOpen(0.9, sp(d.cx, d.y + 1, d.cz).p); }
}
// busy actions (lock picking, prying...): you stand still for a moment
function startBusy(label, dur, cb, target, sfx) { P.busy = { label, dur, t: 0, cb, target, sfx, tick: 0, x: P.x, z: P.z }; }
function updateBusy(dt) {
  const b = P.busy; if (!b) return; b.t += dt; b.tick -= dt;
  if (b.tick <= 0) { b.tick = 0.4; if (b.sfx === 'hammer') { SFX.hammer(0.6, 0); makeNoise(P.x, P.y, P.z, 12); } else { SFX.tick(1); makeNoise(P.x, P.y, P.z, 3); } }
  $('prompt').innerHTML = b.label + ' ' + '█'.repeat(Math.floor(b.t / b.dur * 10)) + '░'.repeat(10 - Math.floor(b.t / b.dur * 10)); $('prompt').classList.add('on');
  if (b.t >= b.dur) { P.busy = null; b.cb(); }
}
// ---------- the study code ----------
let codeDoor = null, codeBuf = '';
function openCodePad(d) {
  codeDoor = d; codeBuf = ''; $('codeShow').textContent = '----'; $('codePad').classList.add('on'); G.padOpen = true; if (document.pointerLockElement) document.exitPointerLock();
}
function codeKey(k) {
  if (k === 'C') codeBuf = ''; else if (k === 'OK') { checkCode(); return; } else if (codeBuf.length < 4) codeBuf += k;
  $('codeShow').textContent = (codeBuf + '----').slice(0, 4); SFX.tick(1);
}
function checkCode() {
  if (codeBuf === G.code) { const d = codeDoor; closeCodePad(); unlockDoor(d); SFX.unlock(); msg('Click! The study is open.', 1800); setDoor(d, true); SFX.doorOpen(1, sp(d.cx, d.y + 1, d.cz).p); }
  else { SFX.locked(); $('codeShow').textContent = 'ERR!'; setTimeout(() => { codeBuf = ''; $('codeShow').textContent = '----'; }, 600); }
}
function closeCodePad() { $('codePad').classList.remove('on'); G.padOpen = false; codeDoor = null; if (G.state === 'play' && !TOUCH) lockPointer(); }
function readNote() { if (!invHas('note')) return; $('noteText').innerHTML = '<b>Grandpa\'s scribble</b><br><br>The study lock code:<br><span style="font-size:34px;letter-spacing:10px">' + G.code.split('').join(' ') + '</span><br><br><small>(Orville never remembers it, so he wrote it down.)</small>'; $('note').classList.add('on'); G.noteOpen = true; if (document.pointerLockElement) document.exitPointerLock(); }
function showNotebook() {
  const ck = (ok, t) => '<li>' + (ok ? '✅ ' : '⬜ ') + t + '</li>', got = id => !!G.got[id], dn = id => DOORS[id] && DOORS[id].unlocked, car = SPECIAL.car, boat = SPECIAL.boat, gate = SPECIAL.gate;
  $('noteText').innerHTML = '<b>📓 My notebook</b><br><small>Things I have found so far. Items are hidden in drawers, cupboards and chests.</small>'
    + '<h4>🚪 Front door</h4><ul>' + ck(got('frontkey'), 'Front door key') + ck(got('crowbar'), 'Crowbar (for the boards)') + '</ul>'
    + '<h4>⛵ Boat (garden dock)</h4><ul>' + ck(boat.key || got('boatkey'), 'Boat key') + ck(boat.prop || got('prop'), 'Propeller') + ck(boat.fuel || (G.got.fuel || 0) >= 1, 'Fuel can') + ck(dn('g_back_out'), 'Back door unlocked (gold key)') + '</ul>'
    + '<h4>🚗 Car (garage)</h4><ul>' + ck(car.key || got('carkey'), 'Car key') + ck(car.bat || got('battery'), 'Battery') + ck(car.fuel || (G.got.fuel || 0) >= 1, 'Fuel can') + ck(SPECIAL.power.on, 'Fuse in the basement fuse box (power)') + ck(!gate.chained, 'Bolt cutters for the gate chain') + ck(dn('g_back_out'), 'Back door unlocked (gold key)') + '</ul>'
    + '<h4>🗝️ Doors</h4><ul>' + ck(dn('u_hall_bed1'), 'Your room (hairpin)') + ck(dn('g_liv_lib'), 'Library (red key)') + ck(dn('u_cor_mas'), 'Master bedroom (blue key)') + ck(dn('g_stairs'), 'Cellar stairs (cellar key)') + ck(dn('g_back_stu'), 'Study (4-digit code on a note)') + ck(dn('u_back_nur'), 'Nursery (boards, crowbar)') + ck(dn('o_shed'), 'Garden shed (green key)') + '</ul>';
  $('note').classList.add('on'); G.noteOpen = true; if (document.pointerLockElement) document.exitPointerLock();
}
function closeNote() { $('note').classList.remove('on'); G.noteOpen = false; if (G.state === 'play' && !TOUCH) lockPointer(); }
// ---------- hiding ----------
function enterHide(hs) {
  for (const e of ENEMIES) if (e.state === 'chase' && canSeePlayer(e)) e.knows = hs;
  P.hidden = hs; P.x = hs.x; P.z = hs.z; P.y = hs.y; P.vy = 0; P.crouch = false; P.hideYaw = Math.atan2(-hs.fx, -hs.fz); P.yaw = P.hideYaw; P.pitch = 0;
  SFX.doorShut(0.5, 0); $('hideTxt').textContent = 'Hiding · press USE to come out'; $('hideTxt').classList.add('on'); G.hideSince = G.time; noteSeen(hs);
}
function leaveHide() {
  const hs = P.hidden; if (!hs) return; for (const e of ENEMIES) e.knows = null; const ox = hs.fx * (hs.dep / 2 + 0.5), oz = hs.fz * (hs.dep / 2 + 0.5); P.x = hs.x + ox; P.z = hs.z + oz; P.hidden = null; pushOut(P);
  SFX.doorOpen(0.6, 0); makeNoise(P.x, P.y, P.z, 3); $('hideTxt').classList.remove('on');
}
function noteSeen() {}
// ---------- other things you can use ----------
function useSpecial(int) {
  const k = int.kind, r = int.ref;
  if (k === 'power') {
    if (r.on) { msg('The fuse box hums quietly.', 1500); return; }
    if (!invHas('fuse')) { SFX.locked(); msg('The fuse box is missing its fuse.', 2600); return; }
    invTake('fuse'); r.on = true; POWER = true; FIXTURES_ON(true); r.sw.material.emissive.setHex(0x30d060); r.sw.material.color.setHex(0x30d060); SFX.thunder(0.5); SFX.unlock(); makeNoise(int.x, int.y, int.z, 15); msg('CLUNK! The lights flicker on. That was loud…', 3200); return;
  }
  if (k === 'garagebtn') {
    if (!POWER) { SFX.locked(); msg('Nothing happens. The house has no power.', 2600); return; }
    r.target = r.target ? 0 : 1; SFX.clang(0.6, 0); SFX.car(0.15); makeNoise(r.x, 0, r.z, 14); msg(r.target ? 'The garage door rattles open.' : 'The garage door rumbles shut.', 2000); return;
  }
  if (k === 'gate') {
    if (r.chained) { if (!invHas('cutters')) { SFX.locked(); msg('The gate is chained shut. You need bolt cutters.', 2800); return; } r.chained = false; scene.remove(r.chain); SFX.clang(1, 0); makeNoise(24, 0, -18, 14); msg('Snap! The chain falls off.', 2000); r.target = 1; return; }
    r.target = r.target ? 0 : 1; SFX.creak(1, 0); return;
  }
  if (k === 'car') { useCar(r); return; }
  if (k === 'boat') { useBoat(r); return; }
}
function useCar(c) {
  const put = (flag, id, text) => { if (!c[flag] && invHas(id)) { invTake(id); c[flag] = true; SFX.pickup(); SFX.clang(0.5, 0); makeNoise(c.x, 0, c.z, 7); msg(text, 1800); return true; } return false; };
  if (put('key', 'carkey', 'Car key in the ignition.') | put('bat', 'battery', 'Battery connected.') | put('fuel', 'fuel', 'Fuel poured in.')) { if (!(c.key && c.bat && c.fuel)) return; }
  const miss = []; if (!c.key) miss.push('a key'); if (!c.bat) miss.push('a battery'); if (!c.fuel) miss.push('fuel'); if (miss.length) { SFX.locked(); msg('The car needs ' + miss.join(', ') + '.', 3000); return; }
  if (!SPECIAL.garage.target || SPECIAL.garage.t < 0.95) { msg('The car is ready, but the garage door is closed. Find the button (and the power).', 3500); return; }
  const gt = SPECIAL.gate; if (gt.chained || gt.t < 0.95) { msg('The car is ready, but the garden gate is chained shut. Cut the chain!', 3500); return; }
  beginEnding('car');
}
function useBoat(b) {
  const put = (flag, id, text) => { if (!b[flag] && invHas(id)) { invTake(id); b[flag] = true; SFX.pickup(); SFX.clang(0.5, sp(b.x, 0, b.z).p); makeNoise(b.x, 0, b.z, 8); msg(text, 1800); return true; } return false; };
  const a = put('key', 'boatkey', 'Boat key in.'), c2 = put('prop', 'prop', 'Propeller attached.'), d = put('fuel', 'fuel', 'Fuel tank filled.');
  const miss = []; if (!b.key) miss.push('a key'); if (!b.prop) miss.push('a propeller'); if (!b.fuel) miss.push('fuel'); if (miss.length) { if (!(a || c2 || d)) { SFX.locked(); msg('The boat needs ' + miss.join(', ') + '.', 3000); } return; }
  beginEnding('boat');
}
// ---------- hunters hear, see, and then... all in the next file ----------
// ---------- placing the items for a new game ----------
function lockNeeds(lock) { return lock ? LOCKS[lock] ? LOCKS[lock].need : lock === 'code' ? ['note'] : [] : []; }
function reachableRooms(owned, start = 'bed1') {
  const edges = DOORDEFS.map(d => [d[5], d[6], d[7]]).concat([['hall', 'uphall', null], ['closet', 'bcorr', null], ['garden', 'dock', null], ['garage', 'garden', 'X']]);
  const seen = new Set([start]), q = [start];
  while (q.length) { const a = q.pop(); for (const [u, v, lk] of edges) { if (lk === 'X') continue; const b = u === a ? v : v === a ? u : null; if (!b || seen.has(b)) continue; if (!lockNeeds(lk).every(i => owned.has(i))) continue; seen.add(b); q.push(b); } }
  return seen;
}
function placeItems(seed) {
  rnd = mulberry32(seed * 7919 + 13); for (const c of CONTS) c.items = [];
  G.code = String(1000 + Math.floor(rnd() * 9000));
  CONTS.find(c => c.id === 'c_bed1a').items.push({ id: 'hairpin', n: 1 });
  const owned = new Set(['hairpin']);
  const chain = shuffle(['redkey', 'bluekey', 'padkey', 'goldkey', 'greenkey', 'note', 'crowbar', 'cutters', 'fuse', 'frontkey', 'carkey', 'battery', 'fuel', 'fuel', 'boatkey', 'prop', 'crossbow', 'bolts', 'bolts', 'flashlight', 'bottle', 'bottle', 'teddy']);
  for (const id of chain) {
    const reach = reachableRooms(owned); let cand = CONTS.filter(c => reach.has(c.room) && c.items.length < 2 && c.id !== 'c_bed1a');
    if (!cand.length) cand = CONTS.filter(c => reach.has(c.room) && c.id !== 'c_bed1a');
    const c = pick(cand); c.items.push({ id, n: id === 'bolts' ? 3 : 1 }); owned.add(id);
  }
  G.placed = CONTS.map(c => c.id + ':' + c.items.map(i => i.id).join('+')).filter(s => !s.endsWith(':'));
}
// ---------- reset everything for a new game ----------
function resetWorld(seed) {
  clearWI(); FLY.length = 0; NOISES.length = 0; G.got = {};
  for (const d of DOORLIST) {
    d.unlocked = !d.lock; d.t = 0; d.target = 0; d.grp.rotation.y = 0; d.solid.on = true;
    if (d.lock) { if (!d.lockMesh || !d.lockMesh.parent) { /* meshes were removed when opened: rebuild below */ } }
  }
  rebuildLocks();
  for (const c of CONTS) { c.opened = false; c.t = 0; c.items = []; for (const m of c.moving) m.position.copy(m.userData.b); }
  const g = SPECIAL.garage; g.t = 0; g.target = 0; g.solid.mesh.position.y = 1.3; g.solid.on = true;
  const t = SPECIAL.gate; t.t = 0; t.target = 0; t.chained = true; t.solid.mesh.position.z = -18; t.solid.on = true; if (!t.chain.parent) scene.add(t.chain);
  const pw = SPECIAL.power; pw.on = false; POWER = false; FIXTURES_ON(false); pw.sw.material.emissive.setHex(0xd03030); pw.sw.material.color.setHex(0xd03030);
  Object.assign(SPECIAL.car, { key: false, bat: false, fuel: false }); Object.assign(SPECIAL.boat, { key: false, prop: false, fuel: false });
  P.inv = [null, null, null, null, null, null, null, null]; P.sel = 0; P.hidden = null; P.busy = null; P.noise = 0; P.stunned = 0; $('hideTxt').classList.remove('on');
  placeItems(seed); renderBar();
}
function rebuildLocks() {                                                  // put the padlocks and boards back on the locked doors
  const colors = { padlock: 0xb4b4bc, gold: 0xe8c040, red: 0xd03030, blue: 0x3a6ae0, green: 0x35b060, code: 0x888890, pins: 0xb4b4bc, front: 0xe8c040 };
  for (const d of DOORLIST) {
    if (!d.lock) continue;
    if (d.planks === null || d.planks === undefined) d.planks = null;
    if (!d.lockMesh && d.lock !== 'boards') { const col = colors[d.lock], axis = d.axis, w = d.w; const pl = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? 0.15 : 0.3, 0.19, axis === 'z' ? 0.3 : 0.15), MAT(col, { map: null, metalness: 0.6, roughness: 0.4, emissive: col, emissiveIntensity: 0.25 })); pl.position.set(axis === 'z' ? d.at + w / 2 - 0.3 : d.fixed, d.y + 1.1, axis === 'z' ? d.fixed : d.at + w / 2 - 0.3); scene.add(pl); d.lockMesh = pl; }
    if ((d.lock === 'boards' || d.lock === 'front') && !d.planks) { d.planks = []; for (let i = 0; i < 3; i++) { const p = d.axis === 'z' ? boxMesh(1.7, 0.2, 0.05, MAT('woodFloor'), 1) : boxMesh(0.05, 0.2, 1.7, MAT('woodFloor'), 1); p.position.set(d.cx + (d.axis === 'x' ? 0.12 : 0), d.y + 0.55 + i * 0.55, d.cz + (d.axis === 'z' ? -0.12 : 0)); if (d.axis === 'z') p.rotation.z = (i - 1) * 0.12; else p.rotation.x = (i - 1) * 0.12; scene.add(p); d.planks.push(p); } }
  }
}
