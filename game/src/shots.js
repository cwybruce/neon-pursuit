// Neon Pursuit — deterministic screenshot setups. One job: fixed scenes for ?shot=.
// A shot runs the simulation a fixed number of ticks from a fixed seed with scripted
// inputs, then renders once. Same seed, same picture, every time.
import { CFG } from './config.js';
import { createWorld, update, startGame } from './world.js';

function scriptedInput(overrides) {
  return {
    left: false, right: false, up: true, down: false,
    drift: false, nitro: false, pause: false, confirm: false, mute: false,
    endFrame() {},
    ...overrides,
  };
}

function tick(state, audio, input, n) {
  for (let i = 0; i < n; i++) update(state, input, audio, 1 / 60);
}

const silentAudio = {
  pickup() {}, repair() {}, crash() {}, nitro() {},
  checkpoint() {}, siren() {}, toggleMute() { return false; },
  get muted() { return false; },
};

export function applyShot(state, name, seed) {
  const s = seed || 7;
  if (name === 'start') {
    // title screen over a slow-scrolling city
    const fresh = createWorld(s);
    Object.assign(state, fresh);
    state.screen = 'menu';
    tick(state, silentAudio, scriptedInput({}), 90);
    state.screen = 'menu';
    return state;
  }
  if (name === 'play') {
    const fresh = createWorld(s);
    Object.assign(state, fresh);
    startGame(state);
    // cruise, weave a little, pick up speed
    tick(state, silentAudio, scriptedInput({}), 150);
    tick(state, silentAudio, scriptedInput({ left: true }), 40);
    tick(state, silentAudio, scriptedInput({ right: true }), 60);
    tick(state, silentAudio, scriptedInput({}), 90);
    return state;
  }
  if (name === 'chase') {
    const fresh = createWorld(s + 3);
    Object.assign(state, fresh);
    startGame(state);
    // long run: high wanted level, police swarming, drifting through traffic
    tick(state, silentAudio, scriptedInput({}), 300);
    tick(state, silentAudio, scriptedInput({ nitro: true }), 120);
    tick(state, silentAudio, scriptedInput({ left: true, drift: true }), 50);
    tick(state, silentAudio, scriptedInput({ right: true, drift: true }), 50);
    tick(state, silentAudio, scriptedInput({ nitro: true }), 60);
    // the scripted run is rough enough to wreck the car: stage the chase frame
    // itself — alive, four stars, visibly battered, police closing in.
    state.screen = 'play';
    state.durability = 42;
    state.stars = Math.max(state.stars, 4);
    state.flash = 0;
    state.shake = 0;
    return state;
  }
  if (name === 'over') {
    const fresh = createWorld(s + 11);
    Object.assign(state, fresh);
    startGame(state);
    tick(state, silentAudio, scriptedInput({}), 420);
    tick(state, silentAudio, scriptedInput({ right: true }), 120);
    // force the wreck for the end screen
    state.durability = 0;
    state.screen = 'over';
    state.overReason = 'WRECKED — the NPD boxed you in';
    state.score = Math.max(state.score, 4200);
    state.distance = Math.max(state.distance, 2600);
    return state;
  }
  return state;
}

export function shotNames() {
  return ['start', 'play', 'chase', 'over'];
}
