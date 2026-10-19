// ---------- outdoors: garden, shed, lake, dock, driveway, gate ----------
const OUT = { boat: null, car: null };
function wallAround(x0, x1, z0, z1, h = 6) { B(x0, x1, -5, h, z0, z1, 'woodDark', { vis: false, tag: 'low' }); }
function buildOutdoors() {
  // ground: everything except the footprint of the house (the house has its own floors)
  const G0 = (x0, x1, z0, z1) => B(x0, x1, -4, 0, z0, z1, 'grass', { tile: 6, tag: 'ground' });
  G0(-60, 60, -37, -11); G0(-60, -14, -11, 40); G0(14, 60, -11, 40); G0(-14, 14, 11, 40);
  V(-16, 16, -0.02, 0.01, 11.15, 22, 'dirt', { tile: 4 });
  // invisible walls around the playing area
  wallAround(-40, -39.6, -37.4, 40, 6); wallAround(39.6, 40, -37.4, 40, 6); wallAround(-40, 40, 39.6, 40, 6);
  // lake and dock
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(220, 120), MAT('water', { roughness: 0.15, metalness: 0.35, emissive: 0x0a1626, emissiveIntensity: 0.6 })); lake.rotation.x = -Math.PI / 2; lake.position.set(0, -0.4, -97); scene.add(lake); TEX.water.repeat.set(12, 6);
  B(-2.0, 2.0, -0.35, 0.06, -45, -36.8, 'woodDark', { tile: 1.6, tag: 'dock' });
  for (const sx of [-1, 1]) { B(sx * 2.0 - 0.1, sx * 2.0 + 0.1, 0, 1.2, -45.4, -37, 'woodDark', { vis: false, tag: 'low' }); for (let z = -38; z > -45; z -= 1.8) { const p = boxMesh(0.16, 1.2, 0.16, MAT('woodDark'), 1); p.position.set(sx * 2.0, 0.6, z); scene.add(p); STATIC.push(p); } }
  B(-2.2, 2.2, 0, 1.2, -45.6, -45.3, 'woodDark', { vis: false, tag: 'low' });
  B(-60, -2.0, 0, 6, -37.2, -36.8, 'woodDark', { vis: false, tag: 'low' }); B(2.0, 60, 0, 6, -37.2, -36.8, 'woodDark', { vis: false, tag: 'low' });
  B(2.3, 5, -5, 6, -45.4, -37, 'woodDark', { vis: false, tag: 'low' });                                                  // the boat's water is out of bounds
  // fence round the garden
  const fz = (x, z0, z1) => { B(x - 0.08, x + 0.08, 0, 1.9, z0, z1, 'woodDark', { tile: 1.4 }); for (let z = z0 + 0.5; z < z1; z += 3) { const p = boxMesh(0.2, 2.2, 0.2, MAT('woodDark'), 1); p.position.set(x, 1.1, z); scene.add(p); STATIC.push(p); } };
  fz(-24, -37, -11.15); fz(24, -37, -20.1); fz(24, -15.9, -11.15);
  B(-24, -14.15, 0, 1.9, -11.25, -11.1, 'woodDark', { tile: 1.4 }); B(14.15, 24, 0, 1.9, -11.25, -11.1, 'woodDark', { tile: 1.4 });
  // the driveway
  V(7.5, 10.5, -0.02, 0.012, -22, -11, 'asphalt', { tile: 4 }); V(7.5, 40, -0.02, 0.012, -21.8, -16.2, 'asphalt', { tile: 4 });
  // the road beyond the gate
  V(25, 40, -0.02, 0.012, -26, -11.2, 'asphalt', { tile: 6 });
  // dead trees and graves
  const rt = mulberry32(777); for (let i = 0; i < 26; i++) { const x = -22 + rt() * 44, z = -13.5 - rt() * 22; if (x > 5.5 && x < 12 && z > -23) continue; if (Math.abs(x) < 4 && z < -33) continue; if (Math.hypot(x + 17, z + 20.5) < 4.5) continue; if (x > 3 && z > -23 && z < -15) continue; tree(x, z, 3.2 + rt() * 2.2, rt); }
  for (let i = 0; i < 9; i++) { const x = -10 + (i % 3) * 2.2, z = -28 - Math.floor(i / 3) * 2.0; B(x - 0.35, x + 0.35, 0, 0.95 + (i % 2) * 0.2, z - 0.1, z + 0.1, 'stone', { tile: 1 }); }
  // the moon and the stars
  const moonM = new THREE.Mesh(new THREE.SphereGeometry(6, 20, 14), new THREE.MeshBasicMaterial({ color: 0xdfe6ff, fog: false })); moonM.position.set(-45, 62, -95); scene.add(moonM);
  const st = new THREE.BufferGeometry(), sp2 = new Float32Array(700 * 3); for (let i = 0; i < 700; i++) { const a = Math.random() * 6.28, e = 0.15 + Math.random() * 1.2; sp2[i * 3] = Math.cos(a) * 150 * Math.cos(e); sp2[i * 3 + 1] = 12 + Math.sin(e) * 110; sp2[i * 3 + 2] = Math.sin(a) * 150 * Math.cos(e); }
  st.setAttribute('position', new THREE.BufferAttribute(sp2, 3)); scene.add(new THREE.Points(st, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, fog: false })));
  buildShed(); buildDock(); buildGate();
}
function tree(x, z, h, rnd2) {
  B(x - 0.3, x + 0.3, 0, h, z - 0.3, z + 0.3, 'woodDark', { vis: false });
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, h, 7), MAT(0x2a2018, { map: null })); t.position.set(x, h / 2, z); scene.add(t);
  for (let i = 0; i < 5; i++) { const a = rnd2() * 6.28, b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.1, 1.8, 5), MAT(0x2a2018, { map: null })); b.position.set(x + Math.cos(a) * 0.8, h * (0.55 + i * 0.09), z + Math.sin(a) * 0.8); b.rotation.z = Math.cos(a) * 0.9; b.rotation.x = -Math.sin(a) * 0.9; scene.add(b); }
}
// the garden shed (the green key opens it)
const SHED = { x: -17, z: -21, w: 4.2, d: 3.4 };
function buildShed() {
  const { x: sx, z: sz, w, d } = SHED, zf = sz + d / 2 - 0.0;
  wall('z', sz - d / 2, sx - w / 2, sx + w / 2, 'G', [], 'woodDark', 'woodDark');
  wall('x', sx - w / 2, sz - d / 2, sz + d / 2, 'G', [], 'woodDark', 'woodDark'); wall('x', sx + w / 2, sz - d / 2, sz + d / 2, 'G', [], 'woodDark', 'woodDark');
  wall('z', zf, sx - w / 2, sx + w / 2, 'G', [{ at: sx, w: DW }], 'woodDark', 'woodDark');
  V(sx - w / 2 - 0.3, sx + w / 2 + 0.3, 3.0, 3.2, sz - d / 2 - 0.3, sz + d / 2 + 0.3, 'rust', { tile: 2 });
  V(sx - w / 2, sx + w / 2, -0.02, 0.02, sz - d / 2, sz + d / 2, 'dirt');
  addLamp(sx, 2.2, sz, 0xffb070, 0.8, { flick: 1, room: 'shed' });
}
function buildDock() {
  const bm = MAT(0x4a3a2a, { map: null }), boat = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 4.2), bm); hull.position.y = 0.0; boat.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.6, 4), bm); bow.rotation.x = -Math.PI / 2; bow.rotation.z = Math.PI / 4; bow.position.set(0, 0, -2.85); bow.scale.set(1, 1, 0.65); boat.add(bow);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.5), MAT('woodFloor')); seat.position.set(0, 0.35, 0.3); boat.add(seat);
  const eng = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), MAT(0x2f3640, { map: null, metalness: 0.5 })); eng.position.set(0, 0.4, 2.0); boat.add(eng);
  boat.position.set(3.7, -0.25, -41.5); scene.add(boat); OUT.boat = boat;
  SPECIAL.boat = { x: 2.6, y: 1.0, z: -41.5, grp: boat, key: false, prop: false, fuel: false, done: 0 };
  SPECIAL.boat.int = { kind: 'boat', ref: SPECIAL.boat, x: 2.6, y: 1.0, z: -41.5, r: 2.3 }; INTS.push(SPECIAL.boat.int);
  addLamp(0, 1.8, -41, 0x9ab0ff, 0.5, { flick: 1, room: 'dock' });
}
function buildGate() {
  const panel = B(23.9, 24.2, 0, 1.95, -20.1, -15.9, 'woodDark', { dyn: true, tag: 'gate', tile: 1.4 });
  SPECIAL.gate = { solid: panel, t: 0, target: 0, chained: true, x: 24, y: 1.1, z: -18, int: { kind: 'gate', x: 24, y: 1.1, z: -18, r: 2.6 } }; SPECIAL.gate.int.ref = SPECIAL.gate; INTS.push(SPECIAL.gate.int);
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 6, 14), MAT(0x8a8a92, { map: null, metalness: 0.8, roughness: 0.4 })); chain.position.set(23.75, 1.0, -18); chain.rotation.y = Math.PI / 2; scene.add(chain); SPECIAL.gate.chain = chain;
}
function buildGarageDoor() {
  const p = B(6.5, 11.5, 0, 2.6, -11.08, -10.92, 'metal', { dyn: true, tag: 'garage', tile: 1.4 });
  SPECIAL.garage = { solid: p, t: 0, target: 0, x: 9, y: 1.3, z: -11 };
  const btn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.06), MAT(0xd03030, { map: null, emissive: 0xd03030, emissiveIntensity: 0.5 })); btn.position.set(11.3, 1.3, -4.2); scene.add(btn);
  SPECIAL.garage.int = { kind: 'garagebtn', ref: SPECIAL.garage, x: 11.3, y: 1.3, z: -4.2, r: 1.5 }; INTS.push(SPECIAL.garage.int);
}
function updateSpecial(dt) {
  const g = SPECIAL.garage; if (g && g.t !== g.target) { g.t = g.t < g.target ? Math.min(g.target, g.t + dt * 0.4) : Math.max(g.target, g.t - dt * 0.6); g.solid.mesh.position.y = 1.3 + g.t * 2.55; g.solid.on = g.t < 0.55; }
  const t = SPECIAL.gate; if (t && t.t !== t.target) { t.t = t.t < t.target ? Math.min(t.target, t.t + dt * 0.5) : Math.max(t.target, t.t - dt * 0.5); t.solid.mesh.position.z = -18 - t.t * 4.2; t.solid.on = t.t < 0.3; }
  if (OUT.boat && !SPECIAL.boat.done) OUT.boat.position.y = -0.25 + Math.sin(performance.now() / 900) * 0.05;
}
