import { Text, Graphics } from "pixi.js"
import { FancyButton } from "@pixi/ui"
import Scene from "../core/Scene"
import { ResourceLoader } from "~/core/ResourceLoader"

import { getMapX } from "~/lib/MapX"
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
    await this.utils.assetLoader.loadAssetsGroup("Loading")
    
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
      defaultView: "button-normal",
      pressedView: "button-pressed",
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


  async start() {
    // ?
  }

  async chooseLocalResources() {
    const res = ResourceLoader.getInstance()
    await res.load()
    const mapx = await getMapX("newscene/1410.map")
    const texture = mapx.getJpeg(0)
    // const sprite = Sprite.from(texture)
    // this.addChild(sprite)

    // const wm = WorkerManager.getInstance()

  }
}
