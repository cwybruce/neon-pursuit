// Neon Pursuit — keyboard input. One job: turn key events into a control state.
export function createInput() {
  const keys = new Set();
  const pressed = new Set(); // edge-triggered, consumed by the game each frame
  const codeOf = (e) => e.code;

  function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code);
  }
  function onKeyUp(e) {
    keys.delete(e.code);
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function down(...codes) {
    return codes.some((c) => keys.has(c));
  }
  function wasPressed(...codes) {
    return codes.some((c) => pressed.has(c));
  }
  function endFrame() {
    pressed.clear();
  }

  return {
    get left() { return down('ArrowLeft', 'KeyA'); },
    get right() { return down('ArrowRight', 'KeyD'); },
    get up() { return down('ArrowUp', 'KeyW'); },
    get down() { return down('ArrowDown', 'KeyS'); },
    get drift() { return down('Space'); },
    get nitro() { return down('ShiftLeft', 'ShiftRight'); },
    get pause() { return wasPressed('KeyP', 'Escape'); },
    get confirm() { return wasPressed('Enter', 'Space'); },
    get mute() { return wasPressed('KeyM'); },
    endFrame,
  };
}
