/** Vector-only cabinet artwork: lives entirely within the existing 360×452 canvas. */
import { DUCK_DURATION, SIMON_COLORS, SLOT_SYMBOLS } from './mini-games.js';

const W = 360, H = 452;

// Utility helpers for canvas vector rendering
const round = (ctx, x, y, w, h, r, fill, stroke, strokeWidth = 1.5) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth; ctx.stroke(); }
};

const txt = (ctx, str, x, y, size = 15, color = '#fff', align = 'center', weight = '800') => {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(String(str), x, y);
};

const glow = (ctx, color, blur, fn) => {
  ctx.save();
  if (ctx.shadowColor !== undefined) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
  }
  fn();
  ctx.restore();
};

/** Shared holographic ready overlay for arcade games */
function readyOverlay(ctx, title, caption, hint = 'PRESS PLAY OR TAP TO START') {
  round(ctx, 24, 158, 312, 136, 18, 'rgba(15, 12, 28, 0.94)', '#a855f7', 1.8);
  // Holographic scanlines inside dialog
  for (let y = 166; y < 286; y += 8) {
    ctx.fillStyle = 'rgba(168, 85, 247, 0.04)';
    ctx.fillRect(32, y, 296, 2);
  }
  glow(ctx, '#c084fc', 12, () => {
    txt(ctx, title, 180, 202, 22, '#fdf4ff', 'center', '900');
  });
  txt(ctx, caption, 180, 235, 12, '#e9d5ff', 'center', '600');
  round(ctx, 60, 254, 240, 26, 13, 'rgba(168, 85, 247, 0.22)', '#c084fc', 1.2);
  txt(ctx, hint, 180, 271, 10, '#fef08a', 'center', '800');
}

/** Shared holographic game-over / summary overlay */
function endOverlay(ctx, title, caption, scoreSummary, hint = 'PRESS PLAY TO TRY AGAIN') {
  round(ctx, 24, 150, 312, 152, 18, 'rgba(18, 10, 22, 0.96)', '#f43f5e', 2);
  // Red alert scanlines
  for (let y = 158; y < 294; y += 8) {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.05)';
    ctx.fillRect(32, y, 296, 2);
  }
  glow(ctx, '#fb7185', 14, () => {
    txt(ctx, title, 180, 194, 23, '#fff1f2', 'center', '900');
  });
  txt(ctx, caption, 180, 224, 12, '#fecdd3', 'center', '700');
  if (scoreSummary) {
    txt(ctx, scoreSummary, 180, 246, 11, '#fda4af', 'center', '600');
  }
  round(ctx, 56, 262, 248, 28, 14, 'rgba(244, 63, 94, 0.24)', '#fb7185', 1.2);
  txt(ctx, hint, 180, 280, 10, '#fff', 'center', '800');
}

/* =========================================================================
   1. CYBER SIMON (SIMON SAYS)
   ========================================================================= */

export function simonCell(x, y) {
  const cells = [[37, 112], [185, 112], [37, 260], [185, 260]];
  return cells.findIndex(([cx, cy]) => x >= cx && x < cx + 138 && y >= cy && y < cy + 136);
}

const SIMON_PAD_CONFIGS = [
  {
    // Pad 0: Top-Left (Rose Quartz / Laser Pink)
    idleGrad: ['#3b1129', '#1f0916'],
    litGrad: ['#ffffff', '#ff3388', '#be185d'],
    glow: '#ff2d87',
    border: '#9d174d',
    litBorder: '#ffe4f1',
    symbol: 'heart',
    label: '01',
    name: 'ROSE',
  },
  {
    // Pad 1: Top-Right (Cyber Emerald / Mint)
    idleGrad: ['#063328', '#031c16'],
    litGrad: ['#ffffff', '#10e396', '#047857'],
    glow: '#10f5a3',
    border: '#047857',
    litBorder: '#e6fff7',
    symbol: 'diamond',
    label: '02',
    name: 'MINT',
  },
  {
    // Pad 2: Bottom-Left (Sunburst Gold / Amber)
    idleGrad: ['#382405', '#1f1302'],
    litGrad: ['#ffffff', '#ffbe1a', '#b45309'],
    glow: '#ffc107',
    border: '#b45309',
    litBorder: '#fffbeb',
    symbol: 'star',
    label: '03',
    name: 'GOLD',
  },
  {
    // Pad 3: Bottom-Right (Electric Sapphire / Cyan)
    idleGrad: ['#0c264a', '#051429'],
    litGrad: ['#ffffff', '#00bfff', '#1d4ed8'],
    glow: '#00d0ff',
    border: '#1d4ed8',
    litBorder: '#eff6ff',
    symbol: 'bolt',
    label: '04',
    name: 'CYAN',
  },
];

