// ---------- building the world, menus, the game loop ----------
function initWorld() {
  buildFloors(); buildWalls(); makeDoors(); stairsUp(); stairsDown(); buildWindows(); buildOutdoors(); buildGarageDoor(); furnish();
  mergeStatics(); indexSolids(); navBuild(); FIXTURES_ON(false);
}
// ---------- screens ----------
const SCREENS = ['title', 'howto', 'settings', 'pause', 'over'];
function showScreen(id) { for (const s of SCREENS) $(s).classList.toggle('on', s === id); }
let settingsFrom = 'title';
function syncSettings() {
  const tg = $('tagline'); if (tg) tg.textContent = ({ 3: 'THREE', 5: 'FIVE', 7: 'SEVEN' }[(DIFF[CFG.diff] || DIFF.normal).days] || '') + ' NIGHTS TO ESCAPE';
  $('rngSens').value = CFG.sens; $('rngVol').value = CFG.vol; $('rngBright').value = CFG.bright;
  for (const [id, v] of [['segQ', CFG.quality], ['segScare', String(CFG.scare)], ['segDiff', CFG.diff]]) [...$(id).children].forEach(b => b.classList.toggle('on', b.dataset.v === v));
}
function wireUI() {
  $('btnPlay').onclick = () => startGame(); $('btnHow').onclick = () => { showScreen('howto'); }; $('howClose').onclick = () => showScreen(G.state === 'pause' ? 'pause' : 'title');
  $('btnSet').onclick = () => { settingsFrom = 'title'; syncSettings(); showScreen('settings'); }; $('btnPauseSet').onclick = () => { settingsFrom = 'pause'; syncSettings(); showScreen('settings'); }; $('setClose').onclick = () => { saveCfg(); showScreen(settingsFrom); };
  $('btnResume').onclick = () => resumeGame(); $('btnBook').onclick = () => { showNotebook(); }; $('btnQuit').onclick = () => toTitle();
  $('btnAgain').onclick = () => startGame(); $('btnOverMenu').onclick = () => toTitle();
  $('rngSens').oninput = e => { CFG.sens = +e.target.value; saveCfg(); }; $('rngVol').oninput = e => { CFG.vol = +e.target.value; if (master) master.gain.value = CFG.vol; saveCfg(); };
  $('rngBright').oninput = e => { CFG.bright = +e.target.value; renderer.toneMappingExposure = CFG.bright; saveCfg(); };
  const seg = (id, fn) => [...$(id).children].forEach(b => b.onclick = () => { fn(b.dataset.v); syncSettings(); saveCfg(); });
  seg('segQ', v => { CFG.quality = v; applyQuality(); }); seg('segScare', v => { CFG.scare = +v; }); seg('segDiff', v => { CFG.diff = v; });
  $('noteClose').onclick = () => closeNote(); $('codeClose').onclick = () => closeCodePad();
  const pad = $('padBtns'); ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].forEach(k => { const b = document.createElement('button'); b.textContent = k; b.onclick = () => codeKey(k); pad.appendChild(b); });
  for (const b of document.querySelectorAll('.btn,.seg button,.pad button')) b.addEventListener('pointerdown', () => { audioInit(); SFX.tick(0.9); });
  document.body.classList.toggle('touchmode', TOUCH);
}
document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play' && !G.noPause) pauseGame(); });
function applyQuality() { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TOUCH || CFG.quality === 'low' ? 1.25 : 2)); scene.fog.far = CFG.quality === 'low' ? 20 : 24; resize(); }
function updateNights() { $('nights').innerHTML = 'NIGHT ' + G.day + ' OF ' + G.maxDays + '<small id="roomName"></small>'; roomLabel = ''; }
// ---------- starting, pausing, ending ----------
function startGame() {
  audioInit(); if (ac && ac.state === 'suspended') ac.resume();
  try { if (TOUCH) { const el = document.documentElement, pr = el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null; if (pr && pr.catch) pr.catch(() => {}); if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); } catch (e) {}
  const dm = DIFF[CFG.diff] || DIFF.normal; G.maxDays = dm.days; G.day = 1; G.seed = QS.get('seed') ? +QS.get('seed') : 1 + Math.floor(Math.random() * 1e6); G.time = 0; G.ending = null; G.startT = performance.now();
  resetWorld(G.seed); resetHunters(true); toStart();
  for (const s of SCREENS) $(s).classList.remove('on'); $('hud').classList.add('on'); $('touch').classList.add('on'); document.body.classList.add('playing'); $('fade').style.opacity = 0; $('hurt').style.opacity = 0; $('scare').classList.remove('on');
  updateNights(); renderBar(); G.state = 'play'; G.chaseD = 99; if (!TOUCH) lockPointer();
  msg('You wake up in a locked room. Find a way out of the house…', 5000); setTimeout(() => { if (G.state === 'play') msg(TOUCH ? 'Tip: open drawers (USE), crouch (DUCK) and listen for them.' : 'Tip: E opens things. Shift runs (loud!), C crouches (quiet).', 5000); }, 5200);
}
function toStart() { P.x = ROOMS.bed1.cx - 1.5; P.z = ROOMS.bed1.cz + 0.5; P.y = FY.U; P.yaw = Math.PI / 2; P.pitch = 0; P.vy = 0; P.stepOff = 0; P.crouch = false; P.hidden = null; P.busy = null; P.eye = 1.6; }
function pauseGame() { if (G.state !== 'play') return; G.state = 'pause'; showScreen('pause'); $('prompt').classList.remove('on'); if (ac) ac.suspend(); if (document.pointerLockElement) document.exitPointerLock(); }
function resumeGame() { if (G.state !== 'pause') return; G.state = 'play'; for (const s of SCREENS) $(s).classList.remove('on'); if (ac) ac.resume(); if (!TOUCH) lockPointer(); last = performance.now(); }
function toTitle() { setChase(0); G.state = 'title'; $('hud').classList.remove('on'); $('touch').classList.remove('on'); document.body.classList.remove('playing'); $('scare').classList.remove('on'); $('fade').style.opacity = 0; showScreen('title'); syncSettings(); if (document.pointerLockElement) document.exitPointerLock(); if (ac) ac.resume(); }
function beginEnding(kind) {
  if (G.state !== 'play') return; G.state = 'ending'; G.ending = kind; P.busy = null; if (document.pointerLockElement) { G.noPause = true; document.exitPointerLock(); setTimeout(() => { G.noPause = false; }, 400); }
  $('prompt').classList.remove('on'); $('fade').style.transition = 'opacity 2.2s'; $('fade').style.opacity = 1;
  if (kind === 'car') { SFX.car(1); } else if (kind === 'boat') { SFX.car(0.5); snd(t => { noiseBurst(t, 2.5, 500, 0.5, 0.25, 0, 'lowpass'); }); } else { SFX.doorOpen(1, 0); SFX.thunder(0.6); }
  setTimeout(() => { $('fade').style.transition = ''; endGame(true, kind); }, 3300);
}
function endGame(win, kind) {
  setChase(0); G.state = 'over'; $('hud').classList.remove('on'); $('touch').classList.remove('on'); document.body.classList.remove('playing'); $('fade').style.opacity = 0; $('hurt').style.opacity = 0; $('danger').style.boxShadow = '';
  const mins = Math.max(1, Math.round((performance.now() - G.startT) / 60000));
  if (win) {
    $('overTitle').textContent = '🏆 YOU ESCAPED!';
    $('overText').innerHTML = (kind === 'car' ? 'You fixed the old car and roared out through the gate. Behind you, two silhouettes watch the taillights fade.' : kind === 'boat' ? 'The boat engine coughs to life and the dock slides away. The house shrinks into the mist.' : 'The front door swings open and the cold night air hits your face. You run and do not look back.') + '<br><br>Nights used: <b>' + G.day + ' of ' + G.maxDays + '</b> · Time: <b>' + mins + ' min</b>';
    SFX.chime(1); $('btnAgain').textContent = 'Play again';
  } else {
    $('overTitle').textContent = 'GAME OVER'; $('overText').innerHTML = 'You spent all ' + G.maxDays + ' nights in the Haunted Hallways. The house keeps you…<br><br>Try again with a different route. The items are in new places every time.'; $('btnAgain').textContent = 'Try again';
  }
  showScreen('over'); if (document.pointerLockElement) document.exitPointerLock();
}
// ---------- the loop ----------
let last = performance.now(), flashT = 30, flash = 0, hbT = 0, roomLabel = '';
function frame(now) {
  requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
  const st = G.state;
  if (st === 'play') {
    G.time += dt; updatePlayer(dt); updateHunters(dt); updateDoors(dt); updateContainers(dt); updateSpecial(dt); updateFly(dt); updateTracers(dt); updateLights(dt, t); updateHeldLight(dt); ambienceTick(dt); animateItems(t); updateHud(dt);
    flashT -= dt; if (flashT <= 0) { flashT = rr(35, 75); flash = 1; SFX.thunder(0.9); } if (flash > 0) { flash = Math.max(0, flash - dt * 2.2); ambient.intensity = 0.8 + flash * (Math.random() < 0.5 ? 2.5 : 0.5); } else ambient.intensity = 0.8;
  } else if (st === 'caught') {
    updateDoors(dt); updateLights(dt, t); const e = G.caughtBy; if (e) { const dx = e.x - P.x, dz = e.z - P.z, ty = Math.atan2(-dx, -dz); P.yaw += angDiff(P.yaw, ty) * Math.min(1, dt * 12); P.pitch += (0.1 - P.pitch) * Math.min(1, dt * 8); cam.rotation.set(P.pitch, P.yaw, Math.sin(now / 40) * 0.05); cam.position.set(P.x, P.y + P.eye, P.z); }
  } else if (st === 'ending') { updateDoors(dt); updateSpecial(dt); updateLights(dt, t); }
  else if (st === 'title' || st === 'over') { titleCam(t); updateLights(dt, t); }
  renderer.render(scene, cam);
}
function titleCam(t) { cam.position.set(Math.sin(t * 0.06) * 6, 2.4, 26 + Math.sin(t * 0.04) * 2); cam.lookAt(0, 3.2, 8); heldLight.position.copy(cam.position); heldLight.intensity = 0.0; }
function animateItems(t) { for (const w of WI) { w.mesh.rotation.y += 0.01; w.mesh.position.y = w.by + 0.05 + Math.sin(t * 2 + w.x * 3) * 0.012; } }
function updateHud(dt) {
  const R = roomAt(P.x, P.y, P.z), nm = R ? R.name : 'Outside'; if (nm !== roomLabel) { roomLabel = nm; const r = $('roomName'); if (r) r.textContent = nm; }
  const nz = $('noise'); if (!nz.children.length) { nz.innerHTML = '🔊<i style="height:6px"></i><i style="height:10px"></i><i style="height:14px"></i><i style="height:18px"></i><i style="height:22px"></i>'; }
  const lv = P.hidden ? 0 : Math.ceil(P.noise * 5 - 0.01); [...nz.querySelectorAll('i')].forEach((b, i) => { b.className = i < lv ? (i >= 3 ? 'hot' : 'on') : ''; });
  const cd = G.chaseD || 99, a = cd < 16 ? clamp((16 - cd) / 16, 0, 1) * 0.85 : 0; $('danger').style.boxShadow = P.hidden ? 'inset 0 0 220px 90px rgba(0,0,0,0.88)' : 'inset 0 0 160px 40px rgba(180,0,0,' + a.toFixed(2) + ')';
  setChase(P.hidden ? 0 : clamp((18 - cd) / 14, 0, 1));
  if (cd < 15 && !P.hidden) { hbT -= dt; if (hbT <= 0) { const rate = 1 + (15 - cd) / 8; hbT = 0.95 / rate; SFX.heart(rate, 0.35 + (15 - cd) / 15 * 0.5); } }
}
// ---------- go ----------
addEventListener('contextmenu', e => e.preventDefault()); wireUI(); syncSettings(); renderer.toneMappingExposure = CFG.bright;
try { initWorld(); } catch (err) { console.error(err); fatal('Something went wrong building the house: ' + err.message); }
resetHunters(true); toStart(); updateNights(); renderBar();
$('loading').style.display = 'none'; showScreen('title'); G.state = 'title';
requestAnimationFrame(frame);
if (QS.get('auto')) startGame();
