import {
  DRAGON_SEGMENT_COUNT, DRAGON_SEGMENT_SPACING, DRAGON_SPRITE_SCALE,
  WING_SEGMENT_INDEX, DRAGON_SEGMENT_WIDTHS,
  FIRE_COLORS, FIRE_STEP_INTERVAL
} from './config.js';

// Adapted from dengshu2/illustrated-manuscript (ISC).
// Asset URLs use this site's WebP copies; static drawing respects reduced motion.

/** @typedef {{x:number,y:number,vx:number,vy:number,size:number,life:number,maxLife:number,frame:number,color:number}} FireParticle */

// Sprite canvases and dimensions
let headCanvas, tongueCanvas, wingFrontCanvas, wingBackCanvas;
let headDim, tongueDim, wingFrontDim, wingBackDim;
let bodyCanvases = [];
let bodyDims = [];

function hash(seed) {
  let t = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return t - Math.floor(t);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function scaleSprite(img, scale) {
  let dpr = window.devicePixelRatio || 1;
  let w = Math.round(img.width * scale);
  let h = Math.round(img.height * scale);
  let canvas = document.createElement('canvas');
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return { canvas, w, h };
}

export async function loadDragonSprites() {
  let images = await Promise.all([
    loadImage('/manuscript/head.webp'),
    loadImage('/manuscript/tongue.webp'),
    loadImage('/manuscript/wing-front.webp'),
    loadImage('/manuscript/wing-back.webp'),
    ...Array.from({ length: 19 }, (_, i) => loadImage(`/manuscript/body-${i + 1}.webp`))
  ]);

  let s = DRAGON_SPRITE_SCALE;
  let r;
  r = scaleSprite(images[0], s); headCanvas = r.canvas; headDim = { w: r.w, h: r.h };
  r = scaleSprite(images[1], s); tongueCanvas = r.canvas; tongueDim = { w: r.w, h: r.h };
  r = scaleSprite(images[2], s); wingFrontCanvas = r.canvas; wingFrontDim = { w: r.w, h: r.h };
  r = scaleSprite(images[3], s); wingBackCanvas = r.canvas; wingBackDim = { w: r.w, h: r.h };

  for (let i = 4; i < images.length; i++) {
    r = scaleSprite(images[i], s);
    bodyCanvases.push(r.canvas);
    bodyDims.push({ w: r.w, h: r.h });
  }


}

function getSegmentWidth(index) {
  return index < DRAGON_SEGMENT_WIDTHS.length
    ? DRAGON_SEGMENT_WIDTHS[index] * DRAGON_SPRITE_SCALE
    : 10;
}

export function createDragon(startX, startY, scale = 1) {
  let segments = [];
  for (let i = 0; i < DRAGON_SEGMENT_COUNT; i++) {
    segments.push({
      x: startX,
      y: startY + i * DRAGON_SEGMENT_SPACING * scale,
      angle: -Math.PI / 2,
      width: getSegmentWidth(i) * scale
    });
  }
  return {
    segments,
    jitterSeed: Math.random() * 1000,
    lastStepTime: 0,
    stepInterval: 80,
    fire: /** @type {FireParticle[]} */ ([]),
    fireLastStep: 0,
    scale
  };
}

export function updateDragonScale(dragon, scale) {
  dragon.scale = scale;
  for (let i = 0; i < dragon.segments.length; i++) {
    dragon.segments[i].width = getSegmentWidth(i) * scale;
  }
}

export function getRestPose(startX, startY, scale) {
  let poses = [];
  let spacing = DRAGON_SEGMENT_SPACING * scale;
  poses.push({ x: startX, y: startY - 2, angle: 0 });
  for (let i = 1; i < DRAGON_SEGMENT_COUNT; i++) {
    let angle = -(i / (DRAGON_SEGMENT_COUNT - 1) * (Math.PI / 2) * 1.4);
    let prev = poses[i - 1];
    poses.push({
      x: prev.x - Math.cos(angle) * spacing,
      y: prev.y - Math.sin(angle) * spacing,
      angle
    });
  }
  return poses;
}

export function setDragonRestPose(dragon, x = 0, y = 0) {
  const poses = getRestPose(x, y, dragon.scale);
  dragon.segments.forEach((segment, index) => Object.assign(segment, poses[index]));
}

export function updateDragon(dragon, time, mouseX, mouseY, idle = false, restX = 0, restY = 0) {
  if (time - dragon.lastStepTime < dragon.stepInterval) return false;
  dragon.lastStepTime = time;
  dragon.jitterSeed = Math.random() * 1000;

  if (idle) {
    let rest = getRestPose(restX, restY, dragon.scale);
    let lerp = 0.12;
    for (let i = 0; i < dragon.segments.length; i++) {
      let seg = dragon.segments[i];
      let target = rest[i];
      seg.x += (target.x - seg.x) * lerp;
      seg.y += (target.y - seg.y) * lerp;
      let angleDiff = target.angle - seg.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      seg.angle += angleDiff * lerp;
    }
    return true;
  }

  // Head follows mouse
  let head = dragon.segments[0];
  let dx = mouseX - head.x;
  let dy = mouseY - head.y;
  let dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 4) {
    let speed = Math.min(dist, Math.max(12, dist * 0.15));
    head.x += (dx / dist) * speed;
    head.y += (dy / dist) * speed;
    head.angle = Math.atan2(dy, dx);
  }

  // Body follows head with angle constraints
  let maxBend = 0.25;
  for (let i = 1; i < dragon.segments.length; i++) {
    let prev = dragon.segments[i - 1];
    let seg = dragon.segments[i];
    let angle = Math.atan2(prev.y - seg.y, prev.x - seg.x);
    let diff = angle - prev.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > maxBend) angle = prev.angle + maxBend;
    else if (diff < -maxBend) angle = prev.angle - maxBend;
    seg.angle = angle;
    let spacing = DRAGON_SEGMENT_SPACING * dragon.scale;
    seg.x = prev.x - Math.cos(seg.angle) * spacing;
    seg.y = prev.y - Math.sin(seg.angle) * spacing;
  }
  return true;
}

