import { AnimatedSprite, Container } from "pixi.js"
import config from "~/config"
import { WAS } from "~/lib/WAS"
import { WDFManager } from "~/lib/WDFManager"
import SceneManager from "./SceneManager"

const modes: Record<string, Array<string>> = {
    "default": ["gires.wdf", "cursor/a.tca"],
    "pointer": ["gires.wdf", "cursor/c.tca"],
    "input": ["gires.wdf", "cursor/b.tca"],
    "chat": ["gires.wdf", "cursor/chat.tcp"],
    "disabled": ["gires.wdf", "cursor/d.tca"],
    "give": ["gires.wdf", "cursor/m.tca"],
    "trade": ["gires.wdf", "cursor/i.tca"],
    "friend": ["gires.wdf", "cursor/g.tca"],
    "magic": ["gires.wdf", "cursor/k.tca"],
    "fight": ["gires.wdf", "cursor/o.tca"],
    "protect": ["gires.wdf", "cursor/q.tca"],
    "capture": ["gires.wdf", "cursor/s.tca"],
}

export class Cursor extends Container {
    private static instance: Cursor
    
    modes: Record<string, AnimatedSprite>

    mode: string

    scm = SceneManager.getInstance()

    constructor() {
        super()
        this.mode = "default"
        this.modes = {}
    }

    async setup() {
        const wdfManager = WDFManager.getInstance()
        for (const mode in modes) {
            const was = await wdfManager.get(modes[mode][0], modes[mode][1])
            if (was instanceof WAS) {
                const frames = was.readFrames(config.ui_duration)[0]
                const ani = new AnimatedSprite(frames, true)
                this.modes[mode] = ani
                ani.updateAnchor = true
                ani.anchor.set(was.x / was.width, was.y / was.height)
                ani.play()
                ani.visible = mode === "default"
                ani.eventMode = "none"
                this.addChild(ani)
            }
            this.scm.app.renderer.events.cursorStyles[mode] = (mode: string) => {
                this.modes[this.mode].visible = false
                this.mode = mode
                this.modes[mode].visible = true
            }
        }
    
        this.scm.app.stage.eventMode = "auto"
        this.scm.app.stage.hitArea = this.scm.app.screen

        this.scm.app.renderer.events.domElement.style.cursor = "none"

        this.scm.app.ticker.add(() => {
            this.position = this.scm.app.renderer.events.pointer
        })
        return
    }


    public static async getInstance() {
        if (!Cursor.instance) {
            Cursor.instance = new Cursor()
            await Cursor.instance.setup()
            return Cursor.instance
        }
    
        return Cursor.instance
    }
}


export async function getCursor(): Promise<Cursor> {
    return await Cursor.getInstance()
}