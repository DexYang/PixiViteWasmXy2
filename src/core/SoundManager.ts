import { Sound } from "@pixi/sound"
import { WDFManager } from "~/lib/WDFManager"

export class SoundManager {
    private static instance: SoundManager

    wdfManager: WDFManager

    sounds: Map<string, Sound>

    bgm: Sound

    public static getInstance() {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager()
        }
        return SoundManager.instance
    }


    constructor() {
        this.wdfManager = WDFManager.getInstance()
        this.sounds = new Map<string, Sound>()
    }


    async play(wdf: string, path: string, loop=false, load=false) {
        if (load && this.sounds.has(wdf+path)) {
            const sound = this.sounds[wdf+path]
            sound.play({ loop: loop })
            return sound
        }
        const data = await this.wdfManager.get(wdf, path)
        if (data && data instanceof ArrayBuffer) {
            const sound = Sound.from(data)
            if (load) {
                this.sounds[wdf+path] = sound
            }
            sound.play({ loop: loop })
            return sound
        }
    }

    async bgmPlay(wdf: string, path: string) {
        this.bgmStop()
        this.bgm = await this.play(wdf, path, true)
    }

    bgmStop() {
        if (this.bgm instanceof Sound) {
            this.bgm.stop()
        }
    }
}