function wingAngle(dragon) {
  return dragon.segments[WING_SEGMENT_INDEX].angle;
}

// Include the full sprites and wing sweep when meeting the lower page boundary.
export function getDragonBounds(dragon, verticalOnly = false) {
  const bounds = {left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity};
  function projection(cosine, sine, lo, hi) {
    const start = cosine * Math.cos(lo) + sine * Math.sin(lo);
    const end = cosine * Math.cos(hi) + sine * Math.sin(hi);
    let min = Math.min(start, end), max = Math.max(start, end);
    const peak = Math.atan2(sine, cosine);
    const first = Math.ceil((lo - peak) / Math.PI);
    for (let turn = first; peak + turn * Math.PI <= hi; turn++) {
      const value = (turn % 2 === 0 ? 1 : -1) * Math.hypot(cosine, sine);
      min = Math.min(min, value); max = Math.max(max, value);
    }
    return {min, max};
  }
  function sprite(seg, dim, left, top, sweep = 0.02) {
    if (!dim) return;
    for (const x of [left, left + dim.w]) {
      for (const y of [top, top + dim.h]) {
        const lo = seg.angle - sweep, hi = seg.angle + sweep;
        const vertical = projection(y, x, lo, hi);
        if (!verticalOnly) {
          const horizontal = projection(x, -y, lo, hi);
          bounds.left = Math.min(bounds.left, seg.x + horizontal.min * dragon.scale - 1);
          bounds.right = Math.max(bounds.right, seg.x + horizontal.max * dragon.scale + 1);
        }
        bounds.top = Math.min(bounds.top, seg.y + vertical.min * dragon.scale - 1);
        bounds.bottom = Math.max(bounds.bottom, seg.y + vertical.max * dragon.scale + 1);
      }
    }
  }
  dragon.segments.forEach((seg, i) => {
    if (i === 0) {
      sprite(seg, headDim, -headDim.w * .45, -headDim.h / 2);
      sprite(seg, tongueDim, headDim.w * .3, -tongueDim.h / 2);
    } else {
      const dim = bodyDims[i - 1];
      sprite(seg, dim, -dim.w / 2, -dim.h / 2);
    }
    if (i === WING_SEGMENT_INDEX) {
      const wing={...seg,angle:wingAngle(dragon)};
      sprite(wing, wingBackDim, -wingBackDim.w, -wingBackDim.h, .42);
      sprite(wing, wingFrontDim, -wingFrontDim.w, -wingFrontDim.h, .42);
    }
  });
  return bounds;
}

export function getDragonBottom(dragon) { return getDragonBounds(dragon, true).bottom; }

