// ---------- Grandma Hettie and Grandpa Orville ----------
const ENEMIES = [];
function faceTexture(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gran = kind === 'gran';
  const sk = g.createRadialGradient(64, 60, 10, 64, 64, 66); sk.addColorStop(0, gran ? '#e6d5c0' : '#d6b896'); sk.addColorStop(1, gran ? '#a89683' : '#8e725a'); g.fillStyle = sk; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(60,35,25,0.5)'; g.lineWidth = 1.5; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(22, 34 + i * 3); g.quadraticCurveTo(64, 30 + i * 3 + (i % 2 ? 3 : -3), 106, 34 + i * 3); g.stroke(); }
  g.fillStyle = gran ? '#c8c8cc' : '#e8e8ec'; g.beginPath(); g.moveTo(24, 40); g.quadraticCurveTo(40, gran ? 30 : 24, 56, 42); g.lineTo(56, 47); g.quadraticCurveTo(40, 38, 24, 48); g.fill(); g.beginPath(); g.moveTo(104, 40); g.quadraticCurveTo(88, gran ? 30 : 24, 72, 42); g.lineTo(72, 47); g.quadraticCurveTo(88, 38, 104, 48); g.fill();
  for (const x of [42, 86]) { g.fillStyle = '#1a0a0a'; g.beginPath(); g.ellipse(x, 58, 12, 9, 0, 0, 7); g.fill(); g.fillStyle = '#e8e0d0'; g.beginPath(); g.ellipse(x, 58, 8, 5, 0, 0, 7); g.fill(); g.fillStyle = '#ff2a1a'; g.beginPath(); g.arc(x + (x < 64 ? 1 : -1), 58, 3.2, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(60,30,25,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(64, 62); g.lineTo(58, 84); g.lineTo(68, 85); g.stroke();
  if (gran) { g.fillStyle = '#2a0808'; g.beginPath(); g.moveTo(40, 98); g.quadraticCurveTo(64, 82, 88, 98); g.quadraticCurveTo(64, 116, 40, 98); g.fill(); g.fillStyle = '#e8e0c8'; for (const x of [50, 60, 70, 78]) g.fillRect(x, 94, 4, 6); }
  else { g.fillStyle = '#e8e8ec'; g.beginPath(); g.moveTo(34, 88); g.quadraticCurveTo(64, 74, 94, 88); g.quadraticCurveTo(64, 104, 34, 88); g.fill(); g.fillStyle = '#3a1010'; g.beginPath(); g.moveTo(50, 100); g.quadraticCurveTo(64, 94, 78, 100); g.quadraticCurveTo(64, 110, 50, 100); g.fill(); }
  g.globalCompositeOperation = 'destination-in'; const mk = g.createRadialGradient(64, 62, 30, 64, 62, 64); mk.addColorStop(0, 'rgba(0,0,0,1)'); mk.addColorStop(0.72, 'rgba(0,0,0,1)'); mk.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = mk; g.fillRect(0, 0, 128, 128); g.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
function buildHunter(kind) {
  const gran = kind === 'gran', g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const std = (col, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: 0.85, metalness: 0, emissive: col, emissiveIntensity: 0.08 }, o));
  const skin = std(gran ? 0xd9c2a8 : 0xc9a888), add = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (parent || body).add(m); return m; };
  const S = gran ? 1 : 1.18; g.scale.setScalar(S);
  const dress = gran ? 0x5b3a6e : 0x3a5a3e, top = gran ? 0x9a6a58 : 0x6a4a30, trouser = gran ? 0xb8a898 : 0x45392c;
  add(new THREE.CylinderGeometry(gran ? 0.2 : 0.24, gran ? 0.36 : 0.27, gran ? 0.86 : 0.78, 12), std(dress), 0, gran ? 0.74 : 0.8, 0);
  add(new THREE.CylinderGeometry(gran ? 0.2 : 0.27, gran ? 0.22 : 0.26, gran ? 0.44 : 0.5, 12), std(top), 0, gran ? 1.27 : 1.2, 0);
  if (!gran) add(new THREE.SphereGeometry(0.28, 10, 8), std(0x3a5a3e), 0, 1.0, 0.06).scale.set(1, 0.9, 0.9);
  const head = new THREE.Group(); head.position.set(0, gran ? 1.6 : 1.68, 0); body.add(head); if (gran) head.rotation.x = 0.18;
  add(new THREE.SphereGeometry(gran ? 0.17 : 0.2, 14, 12), skin, 0, 0, 0, head);
  const fm = new THREE.MeshStandardMaterial({ map: faceTexture(kind), roughness: 0.8, emissive: 0xffffff, emissiveIntensity: 0.35, transparent: true, alphaTest: 0.08 }); fm.emissiveMap = fm.map;
  const hr = (gran ? 0.17 : 0.2) + 0.004, face = new THREE.Mesh(new THREE.CylinderGeometry(hr, hr, gran ? 0.3 : 0.34, 18, 1, true, -1.0, 2.0), fm); face.position.set(0, -0.01, 0); head.add(face);
  if (gran) { const hair = add(new THREE.SphereGeometry(0.185, 12, 8, 0, 6.3, 0, 1.7), std(0xc9c9cf), 0, 0.02, -0.01, head); add(new THREE.SphereGeometry(0.085, 8, 6), std(0xc9c9cf), 0, 0.2, -0.1, head); const gl = add(new THREE.TorusGeometry(0.07, 0.008, 5, 12), std(0x222222), 0, 0.02, 0.17, head); }
  else { add(new THREE.CylinderGeometry(0.205, 0.215, 0.07, 12), std(0x3a3a44), 0, 0.15, 0, head); add(new THREE.BoxGeometry(0.26, 0.02, 0.14), std(0x3a3a44), 0, 0.12, 0.2, head); }
  const mk = (x, y, w, h, l, col) => { const p = new THREE.Group(); p.position.set(x, y, 0); body.add(p); add(new THREE.CylinderGeometry(w, w * 0.85, l, 8), std(col), 0, -l / 2, 0, p); return p; };
  const legs = [mk(-0.1 * (gran ? 1 : 1.2), gran ? 0.45 : 0.52, gran ? 0.06 : 0.085, 0, gran ? 0.45 : 0.52, trouser), mk(0.1 * (gran ? 1 : 1.2), gran ? 0.45 : 0.52, gran ? 0.06 : 0.085, 0, gran ? 0.45 : 0.52, trouser)];
  for (const l of legs) add(new THREE.BoxGeometry(0.11, 0.07, 0.2), std(0x1a1210), 0, gran ? -0.43 : -0.5, 0.05, l);
  const arms = [mk(-(gran ? 0.25 : 0.33), gran ? 1.42 : 1.5, gran ? 0.05 : 0.07, 0, 0.5, top), mk(gran ? 0.25 : 0.33, gran ? 1.42 : 1.5, gran ? 0.05 : 0.07, 0, 0.5, top)];
  for (const a of arms) add(new THREE.SphereGeometry(gran ? 0.05 : 0.065, 8, 6), skin, 0, -0.52, 0, a);
  if (gran) { const pan = new THREE.Group(); pan.position.set(0, -0.52, 0.05); arms[1].add(pan); add(new THREE.CylinderGeometry(0.14, 0.14, 0.025, 14), std(0x1a1a1e, { metalness: 0.5 }), 0, 0, 0.2, pan).rotation.x = Math.PI / 2; add(new THREE.BoxGeometry(0.035, 0.035, 0.22), std(0x2a2a2e), 0, 0, 0.05, pan); }
  else { const cane = new THREE.Group(); cane.position.set(0, -0.52, 0.04); arms[0].add(cane); add(new THREE.CylinderGeometry(0.018, 0.018, 1.0, 6), std(0x5a3a1a), 0, -0.3, 0.05, cane); add(new THREE.TorusGeometry(0.06, 0.016, 5, 10, 3.2), std(0x5a3a1a), 0, 0.22, 0.05, cane); }
  for (const x of [-1, 1]) { const eye = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.01), new THREE.MeshBasicMaterial({ color: 0xff3020 })); eye.position.set(x * (gran ? 0.057 : 0.068), gran ? 0.0 : 0.0, gran ? 0.162 : 0.192); eye.visible = false; head.add(eye); }
  return { g, body, head, legs, arms };
}
function makeHunter(kind) {
  const gran = kind === 'gran', m = buildHunter(kind); scene.add(m.g);
  const e = { kind, name: gran ? 'Grandma Hettie' : 'Grandpa Orville', m, g: m.g, x: 0, y: 0, z: 0, yaw: 0, r: 0.28, h: 1.8, fl: 'G', state: 'patrol', path: null, pi: 0, portal: null,
    walk: gran ? 1.7 : 1.15, chase: gran ? 3.6 : 2.55, hear: gran ? 1.0 : 0.45, sight: gran ? 13 : 10.5, stunBase: gran ? 9 : 4.5,
    stun: 0, idleT: 0, searchT: 0, lostT: 0, repathT: 0, lastSeen: null, atk: 0, phase: 0, stepD: 0, humT: rr(3, 7), noiseId: 0, stuckT: 0, stuckN: 0, lx: 0, lz: 0, checked: [], hideGo: null, doorWait: 0, knows: null, speedNow: 0, alert: 0 };
  ENEMIES.push(e); return e;
}
function placeHunter(e, roomId) {
  const R = ROOMS[roomId], n = navNearest(R.fl, R.cx, R.cz, 12); const p = n >= 0 ? nodePos(n) : { x: R.cx, z: R.cz }; e.x = p.x; e.z = p.z; e.fl = R.fl; e.y = FY[R.fl]; e.state = 'patrol'; e.path = null; e.portal = null; e.stun = 0; e.idleT = rr(1, 3); e.lastSeen = null; e.atk = 0; e.knows = null; e.hideGo = null; e.checked = []; e.lostT = 0; e.searchT = 0; e.stuckN = 0; e.lx = e.x; e.lz = e.z; e.g.rotation.set(0, 0, 0); e.m.body.rotation.set(0, 0, 0); e.g.visible = true; e.noiseId = noiseSerial;
}
function resetHunters(first) {
  while (ENEMIES.length < 2) makeHunter(ENEMIES.length ? 'grandpa' : 'gran');
  const dm = DIFF[CFG.diff] || DIFF.normal; for (const e of ENEMIES) { const gran = e.kind === 'gran'; e.walk = (gran ? 1.7 : 1.15) * dm.speed; e.chase = (gran ? 3.6 : 2.55) * dm.speed; e.hear = (gran ? 1.0 : 0.45) * dm.hear; e.sight = (gran ? 13 : 10.5) * dm.sight; }
  const pr = first ? { gran: ['kitchen', 'dining', 'living', 'garage'], grandpa: ['corridor', 'upback', 'playroom', 'bath', 'midhall'] } : { gran: ['kitchen', 'dining', 'living', 'garage', 'backhall', 'hall'], grandpa: ['corridor', 'upback', 'playroom', 'bath', 'midhall'] };
  for (const e of ENEMIES) { placeHunter(e, pick(pr[e.kind])); }
}
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; return d; };
function canSeePlayer(e) {
  if (P.hidden || e.stun > 0) return false; const dx = P.x - e.x, dz = P.z - e.z, dy = P.y - e.y; if (Math.abs(dy) > 2.2) return false; const d = Math.hypot(dx, dz);
  const range = e.sight * (P.crouch ? 0.55 : P.run ? 1.15 : 1); if (d > range) return false;
  const c = (dx * Math.sin(e.yaw) + dz * Math.cos(e.yaw)) / Math.max(d, 0.01); if (c < 0.3 && d > 1.8) return false;
  return losClear(e.x, e.y + 1.5, e.z, P.x, P.y + P.eye * 0.85, P.z);
}
function setPath(e, fl, x, z) { const p = navPath(e.fl, e.x, e.z, fl, x, z); e.path = p; e.pi = 0; return !!p; }
function patrolTarget(e) {
  const rooms = Object.values(ROOMS).filter(r => ['G', 'U', 'B'].includes(r.fl) && r.id !== 'shed' && r.id !== 'dock' && r.id !== 'garden');
  for (let k = 0; k < 8; k++) { let R = pick(rooms); if (rnd() < 0.3) { const pf = floorOfY(P.y), cand = rooms.filter(r => r.fl === pf); if (cand.length) R = pick(cand); } if (R.fl === 'B' && !DOORS.g_stairs.unlocked) continue; if (setPath(e, R.fl, R.cx + rr(-1.5, 1.5), R.cz + rr(-1.5, 1.5))) return true; }
  return false;
}
function investigate(e, x, y, z, hurry) {
  const fl = floorOfY(y); if (setPath(e, fl, x, z)) { e.state = 'investigate'; e.searchT = rr(3, 5); e.idleT = 0; if (hurry) e.alert = 1; return true; } return false;
}
function stunEnemy(e, mult) { e.stun = e.stunBase * (mult || 1); e.state = 'stunned'; e.path = null; e.portal = null; SFX.stun(1, sp(e.x, e.y + 1, e.z).p); }
function updateHunters(dt) {
  if (G.state !== 'play') return; G.chaseD = 99;
  for (const e of ENEMIES) { updateHunter(e, dt); if (e.state === 'chase' || e.state === 'attack') G.chaseD = Math.min(G.chaseD, Math.hypot(P.x - e.x, P.z - e.z)); }
  for (let i = 0; i < ENEMIES.length; i++) for (let j = i + 1; j < ENEMIES.length; j++) { const a = ENEMIES[i], b = ENEMIES[j]; const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz); if (d < 0.7 && d > 0.001 && Math.abs(a.y - b.y) < 1) { const k = (0.7 - d) / 2 / d; a.x -= dx * k; a.z -= dz * k; b.x += dx * k; b.z += dz * k; } }
}
function updateHunter(e, dt) {
  if (!e.portal) e.fl = floorOfY(e.y + 0.5);
  if (e.stun > 0) { e.stun -= dt; e.state = 'stunned'; e.m.body.rotation.z = Math.sin(performance.now() / 120) * 0.12; e.m.head.rotation.z = Math.sin(performance.now() / 90) * 0.3; if (e.stun <= 0) { e.m.body.rotation.z = 0; e.m.head.rotation.z = 0; e.state = 'search'; e.searchT = 7; e.lastSeen = { x: P.x, z: P.z, fl: floorOfY(P.y) }; } animate(e, 0, dt); return; }
  const sees = canSeePlayer(e);
  if (sees) { if (e.state !== 'chase' && e.state !== 'attack') { e.state = 'chase'; e.path = null; e.portal = null; e.alert = 1; e.toLast = false; if (!e.sting || G.time - e.sting > 6) { e.sting = G.time; SFX.hum(e.kind, e.x, e.y + 1, e.z); stingSound(e); } } e.lostT = 0; e.toLast = false; e.lastSeen = { x: P.x, z: P.z, fl: floorOfY(P.y) }; e.knows = null; }
  // hearing
  for (const n of NOISES) { if (n.id <= e.noiseId) continue; e.noiseId = n.id; if (n.who === 'enemy') continue; if (e.state === 'chase' || e.state === 'attack' || e.stun > 0) continue; const dx = n.x - e.x, dz = n.z - e.z, dy = n.y - e.y, d = Math.hypot(dx, dz) + Math.abs(dy) * 1.5; if (d < n.r * e.hear) { if (investigate(e, n.x, n.y, n.z, true)) { e.noiseHeard = G.time; } } }
  if (e.doorWait > 0) { e.doorWait -= dt; animate(e, 0, dt); return; }
  switch (e.state) {
    case 'patrol': {
      if (e.idleT > 0) { e.idleT -= dt; e.yaw += Math.sin(performance.now() / 700 + e.phase) * dt * 0.8; animate(e, 0, dt); break; }
      if (!e.path || e.pi >= e.path.length) { if (!patrolTarget(e)) { e.idleT = 1.5; break; } }
      followPath(e, e.walk, dt); if (e.path && e.pi >= e.path.length) { e.path = null; e.idleT = rr(1.5, 4); }
      break;
    }
    case 'investigate': {
      followPath(e, e.walk * 1.35, dt);
      if (!e.path || e.pi >= e.path.length) { e.state = 'search'; e.searchT = rr(4, 7); e.path = null; e.lastSeen = { x: e.x, z: e.z, fl: e.fl }; }
      break;
    }
    case 'chase': {
      e.repathT -= dt;
      if (sees) {
        const d = Math.hypot(P.x - e.x, P.z - e.z), dy = Math.abs(P.y - e.y);
        if (d < 1.05 && dy < 1.4) { e.state = 'attack'; e.atk = 0; e.path = null; break; }
        if (d < 2.2 && losClear(e.x, e.y + 1, e.z, P.x, P.y + 1, P.z)) { e.path = [{ fl: floorOfY(P.y), x: P.x, z: P.z, last: true }]; e.pi = 0; }
        else if (e.repathT <= 0 || !e.path) { e.repathT = 0.35; if (!setPath(e, floorOfY(P.y), P.x, P.z)) { e.path = null; } }
      } else {
        e.lostT += dt;
        if (e.knows && !e.hideGo) goToHide(e, e.knows);
        if (!e.hideGo && (!e.path || e.pi >= e.path.length)) {
          if (!e.toLast && e.lastSeen) { e.toLast = true; if (!setPath(e, e.lastSeen.fl, e.lastSeen.x, e.lastSeen.z)) { e.state = 'search'; e.searchT = 9; } }
          else { e.state = 'search'; e.searchT = 9; e.toLast = false; }
        }
      }
      if (e.hideGo) { followPath(e, e.chase * 0.85, dt); if (!e.path || e.pi >= e.path.length) checkHide(e, e.hideGo); }
      else if (e.path) followPath(e, e.chase, dt); else animate(e, 0, dt);
      break;
    }
    case 'attack': {
      e.atk += dt; const dx = P.x - e.x, dz = P.z - e.z; e.yaw = Math.atan2(dx, dz); animate(e, 0, dt); e.m.arms[1].rotation.x = -1.4 + Math.sin(e.atk * 12) * 0.3;
      const d = Math.hypot(dx, dz);
      if (P.hidden) { e.state = 'search'; e.searchT = 6; break; }
      if (d > 1.7) { e.state = 'chase'; break; }
      if (e.atk > 0.4) caught(e);
      break;
    }
    case 'search': {
      e.searchT -= dt;
      if (e.hideGo) { followPath(e, e.walk * 1.3, dt); if (!e.path || e.pi >= e.path.length) checkHide(e, e.hideGo); break; }
      if (e.searchT <= 0) { e.state = 'patrol'; e.path = null; e.idleT = 0.5; e.checked = []; break; }
      if (!e.path || e.pi >= e.path.length) {
        // maybe peek into a hiding place nearby
        const c = HIDES.filter(h => h.y === FY[e.fl] && Math.hypot(h.x - e.x, h.z - e.z) < 5 && !e.checked.includes(h) && (!e.lastSeen || Math.hypot(h.x - e.lastSeen.x, h.z - e.lastSeen.z) < 7));
        if (c.length && rnd() < 0.6) { const h = pick(c); e.checked.push(h); e.hideGo = h; goToHide(e, h); break; }
        const ls = e.lastSeen || { x: e.x, z: e.z, fl: e.fl }; if (!setPath(e, ls.fl, ls.x + rr(-5, 5), ls.z + rr(-5, 5))) { e.idleT = 1; animate(e, 0, dt); }
      } else followPath(e, e.walk * 1.25, dt);
      break;
    }
  }
  // voice and heavy breathing
  e.humT -= dt; if (e.humT <= 0) { e.humT = rr(5, 9); SFX.hum(e.kind, e.x, e.y + 1, e.z); }
}
function goToHide(e, h) { e.hideGo = h; const fx = h.x + h.fx * (h.dep / 2 + 0.75), fz = h.z + h.fz * (h.dep / 2 + 0.75); if (!setPath(e, floorOfY(h.y + 0.5), fx, fz)) { e.hideGo = null; e.path = null; } e.hideT = 0; }
function checkHide(e, h) {
  e.hideT = (e.hideT || 0); e.doorWait = 0.9; e.hideGo = null; e.path = null; SFX.doorOpen(0.8, sp(h.x, h.y + 1, h.z).p); e.yaw = Math.atan2(h.x - e.x, h.z - e.z);
  if (P.hidden === h) { caught(e); return; }
  if (e.state === 'chase') { e.state = 'search'; e.searchT = 7; e.knows = null; }
}
function followPath(e, speed, dt) {
  if (e.portal) { movePortal(e, speed, dt); return; }
  if (!e.path || e.pi >= e.path.length) { animate(e, 0, dt); return; }
  const w = e.path[e.pi];
  if (w.portal) { startPortal(e, w); return; }
  let dx = w.x - e.x, dz = w.z - e.z, d = Math.hypot(dx, dz);
  if (d < (w.last ? 0.25 : 0.32)) { e.pi++; return; }
  const k = Math.min(speed * dt, d) / d, mx = dx * k, mz = dz * k;
  // doors in the way are opened
  for (const dr of DOORLIST) { if (dr.t > 0.6 || dr.target || !dr.unlocked || Math.abs(dr.y - e.y) > 1) continue; const ddx = dr.cx - e.x, ddz = dr.cz - e.z, dd = Math.hypot(ddx, ddz); if (dd < 1.35 && ddx * dx + ddz * dz > 0) { setDoor(dr, true); SFX.doorOpen(1, sp(dr.cx, dr.y + 1, dr.cz).p); e.doorWait = e.state === 'chase' ? 0.25 : 0.5; makeNoise(dr.cx, dr.y, dr.cz, 3, 'enemy'); return; } }
  e.x += mx; e.z += mz; pushOut(e); const gy = groundAt(e.x, e.z, e.y); if (gy > -1e8) e.y = gy;
  e.yaw += angDiff(e.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * (e.state === 'chase' ? 12 : 7)); e.speedNow = speed;
  animate(e, speed, dt);
  // stuck?
  e.stuckT += dt; if (e.stuckT > 1.2) { const moved = Math.hypot(e.x - e.lx, e.z - e.lz); e.lx = e.x; e.lz = e.z; e.stuckT = 0; if (moved < speed * 0.25) { e.stuckN++; if (e.stuckN >= 3) { e.x = w.x; e.z = w.z; e.pi++; e.stuckN = 0; } else e.path = null; } else e.stuckN = 0; }
}
function startPortal(e, w) { const p = w.portal, pts = w.dir > 0 ? p.pts : p.pts.slice().reverse(); e.portal = { pts, k: 0, to: w, fromFl: e.fl }; e.x = pts[0][0]; e.z = pts[0][2]; e.y = pts[0][1]; }
function movePortal(e, speed, dt) {
  const P_ = e.portal, a = P_.pts[P_.k], b = P_.pts[P_.k + 1]; if (!b) { e.fl = P_.to.fl; e.x = P_.to.x; e.z = P_.to.z; e.y = FY[P_.to.fl]; e.portal = null; e.pi++; return; }
  const dx = b[0] - e.x, dy = b[1] - e.y, dz = b[2] - e.z, d = Math.hypot(dx, dy, dz), st = speed * 0.8 * dt;
  if (d <= st) { e.x = b[0]; e.y = b[1]; e.z = b[2]; P_.k++; } else { e.x += dx / d * st; e.y += dy / d * st; e.z += dz / d * st; }
  if (Math.hypot(dx, dz) > 0.05) e.yaw += angDiff(e.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 8); animate(e, speed, dt);
}
function animate(e, speed, dt) {
  const m = e.m, mv = Math.min(1, speed / 2); e.phase += dt * (speed * 2.6 + 0.01); const s = Math.sin(e.phase), gran = e.kind === 'gran';
  m.legs[0].rotation.x = s * 0.7 * mv; m.legs[1].rotation.x = -s * 0.7 * mv; if (e.state !== 'attack') { m.arms[0].rotation.x = -s * 0.5 * mv; m.arms[1].rotation.x = e.state === 'chase' ? -0.9 : s * 0.5 * mv; }
  m.body.position.y = Math.abs(s) * 0.035 * mv; m.body.rotation.x = e.state === 'chase' ? 0.12 : 0; if (e.state !== 'stunned') m.body.rotation.z = 0;
  e.g.position.set(e.x, e.y, e.z); e.g.rotation.y = e.yaw;
  if (speed > 0.2 && (e.stepD += dt * speed) > (gran ? 1.15 : 0.9)) { e.stepD = 0; const sp_ = sp(e.x, e.y + 1, e.z); if (sp_.v > 0.02) { SFX.step(gran ? 'wood' : 'stone', sp_.v * (gran ? 1.2 : 1.9), sp_.p); } makeNoise(e.x, e.y, e.z, 0.1, 'enemy'); }
}
function stingSound(e) { snd(t => { tone(t, 220, 0.5, 0.12, 'sawtooth', 0, 440, 0.01); tone(t, 233, 0.5, 0.1, 'square', 0, 466, 0.01); thump(t, 90, 40, 0.4, 0.5); }); }
// ---------- caught! ----------
function drawScare(kind) {
  const c = $('scareFace'), g = c.getContext('2d'), s = 512; g.fillStyle = '#100000'; g.fillRect(0, 0, s, s);
  const gr = g.createRadialGradient(256, 240, 20, 256, 256, 300); gr.addColorStop(0, kind === 'gran' ? '#f0e0cc' : '#e0c4a0'); gr.addColorStop(1, '#4a2a20'); g.fillStyle = gr; g.beginPath(); g.ellipse(256, 270, 190, 235, 0, 0, 7); g.fill();
  g.fillStyle = kind === 'gran' ? '#d4d4dc' : '#e8e8f0'; g.beginPath(); g.ellipse(256, 80, 200, 90, 0, 3.14, 6.28); g.fill(); if (kind !== 'gran') { g.fillStyle = '#2f2f38'; g.fillRect(96, 70, 320, 40); g.fillRect(90, 100, 340, 18); }
  g.strokeStyle = 'rgba(60,20,10,0.6)'; g.lineWidth = 4; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(110, 150 + i * 9); g.quadraticCurveTo(256, 135 + i * 9 + (i % 2 ? 12 : -10), 402, 150 + i * 9); g.stroke(); }
  for (const x of [170, 342]) { g.fillStyle = '#000'; g.beginPath(); g.ellipse(x, 235, 52, 38, 0, 0, 7); g.fill(); g.fillStyle = '#f4ecdc'; g.beginPath(); g.ellipse(x, 235, 38, 24, 0, 0, 7); g.fill(); g.fillStyle = '#ff1a0a'; g.beginPath(); g.arc(x + (x < 256 ? 6 : -6), 235, 15, 0, 7); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(x + (x < 256 ? 6 : -6), 235, 6, 0, 7); g.fill(); g.strokeStyle = '#220808'; g.lineWidth = 12; g.beginPath(); g.moveTo(x - 60, 195 + (x < 256 ? 8 : -8)); g.lineTo(x + 60, 195 + (x < 256 ? -14 : 14)); g.stroke(); }
  g.fillStyle = '#1a0000'; g.beginPath(); g.moveTo(150, 380); g.quadraticCurveTo(256, 300, 362, 380); g.quadraticCurveTo(256, 500, 150, 380); g.fill(); g.fillStyle = '#e8e0c0'; for (let i = 0; i < 8; i++) { g.fillRect(170 + i * 24, 360 + Math.abs(i - 3.5) * 2, 15, 30); g.fillRect(172 + i * 24, 415 - Math.abs(i - 3.5) * 5, 14, 24); }
  if (kind !== 'gran') { g.fillStyle = '#f0f0f6'; g.beginPath(); g.moveTo(130, 330); g.quadraticCurveTo(256, 290, 382, 330); g.quadraticCurveTo(256, 360, 130, 330); g.fill(); }
  g.fillStyle = 'rgba(150,0,0,0.5)'; for (let i = 0; i < 8; i++) { g.fillRect(60 + Math.random() * 400, 0, 6, 100 + Math.random() * 300); }
}
function caught(e) {
  if (G.state !== 'play') return; G.state = 'caught'; G.caughtBy = e; P.busy = null; if (document.pointerLockElement) { G.noPause = true; document.exitPointerLock(); setTimeout(() => { G.noPause = false; }, 400); }
  if (P.hidden) { P.hidden = null; $('hideTxt').classList.remove('on'); }
  setChase(0); SFX.scream(); makeNoise(P.x, P.y, P.z, 1, 'enemy'); $('hurt').style.opacity = 1; $('prompt').classList.remove('on');
  if (CFG.scare) { drawScare(e.kind); $('scare').classList.add('on'); }
  setTimeout(() => { $('scare').classList.remove('on'); $('fade').style.opacity = 1; setTimeout(afterCaught, 700); }, CFG.scare ? 1300 : 500);
}
function afterCaught() {
  G.day++; $('hurt').style.opacity = 0;
  if (G.day > G.maxDays) { endGame(false); return; }
  P.x = ROOMS.bed1.cx - 1.5; P.z = ROOMS.bed1.cz + 0.5; P.y = FY.U; P.yaw = Math.PI / 2; P.pitch = 0; P.vy = 0; P.stepOff = 0; P.crouch = false; P.hidden = null;
  resetHunters(false); updateNights(); G.state = 'play'; G.respawnT = G.time; G.chaseD = 99;
  setTimeout(() => { $('fade').style.opacity = 0; msg('Night ' + G.day + ' of ' + G.maxDays + '. You wake up in your room…', 4000); if (!TOUCH) lockPointer(); }, 400);
}
