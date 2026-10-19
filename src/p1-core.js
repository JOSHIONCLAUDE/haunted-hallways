'use strict';
// =====================================================================
//  HAUNTED HALLWAYS  -  a first-person horror escape game (three.js)
// =====================================================================
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rnd = Math.random;                                       // swapped for a seeded generator so a game can be repeated
const rr = (a, b) => a + rnd() * (b - a), pick = arr => arr[(rnd() * arr.length) | 0], shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const QS = new URLSearchParams(location.search);
const TOUCH_FORCED = QS.get('touch') === '1';
let TOUCH = TOUCH_FORCED || matchMedia('(hover: none) and (pointer: coarse)').matches;
const CFG = { sens: 1.2, vol: 0.85, bright: 1.0, diff: 'normal', quality: TOUCH ? 'low' : 'high', scare: 1 };
try { Object.assign(CFG, JSON.parse(localStorage.getItem('hhCfg') || '{}')); } catch (e) {}
const saveCfg = () => { try { localStorage.setItem('hhCfg', JSON.stringify(CFG)); } catch (e) {} };

// ---------- renderer / scene ----------
function fatal(msg) { const l = $('loading'); l.style.display = 'flex'; l.innerHTML = '<div style="max-width:520px;line-height:1.6;letter-spacing:0;font-size:16px">⚠ ' + msg + '</div>'; throw new Error(msg); }
if (typeof THREE === 'undefined') fatal('The 3D engine did not load. Keep the <b>vendor</b> folder next to the game file.');
let glOK = false; try { const c = document.createElement('canvas'); glOK = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) {}
if (!glOK) fatal('Your device could not start 3D graphics (WebGL). Try another browser or turn on hardware acceleration.');
const renderer = new THREE.WebGLRenderer({ antialias: !TOUCH && CFG.quality === 'high', powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TOUCH || CFG.quality === 'low' ? 1.25 : 2));
renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = CFG.bright;
$('game').appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x03050a); scene.fog = new THREE.Fog(0x04060b, 3, 24);
const cam = new THREE.PerspectiveCamera(72, 1, 0.05, 90); cam.rotation.order = 'YXZ'; scene.add(cam);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const ambient = new THREE.AmbientLight(0x3a4058, 0.8); scene.add(ambient);
const moon = new THREE.DirectionalLight(0x7f95c8, 0.25); moon.position.set(-20, 40, 15); scene.add(moon);
// a handful of real lights follow the player and are moved to the nearest lamps (keeps the game fast)
const LAMPS = [], lightPool = [];
for (let i = 0; i < (TOUCH ? 3 : 5); i++) { const L = new THREE.PointLight(0xffc880, 0, 11, 2); scene.add(L); lightPool.push({ L, lamp: null }); }
const heldLight = new THREE.PointLight(0xaab8ff, 0.5, 6.5, 2); scene.add(heldLight);       // your eyes get used to the dark
function addLamp(x, y, z, col = 0xffc880, inten = 1.1, o = {}) { const l = { x, y, z, col, inten, on: true, flick: o.flick || 0, ph: Math.random() * 9, off: o.off || false, powered: !!o.powered, room: o.room || '' }; LAMPS.push(l); return l; }
let lightT = 0, POWER = false;
function updateLights(dt, t) {
  lightT -= dt; if (lightT <= 0) {
    lightT = 0.25; const cx = cam.position.x, cy = cam.position.y, cz = cam.position.z, c = LAMPS.filter(l => l.on && !l.off && (!l.powered || POWER)).map(l => ({ l, d: Math.hypot(l.x - cx, (l.y - cy) * 1.6, l.z - cz) })).sort((a, b) => a.d - b.d).slice(0, lightPool.length);
    lightPool.forEach((p, i) => { p.lamp = c[i] ? c[i].l : null; if (p.lamp) { p.L.position.set(p.lamp.x, p.lamp.y, p.lamp.z); p.L.color.setHex(p.lamp.col); } });
  }
  lightPool.forEach(p => { const lp = p.lamp, target = lp ? lp.inten * (lp.flick ? 0.55 + 0.45 * Math.sin(t * 9 + lp.ph) * Math.sin(t * 3.1 + lp.ph) : 1) * (Math.random() < 0.002 * lp.flick ? 0.2 : 1) : 0; p.L.intensity = lerp(p.L.intensity, target, Math.min(1, dt * 5)); });
  heldLight.position.copy(cam.position);
}

