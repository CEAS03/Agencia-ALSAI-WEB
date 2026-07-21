import * as THREE from 'three';
import type { EcoNodeDef } from './defs';

/**
 * Texturas generadas en runtime (sin descargas): discos de cristal con
 * glifo luminoso, halos y pulso. Cada icono tiene variante nítida y
 * suavizada (pre-blur) para las capas de profundidad.
 */

const SIZE = 256;

function baseCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

function drawNodeDisc(ctx: CanvasRenderingContext2D, def: EcoNodeDef): void {
  const cx = SIZE / 2;
  const r = SIZE * 0.42;

  // Cuerpo de cristal oscuro
  const body = ctx.createRadialGradient(cx, cx - r * 0.35, r * 0.1, cx, cx, r);
  body.addColorStop(0, 'rgba(24, 42, 78, 0.85)');
  body.addColorStop(0.55, 'rgba(12, 22, 46, 0.72)');
  body.addColorStop(1, 'rgba(6, 12, 26, 0.55)');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.fill();

  // Anillo luminoso fino
  const ring = ctx.createLinearGradient(cx - r, cx - r, cx + r, cx + r);
  ring.addColorStop(0, 'rgba(96, 168, 255, 0.75)');
  ring.addColorStop(0.5, 'rgba(70, 120, 200, 0.25)');
  ring.addColorStop(1, 'rgba(60, 210, 220, 0.6)');
  ctx.strokeStyle = ring;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cx, r - 1.5, 0, Math.PI * 2);
  ctx.stroke();

  // Reflejo superior sutil (material de cristal)
  const gloss = ctx.createLinearGradient(0, cx - r, 0, cx);
  gloss.addColorStop(0, 'rgba(170, 210, 255, 0.16)');
  gloss.addColorStop(1, 'rgba(170, 210, 255, 0)');
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.ellipse(cx, cx - r * 0.42, r * 0.66, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glifo
  const scale = (SIZE * 0.52) / 24;
  ctx.save();
  ctx.translate(cx - 12 * scale, cx - 12 * scale);
  ctx.scale(scale, scale);
  ctx.lineWidth = 1.55;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(226, 240, 255, 0.95)';
  ctx.shadowColor = 'rgba(80, 200, 255, 0.9)';
  ctx.shadowBlur = 6;
  for (const d of def.paths) {
    ctx.stroke(new Path2D(d));
  }
  ctx.restore();
}

export interface NodeTextures {
  sharp: THREE.CanvasTexture;
  soft: THREE.CanvasTexture;
}

export function makeNodeTextures(def: EcoNodeDef): NodeTextures {
  const [canvas, ctx] = baseCanvas();
  drawNodeDisc(ctx, def);

  const [softCanvas, softCtx] = baseCanvas();
  softCtx.filter = 'blur(7px)';
  softCtx.drawImage(canvas, 0, 0);

  const sharp = new THREE.CanvasTexture(canvas);
  const soft = new THREE.CanvasTexture(softCanvas);
  sharp.anisotropy = 2;
  sharp.colorSpace = THREE.SRGBColorSpace;
  soft.colorSpace = THREE.SRGBColorSpace;
  return { sharp, soft };
}

/** Halo radial reutilizable (glow de nodos y pulso de conexiones). */
export function makeGlowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = baseCanvas();
  const cx = SIZE / 2;
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  g.addColorStop(0, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.22, 'rgba(255, 255, 255, 0.5)');
  g.addColorStop(0.55, 'rgba(255, 255, 255, 0.12)');
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Punto ambiental simple. */
export function makeDotTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = baseCanvas();
  const cx = SIZE / 2;
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, SIZE * 0.18);
  g.addColorStop(0, 'rgba(190, 220, 255, 0.9)');
  g.addColorStop(0.5, 'rgba(140, 180, 240, 0.35)');
  g.addColorStop(1, 'rgba(140, 180, 240, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