// Get collision rectangles for text exclusion
export function getDragonExclusions(dragon, top, bottom, padding) {
  let rects = [];
  for (let seg of dragon.segments) {
    let radius = seg.width / 2 + padding;
    if (seg.y + radius < top || seg.y - radius > bottom) continue;
    let mid = (top + bottom) / 2;
    let distToMid = Math.abs(seg.y - mid);
    let halfHeight = (bottom - top) / 2;
    let gap = Math.max(0, distToMid - halfHeight);
    if (gap >= radius) continue;
    let halfWidth = Math.sqrt(radius * radius - gap * gap);
    rects.push({ left: seg.x - halfWidth, right: seg.x + halfWidth });
  }
  if (rects.length <= 1) return rects;
  rects.sort((a, b) => a.left - b.left);
  let merged = [rects[0]];
  for (let i = 1; i < rects.length; i++) {
    let r = rects[i];
    let last = merged[merged.length - 1];
    if (r.left <= last.right) last.right = Math.max(last.right, r.right);
    else merged.push(r);
  }
  return merged;
}

// Spawn fire particles on click
export function spawnFire(dragon) {
  let head = dragon.segments[0];
  let scale = dragon.scale;
  let mouthOffset = (headCanvas ? headDim.w * 0.55 : 30) * scale;
  let fx = head.x + Math.cos(head.angle) * mouthOffset;
  let fy = head.y + Math.sin(head.angle) * mouthOffset;
  let count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    let spread = (Math.random() - 0.5) * 0.25;
    let speed = (35 + Math.random() * 20) * scale;
    let angle = head.angle + spread;
    dragon.fire.push({
      x: fx + (Math.random() - 0.5) * 4,
      y: fy + (Math.random() - 0.5) * 4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: (8 + Math.random() * 12) * scale,
      life: 1,
      maxLife: 12 + Math.floor(Math.random() * 6),
      frame: 0,
      color: Math.floor(Math.random() * 3)
    });
  }
}

export function hasActiveFire(dragon) {
  return dragon.fire.length > 0;
}

export function updateFire(dragon, time) {
  if (time - dragon.fireLastStep < FIRE_STEP_INTERVAL) return;
  dragon.fireLastStep = time;
  for (let i = dragon.fire.length - 1; i >= 0; i--) {
    let p = dragon.fire[i];
    p.frame++;
    p.life = 1 - p.frame / p.maxLife;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    let gravity = Math.max(0, (p.frame - 4) / p.maxLife);
    p.vy -= gravity * 1.5;
    if (p.life < 0.25) p.size *= 0.75;
    else if (p.frame < 3) p.size *= 1.15;
    if (p.life <= 0 || p.size < 1.5) dragon.fire.splice(i, 1);
  }
}

// Get fire influence on a text character position
export function getFireInfluence(dragon, x, y) {
  let dx = 0, dy = 0, totalWeight = 0;
  for (let p of dragon.fire) {
    let ex = x - p.x;
    let ey = y - p.y;
    let dist = Math.sqrt(ex * ex + ey * ey);
    if (dist > 60 || dist < 0.1) continue;
    let falloff = 1 - dist / 60;
    let weight = falloff * falloff * p.life;
    let nx = ex / dist;
    let ny = ey / dist;
    dx += nx * weight;
    dy += ny * weight;
    totalWeight += weight;
  }
  if (totalWeight < 0.001) return { dx: 0, dy: 0, strength: 0 };
  let mag = Math.sqrt(dx * dx + dy * dy);
  return {
    dx: mag > 0 ? dx / mag : 0,
    dy: mag > 0 ? dy / mag : 0,
    strength: Math.min(totalWeight, 1.5)
  };
}

// Get fire exclusion zones for text
export function getFireExclusions(dragon, top, bottom, padding) {
  let rects = [];
  for (let p of dragon.fire) {
    let radius = p.size / 2 + padding;
    if (p.y + radius < top || p.y - radius > bottom) continue;
    let mid = (top + bottom) / 2;
    let distToMid = Math.abs(p.y - mid);
    let halfHeight = (bottom - top) / 2;
    let gap = Math.max(0, distToMid - halfHeight);
    if (gap >= radius) continue;
    let halfWidth = Math.sqrt(radius * radius - gap * gap);
    rects.push({ left: p.x - halfWidth, right: p.x + halfWidth });
  }
  if (rects.length <= 1) return rects;
  rects.sort((a, b) => a.left - b.left);
  let merged = [rects[0]];
  for (let i = 1; i < rects.length; i++) {
    let r = rects[i];
    let last = merged[merged.length - 1];
    if (r.left <= last.right) last.right = Math.max(last.right, r.right);
    else merged.push(r);
  }
  return merged;
}

