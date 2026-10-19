// ---------- navigation grid for the hunters ----------
const NAV = { cs: 0.5, x0: -14.5, z0: -11.5, nx: 58, nz: 46, rad: 0.29, base: {}, doorCell: new Map(), portals: [] };
NAV.N = NAV.nx * NAV.nz;
const FLI = { B: 0, G: 1, U: 2 }, FLN = ['B', 'G', 'U'];
const nodeOf = (fl, i, j) => FLI[fl] * NAV.N + j * NAV.nx + i;
const cellX = i => NAV.x0 + (i + 0.5) * NAV.cs, cellZ = j => NAV.z0 + (j + 0.5) * NAV.cs;
const cellI = x => Math.floor((x - NAV.x0) / NAV.cs), cellJ = z => Math.floor((z - NAV.z0) / NAV.cs);
function floorHere(x, z, fy) { for (const s of near(x, z, 0.02)) if (s.tag === 'slab' && x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1 && Math.abs(s.top - fy) < 0.02) return true; return false; }
function navCellFree(x, z, fy) {
  for (const [ox, oz] of [[0, 0], [0.25, 0], [-0.25, 0], [0, 0.25], [0, -0.25]]) if (!floorHere(x + ox, z + oz, fy)) return false;
  const r = NAV.rad;
  for (const s of near(x, z, r + 0.1)) {
    if (!s.on || !s.nav || s.top <= fy + 0.3 || s.y0 >= fy + 1.8) continue;
    const cx = clamp(x, s.x0, s.x1), cz = clamp(z, s.z0, s.z1); if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return false;
  }
  return true;
}
function navBuild() {
  for (const fl of FLK) { const g = new Uint8Array(NAV.N), fy = FY[fl]; for (let j = 0; j < NAV.nz; j++) for (let i = 0; i < NAV.nx; i++) g[j * NAV.nx + i] = navCellFree(cellX(i), cellZ(j), fy) ? 0 : 1; NAV.base[fl] = g; }
  NAV.doorCell.clear();
  for (const d of DOORLIST) {                                       // cells in the doorway belong to the door (blocked while it is locked)
    if (d.id === 'o_shed') continue;
    for (let j = 0; j < NAV.nz; j++) for (let i = 0; i < NAV.nx; i++) { const x = cellX(i), z = cellZ(j), a = d.axis === 'z' ? x - d.at : z - d.at, c = d.axis === 'z' ? z - d.fixed : x - d.fixed; if (Math.abs(a) < d.w / 2 && Math.abs(c) < 0.45 && NAV.base[d.fl][j * NAV.nx + i] === 0) NAV.doorCell.set(nodeOf(d.fl, i, j), d); }
  }
  NAV.portals = [
    { a: ['G', -3.25, 8.75], b: ['U', -3.25, 3.75], pts: [[-3.25, 0, 8.75], [-3.1, 0, 8.3], [-3.1, 3.3, 4.4], [-3.25, 3.3, 3.75]], cost: 12, name: 'stairs' },
    { a: ['G', -2.75, -2.25], b: ['B', -1.75, 2.25], pts: [[-2.75, 0, -2.25], [-3.1, 0, -1.5], [-3.1, -3, 2.5], [-1.75, -3, 2.25]], cost: 12, name: 'cellar' },
  ];
  NAV.edges = new Map();
  for (const p of NAV.portals) {
    p.na = nodeOf(p.a[0], cellI(p.a[1]), cellJ(p.a[2])); p.nb = nodeOf(p.b[0], cellI(p.b[1]), cellJ(p.b[2]));
    if (NAV.base[p.a[0]][p.na % NAV.N] || NAV.base[p.b[0]][p.nb % NAV.N]) console.warn('portal cell is blocked', p.name, NAV.base[p.a[0]][p.na % NAV.N], NAV.base[p.b[0]][p.nb % NAV.N]);
    (NAV.edges.get(p.na) || NAV.edges.set(p.na, []).get(p.na)).push({ to: p.nb, p, dir: 1 }); (NAV.edges.get(p.nb) || NAV.edges.set(p.nb, []).get(p.nb)).push({ to: p.na, p, dir: -1 });
  }
  NAV.heapN = new Int32Array(NAV.N * 3 + 8); NAV.heapF = new Float32Array(NAV.N * 3 + 8); NAV.g = new Float32Array(NAV.N * 3); NAV.from = new Int32Array(NAV.N * 3); NAV.via = new Int8Array(NAV.N * 3); NAV.closed = new Uint8Array(NAV.N * 3);
}
function nodeBlocked(n) {
  const fl = FLN[(n / NAV.N) | 0], k = n % NAV.N; if (NAV.base[fl][k]) return true;
  const d = NAV.doorCell.get(n); return !!(d && doorLocked(d));
}
const nodePos = n => { const k = n % NAV.N; return { fl: FLN[(n / NAV.N) | 0], x: cellX(k % NAV.nx), z: cellZ((k / NAV.nx) | 0) }; };
function navNearest(fl, x, z, maxR = 5) {
  const ci = cellI(x), cj = cellJ(z); let best = -1, bd = 1e9;
  for (let r = 0; r <= maxR; r++) {
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= NAV.nx || j >= NAV.nz) continue;
      const n = nodeOf(fl, i, j); if (nodeBlocked(n)) continue; const d = (cellX(i) - x) ** 2 + (cellZ(j) - z) ** 2; if (d < bd) { bd = d; best = n; }
    }
    if (best >= 0) return best;
  }
  return -1;
}
const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];
function navPath(fl0, x0, z0, fl1, x1, z1) {                         // returns [{fl,x,z, portal?, dir?}] or null
  const s = navNearest(fl0, x0, z0), t = navNearest(fl1, x1, z1); if (s < 0 || t < 0) return null;
  const gi = cellI(x1), gj = cellJ(z1), rawFree = gi >= 0 && gj >= 0 && gi < NAV.nx && gj < NAV.nz && !nodeBlocked(nodeOf(fl1, gi, gj)), gp = rawFree ? { x: x1, z: z1 } : nodePos(t);
  if (s === t) return [{ fl: fl1, x: gp.x, z: gp.z, last: true }];
  const { g, from, via, closed, heapN, heapF } = NAV; closed.fill(0); g.fill(1e9);
  const tp = nodePos(t); let hn = 0;
  const push = (n, f) => { let i = hn++; while (i > 0) { const p = (i - 1) >> 1; if (heapF[p] <= f) break; heapF[i] = heapF[p]; heapN[i] = heapN[p]; i = p; } heapF[i] = f; heapN[i] = n; };
  const pop = () => { const top = heapN[0], f = heapF[--hn]; const nn = heapN[hn]; let i = 0; while (true) { let c = 2 * i + 1; if (c >= hn) break; if (c + 1 < hn && heapF[c + 1] < heapF[c]) c++; if (heapF[c] >= f) break; heapF[i] = heapF[c]; heapN[i] = heapN[c]; i = c; } heapF[i] = f; heapN[i] = nn; return top; };
  const h = n => { const p = nodePos(n); if (p.fl !== tp.fl) return 0; const dx = Math.abs(p.x - tp.x) / NAV.cs, dz = Math.abs(p.z - tp.z) / NAV.cs; return (Math.max(dx, dz) + 0.4142 * Math.min(dx, dz)) * 0.99; };
  g[s] = 0; from[s] = -1; via[s] = 0; push(s, h(s)); let found = false, guard = 0;
  while (hn > 0 && guard++ < 40000) {
    const n = pop(); if (closed[n]) continue; closed[n] = 1; if (n === t) { found = true; break; }
    const fl = (n / NAV.N) | 0, k = n % NAV.N, i = k % NAV.nx, j = (k / NAV.nx) | 0, gb = g[n], base = fl * NAV.N, bg = NAV.base[FLN[fl]];
    for (const [di, dj, c] of DIRS) {
      const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NAV.nx || nj >= NAV.nz) continue; const nn = base + nj * NAV.nx + ni; if (closed[nn] || nodeBlocked(nn)) continue;
      if (di && dj && (bg[j * NAV.nx + ni] || bg[nj * NAV.nx + i] || nodeBlocked(base + j * NAV.nx + ni) || nodeBlocked(base + nj * NAV.nx + i))) continue;
      const ng = gb + c; if (ng < g[nn]) { g[nn] = ng; from[nn] = n; via[nn] = 0; push(nn, ng + h(nn)); }
    }
    const pe = NAV.edges.get(n); if (pe) for (const e of pe) { if (closed[e.to] || nodeBlocked(e.to)) continue; const ng = gb + e.p.cost; if (ng < g[e.to]) { g[e.to] = ng; from[e.to] = n; via[e.to] = e.dir * (NAV.portals.indexOf(e.p) + 1); push(e.to, ng + h(e.to)); } }
  }
  if (!found) return null;
  const rev = []; for (let n = t; n !== -1; n = from[n]) rev.push(n); rev.reverse();
  const out = []; for (let q = 1; q < rev.length; q++) { const p = nodePos(rev[q]), v = via[rev[q]]; const o = { fl: p.fl, x: p.x, z: p.z }; if (v) { o.portal = NAV.portals[Math.abs(v) - 1]; o.dir = v > 0 ? 1 : -1; } out.push(o); }
  // straighten runs on one floor (skip nodes the hunter can walk straight past)
  const sm = []; let cur = { fl: fl0, x: x0, z: z0 }, q = 0;
  while (q < out.length) {
    if (out[q].portal) { sm.push(out[q]); cur = out[q]; q++; continue; }
    let best = q;
    for (let r = Math.min(out.length - 1, q + 12); r > q; r--) { let ok = out[r].fl === cur.fl; for (let m = q; m <= r && ok; m++) if (out[m].portal) ok = false; if (ok && navLine(cur.fl, cur.x, cur.z, out[r].x, out[r].z)) { best = r; break; } }
    sm.push(out[best]); cur = out[best]; q = best + 1;
  }
  sm.push({ fl: fl1, x: gp.x, z: gp.z, last: true }); return sm;
}
function navLine(fl, x0, z0, x1, z1) {                                 // is the straight line between two points free of blocked cells?
  const d = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(d / 0.25)); for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n, i = cellI(x), j = cellJ(z); if (i < 0 || j < 0 || i >= NAV.nx || j >= NAV.nz || nodeBlocked(nodeOf(fl, i, j))) return false; } return true;
}
