# Neon Pursuit — Dossier

A high-speed neon police chase through Neon Bay, a fictional neon harbour city.
You lifted the mayor's prototype. The whole Neon Bay Police Department is behind
you. Dodge traffic and roadblocks, drift, boost on nitro, grab repairs, and outrun
the five-star dragnet. Survive the drop checkpoints and chase the next one.

## How to play

- **Steer** — Arrow keys or A/D. **Speed** — Arrow Up / W. **Brake** — Arrow Down / S.
- **SPACE** — handbrake drift (drifting through traffic pays bonus points).
- **SHIFT** — nitro boost (drains the nitro meter; nitro pickups refill it).
- **P** — pause. **M** — mute. **ENTER** — start / restart.
- Best score is saved in the browser (localStorage).

## Systems

- **Wanted level** — 1 to 5 stars, climbing with survival time. More stars means
  more police on the road, faster and more aggressive.
- **Police AI** — patrol cars close in from behind, steer onto your lane, and ram
  you. Cars you outrun count as evaded and pay points.
- **Traffic** — civilian cars in four lanes, slower than you, drifting between lanes.
  Never blocks all four lanes at once.
- **Roadblocks** — striped barriers; hitting one costs heavy durability.
- **Pickups** — nitro canisters (green N) and repair kits (yellow +).
- **Missions** — five distance drop checkpoints (500 / 1500 / 3000 / 5000 / 8000 m),
  each paying 500 points and a nitro refill.
- **HUD** — score, distance, speed, wanted stars, durability and nitro bars.
- **Minimap** — live strip showing your car, police, traffic and pickups ahead.
- **Sound** — WebAudio synth bleeps for pickups, crashes, nitro and checkpoints.
  No audio files, no network requests.

## Screenshots

- `1-start.jpg` (73,465 bytes) — title screen over the scrolling city.
- `2-play.jpg` (71,506 bytes) — early chase: traffic, a roadblock, HUD, minimap.
- `3-chase.jpg` (74,730 bytes) — four-star heat: drifting with nitro, low
  durability, police closing in.
- `4-over.jpg` (61,959 bytes) — BUSTED end screen with final score.

All four are real renders of the game's own code in desktop Chrome (1280x720),
taken with a CDP script. No edits, no compositing.

## Files

- `game/index.html` — canvas page, loads the game modules.
- `game/src/main.js` — entry point: canvas, game loop, screens, `?shot=` scenes.
- `game/src/config.js` — tuning numbers and the neon palette.
- `game/src/world.js` — world state and simulation (chase, collisions, police AI).
- `game/src/render.js` — drawing: city, cars, HUD, minimap, overlays.
- `game/src/input.js` — keyboard input.
- `game/src/audio.js` — WebAudio synth effects.
- `game/src/shots.js` — deterministic screenshot setups (fixed seeds).
- `main.ts` — entry program: copies game/ and screenshots/ to /output and writes
  dossier.json with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's library, unchanged.
- `serve.ts` — tiny static server for local play (`node serve.ts`).
- `shots.json` — the four screenshot scenes.

## Tests

- Desktop Chrome 158, headless, CDP-driven: 0 console errors, 0 external
  (non-localhost) requests across all four screenshot loads.
- `main.ts` run twice (v1 and v2): identical dossier.json sha256
  (a10714652ec75e2719d6b2780d34b8d3f1827a8ca1a41a7594f0b18a2372d27c).
- Screenshots: 4 JPEGs, 1280x720, each under 256 KiB.
- Two real bugs fixed during testing: a missing `playerY` initialisation (the
  player car rendered nowhere until the state carried it) and a chase screenshot
  that ended in a wreck (the shot now stages the chase frame explicitly).
