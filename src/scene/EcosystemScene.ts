import * as THREE from 'three';
import { ECO_AMBIENT, ECO_NODES, ECO_ROUTES, type EcoMode, type EcoNodeDef } from './defs';
import { makeDotTexture, makeGlowTexture, makeNodeTextures } from './textures';

/**
 * EcosystemScene — red empresarial viva que ocupa todo el fondo.
 * Sistema imperativo Three.js: sprites-nodo con deriva orgánica, conexiones
 * temporales con impulso de luz, scheduler de rutas de negocio, interacción
 * táctil y modos que reaccionan al estado de la página.
 */

const CAM_Z = 10;
const FOV = 55;
const SCROLL_Y_RANGE = 6.4;
const SCROLL_Z_RANGE = 1.25;

const COLOR_ELECTRIC = new THREE.Color('#4d9dff');
const COLOR_CYAN = new THREE.Color('#37e2e4');
const COLOR_VIOLET = new THREE.Color('#8b7cf6');
const COLOR_SUCCESS = new THREE.Color('#2ee6c3');

interface ModeParams {
  interval: number;
  brightness: number;
  violet: number;
  success: boolean;
}

const MODES: Record<EcoMode, ModeParams> = {
  hero: { interval: 4.6, brightness: 1, violet: 0.12, success: false },
  diagnostic: { interval: 7.5, brightness: 0.55, violet: 0.72, success: false },
  analysis: { interval: 2.1, brightness: 0.72, violet: 0.85, success: false },
  success: { interval: 5.5, brightness: 0.85, violet: 0, success: true },
};

interface NodeState {
  def: EcoNodeDef | null;
  /** Coordenadas normalizadas de origen (nx, ny, z) — layout() las traduce a mundo. */
  norm: THREE.Vector3;
  sprite: THREE.Sprite;
  glow: THREE.Sprite;
  base: THREE.Vector3;
  pos: THREE.Vector3;
  driftPhase: THREE.Vector3;
  driftFreq: THREE.Vector3;
  driftAmp: number;
  push: THREE.Vector3;
  pushTarget: THREE.Vector3;
  attract: THREE.Vector3;
  attractTarget: THREE.Vector3;
  baseOpacity: number;
  baseScale: number;
  glowLevel: number;
  glowTarget: number;
  flash: number;
  revealAt: number;
  dim: number;
}

const LEG_POINTS = 48;
const PHASE = { draw: 0.45, travel: 0.72, hold: 2.4, fade: 0.85 };

class LegFx {
  readonly a: NodeState;
  readonly b: NodeState;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  readonly line: THREE.Line;
  readonly pulse: THREE.Sprite;
  private curve = new THREE.QuadraticBezierCurve3();
  private ctrlSide: number;
  t = 0;
  done = false;
  /** true cuando el impulso llegó al nodo destino. */
  arrived = false;

