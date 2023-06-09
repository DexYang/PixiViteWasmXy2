import { Layer } from "@pixi/layers"
import type { SceneUtils } from "./SceneManager"
import SceneManager from "./SceneManager"

export interface Scene {
  load?(): void | Promise<void>;
  unload?(): void | Promise<void>;
  start?(): void | Promise<void>;
  onResize?(width: number, height: number): void;
}

export abstract class Scene extends Layer implements Scene{
  abstract name: string;

  sm = SceneManager.getInstance()

  constructor(protected utils: SceneUtils) {
    super()
    this.sortableChildren = true
  }
}

export default Scene
