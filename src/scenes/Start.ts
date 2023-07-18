import { LoginScene } from "~/core/LoginScene"
import conf from "~/data/login/start_scene"
import { Layer } from "@pixi/layers"
import config from "~/config"
import { getButton } from "~/core/Button"


export default class Start extends LoginScene {
    name = "Start"

    conf = conf

    async start() {
        const res = this.conf[config.ui_prefer]

        this.ui_layer = new Layer()
        this.ui_layer.zIndex = 0
        this.ui_layer.zOrder = 0

        for (const key in res["buttons"]) {
            const value = res["buttons"][key]
            const btn = await getButton(value["wdf"], value["was_hash"])
            if (btn !== null) {
                btn.position.set(value["x"], value["y"])
                if (key === "进入游戏") {
                    btn.onPress.connect(async () => {
                        await this.scm.switchScene("World")
                    })
                } else if (key === "注册账号") {
                    btn.onPress.connect(async () =>  {
                        alert("注册账号")
                    })
                } else if (key === "退出游戏") {
                    btn.onPress.connect(async () => {
                        await this.scm.switchScene("Loading")
                    })
                }
                this.ui_layer.addChild(btn)
            }
        }

        this.container.addChild(this.ui_layer)


        this.bgm = await this.sdm.play("gires2.wdf", "0xF7426640", true)
    }

    async unload() {
        this.bgm.stop()
    }
}