// Draw the dragon body segments
export function drawDragon(ctx, dragon, animate = true) {
  let segs = dragon.segments;
  let seed = dragon.jitterSeed;
  let time = performance.now() / 1000;
  let scale = dragon.scale;

  // Draw wing-back first (behind body)
  if (wingBackCanvas) {
    let seg = segs[WING_SEGMENT_INDEX];
    let jx = (hash(seed + WING_SEGMENT_INDEX * 37) - 0.5) * 1.5;
    let jy = (hash(seed + WING_SEGMENT_INDEX * 37 + 100) - 0.5) * 1.5;
    let jr = (hash(seed + WING_SEGMENT_INDEX * 37 + 200) - 0.5) * 0.04;
    let wingFlap = animate ? Math.sin(time * 3) * 0.4 : 0;
    ctx.save();
    ctx.translate(seg.x + jx, seg.y + jy);
    ctx.rotate(wingAngle(dragon) + jr + wingFlap);
    ctx.scale(scale, scale);
    let { w, h } = wingBackDim;
    ctx.drawImage(wingBackCanvas, -w, -h, w, h);
    ctx.restore();
  }

  // Draw body segments back to front
  for (let i = segs.length - 1; i >= 0; i--) {
    let seg = segs[i];
    let jx = (hash(seed + i * 37) - 0.5) * 1.5;
    let jy = (hash(seed + i * 37 + 100) - 0.5) * 1.5;
    let jr = (hash(seed + i * 37 + 200) - 0.5) * 0.04;

    ctx.save();
    ctx.translate(seg.x + jx, seg.y + jy);
    ctx.rotate(seg.angle + jr);
    ctx.scale(scale, scale);

    if (i === 0) {
      // Tongue
      if (tongueCanvas) {
        let { w, h } = tongueDim;
        ctx.drawImage(tongueCanvas, headDim.w * 0.3, -h / 2, w, h);
      }
      // Head
      if (headCanvas) {
        let { w, h } = headDim;
        ctx.drawImage(headCanvas, -w * 0.45, -h / 2, w, h);
      }
    } else {
      let bodyIdx = i - 1;
      let bodyCanvas = bodyCanvases[bodyIdx];
      let dim = bodyDims[bodyIdx];
      if (bodyCanvas && dim) {
        let { w, h } = dim;
        ctx.drawImage(bodyCanvas, -w / 2, -h / 2, w, h);
      }
      // Wing-front on the wing segment
      if (i === WING_SEGMENT_INDEX && wingFrontCanvas) {
        let wingFlap = animate ? Math.sin(time * 3 + 0.5) * 0.4 : 0;
        ctx.save();
        let { w, h } = wingFrontDim;
        ctx.rotate(wingAngle(dragon)-seg.angle-wingFlap);
        ctx.drawImage(wingFrontCanvas, -w, -h, w, h);
        ctx.restore();
      }
    }
    ctx.restore();
  }
}

// Draw fire particles
function jitterLine(ctx, x1, y1, x2, y2, seed, jitter) {
  for (let s = 1; s <= 4; s++) {
    let t = s / 4;
    let jx = (hash(seed + s * 13) - 0.5) * jitter;
    let jy = (hash(seed + s * 29) - 0.5) * jitter;
    ctx.lineTo(x1 + (x2 - x1) * t + jx, y1 + (y2 - y1) * t + jy);
  }
}

export function drawFire(ctx, dragon) {
  for (let p of dragon.fire) {
    let angle = Math.atan2(p.vy, p.vx);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.globalAlpha = Math.min(1, p.life * 1.5);
    let decay = 1 - p.life;
    ctx.fillStyle = FIRE_COLORS[decay < 0.33 ? 0 : decay < 0.66 ? 1 : 2];
    let r = p.size / 2;
    let seedBase = p.color * 31 + p.frame * 0.3;
    let jitterFn = (n) => (hash(seedBase + n * 17) - 0.5) * r * 0.4;
    let jitter = r * 0.35;
    let corners = [
      [r * 1.2 + jitterFn(0), jitterFn(1)],
      [jitterFn(2), -r * 0.7 + jitterFn(3)],
      [-r + jitterFn(4), jitterFn(5)],
      [jitterFn(6), r * 0.7 + jitterFn(7)]
    ];
    ctx.beginPath();
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let j = 0; j < 4; j++) {
      let next = corners[(j + 1) % 4];
      jitterLine(ctx, corners[j][0], corners[j][1], next[0], next[1], seedBase + j * 100, jitter);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
