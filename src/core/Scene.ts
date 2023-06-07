import { Container } from "pixi.js"
import type { SceneUtils } from "./SceneManager"
import SceneManager from "./SceneManager";

export interface Scene {
  load?(): void | Promise<void>;
  unload?(): void | Promise<void>;
  start?(): void | Promise<void>;
  onResize?(width: number, height: number): void;
}

export abstract class Scene extends Container {
  abstract name: string;

  scene_manager = SceneManager.getInstance()

  constructor(protected utils: SceneUtils) {
    super()
  }
}

export default Scene
