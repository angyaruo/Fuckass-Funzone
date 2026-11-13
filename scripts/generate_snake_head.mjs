import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const S = 4;
const W = 128 * S;
const H = 128 * S;
const buf = new Uint8ClampedArray(W * H * 4);

function setPixel(x, y, r, g, b, a) {
  if (x < 0 || x >= W || y < 0 || y >= H || a <= 0) return;
  const idx = (y * W + x) * 4;
  const srcA = a / 255;
  const dstA = buf[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA > 0) {
    buf[idx] = Math.round((r * srcA + buf[idx] * dstA * (1 - srcA)) / outA);
    buf[idx + 1] = Math.round((g * srcA + buf[idx + 1] * dstA * (1 - srcA)) / outA);
    buf[idx + 2] = Math.round((b * srcA + buf[idx + 2] * dstA * (1 - srcA)) / outA);
    buf[idx + 3] = Math.round(outA * 255);
  }
}

function hexToRgba(hex, alpha = 255) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, alpha];
}

function fillEllipse(cx, cy, rx, ry, color, rot = 0) {
  cx *= S; cy *= S; rx *= S; ry *= S;
  const [r, g, b, a] = Array.isArray(color) ? color : hexToRgba(color);
  const cos = Math.cos(-rot), sin = Math.sin(-rot);
  const maxR = Math.max(rx, ry) + 1;
  const minX = Math.max(0, Math.floor(cx - maxR));
  const maxX = Math.min(W - 1, Math.ceil(cx + maxR));
  const minY = Math.max(0, Math.floor(cy - maxR));
  const maxY = Math.min(H - 1, Math.ceil(cy + maxR));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx, dy = y - cy;
      const nx = dx * cos - dy * sin;
      const ny = dx * sin + dy * cos;
      const d = (nx * nx) / (rx * rx) + (ny * ny) / (ry * ry);
      if (d <= 1) {
        const edge = Math.sqrt(d);
        const alphaFactor = edge > 0.92 ? (1 - edge) / 0.08 : 1;
        setPixel(x, y, r, g, b, Math.round(a * Math.max(0, Math.min(1, alphaFactor))));
      }
    }
  }
}

function fillPolygon(points, color) {
  const scaled = points.map(([x, y]) => [x * S, y * S]);
  const [r, g, b, a] = Array.isArray(color) ? color : hexToRgba(color);
  let minX = W, maxX = 0, minY = H, maxY = 0;
  for (const [x, y] of scaled) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  minX = Math.max(0, Math.floor(minX)); maxX = Math.min(W - 1, Math.ceil(maxX));
  minY = Math.max(0, Math.floor(minY)); maxY = Math.min(H - 1, Math.ceil(maxY));

  for (let y = minY; y <= maxY; y++) {
    const nodeX = [];
    let j = scaled.length - 1;
    for (let i = 0; i < scaled.length; i++) {
      if ((scaled[i][1] < y && scaled[j][1] >= y) || (scaled[j][1] < y && scaled[i][1] >= y)) {
        nodeX.push(scaled[i][0] + (y - scaled[i][1]) / (scaled[j][1] - scaled[i][1]) * (scaled[j][0] - scaled[i][0]));
      }
      j = i;
    }
    nodeX.sort((p, q) => p - q);
    for (let i = 0; i < nodeX.length; i += 2) {
      if (nodeX[i] >= maxX) break;
      if (nodeX[i + 1] > minX) {
        const xStart = Math.max(minX, Math.round(nodeX[i]));
        const xEnd = Math.min(maxX, Math.round(nodeX[i + 1]));
        for (let x = xStart; x <= xEnd; x++) {
          setPixel(x, y, r, g, b, a);
        }
      }
    }
  }
}

function strokeLine(x1, y1, x2, y2, width, color) {
  const [r, g, b, a] = Array.isArray(color) ? color : hexToRgba(color);
  const sx1 = x1 * S, sy1 = y1 * S, sx2 = x2 * S, sy2 = y2 * S, sw = width * S;
  const dx = sx2 - sx1, dy = sy2 - sy1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const nx = -dy / len * (sw / 2);
  const ny = dx / len * (sw / 2);

  fillPolygon([
    [(sx1 + nx)/S, (sy1 + ny)/S],
    [(sx2 + nx)/S, (sy2 + ny)/S],
    [(sx2 - nx)/S, (sy2 - ny)/S],
    [(sx1 - nx)/S, (sy1 - ny)/S]
  ], color);
  fillEllipse(x1, y1, width / 2, width / 2, color);
  fillEllipse(x2, y2, width / 2, width / 2, color);
}

