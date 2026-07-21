import type { EcoMode } from './defs';
import type { EcosystemScene } from './EcosystemScene';

/**
 * Registro global del fondo: permite que la página y el diagnóstico
 * cambien el estado del ecosistema sin acoplarse a Three.js.
 */

let instance: EcosystemScene | null = null;

export function registerScene(scene: EcosystemScene | null): void {
  instance = scene;
}

export function setEcoMode(mode: EcoMode): void {
  instance?.setMode(mode);
}

export function revealEco(): void {
  instance?.reveal();
}