export function drawSimon(canvas, game, { best = 0 } = {}) {
  const c = canvas.getContext('2d');
  if (!c) return;
  const sx = canvas.width / W, sy = canvas.height / H;
  c.setTransform(sx, 0, 0, sy, 0, 0);

  // Deep cyber arcade chassis
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#151024');
  bg.addColorStop(0.5, '#0e0b1a');
  bg.addColorStop(1, '#08060f');
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // Subtle cyber grid
  c.fillStyle = '#a855f70a';
  for (let i = 0; i < 18; i++) {
    c.fillRect((i * 47 + 10) % W, (i * 37 + 10) % H, 2, 2);
  }

  // Inner console bezel
  round(c, 14, 12, 332, 428, 20, '#191329', '#3e2d54', 1.5);
  // Bezel rim accents
  c.fillStyle = '#a855f724';
  c.fillRect(20, 13, 320, 1.5);

  // Top Scoreboard & Header
  round(c, 24, 20, 312, 54, 14, '#100c1e', '#593b70', 1.2);
  // Header accent line
  c.fillStyle = 'rgba(216, 180, 254, 0.15)';
  c.fillRect(36, 48, 288, 1);

  // Title with glow
  glow(c, '#c084fc', 8, () => {
    txt(c, 'CYBER SIMON', 180, 39, 18, '#f3e8ff', 'center', '900');
  });

  // Digital indicators
  // Round badge (Left)
  round(c, 34, 54, 76, 16, 6, '#1e1433', '#7e22ce', 1);
  txt(c, `ROUND ${game.level || 0}`, 72, 65, 9, '#38bdf8', 'center', '800');

  // Center status indicator dots
  const seqLength = game.sequence?.length || 0;
  const maxDots = Math.min(seqLength, 8);
  for (let d = 0; d < maxDots; d++) {
    const dx = 180 + (d - (maxDots - 1) / 2) * 11;
    const isCompleted = d < game.cursor;
    c.beginPath();
    c.arc(dx, 62, 2.5, 0, Math.PI * 2);
    c.fillStyle = isCompleted ? '#4ade80' : 'rgba(255,255,255,0.2)';
    c.fill();
  }

  // Best badge (Right)
  round(c, 250, 54, 76, 16, 6, '#281d11', '#b45309', 1);
  txt(c, `RECORD ${best}`, 288, 65, 9, '#fde047', 'center', '800');

  // The 4 Interactive Pads
  const padCoords = [[37, 112], [185, 112], [37, 260], [185, 260]];
  for (let i = 0; i < 4; i++) {
    const [x, y] = padCoords[i];
    const w = 138, h = 136;
    const cfg = SIMON_PAD_CONFIGS[i];
    const isLit = game.status === 'playing' && (
      (game.phase === 'show' && game.lit === i) ||
      (game.phase === 'input' && game.lit === i) ||
      (game.phase === 'dead' && game.lit === i)
    );

    // Inset button well / shadow bevel
    round(c, x - 2, y - 2, w + 4, h + 4, 20, '#0c0816', '#261b36', 1.2);

    if (isLit) {
      // INTENSE NEON ILLUMINATION
      glow(c, cfg.glow, 28, () => {
        round(c, x, y, w, h, 18, cfg.glow, cfg.litBorder, 2.5);
      });

      // Luminous gradient face
      const lg = c.createRadialGradient(x + w / 2, y + h / 2, 5, x + w / 2, y + h / 2, w / 1.3);
      lg.addColorStop(0, '#ffffff');
      lg.addColorStop(0.35, cfg.litGrad[1]);
      lg.addColorStop(1, cfg.litGrad[2]);
      round(c, x + 2, y + 2, w - 4, h - 4, 16, lg);

      // Inner ripple ring
      c.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x + w / 2, y + h / 2, 36, 0, Math.PI * 2);
      c.stroke();

      // Sharp dark high-contrast numeral inside lit pad
      txt(c, String(i + 1), x + w / 2, y + h / 2 + 15, 46, '#0f0817', 'center', '900');
      // Sub-label
      txt(c, cfg.name, x + w / 2, y + h / 2 - 28, 10, '#0f0817', 'center', '900');
    } else {
      // INACTIVE / IDLE CRYSTALLINE BUTTON
      const dg = c.createLinearGradient(x, y, x + w, y + h);
      dg.addColorStop(0, cfg.idleGrad[0]);
      dg.addColorStop(1, cfg.idleGrad[1]);
      round(c, x, y, w, h, 18, dg, cfg.border, 1.8);

      // Subtle top glass specular arc
      const glare = c.createLinearGradient(x, y, x, y + 42);
      glare.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
      glare.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
      round(c, x + 6, y + 4, w - 12, 38, 12, glare);

      // Inset symbol medallion
      round(c, x + w / 2 - 32, y + h / 2 - 32, 64, 64, 14, 'rgba(0, 0, 0, 0.28)', 'rgba(255,255,255,0.08)', 1);

      // Stylized number
      glow(c, cfg.glow, 6, () => {
        txt(c, String(i + 1), x + w / 2, y + h / 2 + 14, 40, '#f8fafc', 'center', '900');
      });

      // Micro corner LED
      c.beginPath();
      c.arc(x + 16, y + 16, 3, 0, Math.PI * 2);
      c.fillStyle = cfg.glow;
      c.fill();

      // Pad code
      txt(c, cfg.label, x + w - 18, y + h - 12, 9, 'rgba(255,255,255,0.3)', 'right', '700');
    }
  }

  // Center console illuminated core medallion
  round(c, 162, 238, 36, 36, 18, '#140e22', '#5b3a72', 2);
  c.beginPath();
  c.arc(180, 256, 12, 0, Math.PI * 2);
  const coreFill = game.phase === 'show' ? '#c084fc' : game.phase === 'input' ? '#38bdf8' : game.phase === 'next' ? '#4ade80' : '#a855f7';
  c.fillStyle = coreFill;
  c.fill();
  c.strokeStyle = '#ffffff88';
  c.lineWidth = 1.5;
  c.stroke();

  // Bottom Console Readout Bar
  round(c, 24, 408, 312, 32, 12, '#100c1e', '#4c335e', 1.2);
  let statusText = 'READY · TAP OR PRESS 1–4';
  let statusColor = '#e9d5ff';

  if (game.status === 'paused') {
    statusText = 'PAUSED · PRESS PLAY TO RESUME';
    statusColor = '#fde047';
  } else if (game.status === 'playing') {
    if (game.phase === 'show') {
      statusText = `OBSERVE PATTERN · STEP ${Math.max(1, Math.floor(game.demoIndex / 2) + 1)}/${seqLength}`;
      statusColor = '#c084fc';
    } else if (game.phase === 'input') {
      statusText = `YOUR TURN · ${game.cursor}/${seqLength} REPEATED`;
      statusColor = '#38bdf8';
    } else if (game.phase === 'next') {
      statusText = 'SEQUENCE CLEARED! PREPARING NEXT ROUND';
      statusColor = '#4ade80';
    }
  }

  glow(c, statusColor, 6, () => {
    txt(c, statusText, 180, 428, 11, statusColor, 'center', '800');
  });

  // State Overlays
  if (game.status === 'idle') {
    readyOverlay(c, 'PATTERN MATRIX', 'Memorize the light sequence, then repeat it without error.', 'PRESS PLAY OR TAP TO BEGIN');
  } else if (game.status === 'dead') {
    endOverlay(c, 'WRONG SEQUENCE!', `Memory desynchronized at Round ${game.level || 1}.`, `Rounds cleared: ${game.score} · Best: ${best}`);
  }
}

