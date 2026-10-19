// ---------- furniture, containers, hiding places, lamps ----------
ROOMS.shed = { floor: 'dirt', id: 'shed', name: 'Garden shed', fl: 'G', x0: -19.1, x1: -14.9, z0: -22.7, z1: -19.3, y: 0, cx: -17, cz: -21 };
ROOMS.dock = { floor: 'woodFloor', id: 'dock', name: 'The dock', fl: 'G', x0: -2, x1: 2, z0: -45, z1: -37, y: 0, cx: 0, cz: -41 };
ROOMS.garden = { floor: 'grass', id: 'garden', name: 'The garden', fl: 'G', x0: -24, x1: 24, z0: -37, z1: -11, y: 0, cx: 0, cz: -24 };
const FRONT = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const EXT = (cx, cz, len, dep, f) => { const ns = f === 'n' || f === 's', w = ns ? len : dep, d = ns ? dep : len; return [cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2]; };
function wallPos(room, side, along, dep) {                               // where a piece of furniture goes when its back is against a wall
  const R = ROOMS[room], t = 0.15;
  if (side === 'w') return { cx: R.x0 + t + dep / 2, cz: along, f: 'e' }; if (side === 'e') return { cx: R.x1 - t - dep / 2, cz: along, f: 'w' };
  if (side === 'n') return { cx: along, cz: R.z0 + t + dep / 2, f: 's' }; return { cx: along, cz: R.z1 - t - dep / 2, f: 'n' };
}
function box(room, cx, cz, len, dep, h, f, mat, o = {}) { const y = ROOMS[room].y + (o.y || 0), [a, b, c, d] = EXT(cx, cz, len, dep, f); return B(a, b, y, y + h, c, d, mat, o); }
function deco(room, side, along, len, dep, h, mat, o) { const p = wallPos(room, side, along, dep); return box(room, p.cx, p.cz, len, dep, h, p.f, mat, o); }
// ---- lamps ----
function ceilLamp(room, x, z, o = {}) {
  const R = ROOMS[room], y = R.y + 2.72, lamp = addLamp(x, y - 0.35, z, o.col || 0xffd9a0, o.inten || 1.15, { powered: true, room });
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshBasicMaterial({ color: 0x555555 })); m.position.set(x, y - 0.1, z); scene.add(m);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 5), MAT(0x222222, { map: null })); cap.position.set(x, y + 0.05, z); scene.add(cap);
  FIXT.push({ m, lamp });
}
function candle(room, x, y, z) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.2, 6), MAT(0xd8cdb0, { map: null })); c.position.set(x, y + 0.1, z); scene.add(c);
  const f = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffc060 })); f.position.set(x, y + 0.23, z); f.scale.y = 1.6; scene.add(f);
  addLamp(x, y + 0.45, z, 0xffa860, 0.8, { flick: 1, room });
}
// ---- containers (drawers, chests, fridges...) ----
function container(id, room, cx, cz, f, o = {}) {
  const R = ROOMS[room], len = o.len || 1.0, dep = o.dep || 0.5, h = o.h || 0.85, kind = o.kind || 'drawer', y0 = R.y, [fx, fz] = FRONT[f], ns = f === 'n' || f === 's', al = ns ? [1, 0] : [0, 1];
  const mat = o.mat || 'woodDark', body = box(room, cx, cz, len, dep, h, f, mat, { tile: 1.2 }), moving = [];
  const addPanel = (off, yy, ww, hh, pm, depth = 0.03) => { const px = cx + fx * (dep / 2 + depth / 2) + al[0] * off, pz = cz + fz * (dep / 2 + depth / 2) + al[1] * off, w = ns ? ww : depth, d = ns ? depth : ww; const m = V(px - w / 2, px + w / 2, y0 + yy - hh / 2, y0 + yy + hh / 2, pz - d / 2, pz + d / 2, pm, { dyn: true, tile: 1 }).mesh; m.userData.b = m.position.clone(); moving.push(m); return m; };
  const knob = (off, yy) => { const px = cx + fx * (dep / 2 + 0.05) + al[0] * off, pz = cz + fz * (dep / 2 + 0.05) + al[1] * off; const w = ns ? 0.14 : 0.05, d = ns ? 0.05 : 0.14; const m = V(px - w / 2, px + w / 2, y0 + yy - 0.025, y0 + yy + 0.025, pz - d / 2, pz + d / 2, 0xc9a24a, { dyn: true }).mesh; m.userData.b = m.position.clone(); moving.push(m); };
  const cont = { id, room, kind, x: cx, z: cz, y: y0, h, items: [], opened: false, t: 0, moving, slide: [fx, fz], lift: kind === 'chest' ? 0.34 : 0, top: y0 + h, len, al };
  if (kind === 'chest') {
    const lid = V(cx - (ns ? len : dep) / 2 - 0.02, cx + (ns ? len : dep) / 2 + 0.02, y0 + h, y0 + h + 0.1, cz - (ns ? dep : len) / 2 - 0.02, cz + (ns ? dep : len) / 2 + 0.02, 'woodFloor', { dyn: true, tile: 1 }).mesh; lid.userData.b = lid.position.clone(); lid.userData.lid = true; moving.push(lid); knob(0, h * 0.55);
    for (const off of [-len * 0.3, len * 0.3]) addPanel(off, h * 0.5, 0.06, h * 0.9, 0x555a62, 0.035);
  } else if (kind === 'fridge') {
    addPanel(0, h * 0.5, len - 0.04, h - 0.06, 0xb9bec2, 0.05); knob(-len * 0.35, h * 0.6);
  } else {
    const rows = h > 1.3 ? 3 : 1, cols = len > 0.9 ? 2 : 1;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const off = (c - (cols - 1) / 2) * (len / cols), yy = rows === 1 ? h * 0.55 : h * (0.2 + r * 0.3) + 0.12, hh = rows === 1 ? h * 0.7 : h * 0.26, ww = len / cols - 0.05; addPanel(off, yy, ww, hh, 'woodFloor'); knob(off, yy); }
  }
  cont.anchor = { x: cx, y: y0 + h + (kind === 'chest' ? 0.45 : 0.08), z: cz };
  cont.int = { kind: 'cont', ref: cont, x: cx + fx * (dep / 2 + 0.15), y: y0 + Math.min(h, 1.3) * 0.65, z: cz + fz * (dep / 2 + 0.15), r: 1.5 }; INTS.push(cont.int);
  CONTS.push(cont); return cont;
}
function cab(id, room, side, along, o = {}) { const p = wallPos(room, side, along, o.dep || 0.5); return container(id, room, p.cx, p.cz, p.f, o); }
function updateContainers(dt) {
  for (const c of CONTS) {
    const tg = c.opened ? 1 : 0; if (c.t === tg) continue; c.t = c.t < tg ? Math.min(tg, c.t + dt * 3) : Math.max(tg, c.t - dt * 3);
    for (const m of c.moving) { const b = m.userData.b; if (c.kind === 'chest') m.position.set(b.x, b.y + (m.userData.lid ? c.lift * c.t : 0), b.z); else m.position.set(b.x + c.slide[0] * 0.32 * c.t, b.y, b.z + c.slide[1] * 0.32 * c.t); }
  }
}
// ---- wardrobes and lockers: places to hide ----
function hideSpot(id, room, cx, cz, f, o = {}) {
  const R = ROOMS[room], len = o.len || 1.2, dep = o.dep || 0.6, h = o.h || 2.1, y0 = R.y, [fx, fz] = FRONT[f], ns = f === 'n' || f === 's', al = ns ? [1, 0] : [0, 1];
  box(room, cx, cz, len, dep, h, f, o.mat || 'woodDark', { tile: 1.2 });
  const panel = (off, w2) => { const px = cx + fx * (dep / 2 + 0.012) + al[0] * off, pz = cz + fz * (dep / 2 + 0.012) + al[1] * off, w = ns ? w2 : 0.03, d = ns ? 0.03 : w2; V(px - w / 2, px + w / 2, y0 + 0.12, y0 + h - 0.12, pz - d / 2, pz + d / 2, o.door || 'woodFloor', { tile: 1.2 }); };
  panel(-len / 4, len / 2 - 0.05); panel(len / 4, len / 2 - 0.05);
  for (const off of [-0.06, 0.06]) { const px = cx + fx * (dep / 2 + 0.05) + al[0] * off, pz = cz + fz * (dep / 2 + 0.05) + al[1] * off; V(px - 0.02, px + 0.02, y0 + 1.0, y0 + 1.2, pz - 0.02, pz + 0.02, 0xc9a24a); }
  const hs = { id, room, x: cx, z: cz, y: y0, f, fx, fz, len, dep, h };
  hs.int = { kind: 'hide', ref: hs, x: cx + fx * (dep / 2 + 0.15), y: y0 + 1.2, z: cz + fz * (dep / 2 + 0.15), r: 1.4 }; INTS.push(hs.int); HIDES.push(hs); return hs;
}
function ward(id, room, side, along, o = {}) { const p = wallPos(room, side, along, o.dep || 0.6); return hideSpot(id, room, p.cx, p.cz, p.f, o); }
// ---- beds, chairs, tables... ----
function bed(room, cx, cz, lx, lz, col = 0x5a2a3a) {
  const y = ROOMS[room].y; B(cx - lx / 2, cx + lx / 2, y, y + 0.5, cz - lz / 2, cz + lz / 2, 'woodDark', { tile: 1.2 });
  V(cx - lx / 2 + 0.03, cx + lx / 2 - 0.03, y + 0.5, y + 0.66, cz - lz / 2 + 0.03, cz + lz / 2 - 0.03, col, { tile: 1 });
}
function chair(room, cx, cz, col = 0x4a3020) { const y = ROOMS[room].y; B(cx - 0.23, cx + 0.23, y, y + 0.5, cz - 0.23, cz + 0.23, col, { tile: 1 }); V(cx - 0.23, cx + 0.23, y + 0.5, y + 0.95, cz - 0.23, cz - 0.17, col, { tile: 1 }); }
function table(room, cx, cz, lx, lz, h = 0.78, mat = 'woodDark') { const y = ROOMS[room].y; B(cx - lx / 2, cx + lx / 2, y, y + h, cz - lz / 2, cz + lz / 2, mat, { tile: 1.4 }); }
function rug(room, cx, cz, lx, lz, col = 0x6a2030) { const y = ROOMS[room].y; V(cx - lx / 2, cx + lx / 2, y + 0.004, y + 0.012, cz - lz / 2, cz + lz / 2, col, { tile: 1 }); }
function portrait(x, y, z, axis, face) { const w = 0.7, h = 0.9, m = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? w : 0.05, h, axis === 'z' ? 0.05 : w), MAT(0x2a1c14, { map: null })); m.position.set(x, y, z); scene.add(m); const p = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? w - 0.12 : 0.055, h - 0.12, axis === 'z' ? 0.055 : w - 0.12), MAT(0x5a5040, { map: null, roughness: 1 })); p.position.set(x + (axis === 'x' ? face * 0.005 : 0), y, z + (axis === 'z' ? face * 0.005 : 0)); scene.add(p); }
// ---------- the rooms ----------
function furnish() {
  // front hall
  cab('c_hall', 'hall', 'e', 5.5, { len: 1.2 }); ward('h_hall', 'hall', 'n', 2.9); deco('hall', 'w', 3.9, 0.6, 0.4, 2.0, 'woodDark'); rug('hall', 0, 7, 2.6, 5, 0x5a1c24);
  ceilLamp('hall', 0, 7); candle('hall', 3.6, 0.85, 5.1); portrait(3.8, 1.9, 8.4, 'x', -1);
  // living room
  deco('living', 's', -10, 3.0, 0.9, 0.85, 'fabricRed'); table('living', -10, 7.5, 1.4, 0.8, 0.45); cab('c_liv1', 'living', 'w', 7.0, { len: 1.4 }); cab('c_liv2', 'living', 'n', -12.3, { len: 1.2 });
  box('living', -6.2, 5.2, 0.9, 0.9, 0.8, 'n', 'fabric'); deco('living', 'w', 4.6, 1.6, 0.5, 1.3, 'stone', { tile: 1 }); ward('h_liv', 'living', 'n', -5.4); rug('living', -10, 7.5, 3.4, 2.6, 0x30203a);
  ceilLamp('living', -9, 7); candle('living', -10, 0.45, 7.5);
  // library
  deco('library', 'w', -1.0, 4.0, 0.5, 2.4, 'woodDark'); deco('library', 'n', -9, 5.0, 0.5, 2.4, 'woodDark'); container('c_lib1', 'library', -8, -0.3, 's', { len: 1.6, dep: 0.8, h: 0.8 });
  cab('c_lib2', 'library', 'e', -1.5, { len: 1.0 }); ward('h_lib', 'library', 'w', 1.9); box('library', -6.5, 1.0, 0.9, 0.9, 0.8, 'n', 'fabric'); rug('library', -8.5, 0.5, 3.4, 2.4, 0x2a2438);
  ceilLamp('library', -9, 0); candle('library', -8.6, 0.8, -0.3);
  // dining room
  table('dining', 9, 7, 3.6, 1.3); for (const [x, z] of [[8, 5.7], [10, 5.7], [8, 8.3], [10, 8.3]]) chair('dining', x, z);
  cab('c_din1', 'dining', 'e', 5.5, { len: 1.4, h: 1.9 }); cab('c_din2', 'dining', 's', 11, { len: 1.5 }); deco('dining', 'e', 9.5, 0.6, 0.4, 2.0, 'woodDark');
  ceilLamp('dining', 9, 7); candle('dining', 8.4, 0.78, 7); candle('dining', 9.6, 0.78, 7);
  // hallway
  cab('c_mid1', 'midhall', 'e', 1.7, { len: 1.2 }); ward('h_mid', 'midhall', 'e', -3.2); ceilLamp('midhall', 0.8, -0.5); candle('midhall', 3.6, 0.85, 1.7); rug('midhall', 0.5, -0.5, 1.8, 5, 0x30203a);
  addLamp(-3.1, 1.1, -3.0, 0xffa860, 0.7, { flick: 1, room: 'closet' }); portrait(-1.9, 1.9, 1.5, 'x', 1);
  // kitchen
  cab('c_kit1', 'kitchen', 'e', 0.5, { len: 2.4, dep: 0.6, h: 0.9, mat: 'metal' }); cab('c_kit2', 'kitchen', 'e', -2.9, { len: 0.8, dep: 0.7, h: 1.9, kind: 'fridge', mat: 'metal' }); cab('c_kit3', 'kitchen', 'n', 12, { len: 1.2, dep: 0.6, h: 0.9, mat: 'metal' });
  deco('kitchen', 'n', 6, 1.0, 0.6, 0.9, 'metal'); table('kitchen', 11, -0.6, 1.8, 1.0, 0.9, 'tile'); ward('h_kit', 'kitchen', 's', 5.0); ceilLamp('kitchen', 9, 0); candle('kitchen', 11, 0.9, -0.6);
  // back hall
  cab('c_back1', 'backhall', 'n', -2.5, { len: 1.2 }); ward('h_back', 'backhall', 'n', 2.6); deco('backhall', 'e', -5.2, 1.0, 0.4, 0.5, 'woodDark'); ceilLamp('backhall', 0, -7.5);
  // garage (with the car)
  box('garage', 9.2, -8.0, 4.4, 1.9, 0.9, 'n', 0x7a1f1f); box('garage', 9.2, -7.7, 2.2, 1.7, 0.55, 'n', 0x6a1818, { y: 0.9 }); V(8.3, 10.1, 1.0, 1.4, -8.8, -6.6, 0x20262c, { tile: 1 });
  for (const [x, z] of [[8.2, -9.3], [10.2, -9.3], [8.2, -6.6], [10.2, -6.6]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 12), MAT(0x15161a, { map: null })); w.rotation.z = Math.PI / 2; w.position.set(x, 0.34, z); scene.add(w); }
  SPECIAL.car = { x: 9.2, z: -8.0, ready: false, key: false, bat: false, fuel: false, done: 0 }; SPECIAL.car.int = { kind: 'car', ref: SPECIAL.car, x: 8.0, y: 1.0, z: -7.2, r: 1.6 }; INTS.push(SPECIAL.car.int);
  cab('c_gar1', 'garage', 'e', -7.5, { len: 2.2, dep: 0.6, h: 0.95 }); cab('c_gar2', 'garage', 'w', -10.0, { len: 1.4, h: 1.6 }); box('garage', 13.3, -10.2, 0.8, 0.8, 0.8, 'n', 'woodFloor'); box('garage', 12.2, -10.4, 0.8, 0.8, 0.6, 'n', 'woodFloor');
  ceilLamp('garage', 9, -7.5);
  // study
  container('c_stu1', 'study', -9.6, -8.5, 'e', { len: 2.0, dep: 0.9, h: 0.8 }); cab('c_stu2', 'study', 'n', -12, { len: 0.9, dep: 0.7, h: 0.9, kind: 'chest', mat: 'metal' });
  deco('study', 'w', -7.5, 5.0, 0.5, 2.4, 'woodDark'); box('study', -6.5, -5.5, 0.9, 0.9, 0.8, 'n', 'fabric'); ward('h_stu', 'study', 's', -12.5); ceilLamp('study', -9, -7.5); candle('study', -9.6, 0.8, -8.0);
  // upstairs hall
  cab('c_uph1', 'uphall', 'e', 5.5, { len: 1.4 }); ward('h_uph', 'uphall', 's', 0, { len: 1.4 }); ceilLamp('uphall', 1, 7); candle('uphall', 3.6, 4.15, 5.5); rug('uphall', 1, 7, 2.4, 5, 0x5a1c24);
  // your room (you wake up here)
  bed('bed1', -12.85, 5.5, 2.0, 1.1, 0x35507a); cab('c_bed1a', 'bed1', 'w', 4.2, { len: 0.5, dep: 0.45, h: 0.55 }); cab('c_bed1b', 'bed1', 'n', -9, { len: 1.2 }); ward('h_bed1', 'bed1', 's', -11, { len: 1.4 });
  deco('bed1', 'n', -6.3, 1.4, 0.6, 0.8, 'woodDark'); chair('bed1', -6.3, 4.2); ceilLamp('bed1', -9, 7); candle('bed1', -13.6, 3.85, 4.2); rug('bed1', -9.5, 6.5, 3, 2.2, 0x30203a);
  // guest room
  bed('bed2', 12.85, 6.0, 2.0, 1.6, 0x7a2a3a); cab('c_bed2a', 'bed2', 'e', 4.3, { len: 0.5, dep: 0.45, h: 0.55 }); cab('c_bed2b', 'bed2', 'e', 7.7, { len: 0.5, dep: 0.45, h: 0.55 }); cab('c_bed2c', 'bed2', 'n', 9, { len: 1.4 }); ward('h_bed2', 'bed2', 's', 9, { len: 1.4 });
  ceilLamp('bed2', 9, 7); candle('bed2', 13.6, 3.3 + 0.55, 4.3);
  // corridor
  cab('c_cor1', 'corridor', 'e', 1.8, { len: 1.2 }); cab('c_cor2', 'corridor', 'w', 1.8, { len: 1.2 }); ceilLamp('corridor', 0, -0.5); candle('corridor', 3.6, 3.3 + 0.85, 1.8);
  // master bedroom
  bed('master', -12.85, -0.5, 2.0, 1.6, 0x6a1c2a); cab('c_mas1', 'master', 'w', -2.4, { len: 0.5, dep: 0.45, h: 0.55 }); cab('c_mas2', 'master', 'w', 1.4, { len: 0.5, dep: 0.45, h: 0.55 }); cab('c_mas3', 'master', 'n', -9, { len: 1.6 });
  cab('c_mas4', 'master', 's', -8.5, { len: 1.2, h: 0.8 }); ward('h_mas', 'master', 'n', -6, { len: 1.4 }); ceilLamp('master', -9, -0.5); candle('master', -13.6, 3.85, -2.4);
  // bathroom
  deco('bath', 'e', -2.2, 1.8, 0.8, 0.6, 'tile'); deco('bath', 's', 12.5, 0.5, 0.6, 0.45, 'tile'); cab('c_bath1', 'bath', 's', 9, { len: 1.0, h: 0.9 }); cab('c_bath2', 'bath', 'n', 6, { len: 0.6, h: 0.7, kind: 'chest' }); ceilLamp('bath', 9, 0);
  // back landing, nursery, playroom
  cab('c_upb1', 'upback', 'n', -1.8, { len: 1.2 }); ward('h_upb', 'upback', 'n', 1.8); ceilLamp('upback', 0, -7.5);
  deco('nursery', 'w', -9.5, 1.6, 0.9, 0.9, 'woodFloor'); cab('c_nur1', 'nursery', 'n', -7, { len: 1.0, h: 0.6, kind: 'chest' }); cab('c_nur2', 'nursery', 'w', -6.0, { len: 1.2 }); ward('h_nur', 'nursery', 's', -10, { len: 1.4 });
  box('nursery', -9, -8, 0.7, 0.7, 0.6, 'n', 'fabric'); ceilLamp('nursery', -9, -7.5); rug('nursery', -9, -7, 3, 2.4, 0x6a8ab0);
  cab('c_ply1', 'playroom', 'e', -9, { len: 1.2, dep: 0.6, h: 0.6, kind: 'chest' }); cab('c_ply2', 'playroom', 'n', 9, { len: 1.6, h: 1.2 }); ward('h_ply', 'playroom', 's', 12, { len: 1.4 }); table('playroom', 9.5, -7, 1.2, 0.8, 0.5); ceilLamp('playroom', 9, -7.5);
  // basement
  cab('c_bc1', 'bcorr', 'e', 1.0, { len: 1.6, h: 1.6 }); box('bcorr', 3.4, -3.2, 0.8, 0.8, 0.8, 'n', 'woodFloor'); ward('h_bc', 'bcorr', 's', 1.5, { len: 0.9, dep: 0.5, mat: 'metal', door: 'metal' }); ceilLamp('bcorr', 0.5, -0.5, { inten: 0.9 });
  box('boiler', 1.8, -9.2, 2.0, 2.0, 2.4, 'n', 'rust', { tile: 1.5 }); cab('c_boil1', 'boiler', 's', -2.0, { len: 1.2, h: 0.9 }); ward('h_boil', 'boiler', 'n', -2.6, { len: 1.0, dep: 0.55, mat: 'metal', door: 'metal' }); ceilLamp('boiler', 0, -7.5, { inten: 0.9 });
  V(3.78, 3.85, FY.B + 1.15, FY.B + 1.6, -6.3, -5.7, 0x2b2f35);
  const sw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.1), MAT(0xd03030, { map: null, emissive: 0xd03030, emissiveIntensity: 0.6 })); sw.position.set(3.72, FY.B + 1.4, -6.0); scene.add(sw);
  SPECIAL.power = { on: false, sw }; SPECIAL.power.int = { kind: 'power', ref: SPECIAL.power, x: 3.6, y: FY.B + 1.4, z: -6.0, r: 1.6 }; INTS.push(SPECIAL.power.int);
  deco('cellar', 'w', 0, 4.0, 0.5, 1.9, 'woodDark'); box('cellar', -6.5, 1.8, 0.9, 0.9, 1.0, 'n', 'woodFloor'); box('cellar', -5.5, 2.1, 0.9, 0.9, 1.0, 'n', 'woodFloor');
  cab('c_cel1', 'cellar', 's', -9, { len: 1.2, dep: 0.6, h: 0.6, kind: 'chest' }); cab('c_cel2', 'cellar', 'e', 0.2, { len: 1.0, h: 1.2 }); ward('h_cel', 'cellar', 'n', -12.5, { len: 1.0, dep: 0.55, mat: 'metal', door: 'metal' }); ceilLamp('cellar', -9, -0.5, { inten: 0.9 });
  cab('c_wk1', 'workshop', 'w', -7.5, { len: 3.0, dep: 0.7, h: 0.95 }); cab('c_wk2', 'workshop', 'n', -8, { len: 1.4, h: 1.6 }); box('workshop', -5.4, -10.2, 0.9, 0.9, 1.0, 'n', 'woodFloor'); ward('h_wk', 'workshop', 'n', -12, { len: 1.0, dep: 0.55, mat: 'metal', door: 'metal' }); ceilLamp('workshop', -9, -7.5, { inten: 0.9 });
  // lanterns outside so you can find the doors
  const lantern = (x, y, z, room) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 0.22), new THREE.MeshBasicMaterial({ color: 0xffd080 })); m.position.set(x, y, z); scene.add(m); addLamp(x, y - 0.2, z, 0xffb060, 1.0, { flick: 1, room }); };
  lantern(1.5, 2.4, -11.4, 'garden'); lantern(9, 2.9, -11.4, 'garden'); lantern(1.6, 2.4, 11.4, 'front'); lantern(23.5, 2.2, -15.2, 'garden');
  // outdoors
  container('c_shed1', 'shed', -18.65, -21.5, 'e', { len: 1.4, dep: 0.6, h: 1.0 }); container('c_shed2', 'shed', -15.35, -21.5, 'w', { len: 1.4, dep: 0.6, h: 1.0 });
  container('c_dock', 'dock', -1.4, -40.0, 'e', { len: 1.2, dep: 0.5, h: 0.6, kind: 'chest' });
  container('c_gard1', 'garden', 14, -27, 's', { len: 1.0, dep: 0.6, h: 0.6, kind: 'chest', mat: 'rust' }); container('c_gard2', 'garden', -12, -16, 's', { len: 1.0, dep: 0.6, h: 0.6, kind: 'chest', mat: 'rust' });
}
const FIXTURES_ON = on => { for (const f of FIXT) f.m.material.color.setHex(on ? 0xfff0c0 : 0x444444); };
