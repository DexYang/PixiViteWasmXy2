import { Layer } from "@pixi/layers"
import SceneManager from "./SceneManager"
import { SoundManager } from "./SoundManager"

export interface Scene {
  load?(): void | Promise<void>;
  unload?(): void | Promise<void>;
  start?(): void | Promise<void>;
  onResize?(width: number, height: number): void;
}

export abstract class Scene extends Layer implements Scene{
  abstract name: string;

  scm = SceneManager.getInstance()
  sdm = SoundManager.getInstance()

  constructor() {
      super()
      this.sortableChildren = true
  }
}

export default Scene