/* =========================================================================
   2. DUCK HUNT
   ========================================================================= */

function duckWing(c, up, flapVal) {
  c.beginPath();
  if (up) {
    c.moveTo(-6, -4);
    c.quadraticCurveTo(-14, -28 + flapVal * 6, -2, -32 + flapVal * 7);
    c.quadraticCurveTo(8, -26, 4, -4);
  } else {
    c.moveTo(-8, 2);
    c.quadraticCurveTo(-16, 22 - flapVal * 6, -4, 26 - flapVal * 7);
    c.quadraticCurveTo(8, 20, 6, 2);
  }
  c.closePath();
}

function drawMallard(c, x, y, d, reduceMotion) {
  c.save();
  c.translate(x, y);
  if (d.vx < 0) c.scale(-1, 1);

  const flapCycle = reduceMotion ? 0 : Math.sin(d.flap);
  const isWingUp = flapCycle > 0;

  // Far wing (when up)
  if (isWingUp) {
    c.fillStyle = '#334155';
    duckWing(c, true, flapCycle * 0.8);
    c.fill();
    // Blue speculum wing bar on far wing
    c.fillStyle = '#2563eb';
    c.fillRect(-8, -22, 6, 8);
  }

  // Tail feathers
  c.fillStyle = '#1e293b';
  c.beginPath();
  c.moveTo(-18, 0);
  c.lineTo(-34, -4);
  c.lineTo(-30, 4);
  c.lineTo(-36, 8);
  c.lineTo(-16, 6);
  c.closePath();
  c.fill();
  c.fillStyle = '#f8fafc';
  c.fillRect(-26, -1, 4, 7); // White tail margin

  // Duck Body (rich taupe/chestnut breast)
  c.beginPath();
  c.ellipse(-3, 2, 22, 14, 0.05, 0, Math.PI * 2);
  const bodyGrad = c.createLinearGradient(-22, -10, 18, 14);
  bodyGrad.addColorStop(0, '#475569');
  bodyGrad.addColorStop(0.5, '#64748b');
  bodyGrad.addColorStop(1, '#94a3b8');
  c.fillStyle = bodyGrad;
  c.fill();

  // Chestnut Breast
  c.beginPath();
  c.ellipse(10, 5, 11, 11, -0.2, 0, Math.PI * 2);
  c.fillStyle = '#7c2d12';
  c.fill();

  // Near Wing
  c.fillStyle = '#475569';
  duckWing(c, isWingUp, flapCycle);
  c.fill();
  c.strokeStyle = '#1e293b';
  c.lineWidth = 1;
  c.stroke();

  // Royal blue speculum wing bar with white borders
  c.fillStyle = '#ffffff';
  c.fillRect(-8, isWingUp ? -18 : 8, 8, 8);
  c.fillStyle = '#2563eb';
  c.fillRect(-7, isWingUp ? -17 : 9, 6, 6);

  // White Neck Collar Ring
  c.beginPath();
  c.ellipse(16, -7, 6.5, 4, 0.3, 0, Math.PI * 2);
  c.fillStyle = '#ffffff';
  c.fill();

  // Iridescent Emerald Mallard Head
  c.beginPath();
  c.ellipse(20, -13, 12, 10, 0.2, 0, Math.PI * 2);
  const headGrad = c.createRadialGradient(22, -15, 2, 20, -13, 12);
  headGrad.addColorStop(0, '#34d399');
  headGrad.addColorStop(0.5, '#059669');
  headGrad.addColorStop(1, '#064e3b');
  c.fillStyle = headGrad;
  c.fill();

  // Cute eye
  c.beginPath();
  c.arc(23, -15, 2.8, 0, Math.PI * 2);
  c.fillStyle = '#0f172a';
  c.fill();
  c.beginPath();
  c.arc(24, -16, 1, 0, Math.PI * 2);
  c.fillStyle = '#ffffff'; // catchlight
  c.fill();

  // Orange Mallard Bill
  c.beginPath();
  c.moveTo(27, -15);
  c.lineTo(41, -11);
  c.lineTo(38, -6);
  c.lineTo(26, -9);
  c.closePath();
  const billGrad = c.createLinearGradient(27, -15, 41, -9);
  billGrad.addColorStop(0, '#f59e0b');
  billGrad.addColorStop(1, '#d97706');
  c.fillStyle = billGrad;
  c.fill();
  // Nostril dot
  c.fillStyle = '#78350f';
  c.fillRect(30, -13, 1.5, 1.5);

  c.restore();
}

