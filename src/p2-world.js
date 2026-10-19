// ---------- the house ----------
const FY = { B: -3, G: 0, U: 3.3 }, FLK = ['B', 'G', 'U'], WH = 3.0, WT = 0.3, DW = 1.2, DH = 2.15, STEP = 0.5;
const XS = [-14, -4, 4, 14], ZS = [-11, -4, 3, 11];          // column and row edges: a 3 x 3 grid of rooms on every floor
const SOLIDS = [], STATIC = [], INTS = [], HIDES = [], CONTS = [], DOORLIST = [], DOORS = {}, ROOMS = {}, FIXT = [], SPECIAL = {};
const matOf = m => typeof m === 'string' ? MAT(m) : typeof m === 'number' ? MAT(m, { map: null }) : m;
function boxMesh(w, h, d, mat, tile = 2.2) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile); }
  return new THREE.Mesh(g, mat);
}
// B(...) draws a box and (unless told otherwise) makes it solid. Static boxes are merged into a few big meshes after the build.
function B(x0, x1, y0, y1, z0, z1, mat, o = {}) {
  let mesh = null;
  if (o.vis !== false) { mesh = boxMesh(x1 - x0, y1 - y0, z1 - z0, matOf(mat), o.tile || 2.2); mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); scene.add(mesh); if (!o.dyn) STATIC.push(mesh); }
  if (o.solid === false) return { mesh };
  const s = { x0, x1, y0, top: y1, z0, z1, mesh, on: true, nav: o.nav !== false, tag: o.tag || '' }; SOLIDS.push(s); return s;
}
const V = (x0, x1, y0, y1, z0, z1, mat, o = {}) => B(x0, x1, y0, y1, z0, z1, mat, Object.assign({ solid: false }, o));   // look only
const BX = (cx, cz, w, d, y0, y1, mat, o) => B(cx - w / 2, cx + w / 2, y0, y1, cz - d / 2, cz + d / 2, mat, o);
function mergeStatics() {
  const groups = new Map();
  for (const m of STATIC) { const p = m.position, key = m.material.uuid + '|' + Math.round(p.y / 3.3) + '|' + Math.floor((p.x + 60) / 10) + '|' + Math.floor((p.z + 90) / 10); let g = groups.get(key); if (!g) groups.set(key, g = { mat: m.material, list: [] }); g.list.push(m); }
  const v = new THREE.Vector3();
  for (const { mat, list } of groups.values()) {
    const parts = list.map(m => { m.updateMatrixWorld(true); return { m, g: m.geometry.index ? m.geometry.toNonIndexed() : m.geometry }; });
    let n = 0; parts.forEach(p => { n += p.g.attributes.position.count; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
    for (const { m, g } of parts) {
      const p = g.attributes.position, nn = g.attributes.normal, u = g.attributes.uv, e = new THREE.Matrix3().getNormalMatrix(m.matrixWorld);
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); pos[(o + i) * 3] = v.x; pos[(o + i) * 3 + 1] = v.y; pos[(o + i) * 3 + 2] = v.z; v.fromBufferAttribute(nn, i).applyMatrix3(e).normalize(); nor[(o + i) * 3] = v.x; nor[(o + i) * 3 + 1] = v.y; nor[(o + i) * 3 + 2] = v.z; uv[(o + i) * 2] = u.getX(i); uv[(o + i) * 2 + 1] = u.getY(i); }
      o += p.count; scene.remove(m); m.geometry.dispose(); if (g !== m.geometry) g.dispose();
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.computeBoundingSphere();
    scene.add(new THREE.Mesh(geo, mat));
  }
  STATIC.length = 0;
}
// ---------- the plan: 3 floors x 3 x 3 rooms ----------   [id, name, wall texture, floor texture]
const PLAN = {
  G: [[['study', 'Study', 'wallGreen', 'carpet'], ['backhall', 'Back hall', 'plaster', 'tile'], ['garage', 'Garage', 'concrete', 'concrete']],
      [['library', 'Library', 'wallRed', 'woodDark'], ['midhall', 'Hallway', 'plaster', 'woodFloor'], ['kitchen', 'Kitchen', 'plaster', 'tile']],
      [['living', 'Living room', 'wallRed', 'carpet'], ['hall', 'Front hall', 'wallGreen', 'woodFloor'], ['dining', 'Dining room', 'wallBlue', 'woodFloor']]],
  U: [[['nursery', 'Nursery', 'wallBlue', 'carpet'], ['upback', 'Back landing', 'plaster', 'woodFloor'], ['playroom', 'Playroom', 'wallGreen', 'woodFloor']],
      [['master', 'Master bedroom', 'wallRed', 'carpet'], ['corridor', 'Corridor', 'plaster', 'woodFloor'], ['bath', 'Bathroom', 'tileBath', 'tileBath']],
      [['bed1', 'Your room', 'wallBlue', 'woodFloor'], ['uphall', 'Upstairs hall', 'wallGreen', 'carpet'], ['bed2', 'Guest room', 'wallRed', 'woodFloor']]],
  B: [[['workshop', 'Workshop', 'stone', 'concrete'], ['boiler', 'Boiler room', 'stone', 'concrete'], null],
      [['cellar', 'Cellar', 'stone', 'concrete'], ['bcorr', 'Basement', 'concrete', 'concrete'], null],
      [null, null, null]],
};
for (const fl of FLK) for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const e = PLAN[fl][r][c]; if (!e) continue; const [id, name, wall, floor] = e; ROOMS[id] = { id, name, fl, c, r, x0: XS[c], x1: XS[c + 1], z0: ZS[r], z1: ZS[r + 1], wall, floor, y: FY[fl], cx: (XS[c] + XS[c + 1]) / 2, cz: (ZS[r] + ZS[r + 1]) / 2 }; }
const roomAt = (x, y, z) => { for (const k in ROOMS) { const R = ROOMS[k]; if (x >= R.x0 && x < R.x1 && z >= R.z0 && z < R.z1 && y >= R.y - 0.6 && y < R.y + 3.2) return R; } return null; };
// stairwell holes in the floors: main stairs (up to the landing) and the cellar stairs (down)
const HOLES = { G: [{ x0: -4, x1: -2.3, z0: -1.5, z1: 2.7 }], U: [{ x0: -4, x1: -2.4, z0: 4.4, z1: 8.3 }] };
function slabPiece(x0, x1, z0, z1, y1, fmat) {
  if (x1 - x0 < 0.01 || z1 - z0 < 0.01) return;
  B(x0, x1, y1 - 0.3, y1, z0, z1, 'plaster', { vis: false, tag: 'slab' });
  V(x0, x1, y1 - 0.3, y1 - 0.02, z0, z1, 'plaster'); V(x0, x1, y1 - 0.02, y1, z0, z1, fmat, { tile: 2.6 });
}
function buildFloors() {
  for (const k in ROOMS) {
    const R = ROOMS[k], hs = (HOLES[R.fl] || []).filter(h => h.x1 > R.x0 && h.x0 < R.x1 && h.z1 > R.z0 && h.z0 < R.z1);
    if (!hs.length) { slabPiece(R.x0, R.x1, R.z0, R.z1, R.y, R.floor); continue; }
    const h = hs[0], hx0 = Math.max(h.x0, R.x0), hx1 = Math.min(h.x1, R.x1), hz0 = Math.max(h.z0, R.z0), hz1 = Math.min(h.z1, R.z1);
    slabPiece(R.x0, hx0, R.z0, R.z1, R.y, R.floor); slabPiece(hx1, R.x1, R.z0, R.z1, R.y, R.floor);
    slabPiece(hx0, hx1, R.z0, hz0, R.y, R.floor); slabPiece(hx0, hx1, hz1, R.z1, R.y, R.floor);
  }
}
// ---------- walls (with door gaps) ----------
function wall(axis, fixed, a0, a1, fl, gaps, mLow, mHigh) {      // axis 'z' = the wall runs along x at z=fixed; 'x' = runs along z at x=fixed. mLow faces the smaller coordinate.
  const y0 = FY[fl], y1 = y0 + WH, h = WT / 2; let cur = a0;
  const seg = (s0, s1, ya, yb) => { if (s1 - s0 < 0.01 || yb - ya < 0.01) return; if (axis === 'z') { B(s0, s1, ya, yb, fixed - h, fixed, mLow); B(s0, s1, ya, yb, fixed, fixed + h, mHigh); } else { B(fixed - h, fixed, ya, yb, s0, s1, mLow); B(fixed, fixed + h, ya, yb, s0, s1, mHigh); } };
  for (const d of gaps.slice().sort((p, q) => p.at - q.at)) { const gh = d.h || DH; seg(cur, d.at - d.w / 2, y0, y1); seg(d.at - d.w / 2, d.at + d.w / 2, y0 + gh, y1); cur = d.at + d.w / 2; }
  seg(cur, a1, y0, y1);
}
// doors: [id, floor, wall axis, wall coordinate, position along the wall, room on the low side, room on the high side, lock, swing]
const DOORDEFS = [
  ['g_liv_hall', 'G', 'x', -4, 9.5, 'living', 'hall', null, 1], ['g_hall_din', 'G', 'x', 4, 9.5, 'hall', 'dining', null, -1], ['g_hall_mid', 'G', 'z', 3, 0, 'midhall', 'hall', null, 1],
  ['g_liv_lib', 'G', 'z', 3, -9, 'library', 'living', 'red', 1], ['g_din_kit', 'G', 'z', 3, 9, 'kitchen', 'dining', null, -1],
  ['g_mid_kit', 'G', 'x', 4, -0.5, 'midhall', 'kitchen', null, -1], ['g_mid_back', 'G', 'z', -4, 0, 'backhall', 'midhall', null, 1],
  ['g_kit_gar', 'G', 'z', -4, 9, 'garage', 'kitchen', null, -1], ['g_back_gar', 'G', 'x', 4, -7.5, 'backhall', 'garage', null, -1], ['g_back_stu', 'G', 'x', -4, -7.5, 'study', 'backhall', 'code', 1],
  ['g_back_out', 'G', 'z', -11, 0, 'garden', 'backhall', 'gold', -1], ['g_front', 'G', 'z', 11, 0, 'hall', 'front', 'front', 1],
  ['g_stairs', 'G', 'x', -2.3, -2.5, 'closet', 'midhall', 'padlock', 1],
  ['u_hall_bed1', 'U', 'x', -4, 9.5, 'bed1', 'uphall', 'pins', -1], ['u_hall_bed2', 'U', 'x', 4, 9.5, 'uphall', 'bed2', null, 1], ['u_hall_cor', 'U', 'z', 3, 0, 'corridor', 'uphall', null, 1],
  ['u_cor_mas', 'U', 'x', -4, -0.5, 'master', 'corridor', 'blue', 1], ['u_cor_bath', 'U', 'x', 4, -0.5, 'corridor', 'bath', null, 1], ['u_cor_back', 'U', 'z', -4, 0, 'upback', 'corridor', null, 1],
  ['u_back_nur', 'U', 'x', -4, -7.5, 'nursery', 'upback', 'boards', 1], ['u_back_play', 'U', 'x', 4, -7.5, 'upback', 'playroom', null, 1],
  ['b_cor_cel', 'B', 'x', -4, -3.0, 'cellar', 'bcorr', null, 1], ['b_cor_boil', 'B', 'z', -4, 0, 'boiler', 'bcorr', null, 1], ['b_cel_work', 'B', 'z', -4, -9, 'workshop', 'cellar', null, 1], ['b_boil_work', 'B', 'x', -4, -7.5, 'workshop', 'boiler', null, 1],
  ['o_shed', 'G', 'z', -19.3, -17, 'garden', 'shed', 'green', -1],
];
const GAPS = [{ fl: 'G', axis: 'z', fixed: -11, at: 9, w: 5, h: 2.6 }];     // the garage roll-up door
const OUTER = 'brick';
function buildWalls() {
  const gaps = (axis, fixed, fl, s0, s1) => DOORDEFS.filter(d => d[1] === fl && d[2] === axis && Math.abs(d[3] - fixed) < 0.01 && d[4] > s0 && d[4] < s1).map(d => ({ at: d[4], w: DW }))
    .concat(GAPS.filter(g => g.fl === fl && g.axis === axis && g.fixed === fixed && g.at > s0 && g.at < s1));
  for (const fl of FLK) {
    const P_ = PLAN[fl];
    for (const x of [-4, 4]) for (let r = 0; r < 3; r++) {                                  // inner walls running north-south
      const lo = P_[r][x === -4 ? 0 : 1], hi = P_[r][x === -4 ? 1 : 2]; if (!lo && !hi) continue;
      wall('x', x, ZS[r], ZS[r + 1], fl, gaps('x', x, fl, ZS[r], ZS[r + 1]), lo ? lo[2] : OUTER, hi ? hi[2] : OUTER);
    }
    for (const z of [-4, 3]) for (let c = 0; c < 3; c++) {                                  // inner walls running east-west
      const rl = z === -4 ? 0 : 1, lo = P_[rl][c], hi = P_[rl + 1][c]; if (!lo && !hi) continue;
      wall('z', z, XS[c], XS[c + 1], fl, gaps('z', z, fl, XS[c], XS[c + 1]), lo ? lo[2] : OUTER, hi ? hi[2] : OUTER);
    }
    for (let c = 0; c < 3; c++) {                                                           // outside walls: north and south
      const n = P_[0][c], s = P_[2][c];
      if (n) wall('z', -11, XS[c], XS[c + 1], fl, gaps('z', -11, fl, XS[c], XS[c + 1]), OUTER, n[2]);
      if (s) wall('z', 11, XS[c], XS[c + 1], fl, gaps('z', 11, fl, XS[c], XS[c + 1]), s[2], OUTER);
    }
    for (let r = 0; r < 3; r++) { const w = P_[r][0], e = P_[r][2]; if (w) wall('x', -14, ZS[r], ZS[r + 1], fl, [], OUTER, w[2]); if (e) wall('x', 14, ZS[r], ZS[r + 1], fl, [], e[2], OUTER); }
  }
  // the little cupboard around the cellar stairs (ground floor): its wall is x=-2.3
  wall('x', -2.3, -4, 3, 'G', gaps('x', -2.3, 'G', -4, 3), 'plaster', 'plaster');
  // roof
  V(-14.3, 14.3, 6.3, 6.6, -11.3, 11.3, 'woodDark', { tile: 3 });
  for (const s of [-1, 1]) { const m = boxMesh(30, 0.35, 12.3, MAT('rust'), 4); m.position.set(0, 7.45, s * 5.5); m.rotation.x = s * 0.2; scene.add(m); }
  for (const sx of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(-11.3, 0); sh.lineTo(11.3, 0); sh.lineTo(0, 2.2); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false }), m = new THREE.Mesh(g, MAT('brick')); m.rotation.y = Math.PI / 2; m.position.set(sx * 14.15 - 0.15, 6.3, 0); scene.add(m); }
}
// ---------- doors you can open ----------
function makeDoors() {
  for (const df of DOORDEFS) {
    const [id, fl, axis, fixed, at, lo, hi, lock, swing] = df, y = FY[fl], w = DW, wood = MAT('woodDark');
    const d = { id, fl, axis, fixed, at, lo, hi, lock, swing, y, w, unlocked: !lock, t: 0, target: 0, cx: axis === 'z' ? at : fixed, cz: axis === 'z' ? fixed : at };
    const g = new THREE.Group(); g.position.set(axis === 'z' ? at - w / 2 : fixed, y, axis === 'z' ? fixed : at - w / 2); scene.add(g);
    const leaf = axis === 'z' ? boxMesh(w, DH, 0.09, wood, 1.2) : boxMesh(0.09, DH, w, wood, 1.2);
    leaf.position.set(axis === 'z' ? w / 2 : 0, DH / 2, axis === 'z' ? 0 : w / 2); g.add(leaf);
    const gold = MAT(0xc9a24a, { metalness: 0.7, roughness: 0.35, map: null });
    for (const sd of [1, -1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), gold); k.position.set(axis === 'z' ? w - 0.13 : sd * 0.09, 1.0, axis === 'z' ? sd * 0.09 : w - 0.13); g.add(k); }
    d.grp = g; d.leaf = leaf;
    d.solid = axis === 'z' ? B(at - w / 2, at + w / 2, y, y + DH, fixed - 0.07, fixed + 0.07, wood, { vis: false, nav: false, tag: 'door' }) : B(fixed - 0.07, fixed + 0.07, y, y + DH, at - w / 2, at + w / 2, wood, { vis: false, nav: false, tag: 'door' });
    if (lock) {
      const col = { padlock: 0xb4b4bc, gold: 0xe8c040, red: 0xd03030, blue: 0x3a6ae0, green: 0x35b060, code: 0x888890, pins: 0xb4b4bc, boards: 0x6a4a2a, front: 0xe8c040 }[lock];
      if (lock === 'boards' || lock === 'front') {
        d.planks = []; for (let i = 0; i < 3; i++) { const p = axis === 'z' ? boxMesh(1.7, 0.2, 0.05, MAT('woodFloor'), 1) : boxMesh(0.05, 0.2, 1.7, MAT('woodFloor'), 1);
          p.position.set(d.cx + (axis === 'x' ? 0.12 : 0), y + 0.55 + i * 0.55, d.cz + (axis === 'z' ? -0.12 : 0)); if (axis === 'z') p.rotation.z = (i - 1) * 0.12; else p.rotation.x = (i - 1) * 0.12; scene.add(p); d.planks.push(p); }
      }
      if (lock !== 'boards') { const pl = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? 0.15 : 0.3, 0.19, axis === 'z' ? 0.3 : 0.15), MAT(col, { map: null, metalness: 0.6, roughness: 0.4, emissive: col, emissiveIntensity: 0.25 })); pl.position.set(axis === 'z' ? at + w / 2 - 0.3 : fixed, y + 1.1, axis === 'z' ? fixed : at + w / 2 - 0.3); scene.add(pl); d.lockMesh = pl; }
    }
    d.int = { kind: 'door', ref: d, x: d.cx, y: y + 1.1, z: d.cz, r: 1.8 }; INTS.push(d.int);
    DOORS[id] = d; DOORLIST.push(d);
  }
}
const doorLocked = d => !d.unlocked;
function setDoor(d, open) { if (open && doorLocked(d)) return false; d.target = open ? 1 : 0; return true; }
function updateDoors(dt) {
  for (const d of DOORLIST) {
    if (d.t !== d.target) { const k = dt * 2.4; d.t = d.t < d.target ? Math.min(d.target, d.t + k) : Math.max(d.target, d.t - k); d.grp.rotation.y = d.swing * d.t * 1.7; }
    d.solid.on = d.t < 0.5;
  }
}
// ---------- stairs ----------
function stairsUp() {                       // main stairs: front hall (z=8.3) up to the landing (z=4.4)
  const n = 13, rise = 3.3 / n, run = 0.3;
  for (let i = 1; i <= n; i++) B(-3.85, -2.4, 0, i * rise, 8.3 - i * run, 8.3 - (i - 1) * run, 'woodDark', { tile: 1.2, tag: 'stair' });
  B(-2.45, -2.35, 0, 4.5, 4.4, 8.3, 'woodDark', { tile: 1.5 });                            // the balustrade on the open side
  B(-3.85, -2.45, 3.3, 4.5, 8.3, 8.45, 'woodDark', { tile: 1.5 });                          // and across the foot of the hole upstairs
}
function stairsDown() {                      // cellar stairs: from the cupboard (z=-1.5) down to the basement (z=2.66)
  const n = 13, rise = 3.0 / n, run = 0.32;
  for (let i = 1; i <= n; i++) B(-3.85, -2.4, FY.B - 0.3, -i * rise, -1.5 + (i - 1) * run, -1.5 + i * run, 'concrete', { tile: 1.2, tag: 'stair' });
}
// ---------- windows ----------
function windowAt(x, y, z, axis, face) {                                                    // face = +1/-1: which way the room is from the wall
  const w = 1.1, h = 1.25, ox = axis === 'x' ? face * 0.16 : 0, oz = axis === 'z' ? face * 0.16 : 0;
  const pane = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? w : 0.03, h, axis === 'z' ? 0.03 : w), new THREE.MeshBasicMaterial({ color: 0x23365c })); pane.position.set(x + ox, y, z + oz); scene.add(pane);
  const fr = (ww, hh, dx, dy) => { const m = boxMesh(axis === 'z' ? ww : 0.07, hh, axis === 'z' ? 0.07 : ww, MAT('woodDark'), 1); m.position.set(x + ox + (axis === 'x' ? face * 0.02 : 0), y + dy, z + oz + (axis === 'z' ? face * 0.02 : 0)); if (axis === 'z') m.position.x += dx; else m.position.z += dx; scene.add(m); STATIC.push(m); };
  fr(0.07, h + 0.12, 0, 0); fr(w + 0.14, 0.07, 0, 0); fr(w + 0.14, 0.09, 0, h / 2 + 0.03); fr(w + 0.14, 0.09, 0, -h / 2 - 0.03); fr(0.09, h, w / 2 + 0.03, 0); fr(0.09, h, -w / 2 - 0.03, 0);
  for (const sd of [-1, 1]) { const cur = boxMesh(axis === 'z' ? 0.3 : 0.06, h + 0.5, axis === 'z' ? 0.06 : 0.3, MAT(0x4a1a22, { map: null, roughness: 1 }), 1); cur.position.set(x + ox * 1.9 + (axis === 'z' ? sd * (w / 2 + 0.2) : 0), y + 0.1, z + oz * 1.9 + (axis === 'x' ? sd * (w / 2 + 0.2) : 0)); scene.add(cur); STATIC.push(cur); }
}
function buildWindows() {
  const W = (fl, axis, fixed, along, face) => { const y = FY[fl] + 1.65; if (axis === 'z') windowAt(along, y, fixed, 'z', face); else windowAt(fixed, y, along, 'x', face); };
  for (const fl of ['G', 'U']) {
    for (const c of [-9, 9]) { W(fl, 'z', 11, c, -1); W(fl, 'z', -11, c, 1); }
    for (const z of [-7.5, 0, 7.5]) { W(fl, 'x', -14, z, 1); W(fl, 'x', 14, z, -1); }
  }
  W('U', 'z', 11, 0, -1); W('U', 'z', -11, 0, 1);
}
// ---------- collision ----------
const SG = new Map(), SGC = 2;
const sgKey = (i, j) => i * 4096 + j;
function indexSolids() {
  SG.clear();
  for (const s of SOLIDS) for (let i = Math.floor((s.x0 + 100) / SGC); i <= Math.floor((s.x1 + 100) / SGC); i++) for (let j = Math.floor((s.z0 + 100) / SGC); j <= Math.floor((s.z1 + 100) / SGC); j++) { const k = sgKey(i, j); let a = SG.get(k); if (!a) SG.set(k, a = []); a.push(s); }
}
const _empty = [];
function near(x, z, r) {                                      // solids that might touch a circle
  const i0 = Math.floor((x - r + 100) / SGC), i1 = Math.floor((x + r + 100) / SGC), j0 = Math.floor((z - r + 100) / SGC), j1 = Math.floor((z + r + 100) / SGC);
  if (i0 === i1 && j0 === j1) return SG.get(sgKey(i0, j0)) || _empty;
  const out = []; for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const a = SG.get(sgKey(i, j)); if (a) for (const s of a) if (out.indexOf(s) < 0) out.push(s); } return out;
}
function groundAt(x, z, y) {                                  // the highest surface under (x,z) that is no more than a step above y
  let g = -1e9; for (const s of near(x, z, 0.05)) { if (!s.on || x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue; if (s.top <= y + STEP && s.top > g) g = s.top; } return g;
}
function pushOut(e) {
  const r = e.r;
  for (let it = 0; it < 4; it++) {
    let moved = false;
    for (const s of near(e.x, e.z, r + 0.1)) {
      if (!s.on || s.top <= e.y + STEP || s.y0 >= e.y + e.h) continue;
      const rs = s.tag === 'stair' ? r * 0.45 : r, cx = clamp(e.x, s.x0, s.x1), cz = clamp(e.z, s.z0, s.z1), dx = e.x - cx, dz = e.z - cz, d2 = dx * dx + dz * dz; if (d2 >= rs * rs) continue;
      if (d2 > 1e-9) { const d = Math.sqrt(d2), k = (rs - d) / d; e.x += dx * k; e.z += dz * k; }
      else { const l = e.x - s.x0, rt = s.x1 - e.x, t = e.z - s.z0, b = s.z1 - e.z, m = Math.min(l, rt, t, b); if (m === l) e.x = s.x0 - r; else if (m === rt) e.x = s.x1 + r; else if (m === t) e.z = s.z0 - r; else e.z = s.z1 + r; }
      moved = true;
    }
    if (!moved) break;
  }
}
function losClear(ax, ay, az, bx, by, bz) {                   // a straight line of sight (walls and closed doors block it)
  const dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.hypot(dx, dy, dz), n = Math.max(2, Math.ceil(len / 0.25));
  for (let i = 1; i < n; i++) { const t = i / n, x = ax + dx * t, y = ay + dy * t, z = az + dz * t; for (const s of near(x, z, 0.02)) { if (!s.on || x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1 || y < s.y0 || y > s.top) continue; if (s.tag === 'low') continue; return false; } }
  return true;
}
