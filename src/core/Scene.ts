import { Layer } from "@pixi/layers"
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

  constructor() {
      super()
      this.sortableChildren = true
  }
}

export default Scene