export function drawDuck(canvas, game, { best = 0, reduced = false } = {}) {
  const c = canvas.getContext('2d');
  if (!c) return;
  const sx = canvas.width / W, sy = canvas.height / H;
  c.setTransform(sx, 0, 0, sy, 0, 0);

  // Layered Sunset Meadow Sky
  const sky = c.createLinearGradient(0, 0, 0, 360);
  sky.addColorStop(0, '#1e1b4b');     // Dusk Indigo
  sky.addColorStop(0.35, '#581c87');  // Twilight Plum
  sky.addColorStop(0.68, '#be185d');  // Sunset Fuchsia
  sky.addColorStop(0.88, '#f97316');  // Amber Horizon
  sky.addColorStop(1, '#fef08a');     // Golden Mist
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);

  // Sunset Sun Disc on Horizon
  const sunGrad = c.createRadialGradient(280, 270, 5, 280, 270, 75);
  sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
  sunGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.35)');
  sunGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
  c.fillStyle = sunGrad;
  c.beginPath();
  c.arc(280, 270, 75, 0, Math.PI * 2);
  c.fill();

  // Fluffy Sunset Clouds
  const clouds = [
    { x: 30, y: 105, r: 18, w: 75 },
    { x: 175, y: 135, r: 16, w: 65 },
    { x: 270, y: 95, r: 20, w: 85 },
  ];
  for (const cl of clouds) {
    c.fillStyle = 'rgba(255, 228, 230, 0.22)';
    c.beginPath();
    c.ellipse(cl.x + cl.w / 2, cl.y, cl.w / 2, cl.r, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(254, 205, 211, 0.18)';
    c.beginPath();
    c.arc(cl.x + cl.w * 0.35, cl.y - 6, cl.r * 0.9, 0, Math.PI * 2);
    c.arc(cl.x + cl.w * 0.65, cl.y - 4, cl.r * 0.8, 0, Math.PI * 2);
    c.fill();
  }

  // Distant Mountain Silhouettes (Layer 1)
  c.fillStyle = 'rgba(76, 29, 99, 0.45)';
  c.beginPath();
  c.moveTo(-20, 340);
  c.lineTo(45, 285);
  c.lineTo(120, 315);
  c.lineTo(210, 270);
  c.lineTo(295, 310);
  c.lineTo(380, 260);
  c.lineTo(380, 350);
  c.lineTo(-20, 350);
  c.closePath();
  c.fill();

  // Midground Treeline Silhouette (Layer 2)
  c.fillStyle = '#16383b';
  for (let i = 0; i < 9; i++) {
    const tx = i * 44 - 15;
    const ty = 318 - (i % 3) * 12;
    c.beginPath();
    c.moveTo(tx, 354);
    c.lineTo(tx + 22, ty);
    c.lineTo(tx + 44, 354);
    c.fill();
  }

  // Foreground Marsh Grounds (Layer 3)
  const grass = c.createLinearGradient(0, 345, 0, H);
  grass.addColorStop(0, '#15803d');
  grass.addColorStop(0.35, '#166534');
  grass.addColorStop(1, '#052e16');
  c.fillStyle = grass;
  c.fillRect(0, 348, W, H - 348);

  // Grass blade blades / turf texture
  c.fillStyle = '#22c55e';
  for (let i = 0; i < 38; i++) {
    const gx = i * 10 - 5;
    const gh = 8 + (i % 5) * 5;
    c.beginPath();
    c.moveTo(gx, 352);
    c.lineTo(gx + 4, 352 - gh);
    c.lineTo(gx + 8, 352);
    c.fill();
  }

  // Side Marsh Reeds & Cattails
  const drawReed = (rx, ry, rh) => {
    c.strokeStyle = '#14532d';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(rx, ry);
    c.quadraticCurveTo(rx + 6, ry - rh / 2, rx + 2, ry - rh);
    c.stroke();
    // Cattail cigar head
    c.fillStyle = '#5c2c16';
    round(c, rx, ry - rh - 14, 5, 16, 2.5, '#5c2c16');
  };
  drawReed(14, 385, 45);
  drawReed(26, 395, 55);
  drawReed(334, 390, 50);
  drawReed(346, 385, 40);

  // Draw Flying Ducks
  for (const d of game.ducks) {
    const bob = Math.sin(d.phase) * 9;
    drawMallard(c, d.x, d.y + bob, d, reduced);
  }

  // Shot Visual Feedback (Flash/Sparks/Feathers)
  if (game.flash) {
    const fx = game.flash.x, fy = game.flash.y;
    if (game.flash.hit) {
      // Golden Hit Starburst
      glow(c, '#ffd700', 18, () => {
        c.fillStyle = '#fffef0';
        c.beginPath();
        c.arc(fx, fy, 14, 0, Math.PI * 2);
        c.fill();
      });
      // Feathers bursting out
      c.fillStyle = '#34d399';
      for (let p = 0; p < 6; p++) {
        const ang = (p * Math.PI) / 3;
        c.beginPath();
        c.ellipse(fx + Math.cos(ang) * 20, fy + Math.sin(ang) * 20, 5, 2.5, ang, 0, Math.PI * 2);
        c.fill();
      }
      // Floating Hit Text
      glow(c, '#facc15', 8, () => {
        txt(c, '+1 HIT!', fx, fy - 22, 13, '#fef08a', 'center', '900');
      });
    } else {
      // Miss smoke puff
      c.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(fx, fy, 11, 0, Math.PI * 2);
      c.stroke();
      txt(c, 'MISS', fx, fy - 14, 9, '#fca5a5', 'center', '800');
    }
  }

  // Top Arcade Hunting Scoreboard
  round(c, 12, 12, 336, 76, 14, 'rgba(15, 23, 42, 0.94)', '#b45309', 1.5);
  c.fillStyle = 'rgba(245, 158, 11, 0.12)';
  c.fillRect(20, 44, 320, 1);

  // Header Title
  glow(c, '#fbbf24', 8, () => {
    txt(c, 'DUCK HUNT · SHOOTING GALLERY', 180, 32, 15, '#fef08a', 'center', '900');
  });

  // HITS Metric (Left)
  txt(c, 'DUCKS', 40, 57, 9, '#94a3b8', 'center', '700');
  glow(c, '#4ade80', 6, () => {
    txt(c, String(game.score || 0), 40, 75, 17, '#4ade80', 'center', '900');
  });

  // TIME Countdown (Center)
  const secondsLeft = Math.ceil(game.timeLeft || 0);
  const timeColor = secondsLeft <= 5 ? '#ef4444' : secondsLeft <= 15 ? '#f59e0b' : '#38bdf8';
  txt(c, 'TIME LEFT', 130, 57, 9, '#94a3b8', 'center', '700');
  glow(c, timeColor, 6, () => {
    txt(c, `${secondsLeft}s`, 130, 75, 17, timeColor, 'center', '900');
  });

  // MISSES / Shotgun Shells (Right)
  txt(c, 'AMMO / MISSES', 260, 57, 9, '#94a3b8', 'center', '700');
  // Draw 8 Shotgun Cartridges
  const missesCount = Math.min(8, game.misses || 0);
  for (let s = 0; s < 8; s++) {
    const sxPos = 212 + s * 12;
    const isSpent = s < missesCount;
    if (isSpent) {
      // Spent shell (dark gray with faint red)
      round(c, sxPos, 64, 9, 14, 2, '#334155', '#475569', 1);
      c.fillStyle = '#ef4444';
      c.fillRect(sxPos + 1.5, 69, 6, 4);
    } else {
      // Live shotgun shell (red hull + brass cap)
      round(c, sxPos, 64, 9, 14, 2, '#dc2626', '#fca5a5', 1);
      c.fillStyle = '#f59e0b'; // Brass head
      c.fillRect(sxPos, 64, 9, 4);
    }
  }

  // Bottom Status & Best Record Bar
  round(c, 12, 412, 336, 30, 10, 'rgba(15, 23, 42, 0.94)', '#047857', 1.2);
  const bottomMsg = game.status === 'paused'
    ? 'PAUSED · CLICK RESUME TO KEEP HUNTING'
    : `RECORD: ${best} DUCKS · TAP FLOCK TO SHOOT (MAX 8 MISSES)`;
  txt(c, bottomMsg, 180, 431, 10, '#f0fdf4', 'center', '800');

  // State Overlays
  if (game.status === 'idle') {
    readyOverlay(c, 'DUCK HUNT', 'Aim carefully! Tap the ducks as they fly across the meadow.', 'TAP PLAY TO RELEASE THE DUCKS');
  } else if (game.status === 'dead') {
    const isOutTime = (game.timeLeft || 0) <= 0;
    const title = isOutTime ? 'TIME’S UP!' : 'HUNT TERMINATED';
    const reason = isOutTime ? 'The 45-second season has concluded.' : 'Exceeded the limit of 8 missed shots!';
    endOverlay(c, title, reason, `Final Score: ${game.score} bagged · Misses: ${game.misses}/8`);
  }
}

