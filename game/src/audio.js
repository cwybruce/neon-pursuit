// Neon Pursuit — tiny WebAudio synth. One job: bleeps for pickup, crash, nitro.
// No audio files, no network. Created lazily on the first user gesture; shot mode
// (deterministic screenshots) never creates an AudioContext.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function blip(freqA, freqB, dur, type, gain) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    try {
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freqA, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqB), t + dur);
      g.gain.setValueAtTime(gain || 0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {
      // audio is garnish; never break the game
    }
  }

  return {
    pickup() { blip(660, 990, 0.12, 'sine', 0.06); },
    repair() { blip(520, 780, 0.18, 'sine', 0.06); },
    crash() { blip(160, 40, 0.25, 'sawtooth', 0.08); },
    nitro() { blip(300, 900, 0.3, 'sawtooth', 0.04); },
    checkpoint() { blip(440, 440, 0.1, 'triangle', 0.06); blip(660, 660, 0.14, 'triangle', 0.06); },
    siren() { blip(700, 950, 0.35, 'triangle', 0.02); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
  };
}
