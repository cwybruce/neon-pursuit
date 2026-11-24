// Neon Pursuit — world state and simulation. One job: the chase itself.
// Top-down neon-city pursuit: the player flees down Neon Bay's avenues while the
// Neon Bay Police Department closes in. Traffic, roadblocks, nitro and repair
// pickups scroll past; wanted stars climb with survival time.
import { CFG, COLORS } from './config.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LANE_CENTERS = [0, 1, 2, 3].map((i) => CFG.roadX + CFG.laneW * (i + 0.5));

export function laneCenter(i) {
  return LANE_CENTERS[i];
}

export function createWorld(seed) {
  const rng = mulberry32(seed || 1337);
  const state = {
    seed: seed || 1337,
    rng,
    screen: 'menu', // menu | play | pause | over
    time: 0,
    distance: 0,    // metres travelled
    score: 0,
    speed: 0,
    targetSpeed: CFG.baseSpeed,
    playerX: laneCenter(1),
    playerY: CFG.playerY,
    playerVX: 0,
    drifting: false,
    nitroOn: false,
    nitro: 60,
    durability: CFG.durabilityMax,
    stars: 1,
    policeEvaded: 0,
    pickupsTaken: 0,
    missionIndex: 0,
    missionDone: false,
    best: 0,
    flash: 0,       // damage flash timer
    shake: 0,       // screen shake timer
    traffic: [],
    police: [],
    pickups: [],
    barriers: [],
    particles: [],
    buildings: [],  // side strips, generated as they scroll
    scroll: 0,
    spawnT: 0,
    policeT: 0,
    pickupT: 0,
    barrierT: 0,
    overReason: '',
    muted: false,
  };
  // pre-fill buildings on both sides so the first frame is already a city
  for (let y = -120; y < CFG.viewH + 240; y += 120) {
    state.buildings.push(makeBuilding(state, y, -1));
    state.buildings.push(makeBuilding(state, y + 60, 1));
  }
  try {
    state.best = Number(window.localStorage.getItem('neon-pursuit-best') || 0) || 0;
  } catch {
    state.best = 0;
  }
  return state;
}

function makeBuilding(state, y, side) {
  const r = state.rng;
  const w = 60 + r() * 110;
  const h = 90 + r() * 60;
  const windows = [];
  const cols = Math.max(2, Math.floor(w / 26));
  const rows = Math.max(2, Math.floor(h / 26));
  for (let i = 0; i < cols * rows; i++) {
    windows.push(r() < 0.42);
  }
  return {
    y, side, w, h, windows, cols, rows,
    hue: ['#ff2e88', '#19e3ff', '#ffd23c', '#7CFC66', '#c77dff'][Math.floor(r() * 5)],
    lit: r() < 0.7,
  };
}

function starLevel(state) {
  let level = 1;
  for (let i = 0; i < CFG.starTimes.length; i++) {
    if (state.time >= CFG.starTimes[i]) level = i + 1;
  }
  return level;
}

function spawnTraffic(state) {
  const r = state.rng;
  const lane = Math.floor(r() * 4);
  // never block all four lanes at once: keep at least one gap
  const busy = state.traffic.filter((t) => t.y < 60).map((t) => t.lane);
  if (busy.length >= 3 && busy.includes(lane)) return;
  const speed = 120 + r() * 140; // traffic's own forward speed (slower than player)
  state.traffic.push({
    kind: 'car',
    lane,
    x: laneCenter(lane),
    y: -140,
    w: CFG.carW,
    h: CFG.carH,
    speed,
    color: COLORS.trafficPalette[Math.floor(r() * COLORS.trafficPalette.length)],
    wobble: r() * Math.PI * 2,
  });
}