/* =========================================================================
   3. GABU’S SLOTS (DELUXE CASINO SLOT MACHINE)
   ========================================================================= */

/** Vector icon symbols for the 3 slot reels */
function drawSlotSymbol(c, key, x, y) {
  c.save();
  if (key === 'seven') {
    // 40× TOP JACKPOT: Brilliant 3D Golden Lucky 7 with Ruby Inlay
    glow(c, '#f59e0b', 14, () => {
      // Drop shadow / 3D bevel
      c.fillStyle = '#78350f';
      c.beginPath();
      c.moveTo(x - 24, y - 28);
      c.lineTo(x + 24, y - 28);
      c.lineTo(x + 5, y + 29);
      c.lineTo(x - 9, y + 29);
      c.lineTo(x + 9, y - 14);
      c.lineTo(x - 24, y - 14);
      c.closePath();
      c.fill();
    });

    // Gold frame
    c.fillStyle = '#facc15';
    c.beginPath();
    c.moveTo(x - 26, y - 30);
    c.lineTo(x + 22, y - 30);
    c.lineTo(x + 3, y + 27);
    c.lineTo(x - 11, y + 27);
    c.lineTo(x + 7, y - 16);
    c.lineTo(x - 26, y - 16);
    c.closePath();
    c.fill();

    // Ruby inner core
    c.fillStyle = '#dc2626';
    c.beginPath();
    c.moveTo(x - 22, y - 27);
    c.lineTo(x + 17, y - 27);
    c.lineTo(x + 1, y + 23);
    c.lineTo(x - 7, y + 23);
    c.lineTo(x + 8, y - 19);
    c.lineTo(x - 22, y - 19);
    c.closePath();
    c.fill();

    // Corner diamond sparkle
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(x - 18, y - 24, 2.5, 0, Math.PI * 2);
    c.fill();
  } else if (key === 'star') {
    // 14× Radiant Golden Star
    glow(c, '#fbbf24', 16, () => {
      c.fillStyle = '#ffd700';
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = (i * Math.PI) / 5 - Math.PI / 2;
        const rad = i % 2 ? 14 : 29;
        const px = x + Math.cos(ang) * rad, py = y + Math.sin(ang) * rad;
        i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.closePath();
      c.fill();
    });

    // Faceted core
    c.fillStyle = '#fffbeb';
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = (i * Math.PI) / 5 - Math.PI / 2;
      const rad = i % 2 ? 6 : 14;
      const px = x + Math.cos(ang) * rad, py = y + Math.sin(ang) * rad;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
    c.fill();
  } else if (key === 'gem') {
    // 9× Faceted Brilliant Cyan Diamond
    glow(c, '#00e5ff', 14, () => {
      c.fillStyle = '#06b6d4';
      c.beginPath();
      c.moveTo(x - 26, y - 8);
      c.lineTo(x - 12, y - 27);
      c.lineTo(x + 12, y - 27);
      c.lineTo(x + 26, y - 8);
      c.lineTo(x, y + 28);
      c.closePath();
      c.fill();
    });

    // Facet highlights
    c.fillStyle = '#a5f3fc';
    c.beginPath();
    c.moveTo(x - 12, y - 27);
    c.lineTo(x + 12, y - 27);
    c.lineTo(x + 16, y - 8);
    c.lineTo(x - 16, y - 8);
    c.closePath();
    c.fill();

    // Center table & lower facets
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x - 16, y - 8);
    c.lineTo(x, y + 28);
    c.lineTo(x + 16, y - 8);
    c.stroke();
  } else if (key === 'heart') {
    // 6× 3D Ruby Velvet Heart
    glow(c, '#f43f5e', 14, () => {
      c.fillStyle = '#e11d48';
      c.beginPath();
      c.moveTo(x, y + 25);
      c.bezierCurveTo(x - 48, y - 10, x - 22, y - 32, x, y - 10);
      c.bezierCurveTo(x + 22, y - 32, x + 48, y - 10, x, y + 25);
      c.fill();
    });

    // Inner highlight
    c.fillStyle = '#ffe4e6';
    c.beginPath();
    c.arc(x - 11, y - 11, 4, 0, Math.PI * 2);
    c.fill();
  } else if (key === 'cherry') {
    // 4× Candy Gloss Twin Cherries
    // Green curved stems
    c.strokeStyle = '#10b981';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - 10, y + 4);
    c.quadraticCurveTo(x - 2, y - 26, x + 8, y - 28);
    c.moveTo(x + 12, y + 6);
    c.quadraticCurveTo(x + 4, y - 24, x + 8, y - 28);
    c.stroke();

    // Leaf
    c.fillStyle = '#059669';
    c.beginPath();
    c.ellipse(x + 16, y - 26, 9, 4, -0.4, 0, Math.PI * 2);
    c.fill();

    // Cherry globes
    for (const [cx, cy] of [[x - 11, y + 10], [x + 12, y + 12]]) {
      glow(c, '#f43f5e', 10, () => {
        c.fillStyle = '#e11d48';
        c.beginPath();
        c.arc(cx, cy, 14, 0, Math.PI * 2);
        c.fill();
      });
      // Specular highlight
      c.fillStyle = '#ffe4e6';
      c.beginPath();
      c.arc(cx - 4, cy - 4, 3.5, 0, Math.PI * 2);
      c.fill();
    }
  } else {
    // 3× Gilded Royal Mascot Koi / Fish
    glow(c, '#fb923c', 12, () => {
      c.fillStyle = '#f97316';
      c.beginPath();
      c.ellipse(x + 2, y + 2, 24, 15, 0, 0, Math.PI * 2);
      c.fill();

      // Fish tail fin
      c.beginPath();
      c.moveTo(x - 16, y + 2);
      c.lineTo(x - 36, y - 14);
      c.lineTo(x - 28, y + 2);
      c.lineTo(x - 36, y + 18);
      c.closePath();
      c.fill();
    });

    // Golden Crown atop fish head
    c.fillStyle = '#facc15';
    c.beginPath();
    c.moveTo(x + 10, y - 14);
    c.lineTo(x + 14, y - 24);
    c.lineTo(x + 18, y - 16);
    c.lineTo(x + 22, y - 24);
    c.lineTo(x + 26, y - 14);
    c.closePath();
    c.fill();

    // Big cute eye
    c.fillStyle = '#0f172a';
    c.beginPath();
    c.arc(x + 15, y - 2, 3.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(x + 16, y - 3, 1.2, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

export function drawSlots(canvas, game, { tickets = 0, stake = 1, best = 0 } = {}) {
  const c = canvas.getContext('2d');
  if (!c) return;
  const sx = canvas.width / W, sy = canvas.height / H;
  c.setTransform(sx, 0, 0, sy, 0, 0);

  // VIP Casino Room Background
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1c0e27');
  bg.addColorStop(0.5, '#12081c');
  bg.addColorStop(1, '#08030c');
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // Outer Golden Casino Chassis
  round(c, 14, 12, 332, 428, 22, '#200f2e', '#ca8a04', 2.2);

  // Chasing Marquee Lights around the perimeter
  const isSpinning = Boolean(game.pending && game.time > 0);
  const bulbOffset = isSpinning ? Math.floor(Date.now() / 120) % 2 : 0;
  for (let b = 0; b < 24; b++) {
    const isTop = b < 8;
    const isRight = b >= 8 && b < 12;
    const isBottom = b >= 12 && b < 20;
    const isLeft = b >= 20;

    let bx = 0, by = 0;
    if (isTop) { bx = 34 + b * 42; by = 18; }
    else if (isRight) { bx = 338; by = 48 + (b - 8) * 95; }
    else if (isBottom) { bx = 328 - (b - 12) * 42; by = 434; }
    else if (isLeft) { bx = 22; by = 333 - (b - 20) * 95; }

    const isGold = (b + bulbOffset) % 2 === 0;
    c.beginPath();
    c.arc(bx, by, 3.2, 0, Math.PI * 2);
    c.fillStyle = isGold ? '#fef08a' : '#f43f5e';
    c.fill();
  }

  // Top Casino Marquee Sign
  round(c, 24, 26, 312, 60, 16, '#380c25', '#eab308', 1.8);
  // Marquee decorative arches
  c.strokeStyle = '#fde04744';
  c.lineWidth = 1;
  c.strokeRect(30, 32, 300, 48);

  // Header Title
  glow(c, '#ffd700', 12, () => {
    txt(c, 'GABU’S ROYALE', 180, 52, 21, '#fffbeb', 'center', '900');
  });
  txt(c, '★ HIGH ROLLER FICTIONAL SLOTS ★', 180, 71, 9, '#fde047', 'center', '800');

  // 3-Reel Cylindrical Display Housing
  round(c, 24, 94, 312, 198, 16, '#0f0817', '#eab308', 2.2);

  // Current symbols to show (fast spinning animation vs resting symbols)
  const symbols = isSpinning
    ? Array.from({ length: 3 }, (_, i) => SLOT_SYMBOLS[(Math.floor((1 - game.time) * 19) + i * 2) % SLOT_SYMBOLS.length])
    : (game.reels || ['fish', 'cherry', 'star']);

  const reelX = [32, 132, 232];
  const rw = 96, rh = 182, ry = 102;

  // Draw each of the 3 Cylindrical Drums
  for (let i = 0; i < 3; i++) {
    const rx = reelX[i];
    // Drum face
    round(c, rx, ry, rw, rh, 10, '#fef9fc');

    // Motion Blur speed streaks during spin
    if (isSpinning) {
      c.fillStyle = 'rgba(216, 180, 254, 0.25)';
      for (let s = 0; s < 7; s++) {
        c.fillRect(rx + 6, ry + 15 + s * 24, rw - 12, 3);
      }
    }

    // The Symbol
    drawSlotSymbol(c, symbols[i], rx + rw / 2, ry + rh / 2);

    // Cylindrical 3D Curvature Shadows (top and bottom curves)
    const topShadow = c.createLinearGradient(0, ry, 0, ry + 48);
    topShadow.addColorStop(0, 'rgba(10, 5, 16, 0.75)');
    topShadow.addColorStop(1, 'rgba(10, 5, 16, 0.0)');
    c.fillStyle = topShadow;
    c.fillRect(rx, ry, rw, 48);

    const botShadow = c.createLinearGradient(0, ry + rh - 48, 0, ry + rh);
    botShadow.addColorStop(0, 'rgba(10, 5, 16, 0.0)');
    botShadow.addColorStop(1, 'rgba(10, 5, 16, 0.75)');
    c.fillStyle = botShadow;
    c.fillRect(rx, ry + rh - 48, rw, 48);

    // Chrome separator rim
    c.strokeStyle = '#d4af37';
    c.lineWidth = 1.5;
    c.strokeRect(rx, ry, rw, rh);
  }

  // Center Payline Guide & Pointer Chevrons
  c.fillStyle = '#ffd700';
  // Left pointer
  c.beginPath();
  c.moveTo(25, 193);
  c.lineTo(31, 188);
  c.lineTo(31, 198);
  c.closePath();
  c.fill();
  // Right pointer
  c.beginPath();
  c.moveTo(335, 193);
  c.lineTo(329, 188);
  c.lineTo(329, 198);
  c.closePath();
  c.fill();

  // Subtle center payline laser beam
  if (game.lastMultiplier > 0 && !isSpinning) {
    glow(c, '#ffd700', 16, () => {
      c.strokeStyle = '#fef08a';
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(30, 193);
      c.lineTo(330, 193);
      c.stroke();
    });
  }

  // Winning / Spin Status Marquee Banner
  round(c, 24, 300, 312, 42, 12, '#1a0d24', '#7e22ce', 1.5);
  if (isSpinning) {
    glow(c, '#ffd700', 10, () => {
      txt(c, 'SPINNING FOR FORTUNE…', 180, 325, 15, '#fde047', 'center', '900');
    });
  } else if (game.lastMultiplier > 0) {
    const isJackpot = game.lastMultiplier >= 14;
    const winMsg = isJackpot
      ? `★ JACKPOT! ${game.lastMultiplier}× PAYOUT ★`
      : `WINNER! ${game.lastMultiplier}× MULTIPLIER (+${game.lastPayout} TICKETS)`;
    const winColor = isJackpot ? '#facc15' : '#4ade80';
    glow(c, winColor, 12, () => {
      txt(c, winMsg, 180, 325, 13.5, winColor, 'center', '900');
    });
  } else {
    txt(c, 'PULL LEVER OR PRESS SPIN', 180, 325, 13, '#e9d5ff', 'center', '800');
  }

  // Lower Meter Console: Wallet & Stakes
  round(c, 24, 348, 312, 46, 12, '#140c1c', '#ca8a04', 1.2);
  // Wallet
  txt(c, 'WALLET', 54, 365, 9, '#d8b4fe', 'center', '700');
  glow(c, '#fbbf24', 6, () => {
    txt(c, `${tickets} 🎟`, 54, 383, 14, '#fde047', 'center', '900');
  });

  // Current Bet Status
  txt(c, 'WAGER', 180, 365, 9, '#d8b4fe', 'center', '700');
  const stakeLabel = stake === 0 ? 'FREE PRACTICE' : `${stake} TICKET${stake === 1 ? '' : 'S'}`;
  const stakeCol = stake === 0 ? '#34d399' : '#f43f5e';
  glow(c, stakeCol, 6, () => {
    txt(c, stakeLabel, 180, 383, 12, stakeCol, 'center', '900');
  });

  // Best Win
  txt(c, 'BEST WIN', 290, 365, 9, '#d8b4fe', 'center', '700');
  glow(c, '#facc15', 6, () => {
    txt(c, `${best} 🎟`, 290, 383, 14, '#fef08a', 'center', '900');
  });

  // Mini Paytable Legend Ribbon
  round(c, 24, 400, 312, 30, 8, '#0f0816', '#4a305e', 1);
  txt(c, '777: 40×  ·  ⭐: 14×  ·  💎: 9×  ·  ♥: 6×  ·  🍒: 4×  ·  PAIR: 1×', 180, 419, 9.5, '#fbcfe8', 'center', '800');

  // Idle overlay
  if (game.status === 'idle' && game.spins === 0) {
    readyOverlay(c, 'GABU’S ROYALE SLOTS', 'Three reels of pure local fortune. Match 2 for 1×, or 3 for 3–40×!', 'TAP SPIN BUTTON OR SPACE');
  }
}
