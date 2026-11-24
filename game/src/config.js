// Neon Pursuit — tuning and palette. One job: every number the game runs on.
// City: Neon Bay, a fictional neon harbour city. No real place, no borrowed names.
export const CFG = {
  viewW: 1280,
  viewH: 720,
  roadX: 360,          // road left edge
  roadW: 560,          // road width, 4 lanes
  laneW: 140,
  playerY: 560,        // player car rest line
  carW: 64,
  carH: 110,
  baseSpeed: 320,      // px/s world scroll at cruise
  maxSpeed: 620,
  minSpeed: 140,
  accel: 260,
  brake: 420,
  steer: 520,          // lateral px/s
  driftSteer: 760,     // lateral px/s while drifting
  nitroBoost: 300,     // extra speed while nitro is on
  nitroDrain: 34,      // nitro units per second of boost
  nitroMax: 100,
  durabilityMax: 100,
  crashDamage: 16,     // hitting traffic
  ramDamage: 9,        // police ram
  barrierDamage: 26,
  repairAmount: 30,
  nitroPickup: 45,
  starTimes: [0, 25, 55, 95, 145], // seconds survived -> wanted stars 1..5
  policeMax: [0, 1, 2, 3, 4],      // police on road per star level (index = stars-1)
  missionMarks: [500, 1500, 3000, 5000, 8000], // distance checkpoints (m)
};

export const COLORS = {
  sky: '#070b1d',
  road: '#14162a',
  roadEdge: '#2a2e55',
  laneCyan: '#19e3ff',
  laneMagenta: '#ff2e88',
  sidewalk: '#1b1e33',
  player: '#00e5ff',
  playerTrim: '#ff2e88',
  policeBody: '#e8ecff',
  policeTrim: '#1b2a6b',
  trafficPalette: ['#ffb020', '#ff5a3c', '#7CFC66', '#c77dff', '#ff8ad8', '#5aa2ff'],
  nitro: '#39ff88',
  repair: '#ffd23c',
  star: '#ffd23c',
  hudBg: 'rgba(7, 11, 29, 0.72)',
  text: '#eaf6ff',
  dim: '#8fa3c8',
  danger: '#ff3b5c',
};

export const CITY_NAME = 'Neon Bay';
export const GAME_NAME = 'Neon Pursuit';
