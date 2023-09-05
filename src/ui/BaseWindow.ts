import { Container, RenderTexture } from "pixi.js"

  

export class BaseWindow extends Container {
    bg_set: Array<{wdf: string, path: string, x: number, y: number, z: number}>
    w = 0
    h = 0
    bg: RenderTexture

    constructor() {
        super()
        this.sortableChildren = false
    }

    async load() {
        //
    }
}