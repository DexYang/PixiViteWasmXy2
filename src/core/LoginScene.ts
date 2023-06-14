import Scene from "./Scene"
import { Layer } from "@pixi/layers"
import { AnimatedSprite, Container, Graphics, Sprite } from "pixi.js"
import { ResourceLoader } from "./ResourceLoader"
import { Debug } from "~/utils/debug"
import { WDFManager } from "~/lib/WDFManager"
import config from "~/config"


export abstract class LoginScene extends Scene {
    bg_layer: Layer
    ui_layer: Layer
    container: Container

    conf: Record<string, any>

    onResize(): void {
        this.container.x = Math.max((window.innerWidth - 640) / 2, 0)
        this.container.y = Math.max((window.innerHeight - 480) / 2, 0)
    }

    async load() {
        if (!ResourceLoader.getInstance().loaded) {
            Debug.log("直读资源未加载")
            return
        }
        const wdfManager = WDFManager.getInstance()
    
        this.container = new Container()

        this.container.width = 640
        this.container.height = 480
        this.onResize()
        this.addChild(this.container)

        const res = this.conf[config.ui_prefer]

        this.bg_layer = new Layer()
        this.bg_layer.sortableChildren = true

        for (const key in res["static"]) {
            const value = res["static"][key]
            const was = await wdfManager.get(value["wdf"], value["was_hash"])
            if (was !== undefined) {
                const sp = new Sprite(was.readFrames()[0][0].texture)
                sp.anchor.set(0)
                sp.position.set(value["x"], value["y"])
                sp.zIndex = value["z"]
                this.bg_layer.addChild(sp)
            }
        }

        for (const key in res["animation"]) {
            const value = res["animation"][key]
            const was = await wdfManager.get(value["wdf"], value["was_hash"])
            if (was !== undefined) {
                const ani = new AnimatedSprite(was.readFrames()[0])
                ani.updateAnchor = true
                ani.anchor.set(was.x / was.width, was.y / was.height)
                ani.play()
                ani.position.set(value["x"], value["y"])
                ani.zIndex = value["z"]
                this.bg_layer.addChild(ani)
            }
        }

        this.container.addChild(this.bg_layer)
    }
}