  constructor(a: NodeState, b: NodeState, color: THREE.Color, glowTex: THREE.Texture, reduced: boolean) {
    this.a = a;
    this.b = b;
    this.ctrlSide = Math.random() > 0.5 ? 1 : -1;

    const positions = new Float32Array(LEG_POINTS * 3);
    const ts = new Float32Array(LEG_POINTS);
    for (let i = 0; i < LEG_POINTS; i++) ts[i] = i / (LEG_POINTS - 1);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aT', new THREE.BufferAttribute(ts, 1));

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: color.clone() },
        uDraw: { value: reduced ? 1 : 0 },
        uFade: { value: reduced ? 0 : 1 },
        uPulse: { value: -1 },
      },
      vertexShader: /* glsl */ `
        attribute float aT;
        varying float vT;
        void main() {
          vT = aT;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uDraw;
        uniform float uFade;
        uniform float uPulse;
        varying float vT;
        void main() {
          float drawn = smoothstep(uDraw, uDraw - 0.09, vT);
          float pulse = uPulse >= 0.0 ? exp(-pow((vT - uPulse) * 15.0, 2.0)) : 0.0;
          vec3 col = uColor * (0.62 + 1.9 * pulse);
          float a = drawn * uFade * (0.4 + 0.6 * pulse);
          if (a < 0.004) discard;
          gl_FragColor = vec4(col, a);
        }
      `,
    });

    this.line = new THREE.Line(this.geometry, this.material);
    this.line.renderOrder = 1;
    this.line.frustumCulled = false;

    const pulseMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: color.clone().lerp(new THREE.Color('#ffffff'), 0.35),
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.pulse = new THREE.Sprite(pulseMat);
    this.pulse.scale.setScalar(0.52);
    this.pulse.renderOrder = 3;
  }

  private rebuildCurve(): void {
    const a = this.a.pos;
    const b = this.b.pos;
    const mid = a.clone().lerp(b, 0.5);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(len * 0.14 * this.ctrlSide);
    mid.add(perp);
    this.curve.v0.copy(a);
    this.curve.v1.copy(mid);
    this.curve.v2.copy(b);

    const attr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < LEG_POINTS; i++) {
      const p = this.curve.getPoint(i / (LEG_POINTS - 1));
      attr.setXYZ(i, p.x, p.y, p.z);
    }
    attr.needsUpdate = true;
  }

  update(dt: number, brightness: number, reduced: boolean): void {
    this.t += dt;
    this.rebuildCurve();

    const u = this.material.uniforms;
    const { draw, travel, hold, fade } = PHASE;
    const t = this.t;

    if (reduced) {
      // Sin impulso viajero: la conexión respira solo con opacidad.
      const total = draw + travel + hold + fade;
      const inA = Math.min(t / 0.9, 1);
      const out = t > total - 0.9 ? Math.max(1 - (t - (total - 0.9)) / 0.9, 0) : 1;
      u.uFade.value = inA * out * 0.85 * brightness;
      u.uDraw.value = 1;
      if (t > draw + travel) this.arrived = true;
      if (t >= total) this.done = true;
      return;
    }

    if (t < draw) {
      u.uDraw.value = easeOutCubic(t / draw);
      u.uFade.value = brightness;
    } else if (t < draw + travel) {
      u.uDraw.value = 1;
      const p = easeInOutSine((t - draw) / travel);
      u.uPulse.value = p;
      this.pulse.position.copy(this.curve.getPoint(p));
      (this.pulse.material as THREE.SpriteMaterial).opacity =
        Math.sin(Math.min(p, 1) * Math.PI) * 0.9 * brightness;
      if (p > 0.96) this.arrived = true;
      u.uFade.value = brightness;
    } else if (t < draw + travel + hold) {
      this.arrived = true;
      u.uPulse.value = -1;
      (this.pulse.material as THREE.SpriteMaterial).opacity = 0;
      // Respiración de la conexión activa
      const breathe = 0.78 + 0.22 * Math.sin((t - draw - travel) * 2.4);
      u.uFade.value = breathe * brightness;
    } else if (t < draw + travel + hold + fade) {
      const p = (t - draw - travel - hold) / fade;
      u.uFade.value = (1 - easeOutCubic(p)) * brightness;
    } else {
      this.done = true;
      u.uFade.value = 0;
    }
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    (this.pulse.material as THREE.SpriteMaterial).dispose();
  }
}

interface ActiveRoute {
  ids: string[];
  legIndex: number;
  legs: LegFx[];
  color: THREE.Color;
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
}

function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * Math.min(Math.max(x, 0), 1)) - 1) / 2;
}