// ---------- procedural textures ----------
const MAXANI = renderer.capabilities.getMaxAnisotropy();
function makeTex(draw, size = 256, repeat = true) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(4, MAXANI); if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const specks = (g, s, n, lo, hi, a = 0.12) => { for (let i = 0; i < n; i++) { const v = (Math.random() * (hi - lo) + lo) | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.04 + Math.random() * a) + ')'; const r = 0.6 + Math.random() * 2.2; g.fillRect(Math.random() * s, Math.random() * s, r, r); } };
const stains = (g, s, n, col) => { g.globalAlpha = 0.62; for (let i = 0; i < n; i++) { const x = Math.random() * s, y = Math.random() * s, r = 12 + Math.random() * 48; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } g.globalAlpha = 1; };
const TEX = {
  wallGreen: makeTex((g, s) => { g.fillStyle = '#4b5a45'; g.fillRect(0, 0, s, s); for (let x = 0; x < s; x += 32) { g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(x, 0, 14, s); g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x + 14, 0, 4, s); } stains(g, s, 8, 'rgba(25,20,10,0.35)'); specks(g, s, 2200, 30, 200); }),
  wallRed: makeTex((g, s) => { g.fillStyle = '#6a2a2c'; g.fillRect(0, 0, s, s); g.fillStyle = 'rgba(0,0,0,0.2)'; for (let y = 0; y < s; y += 64) for (let x = 0; x < s; x += 64) { g.beginPath(); g.arc(x + 32, y + 32, 16, 0, 7); g.fill(); g.fillRect(x + 28, y + 8, 8, 48); } stains(g, s, 9, 'rgba(20,10,5,0.4)'); specks(g, s, 2000, 30, 200); }),
  wallBlue: makeTex((g, s) => { g.fillStyle = '#3a4a62'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 40) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, y, s, 3); g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(0, y + 20, s, 12); } stains(g, s, 8, 'rgba(10,15,25,0.4)'); specks(g, s, 2200, 30, 200); }),
  plaster: makeTex((g, s) => { g.fillStyle = '#9a9388'; g.fillRect(0, 0, s, s); stains(g, s, 8, 'rgba(50,45,35,0.2)'); stains(g, s, 5, 'rgba(210,205,190,0.16)'); specks(g, s, 3000, 40, 230); }),
  woodFloor: makeTex((g, s) => { g.fillStyle = '#6b4a2e'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += s / 6) { g.fillStyle = 'rgba(25,12,4,0.65)'; g.fillRect(0, y, s, 2.5); const off = Math.random() * s; g.fillStyle = 'rgba(25,12,4,0.5)'; g.fillRect(off, y, 2, s / 6); for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(40,20,8,0.12)'; g.fillRect(Math.random() * s, y + 4 + Math.random() * (s / 6 - 8), 20 + Math.random() * 80, 1.2); } } stains(g, s, 6, 'rgba(15,8,2,0.35)'); specks(g, s, 900, 20, 130); }),
  woodDark: makeTex((g, s) => { g.fillStyle = '#3e2b1c'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += s / 5) { g.fillStyle = 'rgba(10,5,2,0.6)'; g.fillRect(0, y, s, 2.5); for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(80,50,25,0.14)'; g.fillRect(Math.random() * s, y + 4 + Math.random() * (s / 5 - 8), 20 + Math.random() * 90, 1.2); } } specks(g, s, 700, 10, 100); }),
  carpet: makeTex((g, s) => { g.fillStyle = '#5a2226'; g.fillRect(0, 0, s, s); specks(g, s, 6000, 30, 180, 0.16); g.strokeStyle = 'rgba(210,170,80,0.28)'; g.lineWidth = 4; g.strokeRect(12, 12, s - 24, s - 24); stains(g, s, 7, 'rgba(15,5,5,0.4)'); }),
  tile: makeTex((g, s) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#2b2b2f' : '#b8b4a6'; g.fillRect(i * s / 4, j * s / 4, s / 4, s / 4); } stains(g, s, 8, 'rgba(30,20,10,0.4)'); specks(g, s, 2500, 40, 200); }),
  tileBath: makeTex((g, s) => { g.fillStyle = '#7d98a0'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(20,30,34,0.6)'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * s / 4, 0); g.lineTo(i * s / 4, s); g.moveTo(0, i * s / 4); g.lineTo(s, i * s / 4); g.stroke(); } stains(g, s, 8, 'rgba(30,25,10,0.35)'); specks(g, s, 2000, 40, 220); }),
  brick: makeTex((g, s) => { g.fillStyle = '#6a3a2c'; g.fillRect(0, 0, s, s); for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) { g.fillStyle = 'rgba(' + (95 + Math.random() * 40) + ',' + (45 + Math.random() * 25) + ',' + (32 + Math.random() * 15) + ',0.7)'; g.fillRect(c * 64 + (r % 2 ? 32 : 0) + 2, r * 32 + 2, 60, 28); } g.fillStyle = 'rgba(150,140,125,0.7)'; for (let r = 0; r <= 8; r++) g.fillRect(0, r * 32 - 1, s, 3); stains(g, s, 6, 'rgba(10,20,5,0.4)'); specks(g, s, 1500, 30, 180); }),
  stone: makeTex((g, s) => { g.fillStyle = '#5c5e60'; g.fillRect(0, 0, s, s); for (let r = 0; r < 4; r++) for (let c = -1; c < 4; c++) { const v = 70 + Math.random() * 40; g.fillStyle = 'rgba(' + v + ',' + (v + 3) + ',' + (v + 6) + ',0.85)'; g.fillRect(c * 64 + (r % 2 ? 32 : 0) + 2, r * 64 + 2, 60, 60); } stains(g, s, 8, 'rgba(15,35,15,0.4)'); specks(g, s, 2200, 30, 180); }),
  concrete: makeTex((g, s) => { g.fillStyle = '#6a6c6e'; g.fillRect(0, 0, s, s); stains(g, s, 9, 'rgba(25,25,25,0.35)'); stains(g, s, 4, 'rgba(160,160,150,0.18)'); specks(g, s, 3000, 30, 200); g.strokeStyle = 'rgba(25,25,25,0.4)'; g.lineWidth = 2; g.strokeRect(1, 1, s - 2, s - 2); }),
  metal: makeTex((g, s) => { g.fillStyle = '#4e5660'; g.fillRect(0, 0, s, s); for (let x = 0; x < s; x += 16) { g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x, 0, 5, s); } stains(g, s, 6, 'rgba(110,60,25,0.35)'); specks(g, s, 1500, 30, 200); }),
  grass: makeTex((g, s) => { g.fillStyle = '#2f4a2c'; g.fillRect(0, 0, s, s); stains(g, s, 10, 'rgba(10,30,8,0.4)'); stains(g, s, 7, 'rgba(90,110,50,0.22)'); specks(g, s, 3000, 30, 160); for (let i = 0; i < 600; i++) { g.strokeStyle = 'rgba(' + (30 + Math.random() * 40) + ',' + (70 + Math.random() * 60) + ',30,0.35)'; g.beginPath(); const x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); g.lineTo(x + Math.random() * 4 - 2, y - 3 - Math.random() * 5); g.stroke(); } }),
  dirt: makeTex((g, s) => { g.fillStyle = '#4a3b2c'; g.fillRect(0, 0, s, s); stains(g, s, 10, 'rgba(25,18,10,0.4)'); specks(g, s, 3500, 30, 170); }),
  fabric: makeTex((g, s) => { g.fillStyle = '#6a5a7a'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 8) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, y, s, 2); } specks(g, s, 3000, 40, 200); stains(g, s, 6, 'rgba(20,10,10,0.3)'); }),
  fabricRed: makeTex((g, s) => { g.fillStyle = '#7a2a2a'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 8) { g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(0, y, s, 2); } specks(g, s, 3000, 40, 200); stains(g, s, 6, 'rgba(20,10,10,0.3)'); }),
  rust: makeTex((g, s) => { g.fillStyle = '#6a3a22'; g.fillRect(0, 0, s, s); stains(g, s, 14, 'rgba(30,15,5,0.5)'); stains(g, s, 10, 'rgba(190,110,50,0.3)'); specks(g, s, 2500, 30, 200); }),
  water: makeTex((g, s) => { g.fillStyle = '#10233a'; g.fillRect(0, 0, s, s); stains(g, s, 12, 'rgba(40,80,130,0.35)'); g.strokeStyle = 'rgba(160,190,230,0.2)'; g.lineWidth = 2; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(Math.random() * s, Math.random() * s, 6 + Math.random() * 14, 0, 3); g.stroke(); } }),
  asphalt: makeTex((g, s) => { g.fillStyle = '#2c2d31'; g.fillRect(0, 0, s, s); specks(g, s, 4000, 20, 140); stains(g, s, 6, 'rgba(0,0,0,0.3)'); }),
  paper: makeTex((g, s) => { g.fillStyle = '#c9b88c'; g.fillRect(0, 0, s, s); stains(g, s, 6, 'rgba(90,60,20,0.3)'); specks(g, s, 1200, 80, 200); }, 128),
};
const _mat = {};
function MAT(key, o = {}) { const k = key + JSON.stringify(o); if (_mat[k]) return _mat[k]; const m = new THREE.MeshStandardMaterial(Object.assign({ map: TEX[key] || null, color: TEX[key] ? 0xffffff : key, roughness: 0.92, metalness: 0.0 }, o)); return (_mat[k] = m); }
const SOLIDC = (c, o = {}) => MAT(c, o);
const GLOWMAT = (c, op = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: op < 1, opacity: op, fog: false });

