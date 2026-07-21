import type { EcoMode } from './defs';
import type { EcosystemScene } from './EcosystemScene';

/**
 * Registro global del fondo: permite que la página y el diagnóstico
 * cambien el estado del ecosistema sin acoplarse a Three.js.
 *
 * Three.js se carga de forma diferida (fuera de la ruta crítica del LCP),
 * así que la escena puede tardar en existir. Guardamos el último estado
 * pedido y lo aplicamos al registrarse: nadie tiene que esperar al canvas.
 */

let instance: EcosystemScene | null = null;
let pendingMode: EcoMode | null = null;
let revealRequested = false;

export function registerScene(scene: EcosystemScene | null): void {
  instance = scene;
  if (!scene) return;
  if (revealRequested) scene.reveal();
  if (pendingMode) scene.setMode(pendingMode);
}

export function setEcoMode(mode: EcoMode): void {
  pendingMode = mode;
  instance?.setMode(mode);
}

export function revealEco(): void {
  revealRequested = true;
  instance?.reveal();
}
