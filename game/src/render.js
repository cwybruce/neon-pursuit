// Neon Pursuit — rendering. One job: draw the city, the chase, the HUD, the screens.
import { CFG, COLORS, CITY_NAME, GAME_NAME } from './config.js';
import { laneCenter } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCar(ctx, x, y, w, h, body, trim, opts) {
  const o = opts || {};
  ctx.save();
  ctx.translate(x, y);
  if (o.tilt) ctx.rotate(o.tilt);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, -w / 2 + 4, -h / 2 + 8, w, h, 14);
  ctx.fill();
  // body
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, body);
  g.addColorStop(0.5, trim);
  g.addColorStop(1, body);
  ctx.fillStyle = g;
  rr(ctx, -w / 2, -h / 2, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // cabin
  ctx.fillStyle = 'rgba(8, 12, 28, 0.85)';
  rr(ctx, -w / 2 + 9, -h / 2 + 26, w - 18, h / 2 - 20, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(140, 220, 255, 0.25)';
  rr(ctx, -w / 2 + 12, -h / 2 + 30, w - 24, 10, 5);
  ctx.fill();
  // headlights (front = top of screen, cars drive up)
  ctx.fillStyle = '#fff8c9';
  ctx.fillRect(-w / 2 + 6, -h / 2 - 2, 12, 5);
  ctx.fillRect(w / 2 - 18, -h / 2 - 2, 12, 5);
  // taillights
  ctx.fillStyle = '#ff2e4d';
  ctx.fillRect(-w / 2 + 6, h / 2 - 3, 12, 5);
  ctx.fillRect(w / 2 - 18, h / 2 - 3, 12, 5);
  ctx.restore();
}

function drawPoliceLights(ctx, x, y, w, siren) {
  const phase = Math.floor(siren) % 2 === 0;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = phase ? '#ff2e4d' : '#2e6bff';
  rr(ctx, x - w / 2 + 8, y - 8, w / 2 - 10, 10, 4);
  ctx.fill();
  ctx.fillStyle = phase ? '#2e6bff' : '#ff2e4d';
  rr(ctx, x + 2, y - 8, w / 2 - 10, 10, 4);
  ctx.fill();
  // light glow on the road
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = phase ? '#ff2e4d' : '#2e6bff';
  ctx.beginPath();
  ctx.arc(x, y, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCity(ctx, state) {
  const { roadX, roadW, viewW, viewH } = CFG;
  // sky
  ctx.fillStyle = COLORS.sky;
  ctx.fillRect(0, 0, viewW, viewH);
  // sidewalks
  ctx.fillStyle = COLORS.sidewalk;
  ctx.fillRect(roadX - 70, 0, 70, viewH);
  ctx.fillRect(roadX + roadW, 0, 70, viewH);
  // buildings
  for (const b of state.buildings) {
    const bx = b.side < 0 ? roadX - 80 - b.w : roadX + roadW + 80;
    ctx.fillStyle = '#10132a';
    ctx.fillRect(bx, b.y, b.w, b.h);
    ctx.strokeStyle = b.hue;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, b.y, b.w, b.h);
    ctx.globalAlpha = 1;
    // windows
    const ww = b.w / b.cols;
    const wh = b.h / b.rows;
    for (let i = 0; i < b.windows.length; i++) {
      if (!b.windows[i]) continue;
      const cx = bx + (i % b.cols) * ww + 5;
      const cy = b.y + Math.floor(i / b.cols) * wh + 5;
      ctx.fillStyle = b.hue;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(cx, cy, ww - 10, wh - 10);
    }
    ctx.globalAlpha = 1;
    // rooftop sign glow
    if (b.lit) {
      ctx.fillStyle = b.hue;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(bx + b.w / 2 - 24, b.y - 4, 48, 6);
      ctx.globalAlpha = 1;
    }
  }
  // road
  ctx.fillStyle = COLORS.road;
  ctx.fillRect(roadX, 0, roadW, viewH);
  ctx.strokeStyle = COLORS.roadEdge;
  ctx.lineWidth = 4;
  ctx.strokeRect(roadX, -4, roadW, viewH + 8);
  // lane dashes, scrolling with the world
  ctx.lineWidth = 5;
  ctx.setLineDash([34, 30]);
  ctx.lineDashOffset = -(state.scroll % 64);
  for (let i = 1; i < 4; i++) {
    const x = roadX + CFG.laneW * i;
    ctx.strokeStyle = i === 2 ? COLORS.laneMagenta : COLORS.laneCyan;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.lineTo(x, viewH + 10);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  // neon edge glow
  ctx.fillStyle = COLORS.laneCyan;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(roadX + 2, 0, 3, viewH);
  ctx.fillStyle = COLORS.laneMagenta;
  ctx.fillRect(roadX + roadW - 5, 0, 3, viewH);
  ctx.globalAlpha = 1;
}

function drawPickups(ctx, state) {
  for (const p of state.pickups) {
    const bob = Math.sin(p.bob) * 4;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = p.kind === 'nitro' ? COLORS.nitro : COLORS.repair;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = p.kind === 'nitro' ? '#0b2b18' : '#2b2205';
    ctx.strokeStyle = p.kind === 'nitro' ? COLORS.nitro : COLORS.repair;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = p.kind === 'nitro' ? COLORS.nitro : COLORS.repair;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.kind === 'nitro' ? 'N' : '+', 0, 1);
    ctx.restore();
  }
}

function drawBarriers(ctx, state) {
  for (const b of state.barriers) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = '#ff9f1c';
    rr(ctx, -b.w / 2, -b.h / 2, b.w, b.h, 6);
    ctx.fill();
    ctx.fillStyle = '#14162a';
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.translate(i * 26, 0);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-7, -7, 14, 14);
      ctx.restore();
    }
    ctx.restore();
  }
}

