// Neon Pursuit — entry point. One job: own the canvas, the loop, the screens.
// ?shot=start|play|chase|over renders one deterministic frame and stops (screenshots).
// Otherwise the game runs live with requestAnimationFrame.
import { CFG } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld, update } from './world.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 7) || 7;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function fit() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(CFG.viewW * dpr);
  canvas.height = Math.round(CFG.viewH * dpr);
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', fit);
fit();

const input = createInput();
const audio = createAudio();
let state = createWorld(seed);

function announce() {
  if (!statusEl) return;
  const lines = {
    menu: 'Neon Pursuit. Press Enter to drive.',
    play: `Driving. Score ${Math.floor(state.score)}. Wanted level ${state.stars} of 5.`,
    pause: 'Paused.',
    over: `Busted. Score ${Math.floor(state.score)}. Press Enter to drive again.`,
  };
  statusEl.textContent = lines[state.screen] || '';
}

if (shot) {
  // deterministic screenshot: fixed scene, one frame, no audio, no loop
  document.title = `Neon Pursuit — ${shot}`;
  applyShot(state, shot, seed);
  render(ctx, state);
  announce();
  window.__shotReady = true;
} else {
  let last = performance.now();
  let lastScreen = state.screen;
  let announceT = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(state, input, audio, dt);
    input.endFrame();
    render(ctx, state);
    announceT += dt;
    if (state.screen !== lastScreen || announceT > 2) {
      announce();
      lastScreen = state.screen;
      announceT = 0;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
