import { FancyButton } from "@pixi/ui"
import { Sprite } from "pixi.js"
import { WAS } from "~/lib/WAS"
import { WDFManager } from "~/lib/WDFManager"
import { SoundManager } from "./SoundManager"


export async function getButton(wdf: string, path: string) {
    const wdfManager = WDFManager.getInstance()
    const sdm = SoundManager.getInstance()
    const was = await wdfManager.get(wdf, path)
    if (was instanceof WAS) {
        const fancyButton = new FancyButton({
            defaultView: new Sprite(was.readFrames()[0][0].texture),
            pressedView: new Sprite(was.readFrames()[0][1].texture),
            hoverView: new Sprite(was.readFrames()[0][2].texture),
        })
        fancyButton.down = async () => {
            await sdm.play("sound.wdf", "0x4F8F2281", false, true)
        }
        return fancyButton
    }
    return null
}