function spawnPolice(state) {
  const r = state.rng;
  const max = CFG.policeMax[state.stars - 1] || 0;
  if (state.police.length >= max) return;
  const lane = Math.floor(r() * 4);
  state.police.push({
    kind: 'police',
    lane,
    x: laneCenter(lane) + (r() - 0.5) * 40,
    y: CFG.viewH + 120 + r() * 80, // comes up from behind
    w: CFG.carW,
    h: CFG.carH,
    speed: CFG.baseSpeed * (0.92 + r() * 0.12),
    siren: r() * 10,
    ramCooldown: 0,
  });
}

function spawnPickup(state) {
  const r = state.rng;
  const lane = Math.floor(r() * 4);
  const kind = r() < 0.55 ? 'nitro' : 'repair';
  state.pickups.push({
    kind,
    lane,
    x: laneCenter(lane),
    y: -60,
    w: 44,
    h: 44,
    bob: r() * Math.PI * 2,
  });
}

function spawnBarrier(state) {
  const r = state.rng;
  const lane = Math.floor(r() * 4);
  state.barriers.push({
    kind: 'barrier',
    lane,
    x: laneCenter(lane),
    y: -80,
    w: 90,
    h: 34,
  });
}

function burst(state, x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = state.rng() * Math.PI * 2;
    const v = (speed || 160) * (0.4 + state.rng() * 0.8);
    state.particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 60,
      life: 0.4 + state.rng() * 0.5,
      maxLife: 0.9,
      size: 3 + state.rng() * 5,
      color,
    });
  }
}

function overlap(a, b) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 8 &&
    Math.abs(a.y - b.y) < (a.h + b.h) / 2 - 8;
}

export function startGame(state) {
  const keepBest = state.best;
  const fresh = createWorld(state.seed + 1);
  fresh.best = keepBest;
  fresh.screen = 'play';
  fresh.speed = CFG.baseSpeed;
  Object.assign(state, fresh);
}

