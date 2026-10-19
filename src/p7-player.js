// ---------- controls ----------
const keys = {}, joy = { x: 0, y: 0 };
let TARGET = null, touchRun = false;
const SPEED = { walk: 2.7, run: 4.5, crouch: 1.3 };
function lockPointer() { if (TOUCH) return; try { const p = renderer.domElement.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
const uiOpen = () => G.padOpen || G.noteOpen;
addEventListener('keydown', e => {
  if (e.code === 'Escape') return;
  keys[e.code] = true;
  if (G.state !== 'play' || uiOpen()) { if (G.padOpen && /^Digit[0-9]$/.test(e.code)) codeKey(e.code.slice(5)); if (G.padOpen && e.code === 'Enter') codeKey('OK'); if (G.padOpen && e.code === 'Backspace') codeKey('C'); if (G.noteOpen && (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'KeyN')) closeNote(); return; }
  if (e.repeat) { if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); return; }
  if (e.code === 'KeyE' || e.code === 'KeyF') doUse();
  else if (e.code === 'KeyQ') dropHeld(false);
  else if (e.code === 'KeyC' || e.code === 'ControlLeft') { P.crouch = !P.crouch; }
  else if (/^Digit[1-8]$/.test(e.code)) selectSlot(+e.code.slice(5) - 1);
  else if (e.code === 'KeyT') dropHeld(true);
  else if (e.code === 'KeyN') showNotebook();
  if (['Space', 'ArrowUp', 'ArrowDown', 'ControlLeft'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
document.addEventListener('mousemove', e => { if (G.state === 'play' && !P.busy && document.pointerLockElement) look(e.movementX, e.movementY, 0.0022); });
document.addEventListener('mousedown', e => { if (G.state === 'play' && document.pointerLockElement && e.button === 0) primary(); else if (G.state === 'play' && !document.pointerLockElement && !TOUCH && !uiOpen() && e.target === renderer.domElement) lockPointer(); });
addEventListener('wheel', e => { if (G.state === 'play' && !uiOpen()) selectSlot((P.sel + (e.deltaY > 0 ? 1 : INV_SLOTS - 1)) % INV_SLOTS); }, { passive: true });
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && G.state === 'play' && !uiOpen() && !G.noPause) pauseGame(); });
function look(dx, dy, k) { const s = CFG.sens * k; const lim = P.hidden ? 0.9 : 99; P.yaw -= dx * s; if (P.hidden) P.yaw = P.hideYaw + clamp(P.yaw - P.hideYaw, -lim, lim); P.pitch = clamp(P.pitch - dy * s, -1.45, 1.45); }
// touch
(function () {
  const stick = $('stick'), lz = $('lookzone'); let sid = null, lid = null, lx = 0, ly = 0, sx = 0, sy = 0;
  stick.addEventListener('pointerdown', e => { sid = e.pointerId; stick.setPointerCapture(sid); const r = stick.getBoundingClientRect(); sx = r.left + r.width / 2; sy = r.top + r.height / 2; moveStick(e); e.preventDefault(); });
  stick.addEventListener('pointermove', e => { if (e.pointerId === sid) moveStick(e); });
  const endStick = e => { if (e.pointerId === sid) { sid = null; joy.x = joy.y = 0; stick.firstElementChild.style.transform = ''; } }; stick.addEventListener('pointerup', endStick); stick.addEventListener('pointercancel', endStick);
  function moveStick(e) { let dx = e.clientX - sx, dy = e.clientY - sy; const d = Math.hypot(dx, dy), m = 55; if (d > m) { dx *= m / d; dy *= m / d; } joy.x = dx / m; joy.y = dy / m; stick.firstElementChild.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; if (Math.hypot(joy.x, joy.y) > 0.92) touchRun = true; else if (Math.hypot(joy.x, joy.y) < 0.8) touchRun = false; }
  lz.addEventListener('pointerdown', e => { if (lid !== null) return; lid = e.pointerId; lz.setPointerCapture(lid); lx = e.clientX; ly = e.clientY; e.preventDefault(); });
  lz.addEventListener('pointermove', e => { if (e.pointerId !== lid) return; look(e.clientX - lx, e.clientY - ly, 0.0042); lx = e.clientX; ly = e.clientY; });
  const endLook = e => { if (e.pointerId === lid) lid = null; }; lz.addEventListener('pointerup', endLook); lz.addEventListener('pointercancel', endLook);
  const btn = (id, down, up) => { const b = $(id); b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('down'); if (G.state === 'play' && !uiOpen()) down(); }); const u = () => { b.classList.remove('down'); if (up) up(); }; b.addEventListener('pointerup', u); b.addEventListener('pointercancel', u); b.addEventListener('pointerleave', u); };
  btn('tUse', () => doUse()); btn('tRun', () => { touchRun = true; }, () => { touchRun = false; }); btn('tCrouch', () => { P.crouch = !P.crouch; $('tCrouch').style.opacity = P.crouch ? 1 : 0.7; }); btn('tDrop', () => dropHeld(false)); btn('tPause', () => pauseGame()); btn('tBook', () => showNotebook()); btn('tShoot', () => primary());
})();
function doUse() {
  if (P.hidden) { leaveHide(); return; } if (P.busy) return;
  if (TARGET) activate(TARGET); else { const id = heldId(); if (id === 'note') readNote(); else if (id && ITEMS[id].throw) dropHeld(true); }
}
function activate(int) {
  switch (int.kind) {
    case 'door': useDoor(int.ref); break; case 'cont': openContainer(int.ref); break; case 'item': pickUp(int.ref); break; case 'hide': enterHide(int.ref); break;
    default: useSpecial(int);
  }
}
function primary() {
  if (P.hidden || P.busy) return; const id = heldId();
  if (id === 'crossbow') fireCrossbow(); else if (id && ITEMS[id].throw) dropHeld(true); else if (id === 'note') readNote(); else if (TARGET) activate(TARGET);
}
function fireCrossbow() {
  if (P.reload > 0) return; const s = P.inv.findIndex(q => q && q.id === 'bolts');
  if (s < 0) { SFX.locked(0.7); msg('No bolts left.', 1200); return; }
  P.inv[s].n--; if (P.inv[s].n <= 0) P.inv[s] = null; renderBar(); P.reload = 1.4; SFX.shoot(); makeNoise(P.x, P.y, P.z, 12);
  const cp = Math.cos(P.pitch), d = { x: -Math.sin(P.yaw) * cp, y: Math.sin(P.pitch), z: -Math.cos(P.yaw) * cp }, ox = P.x, oy = P.y + P.eye, oz = P.z;
  let best = null, bt = 22;
  for (const e of ENEMIES) { const cx = e.x - ox, cy = e.y + 1.0 - oy, cz = e.z - oz, t = cx * d.x + cy * d.y + cz * d.z; if (t < 0.3 || t > bt) continue; const px = ox + d.x * t - e.x, py = oy + d.y * t - (e.y + 1.0), pz = oz + d.z * t - e.z; if (px * px + pz * pz < 0.34 * 0.34 && Math.abs(py) < 0.95 && losClear(ox, oy, oz, e.x, e.y + 1.0, e.z)) { best = e; bt = t; } }
  let wallT = 22; { const n = Math.ceil(22 / 0.3); for (let i = 1; i <= n; i++) { const t = i * 0.3, x = ox + d.x * t, y = oy + d.y * t, z = oz + d.z * t; let hit = false; for (const so of near(x, z, 0.02)) if (so.on && x >= so.x0 && x <= so.x1 && z >= so.z0 && z <= so.z1 && y >= so.y0 && y <= so.top) { hit = true; break; } if (hit || y < -4) { wallT = t; break; } } }
  tracer(ox + d.x * 0.5, oy - 0.15 + d.y * 0.5, oz + d.z * 0.5, ox + d.x * Math.min(bt, wallT), oy + d.y * Math.min(bt, wallT), oz + d.z * Math.min(bt, wallT));
  if (best && bt <= wallT) { stunEnemy(best, 1); SFX.hit(1, sp(best.x, best.y + 1, best.z).p); msg(best.kind === 'gran' ? 'Hit! Grandma Hettie is stunned!' : 'Hit! Grandpa Orville staggers!', 1800); }
}
const TRACERS = [];
function tracer(x0, y0, z0, x1, y1, z1) { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)]); const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 1 })); scene.add(l); TRACERS.push({ l, t: 0.18 }); }
function updateTracers(dt) { for (let i = TRACERS.length - 1; i >= 0; i--) { const t = TRACERS[i]; t.t -= dt; t.l.material.opacity = Math.max(0, t.t / 0.18); if (t.t <= 0) { scene.remove(t.l); t.l.geometry.dispose(); TRACERS.splice(i, 1); } } }
// ---------- interaction targeting ----------
function floorOfY(y) { return y < -1.5 ? 'B' : y > 1.65 ? 'U' : 'G'; }
function findTarget() {
  const ex = P.x, ey = P.y + P.eye + P.stepOff, ez = P.z, cp = Math.cos(P.pitch), dx = -Math.sin(P.yaw) * cp, dy = Math.sin(P.pitch), dz = -Math.cos(P.yaw) * cp;
  let best = null, bs = 1e9;
  for (const it of INTS) {
    const vx = it.x - ex, vy = it.y - ey, vz = it.z - ez; if (Math.abs(vy) > 2.0) continue; const d = Math.hypot(vx, vy, vz); if (d > it.r) continue;
    const c = d < 0.01 ? 1 : (vx * dx + vy * dy + vz * dz) / d; if (d > 0.9 ? c < 0.8 : c < 0.35) continue;
    const s = d * (2.1 - c); if (s >= bs) continue;
    if (it.kind === 'door') { const k = 0.35 / Math.max(d, 0.01); if (!losClear(ex, ey, ez, it.x - vx * k, it.y - vy * k, it.z - vz * k)) continue; }
    else { const k = 0.2 / Math.max(d, 0.01); if (!losClear(ex, ey, ez, it.x - vx * k, it.y - vy * k, it.z - vz * k)) continue; }
    best = it; bs = s;
  }
  return best;
}
function promptFor(it) {
  const r = it.ref;
  switch (it.kind) {
    case 'door': if (r.unlocked) return r.target ? 'Close door' : r.id === 'g_front' ? 'Open the front door' : 'Open door'; return r.lock === 'code' ? 'Enter the code' : LOCKS[r.lock].need.every(invHas) ? (r.lock === 'pins' ? 'Pick the lock' : r.lock === 'boards' ? 'Pry off the boards' : 'Unlock') : 'Locked 🔒';
    case 'cont': return r.opened ? '' : r.kind === 'fridge' ? 'Open fridge' : r.kind === 'chest' ? 'Open' : 'Search';
    case 'item': return 'Take ' + ITEMS[r.id].n; case 'hide': return 'Hide';
    case 'power': return 'Fuse box'; case 'garagebtn': return 'Garage door button'; case 'gate': return r.chained ? 'Chained gate' : 'Gate'; case 'car': return 'The car'; case 'boat': return 'The boat';
  }
  return 'Use';
}
// ---------- the player, every frame ----------
function floorKind() { const R = roomAt(P.x, P.y, P.z); if (!R) return 'grass'; const f = R.floor; return f === 'carpet' ? 'carpet' : f === 'woodFloor' || f === 'woodDark' ? 'wood' : f === 'grass' || f === 'dirt' ? 'grass' : 'stone'; }
let bob = 0;
function updatePlayer(dt) {
  if (P.reload > 0) P.reload -= dt; P.noise = Math.max(0, P.noise - dt * 0.8);
  const hs = P.hidden;
  if (hs) { cam.position.set(hs.x + hs.fx * 0.12, hs.y + 1.45, hs.z + hs.fz * 0.12); cam.rotation.set(P.pitch, P.yaw, 0); TARGET = null; $('prompt').classList.remove('on'); return; }
  if (P.busy) { cam.position.set(P.x, P.y + P.eye + P.stepOff, P.z); cam.rotation.set(P.pitch, P.yaw, 0); updateBusy(dt); return; }
  let ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x, iz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) + joy.y;
  const il = Math.hypot(ix, iz); if (il > 1) { ix /= il; iz /= il; }
  const wantRun = (keys.ShiftLeft || keys.ShiftRight || touchRun) && il > 0.1; P.run = wantRun && !P.crouch; if (wantRun && P.crouch && (keys.ShiftLeft || keys.ShiftRight)) P.crouch = false;
  const spd = (P.crouch ? SPEED.crouch : P.run ? SPEED.run : SPEED.walk) * (il > 1 ? 1 : Math.max(il, 0)), sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  const mx = (cy * ix + sy * iz) * spd, mz = (-sy * ix + cy * iz) * spd;     // right = (cos,-sin), forward = (-sin,-cos)
  const want = Math.hypot(mx, mz) * dt, steps = Math.max(1, Math.ceil(want / 0.12));
  for (let i = 0; i < steps; i++) { P.x += mx * dt / steps; P.z += mz * dt / steps; pushOut(P); }
  // standing on things / falling
  const gy = groundAt(P.x, P.z, P.y);
  if (gy < -1e8) { P.vy -= 20 * dt; P.y += P.vy * dt; if (P.y < -12) { respawnSafe(); } }
  else if (P.y > gy + 0.02) { P.vy -= 20 * dt; P.y += P.vy * dt; if (P.y <= gy) { if (P.vy < -6) SFX.drop(0.6, 0); P.y = gy; P.vy = 0; } }
  else { const d = gy - P.y; if (d > 0.001) P.stepOff -= d; P.y = gy; P.vy = 0; }
  P.stepOff += (0 - P.stepOff) * Math.min(1, dt * 9);
  P.eye += ((P.crouch ? 1.05 : 1.6) - P.eye) * Math.min(1, dt * 10);
  // footsteps and the noise they make
  const moving = Math.hypot(mx, mz) > 0.3; if (moving) { P.walkT += Math.hypot(mx, mz) * dt; bob += dt * (P.run ? 11 : 7.5); const stride = P.run ? 1.7 : P.crouch ? 1.4 : 1.15; if (P.walkT > stride) { P.walkT = 0; SFX.step(floorKind(), P.crouch ? 0.35 : P.run ? 1.15 : 0.8, 0); makeNoise(P.x, P.y, P.z, P.crouch ? 1.2 : P.run ? 9 : 4); } }
  const bobY = moving ? Math.sin(bob) * (P.run ? 0.045 : 0.025) : 0;
  cam.position.set(P.x, P.y + P.eye + P.stepOff + bobY, P.z); cam.rotation.set(P.pitch, P.yaw, moving && P.run ? Math.sin(bob * 0.5) * 0.012 : 0);
  // what am I looking at?
  TARGET = findTarget(); const pr = $('prompt');
  if (TARGET) { const t = promptFor(TARGET); if (t) { pr.innerHTML = (TOUCH ? '' : '<kbd>E</kbd>') + t; pr.classList.add('on'); $('dot').classList.add('hot'); } else { pr.classList.remove('on'); $('dot').classList.remove('hot'); TARGET = TARGET.kind === 'cont' ? null : TARGET; } }
  else { pr.classList.remove('on'); $('dot').classList.remove('hot'); }
}
function respawnSafe() { P.x = ROOMS.bed1.cx; P.z = ROOMS.bed1.cz + 1; P.y = FY.U; P.vy = 0; P.stepOff = 0; }
// light in your hands
function updateHeldLight(dt) {
  const fl = heldId() === 'flashlight';
  heldLight.intensity = lerp(heldLight.intensity, fl ? 1.5 : 0.55, Math.min(1, dt * 6)); heldLight.distance = fl ? 13 : 6.5;
  if (fl) { const d = fwd(); heldLight.position.set(cam.position.x + d.x * 3.2, cam.position.y - 0.1, cam.position.z + d.z * 3.2); } else heldLight.position.copy(cam.position);
}