// ---------- sound (made with code) ----------
let ac = null, master = null, noiseBuf = null, ambGain = null;
function audioInit() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = CFG.vol;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 6; master.connect(comp); comp.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    startAmbience();
  } catch (e) { ac = null; }
}
const snd = fn => { if (!ac) return; try { fn(ac.currentTime); } catch (e) { if (QS.get('dbg')) console.error('SFX error', e); } };
const sp = (x, y, z) => { if (!ac) return { v: 0, p: 0 }; const dx = x - cam.position.x, dz = z - cam.position.z, dy = (y - cam.position.y) * 1.8, d = Math.hypot(dx, dy, dz); const ang = Math.atan2(dx, dz) - (P.yaw + Math.PI); return { v: clamp(1.15 - d / 22, 0, 1) ** 1.6, p: clamp(Math.sin(ang) * -0.9, -1, 1) }; };
function outNode(vol, pan) { const g = ac.createGain(); g.gain.value = vol; if (ac.createStereoPanner && pan) { const p = ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); p.connect(master); } else g.connect(master); return g; }
function noiseBurst(t, dur, freq, q, vol, pan = 0, type = 'bandpass', rate = 1) { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = rate * (0.9 + Math.random() * 0.2); const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(outNode(1, pan)); s.start(t, Math.random() * 0.8, dur + 0.05); }
function thump(t, f1, f2, dur, vol, pan = 0) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(outNode(1, pan)); o.start(t); o.stop(t + dur + 0.02); }
function tone(t, f, dur, vol, type = 'sine', pan = 0, f2 = 0, att = 0.02) { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(outNode(1, pan)); o.start(t); o.stop(t + dur + 0.03); }
const SFX = {
  step(kind = 'wood', vol = 1, pan = 0) { snd(t => { const f = kind === 'carpet' ? 220 : kind === 'stone' ? 520 : kind === 'grass' ? 300 : 380; noiseBurst(t, 0.09, f, 1.1, 0.13 * vol, pan, 'lowpass'); thump(t, 90, 50, 0.08, 0.1 * vol, pan); }); },
  creak(vol = 0.5, pan = 0) { snd(t => { tone(t, 160 + Math.random() * 60, 0.7 + Math.random() * 0.5, 0.05 * vol, 'sawtooth', pan, 80 + Math.random() * 50, 0.15); noiseBurst(t, 0.5, 900, 6, 0.04 * vol, pan); }); },
  doorOpen(vol = 1, pan = 0) { snd(t => { tone(t, 120, 0.8, 0.1 * vol, 'sawtooth', pan, 210, 0.2); noiseBurst(t, 0.7, 700, 5, 0.06 * vol, pan); thump(t + 0.65, 120, 60, 0.12, 0.2 * vol, pan); }); },
  doorShut(vol = 1, pan = 0) { snd(t => { thump(t, 140, 45, 0.25, 0.7 * vol, pan); noiseBurst(t, 0.18, 500, 1, 0.3 * vol, pan, 'lowpass'); }); },
  doorSlam(vol = 1, pan = 0) { snd(t => { thump(t, 110, 34, 0.5, 1.0 * vol, pan); noiseBurst(t, 0.4, 400, 0.8, 0.6 * vol, pan, 'lowpass'); }); },
  pickup(vol = 1) { snd(t => { tone(t, 620, 0.12, 0.08 * vol, 'triangle'); tone(t + 0.07, 930, 0.16, 0.08 * vol, 'triangle'); }); },
  drawer(vol = 1, pan = 0) { snd(t => { noiseBurst(t, 0.4, 600, 2, 0.12 * vol, pan); tone(t, 90, 0.35, 0.05 * vol, 'sawtooth', pan, 140, 0.1); thump(t + 0.32, 100, 55, 0.1, 0.18 * vol, pan); }); },
  unlock(vol = 1) { snd(t => { tone(t, 1800, 0.05, 0.1 * vol, 'square'); tone(t + 0.08, 1300, 0.07, 0.1 * vol, 'square'); thump(t + 0.12, 140, 70, 0.1, 0.25 * vol); }); },
  locked(vol = 1) { snd(t => { tone(t, 220, 0.08, 0.1 * vol, 'square'); tone(t + 0.09, 190, 0.1, 0.1 * vol, 'square'); }); },
  hammer(vol = 1, pan = 0) { snd(t => { for (let i = 0; i < 3; i++) { thump(t + i * 0.28, 260, 80, 0.12, 0.5 * vol, pan); noiseBurst(t + i * 0.28, 0.1, 2200, 1, 0.3 * vol, pan); } }); },
  clang(vol = 1, pan = 0) { snd(t => { tone(t, 880, 0.9, 0.12 * vol, 'triangle', pan); tone(t, 1330, 0.7, 0.07 * vol, 'sine', pan); noiseBurst(t, 0.15, 3000, 1, 0.2 * vol, pan); }); },
  drop(vol = 1, pan = 0) { snd(t => { thump(t, 190, 70, 0.14, 0.7 * vol, pan); noiseBurst(t, 0.12, 900, 1, 0.3 * vol, pan); }); },
  shoot() { snd(t => { tone(t, 420, 0.12, 0.12, 'triangle', 0, 180); noiseBurst(t, 0.14, 2400, 1, 0.2); thump(t, 160, 60, 0.12, 0.3); }); },
  hit(vol = 1, pan = 0) { snd(t => { thump(t, 150, 50, 0.2, 0.8 * vol, pan); noiseBurst(t, 0.2, 1200, 1, 0.4 * vol, pan); }); },
  trap(vol = 1, pan = 0) { snd(t => { tone(t, 1500, 0.1, 0.2 * vol, 'square', pan, 300); thump(t, 120, 40, 0.3, 0.9 * vol, pan); noiseBurst(t, 0.3, 3200, 1, 0.5 * vol, pan); }); },
  heart(rate = 1, vol = 0.5) { snd(t => { thump(t, 70, 38, 0.16, vol); thump(t + 0.2 / rate, 62, 34, 0.18, vol * 0.8); }); },
  thunder(vol = 1) { snd(t => { noiseBurst(t, 3.2, 120, 0.5, 0.5 * vol, 0, 'lowpass', 0.5); thump(t, 70, 26, 2.4, 0.7 * vol); noiseBurst(t + 0.05, 0.5, 2000, 0.8, 0.25 * vol); }); },
  chime(vol = 1) { snd(t => { for (let i = 0; i < 3; i++) { tone(t + i * 1.4, 392, 1.8, 0.06 * vol, 'sine'); tone(t + i * 1.4, 784, 1.2, 0.025 * vol, 'sine'); } }); },
  tick(vol = 1) { snd(t => noiseBurst(t, 0.03, 3500, 3, 0.12 * vol)); },
  car(vol = 1) { snd(t => { for (let i = 0; i < 3; i++) { tone(t + i * 0.6, 55 + i * 4, 0.55, 0.22 * vol, 'sawtooth', 0, 70 + i * 6, 0.02); noiseBurst(t + i * 0.6, 0.5, 300, 1, 0.15 * vol, 0, 'lowpass'); } tone(t + 1.9, 70, 4, 0.2 * vol, 'sawtooth', 0, 130, 0.5); }); },
  stun(vol = 1, pan = 0) { snd(t => { tone(t, 900, 0.6, 0.1 * vol, 'sawtooth', pan, 120, 0.01); noiseBurst(t, 0.3, 700, 1, 0.3 * vol, pan); }); },
  scream() { snd(t => { for (const [ty, f0, f1] of [['sawtooth', 640, 1850], ['square', 655, 1930]]) { const o = ac.createOscillator(), g = ac.createGain(), v = ac.createOscillator(), vg = ac.createGain(); o.type = ty; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.28); o.frequency.linearRampToValueAtTime(f1 * 0.8, t + 1.0); v.frequency.value = 36; vg.gain.value = 55; v.connect(vg); vg.connect(o.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.14, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0); o.connect(g); g.connect(outNode(1, 0)); o.start(t); v.start(t); o.stop(t + 1.05); v.stop(t + 1.05); } noiseBurst(t, 0.8, 2800, 0.6, 0.4); thump(t, 95, 28, 0.9, 1.0); }); },
  owl(vol = 1, pan = 0) { snd(t => { tone(t, 430, 0.32, 0.06 * vol, 'sine', pan, 390, 0.05); tone(t + 0.42, 395, 0.3, 0.05 * vol, 'sine', pan, 350, 0.05); tone(t + 1.1, 410, 0.5, 0.06 * vol, 'sine', pan, 340, 0.06); }); },
  cricket(vol = 1, pan = 0) { snd(t => { for (let i = 0; i < 5; i++) tone(t + i * 0.075, 4300 + Math.random() * 200, 0.035, 0.011 * vol, 'square', pan); }); },
  lap(vol = 1, pan = 0) { snd(t => { noiseBurst(t, 1.2, 380, 1.2, 0.05 * vol, pan, 'lowpass', 0.6); }); },
  hum(who, x, y, z) { const s = sp(x, y, z); if (s.v < 0.03) return; snd(t => { if (who === 'gran') { const n = [233, 262, 220, 247]; const f = pick(n); const o = ac.createOscillator(), v = ac.createOscillator(), vg = ac.createGain(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 0.94, t + 1.4); v.frequency.value = 5.2; vg.gain.value = 5; v.connect(vg); vg.connect(o.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06 * s.v, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5); o.connect(g); g.connect(outNode(1, s.p)); o.start(t); v.start(t); o.stop(t + 1.6); v.stop(t + 1.6); } else { tone(t, 82, 0.9, 0.09 * s.v, 'sawtooth', s.p, 70, 0.15); noiseBurst(t, 0.8, 300, 2, 0.06 * s.v, s.p, 'lowpass'); } }); },
};
function startAmbience() {
  ambGain = ac.createGain(); ambGain.gain.value = 0.0; ambGain.connect(master);
  const wind = ac.createBufferSource(); wind.buffer = noiseBuf; wind.loop = true; const wf = ac.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 260; const wg = ac.createGain(); wg.gain.value = 0.22; wind.connect(wf); wf.connect(wg); wg.connect(ambGain); wind.start();
  const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 140; lfo.connect(lg); lg.connect(wf.frequency); lfo.start();
  const d1 = ac.createOscillator(), d2 = ac.createOscillator(), dg = ac.createGain(); d1.type = d2.type = 'sawtooth'; d1.frequency.value = 43.6; d2.frequency.value = 46.2; const df = ac.createBiquadFilter(); df.type = 'lowpass'; df.frequency.value = 120; dg.gain.value = 0.05; d1.connect(df); d2.connect(df); df.connect(dg); dg.connect(ambGain); d1.start(); d2.start();
  ambGain.gain.linearRampToValueAtTime(1, ac.currentTime + 3);
  const c1 = ac.createOscillator(), c2 = ac.createOscillator(), c3 = ac.createOscillator(), cf = ac.createBiquadFilter(); chaseNode = ac.createGain(); chaseNode.gain.value = 0;     // the chase drone
  c1.type = 'sawtooth'; c2.type = 'sawtooth'; c3.type = 'square'; c1.frequency.value = 98; c2.frequency.value = 103.8; c3.frequency.value = 147; cf.type = 'lowpass'; cf.frequency.value = 420;
  c1.connect(cf); c2.connect(cf); c3.connect(cf); cf.connect(chaseNode); chaseNode.connect(master); c1.start(); c2.start(); c3.start();
}
let chaseNode = null;
function setChase(v) { if (!ac || !chaseNode) return; chaseNode.gain.setTargetAtTime(v * 0.1, ac.currentTime, 0.35); }
const AMB = { next: 6 };
function ambienceTick(dt) {                                  // random spooky house sounds
  if (!ac || G.state !== 'play') return;
  const R0 = roomAt(P.x, P.y, P.z), outside = !R0 || R0.id === 'garden' || R0.id === 'dock' || R0.id === 'shed';
  AMB.out = (AMB.out || 3) - dt; if (outside && AMB.out <= 0) { AMB.out = rr(2.5, 6); const r = rnd(); if (r < 0.6) SFX.cricket(1, rr(-0.8, 0.8)); else if (r < 0.8) SFX.owl(1, rr(-0.8, 0.8)); else if (R0 && R0.id === 'dock') SFX.lap(1, rr(-0.5, 0.5)); }
  AMB.next -= dt; if (AMB.next > 0) return; AMB.next = rr(7, 20);
  const r = rnd(); if (r < 0.45) SFX.creak(0.9, rr(-0.8, 0.8)); else if (r < 0.65) SFX.thunder(0.8); else if (r < 0.8) { SFX.tick(1); } else if (r < 0.9) SFX.chime(0.5); else snd(t => { noiseBurst(t, 1.4, 1400, 4, 0.05, rr(-1, 1)); tone(t, 330, 1.6, 0.025, 'sine', rr(-1, 1), 300, 0.4); });
}
