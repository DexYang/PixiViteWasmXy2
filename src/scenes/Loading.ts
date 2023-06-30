import { Text, Graphics, Assets } from "pixi.js"
import { FancyButton } from "@pixi/ui"
import Scene from "../core/Scene"
import { ResourceLoader } from "~/core/ResourceLoader"
import { centerObject } from "~/utils/misc"


export default class Loading extends Scene {
    name = "Loading"

    button: FancyButton
    graphics: Graphics
    header_text: Text
    body_text: Text

    onResize(): void {
        centerObject(this.graphics, -200, -200, false)
        centerObject(this.button, 0, -115)
        centerObject(this.body_text, 0, -150, true)
        centerObject(this.header_text, -198, -198, false)
    }

    async load() {

        await Assets.load("/Loading/images/button-normal.png")
        await Assets.load("/Loading/images/button-pressed.png")

        // graphics
        this.graphics = new Graphics()

        this.graphics.beginFill(0xFFFFFF)
        this.graphics.drawRect(0, 0, 400, 20)
        this.graphics.endFill()

        this.graphics.beginFill(0xE0E0E0)
        this.graphics.drawRect(0, 20, 400, 90)
        this.graphics.endFill()

        // button
        this.button = new FancyButton({
            defaultView: "/Loading/images/button-normal.png",
            pressedView: "/Loading/images/button-pressed.png",
        })
        this.button.anchor.set(0.5)
        this.button.onPress.connect(async () => await this.chooseLocalResources())

        // text
        this.header_text = new Text("大话西游II", {
            fontSize: 12,
            fill: "gray",  
        })

        // text
        this.body_text = new Text("由于浏览器限制, 请手动选择大话西游II经典版官方资源路径", {
            fontSize: 12,
            fill: "black",
        })

    
        this.onResize()
        this.addChild(this.graphics, this.header_text, this.body_text, this.button)
    }

    async chooseLocalResources() {
        const res = ResourceLoader.getInstance()
        await res.load()
        await this.sm.switchScene("World")
    
        // const mapx = await getMapX("newscene/1410.map")
        // const texture = mapx.getJpeg(0)
        // const sprite = Sprite.from(texture)
        // this.addChild(sprite)

        // const wm = WorkerManager.getInstance()

        // const inBuffer = Module._malloc(size)
        // Module.HEAP8.set(uint8Array, inBuffer)
        // const outSize = 320 * 240 * 3
        // const outBuffer = Module._malloc(outSize)

        // console.log(new Uint8Array(Module.asm.memory.buffer, 0, 1024))
        // 获取捕获输出的缓冲区
        // const outputBuffer = new Uint8Array(Module.instance.exports.memory.buffer, 0, 1024)

        // // 解析捕获的输出
        // let i = 0
        // let output = ""
        // while (outputBuffer[i] !== 0) {
        //   output += String.fromCharCode(outputBuffer[i])
        //   i++
        // }

        // Module.getInstance().memory.buffer
    

        // 打印捕获的输出
        // console.log(output)


    }
}