export function update(state, input, audio, dt) {
  dt = Math.min(dt, 0.05);
  if (state.screen === 'menu') {
    // idle city scroll behind the title
    state.scroll += 120 * dt;
    scrollBuildings(state, 120 * dt);
    if (input.confirm) {
      startGame(state);
    }
    return;
  }
  if (state.screen === 'over') {
    if (input.confirm) startGame(state);
    return;
  }
  if (state.screen === 'pause') {
    if (input.pause) state.screen = 'play';
    if (input.confirm) state.screen = 'play';
    return;
  }

  // --- play ---
  if (input.pause) { state.screen = 'pause'; return; }
  if (input.mute) { state.muted = audio.toggleMute(); }

  state.time += dt;
  state.stars = starLevel(state);

  // speed: up accelerates, down brakes, nitro boosts
  state.targetSpeed = CFG.baseSpeed;
  if (input.up) state.targetSpeed = CFG.maxSpeed;
  if (input.down) state.targetSpeed = CFG.minSpeed;
  state.nitroOn = input.nitro && state.nitro > 0 && state.speed > CFG.baseSpeed * 0.7;
  if (state.nitroOn) {
    state.targetSpeed += CFG.nitroBoost;
    state.nitro = Math.max(0, state.nitro - CFG.nitroDrain * dt);
    if (state.rng() < 0.5) {
      state.particles.push({
        x: state.playerX + (state.rng() - 0.5) * 30,
        y: state.playerY + CFG.carH / 2,
        vx: (state.rng() - 0.5) * 40,
        vy: 260 + state.rng() * 120,
        life: 0.3, maxLife: 0.3,
        size: 6 + state.rng() * 8,
        color: state.rng() < 0.5 ? '#39ff88' : '#19e3ff',
      });
    }
  }
  const rate = state.targetSpeed > state.speed ? CFG.accel : CFG.brake;
  state.speed += Math.sign(state.targetSpeed - state.speed) * Math.min(rate * dt, Math.abs(state.targetSpeed - state.speed));
  state.speed = Math.max(CFG.minSpeed, Math.min(CFG.maxSpeed + CFG.nitroBoost, state.speed));

  // steering + drift
  state.drifting = input.drift && Math.abs(state.playerVX) > 60;
  const steerRate = state.drifting ? CFG.driftSteer : CFG.steer;
  let steer = 0;
  if (input.left) steer -= 1;
  if (input.right) steer += 1;
  state.playerVX = steer * steerRate;
  state.playerX += state.playerVX * dt;
  if (state.drifting) {
    state.particles.push({
      x: state.playerX + (state.rng() < 0.5 ? -26 : 26),
      y: state.playerY + CFG.carH / 2 - 6,
      vx: (state.rng() - 0.5) * 30,
      vy: 120,
      life: 0.5, maxLife: 0.5,
      size: 8 + state.rng() * 8,
      color: '#9fb4d8',
    });
    state.score += 2 * dt * 60; // drift pays
  }
  const roadMin = CFG.roadX + CFG.carW / 2 + 6;
  const roadMax = CFG.roadX + CFG.roadW - CFG.carW / 2 - 6;
  if (state.playerX < roadMin) { state.playerX = roadMin; state.playerVX = 0; }
  if (state.playerX > roadMax) { state.playerX = roadMax; state.playerVX = 0; }

  // world scroll + distance
  const scrollSpeed = state.speed;
  state.scroll += scrollSpeed * dt;
  state.distance += (state.speed * dt) / 14; // ~14 px per metre
  state.score += state.speed * dt * 0.06;
  scrollBuildings(state, scrollSpeed * dt);

  // mission checkpoints
  if (state.missionIndex < CFG.missionMarks.length &&
      state.distance >= CFG.missionMarks[state.missionIndex]) {
    state.missionIndex++;
    state.score += 500;
    state.nitro = Math.min(CFG.nitroMax, state.nitro + 25);
    audio.checkpoint();
    if (state.missionIndex >= CFG.missionMarks.length) state.missionDone = true;
  }

  // spawns (rate rises with stars)
  const trafficRate = 0.9 - state.stars * 0.08;
  state.spawnT += dt;
  if (state.spawnT > trafficRate) { state.spawnT = 0; spawnTraffic(state); }
  state.policeT += dt;
  if (state.policeT > 1.6) { state.policeT = 0; spawnPolice(state); }
  state.pickupT += dt;
  if (state.pickupT > 3.2) { state.pickupT = 0; spawnPickup(state); }
  state.barrierT += dt;
  if (state.barrierT > 5.5 - state.stars * 0.5) { state.barrierT = 0; spawnBarrier(state); }

  // move traffic down relative to the player
  for (const t of state.traffic) {
    t.y += (state.speed - t.speed) * dt;
    t.wobble += dt * 2;
    t.x = laneCenter(t.lane) + Math.sin(t.wobble) * 6;
  }
  state.traffic = state.traffic.filter((t) => t.y < CFG.viewH + 180);

  // move pickups / barriers
  for (const p of state.pickups) { p.y += state.speed * dt; p.bob += dt * 4; }
  state.pickups = state.pickups.filter((p) => p.y < CFG.viewH + 80);
  for (const b of state.barriers) { b.y += state.speed * dt; }
  state.barriers = state.barriers.filter((b) => b.y < CFG.viewH + 100);

  // police AI: close in from behind, steer onto the player, ram
  for (const p of state.police) {
    p.siren += dt * 6;
    p.ramCooldown = Math.max(0, p.ramCooldown - dt);
    const dy = state.playerY - p.y;
    // police are faster than the player when behind, slower when ahead
    const chase = dy > 0 ? state.speed * 1.12 : state.speed * 0.94;
    p.y += (chase - state.speed * 0.55) * dt * 0.9 + (p.speed - state.speed) * dt * 0.4;
    // steer toward the player's lane
    const dx = state.playerX - p.x;
    p.x += Math.max(-260 * dt, Math.min(260 * dt, dx * 1.6 * dt + Math.sign(dx) * 40 * dt));
    p.x = Math.max(roadMin, Math.min(roadMax, p.x));
    // ram: when touching, shove the player and damage
    if (overlap({ x: p.x, y: p.y, w: p.w, h: p.h }, { x: state.playerX, y: state.playerY, w: CFG.carW, h: CFG.carH }) && p.ramCooldown <= 0) {
      p.ramCooldown = 0.9;
      state.durability -= CFG.ramDamage;
      state.flash = 0.25;
      state.shake = 0.3;
      state.playerX += Math.sign(state.playerX - p.x || 1) * 26;
      burst(state, state.playerX, state.playerY, '#ffd23c', 10, 200);
      audio.crash();
    }
  }
  // police that fall too far behind are "evaded"
  const before = state.police.length;
  state.police = state.police.filter((p) => {
    if (p.y < -220) { state.policeEvaded++; state.score += 150; return false; }
    if (p.y > CFG.viewH + 260) { state.policeEvaded++; state.score += 150; return false; }
    return true;
  });
  if (state.police.length < before && state.policeEvaded > 0 && state.rng() < 0.3) audio.siren();

  // collisions: traffic
  const playerBox = { x: state.playerX, y: state.playerY, w: CFG.carW, h: CFG.carH };
  for (const t of state.traffic) {
    if (overlap(t, playerBox)) {
      state.durability -= CFG.crashDamage;
      state.flash = 0.3;
      state.shake = 0.35;
      state.speed = Math.max(CFG.minSpeed, state.speed * 0.72);
      burst(state, state.playerX, state.playerY - 20, '#ff5a3c', 14, 240);
      burst(state, t.x, t.y, '#ffb020', 8, 160);
      audio.crash();
      // shove the traffic car aside so one hit is one hit
      t.y += 130;
      t.x += t.x < state.playerX ? -70 : 70;
    }
  }
  // collisions: barriers
  for (const b of state.barriers) {
    if (overlap(b, playerBox)) {
      state.durability -= CFG.barrierDamage;
      state.flash = 0.3;
      state.shake = 0.4;
      state.speed = Math.max(CFG.minSpeed, state.speed * 0.6);
      burst(state, b.x, b.y, '#ff3b5c', 16, 260);
      audio.crash();
      b.y += 200;
    }
  }
  // pickups
  for (const p of state.pickups) {
    if (overlap(p, playerBox)) {
      p.taken = true;
      state.pickupsTaken++;
      if (p.kind === 'nitro') {
        state.nitro = Math.min(CFG.nitroMax, state.nitro + CFG.nitroPickup);
        state.score += 100;
        burst(state, p.x, p.y, '#39ff88', 12, 180);
        audio.pickup();
      } else {
        state.durability = Math.min(CFG.durabilityMax, state.durability + CFG.repairAmount);
        state.score += 100;
        burst(state, p.x, p.y, '#ffd23c', 12, 180);
        audio.repair();
      }
    }
  }
  state.pickups = state.pickups.filter((p) => !p.taken);

  // particles
  for (const pt of state.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt + state.speed * dt * 0.4;
    pt.life -= dt;
  }
  state.particles = state.particles.filter((pt) => pt.life > 0);

  // timers
  state.flash = Math.max(0, state.flash - dt);
  state.shake = Math.max(0, state.shake - dt);

  // wrecked?
  if (state.durability <= 0) {
    state.durability = 0;
    state.screen = 'over';
    state.overReason = 'WRECKED — the NPD boxed you in';
    burst(state, state.playerX, state.playerY, '#ff5a3c', 30, 320);
    if (state.score > state.best) {
      state.best = Math.floor(state.score);
      try { window.localStorage.setItem('neon-pursuit-best', String(state.best)); } catch { /* no storage */ }
    }
  }
}

function scrollBuildings(state, dy) {
  for (const b of state.buildings) b.y += dy;
  // recycle buildings that scrolled off the bottom
  for (const b of state.buildings) {
    if (b.y > CFG.viewH + 120) {
      const fresh = makeBuilding(state, b.y - (CFG.viewH + 360), b.side);
      Object.assign(b, fresh);
    }
  }
}