function drawParticles(ctx, state) {
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * (pt.life / pt.maxLife), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, state) {
  const { viewW } = CFG;
  ctx.fillStyle = COLORS.hudBg;
  rr(ctx, 12, 10, viewW - 24, 64, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`SCORE ${Math.floor(state.score).toLocaleString('en-US')}`, 28, 32);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`${Math.floor(state.distance)} m  ·  ${Math.round(state.speed * 0.36)} km/h`, 28, 58);
  // wanted stars
  ctx.textAlign = 'right';
  ctx.font = 'bold 26px system-ui, sans-serif';
  let stars = '';
  for (let i = 0; i < 5; i++) stars += i < state.stars ? '★' : '☆';
  ctx.fillStyle = COLORS.star;
  ctx.fillText(stars, viewW - 28, 32);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`NPD HEAT ${state.stars}/5  ·  EVADED ${state.policeEvaded}`, viewW - 28, 58);
  // durability + nitro bars (bottom left)
  bar(ctx, 28, CFG.viewH - 56, 240, 16, state.durability / CFG.durabilityMax, '#ff3b5c', 'DURABILITY');
  bar(ctx, 28, CFG.viewH - 28, 240, 16, state.nitro / CFG.nitroMax, '#39ff88', 'NITRO — SHIFT');
}

