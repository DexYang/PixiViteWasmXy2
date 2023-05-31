import { Sprite, Text, Graphics, Texture, FORMATS } from "pixi.js"
import { Button } from "@pixi/ui"
import Scene from "../core/Scene"
import { centerObjects } from "../utils/misc"
import { ResourceLoader } from "~/core/ResourceLoader"
import { getMapX } from "~/lib/MapX"

export default class Loading extends Scene {
  name = "Loading"

  button = new Button(new Graphics()
    .beginFill(0xFFFFFF)
    .drawRoundedRect(0, 0, 100, 50, 15))


  async load() {
    await this.utils.assetLoader.loadAssetsGroup("Loading")

    const bg = Sprite.from("bgNight")

    const text = new Text("Loading...", {
      fontFamily: "Verdana",
      fontSize: 50,
      fill: "white",
    })

    text.resolution = 2
    
    this.button.onPress.connect(async () => await this.chooseLocalResources())

    centerObjects(bg, text)

    this.addChild(bg, text, this.button.view)
  }

  async start() {
    // ?
  }

  async chooseLocalResources() {
    const res = ResourceLoader.getInstance()
    await res.load()
    const mapx = await getMapX("newscene/1410.map")
    const texture = mapx.getJpeg(0)
    const sprite = Sprite.from(texture)
    this.addChild(sprite)
  }
}
