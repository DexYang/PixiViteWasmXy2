import Scene from "./Scene"
import { Layer } from "@pixi/layers"
import { AnimatedSprite, Container, Sprite } from "pixi.js"
import { ResourceLoader } from "./ResourceLoader"
import { Debug } from "~/utils/debug"
import { WDFManager } from "~/lib/WDFManager"
import config from "~/config"
import { FancyButton } from "@pixi/ui"


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
        this.bg_layer.zIndex = 0
        this.bg_layer.zOrder = 0
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


        this.ui_layer = new Layer()
        this.ui_layer.zIndex = 0
        this.ui_layer.zOrder = 0

        for (const key in res["buttons"]) {
            const value = res["buttons"][key]
            const was = await wdfManager.get(value["wdf"], value["was_hash"])
            if (was !== undefined) {
                const btn = new FancyButton({
                    defaultView: new Sprite(was.readFrames()[0][0].texture),
                    pressedView: new Sprite(was.readFrames()[0][1].texture),
                    hoverView: new Sprite(was.readFrames()[0][2].texture),
                })
                btn.position.set(value["x"], value["y"])
                if (key === "进入游戏") {
                    btn.onPress.connect(async () => await this.sm.switchScene("World"))
                } else if (key === "注册账号") {
                    btn.onPress.connect(() => alert("注册账号"))
                } else if (key === "退出游戏") {
                    btn.onPress.connect(async () => await this.sm.switchScene("Loading"))
                }
                this.ui_layer.addChild(btn)
            }
        }

        this.container.addChild(this.ui_layer)
    }
}