function bar(ctx, x, y, w, h, frac, color, label) {
  ctx.fillStyle = 'rgba(7, 11, 29, 0.72)';
  rr(ctx, x - 6, y - 4, w + 12, h + 8, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  rr(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.fillStyle = color;
  rr(ctx, x, y, Math.max(8, w * Math.max(0, Math.min(1, frac))), h, 6);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w + 12, y + h / 2);
}

function drawMinimap(ctx, state) {
  const x = 1000;
  const y = 120;
  const w = 150;
  const h = 420;
  ctx.fillStyle = COLORS.hudBg;
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MINIMAP — NEON BAY', x + w / 2, y + 22);
  // road strip
  const rx = x + w / 2 - 22;
  ctx.fillStyle = '#14162a';
  rr(ctx, rx, y + 40, 44, h - 60, 6);
  ctx.fill();
  ctx.strokeStyle = COLORS.laneCyan;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 40);
  ctx.lineTo(x + w / 2, y + h - 20);
  ctx.stroke();
  ctx.setLineDash([]);
  const mapY = (worldY) => {
    // worldY 0..720 maps to the strip, player at the bottom
    const t = Math.max(0, Math.min(1, worldY / CFG.viewH));
    return y + 40 + t * (h - 60);
  };
  const mapX = (worldX) => rx + 22 + ((worldX - (CFG.roadX + CFG.roadW / 2)) / (CFG.roadW / 2)) * 20;
  // traffic dots
  ctx.fillStyle = '#8fa3c8';
  for (const t of state.traffic) {
    ctx.beginPath();
    ctx.arc(mapX(t.x), mapY(t.y), 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // pickups
  for (const p of state.pickups) {
    ctx.fillStyle = p.kind === 'nitro' ? COLORS.nitro : COLORS.repair;
    ctx.beginPath();
    ctx.arc(mapX(p.x), mapY(p.y), 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // police
  for (const p of state.police) {
    ctx.fillStyle = Math.floor(p.siren) % 2 === 0 ? '#ff2e4d' : '#2e6bff';
    ctx.beginPath();
    ctx.arc(mapX(p.x), mapY(p.y), 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // player
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(mapX(state.playerX), mapY(state.playerY), 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  // mission line
  ctx.fillStyle = COLORS.dim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const mark = state.missionIndex < CFG.missionMarks.length
    ? `NEXT DROP ${CFG.missionMarks[state.missionIndex]} m`
    : 'ALL DROPS DONE';
  ctx.fillText(mark, x + w / 2, y + h - 8);
}

function drawMissionPanel(ctx, state) {
  const x = 24;
  const y = 120;
  const w = 300;
  ctx.fillStyle = COLORS.hudBg;
  rr(ctx, x, y, w, 150, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('JOB — ESCAPE THE DRAGNET', x + 16, y + 28);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = COLORS.dim;
  const lines = [
    `Outrun the NPD. Survive, drift,`,
    `grab nitro and repairs. Every`,
    `checkpoint pays 500 pts.`,
    '',
    `Drops done: ${state.missionIndex}/${CFG.missionMarks.length}`,
    `Police evaded: ${state.policeEvaded}`,
    `Pickups: ${state.pickupsTaken}`,
  ];
  lines.forEach((ln, i) => ctx.fillText(ln, x + 16, y + 54 + i * 18));
}

function drawOverlay(ctx, state) {
  const { viewW, viewH } = CFG;
  ctx.fillStyle = 'rgba(4, 6, 16, 0.66)';
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.textAlign = 'center';
  if (state.screen === 'menu') {
    ctx.fillStyle = COLORS.laneMagenta;
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.fillText(GAME_NAME, viewW / 2, 190);
    ctx.fillStyle = COLORS.laneCyan;
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`HIGH-SPEED PURSUIT IN ${CITY_NAME.toUpperCase()}`, viewW / 2, 240);
    ctx.fillStyle = COLORS.text;
    ctx.font = '21px system-ui, sans-serif';
    const lines = [
      'You lifted the mayor\'s prototype. The whole NPD is behind you.',
      '',
      '← → / A D  steer      ↑ / W  speed      ↓ / S  brake',
      'SPACE  handbrake drift      SHIFT  nitro boost      P  pause',
      'Dodge traffic and barriers. Grab nitro and repairs. Don\'t get boxed in.',
      '',
      'Press ENTER to drive.',
    ];
    lines.forEach((ln, i) => ctx.fillText(ln, viewW / 2, 300 + i * 32));
    if (state.best > 0) {
      ctx.fillStyle = COLORS.star;
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(`BEST SCORE ${state.best.toLocaleString('en-US')}`, viewW / 2, 300 + lines.length * 32 + 16);
    }
  } else if (state.screen === 'pause') {
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.fillText('PAUSED', viewW / 2, 320);
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillStyle = COLORS.dim;
    ctx.fillText('Press P or ENTER to keep driving', viewW / 2, 380);
  } else if (state.screen === 'over') {
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.fillText('BUSTED', viewW / 2, 230);
    ctx.fillStyle = COLORS.text;
    ctx.font = '26px system-ui, sans-serif';
    ctx.fillText(state.overReason, viewW / 2, 290);
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText(`SCORE ${Math.floor(state.score).toLocaleString('en-US')}   ·   ${Math.floor(state.distance)} m   ·   ${state.policeEvaded} POLICE EVADED`, viewW / 2, 350);
    ctx.fillStyle = state.score >= state.best && state.score > 0 ? COLORS.star : COLORS.dim;
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(state.score >= state.best && state.score > 0 ? 'NEW BEST — the Bay remembers.' : `BEST ${state.best.toLocaleString('en-US')}`, viewW / 2, 400);
    ctx.fillStyle = COLORS.text;
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText('Press ENTER to drive again.', viewW / 2, 470);
  }
}

export function render(ctx, state) {
  const { viewW, viewH } = CFG;
  ctx.save();
  // screen shake on impacts
  if (state.shake > 0) {
    const m = state.shake * 14;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }
  drawCity(ctx, state);
  drawPickups(ctx, state);
  drawBarriers(ctx, state);
  // traffic
  for (const t of state.traffic) {
    drawCar(ctx, t.x, t.y, t.w, t.h, t.color, '#10132a', { tilt: Math.sin(t.wobble) * 0.02 });
  }
  // police (behind the player, on top of traffic)
  for (const p of state.police) {
    drawCar(ctx, p.x, p.y, p.w, p.h, COLORS.policeBody, COLORS.policeTrim, {});
    drawPoliceLights(ctx, p.x, p.y - p.h / 2 + 22, p.w, p.siren);
  }
  // player
  const tilt = state.drifting ? Math.sign(state.playerVX || 1) * 0.09 : (state.playerVX / CFG.steer) * 0.05;
  drawCar(ctx, state.playerX, state.playerY, CFG.carW, CFG.carH, COLORS.player, COLORS.playerTrim, { tilt });
  if (state.nitroOn) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#39ff88';
    ctx.beginPath();
    ctx.moveTo(state.playerX - 16, state.playerY + CFG.carH / 2);
    ctx.lineTo(state.playerX, state.playerY + CFG.carH / 2 + 34 + Math.random() * 16);
    ctx.lineTo(state.playerX + 16, state.playerY + CFG.carH / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  drawParticles(ctx, state);
  ctx.restore();

  // damage flash
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 46, 77, ${state.flash * 0.55})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  if (state.screen === 'play' || state.screen === 'pause') {
    drawHud(ctx, state);
    drawMinimap(ctx, state);
    drawMissionPanel(ctx, state);
  }
  if (state.screen !== 'play') {
    drawOverlay(ctx, state);
  }
}