export class EcosystemScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private nodes: NodeState[] = [];
  private byId = new Map<string, NodeState>();
  private glowTex: THREE.Texture;
  private routes: ActiveRoute[] = [];
  private routeIdx = 0;
  private nextRouteAt = 2.2;
  private clock = new THREE.Clock();
  private time = 0;
  private raf = 0;
  private running = false;
  private disposed = false;

  private mode: EcoMode = 'hero';
  private brightness = 1;
  private violetMix = 0.12;

  private scroll = 0;
  private camOffset = new THREE.Vector2();
  private camOffsetTarget = new THREE.Vector2();
  private pointerNdc = new THREE.Vector2(10, 10);
  private raycaster = new THREE.Raycaster();
  private reduced: boolean;
  private revealed = false;

  private readonly proj = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement, opts: { reducedMotion: boolean }) {
    this.reduced = opts.reducedMotion;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
    this.camera.position.set(0, 0, CAM_Z);

    this.glowTex = makeGlowTexture();
    const dotTex = makeDotTexture();

    for (const def of ECO_NODES) {
      const { sharp, soft } = makeNodeTextures(def);
      const far = def.z < -1.1;
      const mat = new THREE.SpriteMaterial({
        map: far ? soft : sharp,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.renderOrder = 2;
      sprite.userData.nodeId = def.id;

      const glowMat = new THREE.SpriteMaterial({
        map: this.glowTex,
        color: COLOR_ELECTRIC.clone(),
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const glow = new THREE.Sprite(glowMat);
      glow.renderOrder = 0;

      const zNorm = (def.z + 2.6) / 3.8;
      const state: NodeState = {
        def,
        norm: new THREE.Vector3(def.nx, def.ny, def.z),
        sprite,
        glow,
        base: new THREE.Vector3(),
        pos: new THREE.Vector3(),
        driftPhase: new THREE.Vector3(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28),
        driftFreq: new THREE.Vector3(0.35 + Math.random() * 0.3, 0.28 + Math.random() * 0.3, 0.2),
        driftAmp: 0.13 + Math.random() * 0.09,
        push: new THREE.Vector3(),
        pushTarget: new THREE.Vector3(),
        attract: new THREE.Vector3(),
        attractTarget: new THREE.Vector3(),
        baseOpacity: 0.4 + zNorm * 0.55,
        baseScale: 0.64 * def.size * (0.85 + zNorm * 0.4),
        glowLevel: 0,
        glowTarget: 0,
        flash: 0,
        revealAt: -1,
        dim: 1,
      };
      this.nodes.push(state);
      this.byId.set(def.id, state);
      this.scene.add(glow, sprite);
    }

    for (const amb of ECO_AMBIENT) {
      const mat = new THREE.SpriteMaterial({
        map: dotTex,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.renderOrder = 0;
      const zNorm = (amb.z + 2.6) / 3.8;
      const state: NodeState = {
        def: null,
        norm: new THREE.Vector3(amb.nx, amb.ny, amb.z),
        sprite,
        glow: sprite,
        base: new THREE.Vector3(),
        pos: new THREE.Vector3(),
        driftPhase: new THREE.Vector3(Math.random() * 6.28, Math.random() * 6.28, 0),
        driftFreq: new THREE.Vector3(0.3 + Math.random() * 0.25, 0.24 + Math.random() * 0.25, 0),
        driftAmp: 0.18,
        push: new THREE.Vector3(),
        pushTarget: new THREE.Vector3(),
        attract: new THREE.Vector3(),
        attractTarget: new THREE.Vector3(),
        baseOpacity: 0.2 + zNorm * 0.25,
        baseScale: 0.3,
        glowLevel: 0,
        glowTarget: 0,
        flash: 0,
        revealAt: -1,
        dim: 1,
      };
      this.nodes.push(state);
      this.scene.add(sprite);
    }

    this.layout();
    this.start();
  }

  /* ── Layout adaptable al aspect ratio ─────────────────────────────── */

  private halfWidthAt(z: number): number {
    const dist = CAM_Z - z;
    const halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * dist;
    return Math.min(halfH * this.camera.aspect, 9);
  }

  private layout(): void {
    for (const n of this.nodes) {
      const hw = this.halfWidthAt(n.norm.z) * 0.88;
      n.base.set(n.norm.x * hw, n.norm.y, n.norm.z);
    }
  }

  resize(w: number, h: number): void {
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.layout();
  }

  /* ── API pública ──────────────────────────────────────────────────── */

  reveal(): void {
    if (this.revealed) return;
    this.revealed = true;
    const order = [...this.nodes].sort((a, b) => b.base.y - a.base.y);
    order.forEach((n, i) => {
      n.revealAt = this.time + (this.reduced ? 0.1 : 0.12 + i * 0.05);
    });
  }

  setScroll(p: number): void {
    this.scroll = THREE.MathUtils.clamp(p, 0, 1);
  }

  setPointer(xNdc: number, yNdc: number): void {
    this.pointerNdc.set(xNdc, yNdc);
    if (!this.reduced) {
      this.camOffsetTarget.set(xNdc * 0.18, yNdc * 0.12);
    }
  }

  setTilt(xNorm: number, yNorm: number): void {
    if (this.reduced) return;
    this.camOffsetTarget.set(
      THREE.MathUtils.clamp(xNorm, -1, 1) * 0.3,
      THREE.MathUtils.clamp(yNorm, -1, 1) * 0.2,
    );
  }

  /** Tap del usuario: enciende el nodo y dispara su ruta. */
  pointerTap(xNdc: number, yNdc: number): void {
    this.raycaster.setFromCamera(new THREE.Vector2(xNdc, yNdc), this.camera);
    const sprites = this.nodes.filter((n) => n.def).map((n) => n.sprite);
    const hits = this.raycaster.intersectObjects(sprites, false);
    if (hits.length === 0) return;
    const id = hits[0].object.userData.nodeId as string;
    const node = this.byId.get(id);
    if (!node) return;
    node.flash = 1;
    node.glowTarget = 1;
    const route = ECO_ROUTES.find((r) => r[0] === id) ?? ECO_ROUTES.find((r) => r.includes(id));
    if (route && this.routes.length < 3) this.startRoute(route);
  }

  setMode(mode: EcoMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    if (mode === 'analysis' || mode === 'success') {
      // Ráfaga inmediata: el sistema reacciona al estado del diagnóstico.
      this.nextRouteAt = this.time + 0.2;
    }
  }

  setRunning(run: boolean): void {
    if (run && !this.running && !this.disposed) {
      this.running = true;
      this.clock.getDelta();
      this.loop();
    } else if (!run) {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }
  }

  private start(): void {
    this.running = true;
    this.loop();
  }

  dispose(): void {
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    for (const r of this.routes) for (const l of r.legs) this.cleanupLeg(l);
    this.renderer.dispose();
  }

  /* ── Rutas y conexiones ───────────────────────────────────────────── */

  private routeColor(): THREE.Color {
    const params = MODES[this.mode];
    if (params.success) return COLOR_SUCCESS.clone();
    const base = COLOR_ELECTRIC.clone().lerp(COLOR_CYAN, Math.random() * 0.7);
    return base.lerp(COLOR_VIOLET, this.violetMix);
  }

  private startRoute(ids: string[]): void {
    const route: ActiveRoute = { ids, legIndex: 0, legs: [], color: this.routeColor() };
    this.routes.push(route);
    this.startLeg(route);
  }

  private startLeg(route: ActiveRoute): void {
    const aId = route.ids[route.legIndex];
    const bId = route.ids[route.legIndex + 1];
    const a = this.byId.get(aId);
    const b = this.byId.get(bId);
    if (!a || !b) return;

    const leg = new LegFx(a, b, route.color, this.glowTex, this.reduced);
    route.legs.push(leg);
    this.scene.add(leg.line, leg.pulse);

    // Los nodos se aproximan ligeramente y se encienden.
    const dirAB = b.pos.clone().sub(a.pos).multiplyScalar(0.05);
    a.attractTarget.copy(dirAB);
    b.attractTarget.copy(dirAB.clone().negate());
    a.glowTarget = Math.max(a.glowTarget, 0.75);
  }

  private cleanupLeg(leg: LegFx): void {
    this.scene.remove(leg.line, leg.pulse);
    leg.dispose();
  }

  private updateRoutes(dt: number): void {
    const params = MODES[this.mode];

    if (this.time >= this.nextRouteAt && this.revealed) {
      if (this.routes.length < 2) {
        this.startRoute(ECO_ROUTES[this.routeIdx % ECO_ROUTES.length]);
        this.routeIdx++;
      }
      this.nextRouteAt = this.time + params.interval * (0.85 + Math.random() * 0.3);
    }

    for (let i = this.routes.length - 1; i >= 0; i--) {
      const route = this.routes[i];
      for (const leg of route.legs) leg.update(dt, this.brightness, this.reduced);

      // El impulso llegó: enciende el destino y encadena el siguiente tramo.
      const current = route.legs[route.legs.length - 1];
      if (current?.arrived) {
        current.b.glowTarget = Math.max(current.b.glowTarget, 0.72);
        if (route.legIndex < route.ids.length - 2 && route.legs.length === route.legIndex + 1) {
          route.legIndex++;
          this.startLeg(route);
        }
      }

      if (route.legs.every((l) => l.done)) {
        for (const leg of route.legs) {
          leg.a.attractTarget.set(0, 0, 0);
          leg.b.attractTarget.set(0, 0, 0);
          leg.a.glowTarget = 0;
          leg.b.glowTarget = 0;
          this.cleanupLeg(leg);
        }
        this.routes.splice(i, 1);
      }
    }
  }

  /* ── Loop principal ───────────────────────────────────────────────── */

  private loop = (): void => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);

    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;

    const params = MODES[this.mode];
    this.brightness = THREE.MathUtils.lerp(this.brightness, params.brightness, dt * 2.2);
    this.violetMix = THREE.MathUtils.lerp(this.violetMix, params.violet, dt * 2);

    // Cámara: scroll = profundidad + desplazamiento; puntero/giroscopio = paralaje.
    this.camOffset.lerp(this.camOffsetTarget, dt * 3);
    const targetY = -this.scroll * SCROLL_Y_RANGE + this.camOffset.y;
    const targetZ = CAM_Z - this.scroll * SCROLL_Z_RANGE;
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.camOffset.x, dt * 3.4);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetY, dt * 3.4);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetZ, dt * 3.4);

    this.updateNodes(dt);
    this.updateRoutes(dt);

    this.renderer.render(this.scene, this.camera);
  };

  private updateNodes(dt: number): void {
    const t = this.time;

    for (const n of this.nodes) {
      // Deriva orgánica, casi imperceptible.
      if (!this.reduced) {
        n.pos.set(
          n.base.x + Math.sin(t * n.driftFreq.x + n.driftPhase.x) * n.driftAmp,
          n.base.y + Math.cos(t * n.driftFreq.y + n.driftPhase.y) * n.driftAmp * 0.8,
          n.base.z + Math.sin(t * n.driftFreq.z + n.driftPhase.z) * 0.08,
        );
      } else {
        n.pos.copy(n.base);
      }

      // Reacción suave al dedo (empuje) y aproximación en conexiones.
      n.push.lerp(n.pushTarget, dt * 4);
      n.attract.lerp(n.attractTarget, dt * 2.4);
      n.pos.add(n.push).add(n.attract);
      n.pushTarget.multiplyScalar(1 - dt * 2.2);

      if (!this.reduced && n.def) {
        this.proj.copy(n.pos).project(this.camera);
        const dx = this.proj.x - this.pointerNdc.x;
        const dy = this.proj.y - this.pointerNdc.y;
        const d = Math.hypot(dx, dy);
        if (d < 0.3 && d > 0.0001) {
          const f = ((0.3 - d) / 0.3) * 0.5;
          n.pushTarget.x = (dx / d) * f;
          n.pushTarget.y = (dy / d) * f;
        }
      }

      n.sprite.position.copy(n.pos);

      // Legibilidad: atenuar nodos que cruzan la zona de contenido.
      this.proj.copy(n.pos).project(this.camera);
      const ex = this.proj.x / 0.96;
      const ey = (this.proj.y - 0.02) / 0.62;
      const e = ex * ex + ey * ey;
      const targetDim = e < 1 ? 0.24 + 0.76 * THREE.MathUtils.smoothstep(e, 0.25, 1) : 1;
      n.dim = THREE.MathUtils.lerp(n.dim, targetDim, dt * 5);

      // Revelado inicial.
      let revealFactor = 0;
      if (n.revealAt >= 0 && t > n.revealAt) {
        revealFactor = this.reduced ? 1 : easeOutCubic((t - n.revealAt) / 0.9);
      }

      n.flash = Math.max(n.flash - dt * 1.6, 0);
      n.glowLevel = THREE.MathUtils.lerp(n.glowLevel, n.glowTarget, dt * 3.5);
      if (n.glowTarget > 0 && this.routes.length === 0) n.glowTarget = 0;

      const flashBoost = 1 + n.flash * 0.16;
      const scale = n.baseScale * flashBoost * (0.94 + revealFactor * 0.06);
      n.sprite.scale.set(scale, scale, 1);

      const opacity =
        n.baseOpacity * revealFactor * n.dim * this.brightness * (1 + n.glowLevel * 0.35 + n.flash * 0.4);
      (n.sprite.material as THREE.SpriteMaterial).opacity = Math.min(opacity, 1);

      if (n.def) {
        const gm = n.glow.material as THREE.SpriteMaterial;
        gm.color.copy(COLOR_ELECTRIC).lerp(COLOR_VIOLET, this.violetMix);
        if (this.mode === 'success') gm.color.copy(COLOR_SUCCESS);
        gm.opacity = (0.05 + n.glowLevel * 0.4 + n.flash * 0.35) * revealFactor * n.dim * this.brightness;
        n.glow.position.copy(n.pos);
        const gs = scale * 2.7;
        n.glow.scale.set(gs, gs, 1);
      }
    }
  }
}