function drawSnakeHead() {
  const DARK = '#1e0d26';
  const MAGENTA_DEEP = '#bd1f69';
  const MAGENTA_MID = '#e83889';
  const MAGENTA_LIGHT = '#ff6eb2';
  const HIGHLIGHT = '#ffaad4';

  // 1. Forked Tongue at front (+X)
  strokeLine(100, 64, 116, 64, 4.5, DARK);
  strokeLine(114, 64, 124, 57, 3.5, DARK);
  strokeLine(114, 64, 124, 71, 3.5, DARK);
  strokeLine(100, 64, 115, 64, 2.5, '#ff6ca3');
  strokeLine(114, 64, 123, 58, 2, '#ff6ca3');
  strokeLine(114, 64, 123, 70, 2, '#ff6ca3');

  // 2. Outer Head Silhouette (symmetrical viper hood)
  fillEllipse(56, 64, 38, 43, DARK);       // Cheeks / rear hood
  fillEllipse(82, 64, 28, 29, DARK);       // Mid snout
  fillEllipse(96, 64, 15, 17, DARK);       // Nose tip
  fillPolygon([
    [22, 64], [52, 21], [94, 47], [109, 64], [94, 81], [52, 107]
  ], DARK);

  // 3. Main Body Layers
  fillEllipse(56, 64, 34, 39, MAGENTA_DEEP);
  fillEllipse(81, 64, 25, 26, MAGENTA_DEEP);
  fillEllipse(94, 64, 13, 15, MAGENTA_DEEP);
  fillPolygon([
    [24, 64], [52, 25], [92, 49], [105, 64], [92, 79], [52, 103]
  ], MAGENTA_DEEP);

  // Midtone body flesh
  fillEllipse(58, 64, 30, 35, MAGENTA_MID);
  fillEllipse(82, 64, 22, 23, MAGENTA_MID);
  fillEllipse(93, 64, 11, 13, MAGENTA_MID);

  // Symmetrical Cheek Flairs (Side Viper Scales)
  fillEllipse(48, 33, 16, 8, '#9c27b0', -0.3);
  fillEllipse(48, 95, 16, 8, '#9c27b0', 0.3);
  fillEllipse(52, 33, 11, 5, '#e056fd', -0.3);
  fillEllipse(52, 95, 11, 5, '#e056fd', 0.3);

  // Center Head Highlight Ridge
  fillEllipse(66, 64, 26, 17, MAGENTA_LIGHT);
  fillEllipse(84, 64, 16, 9, HIGHLIGHT);
  fillEllipse(92, 64, 7, 5, '#ffffff');

  // 4. Nostrils
  fillEllipse(97, 60, 2.2, 1.8, DARK);
  fillEllipse(97, 68, 2.2, 1.8, DARK);

  // 5. Heterochromatic Glowing Cyber-Eyes (Symmetrical placement)
  // UPPER EYE: Electric Cyan / Azure (Gabi's right-eye interface theme)
  fillEllipse(72, 40, 14, 10.5, DARK, 0.15);
  fillEllipse(72, 40, 12, 8.5, '#ffffff', 0.15);
  fillEllipse(74, 40, 8.5, 7.5, '#0284c7', 0.15);
  fillEllipse(75, 40, 6.5, 6, '#38bdf8', 0.15);
  fillEllipse(75.5, 40, 2.4, 5.5, '#082f49', 0.15); // Slit pupil
  fillEllipse(73, 38, 2.2, 2.2, '#ffffff');         // Specular star catchlight
  fillEllipse(77, 42, 1.2, 1.2, '#ffffff');

  // LOWER EYE: Radiant Amber / Gold (Gabi's left-eye gold theme)
  fillEllipse(72, 88, 14, 10.5, DARK, -0.15);
  fillEllipse(72, 88, 12, 8.5, '#ffffff', -0.15);
  fillEllipse(74, 88, 8.5, 7.5, '#d97706', -0.15);
  fillEllipse(75, 88, 6.5, 6, '#fbbf24', -0.15);
  fillEllipse(75.5, 88, 2.4, 5.5, '#451a03', -0.15); // Slit pupil
  fillEllipse(73, 86, 2.2, 2.2, '#ffffff');          // Specular star catchlight
  fillEllipse(77, 90, 1.2, 1.2, '#ffffff');

  // Upper/lower sleek brows
  strokeLine(60, 31, 84, 35, 2.5, DARK);
  strokeLine(60, 97, 84, 93, 2.5, DARK);

  // 6. Symmetrical Forehead Crown / Cyber-Diamond Crest
  fillPolygon([
    [38, 64], [52, 53], [66, 64], [52, 75]
  ], DARK);
  fillPolygon([
    [40, 64], [52, 55], [64, 64], [52, 73]
  ], '#f59e0b');
  fillPolygon([
    [42, 64], [52, 57], [62, 64], [52, 71]
  ], '#fbbf24');
  fillPolygon([
    [45, 64], [52, 59], [59, 64], [52, 69]
  ], '#c084fc');
  fillEllipse(50, 62, 2, 2, '#ffffff'); // Gem gleam
}

function exportPng(targetPath) {
  const targetW = 128, targetH = 128;
  const bytesPerPixel = 4;
  const rowSize = 1 + targetW * bytesPerPixel;
  const outBuf = Buffer.alloc(rowSize * targetH);
  const scale = W / targetW;

  for (let ty = 0; ty < targetH; ty++) {
    const rowOffset = ty * rowSize;
    outBuf[rowOffset] = 0;
    for (let tx = 0; tx < targetW; tx++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
      const startX = tx * scale, startY = ty * scale;
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const idx = ((startY + sy) * W + (startX + sx)) * 4;
          const a = buf[idx + 3];
          rSum += buf[idx] * (a / 255);
          gSum += buf[idx + 1] * (a / 255);
          bSum += buf[idx + 2] * (a / 255);
          aSum += a;
        }
      }
      const count = scale * scale;
      const finalA = aSum / count;
      const pixelOffset = rowOffset + 1 + tx * bytesPerPixel;
      if (finalA > 0) {
        outBuf[pixelOffset] = Math.round(rSum / (aSum / 255));
        outBuf[pixelOffset + 1] = Math.round(gSum / (aSum / 255));
        outBuf[pixelOffset + 2] = Math.round(bSum / (aSum / 255));
        outBuf[pixelOffset + 3] = Math.round(finalA);
      }
    }
  }
  const idat = zlib.deflateSync(outBuf);
  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    const crcVal = zlib.crc32(Buffer.concat([t, data]));
    crc.writeUInt32BE(crcVal);
    return Buffer.concat([len, t, data, crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(targetW, 0); ihdr.writeUInt32BE(targetH, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(targetPath, png);
  console.log('Saved PNG to:', targetPath, 'bytes:', png.length);
}

drawSnakeHead();
exportPng(path.join(root, 'assets/funzone/snake-head.png'));
