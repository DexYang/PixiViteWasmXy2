import Scene from "./Scene"
import { Layer } from "@pixi/layers"
import { Viewport } from "pixi-viewport"
import { ResourceLoader } from "./ResourceLoader"
import { Debug } from "~/utils/debug"
import { getMapX, MapX } from "~/lib/MapX"
import { BLEND_MODES, Sprite } from "pixi.js"
import { get_character } from "./Character"


export abstract class GameScene extends Scene {
    map_layer: Layer
    shape_layer: Layer
    ui_layer: Layer
    window_layer: Layer

    mapx: MapX

    window: Viewport
  
    onResize(): void {
        console.log(window.innerWidth, window.innerHeight)
    }

    async load() {
        if (!ResourceLoader.getInstance().loaded) {
            Debug.log("直读资源未加载")
            return
        }
        this.mapx = await getMapX("newscene/1410.map")

        this.window = new Viewport({
            worldWidth: this.mapx.width,
            worldHeight: this.mapx.height,
            events: this.sm.app.renderer.events
        })
        this.window.dirty = true
        this.window.clamp({
            direction: "all",
            underflow: "center"
        })
        this.addChild(this.window)

        
        this.map_layer = new Layer()
        this.map_layer.zIndex = 0
        this.map_layer.interactive = true
        this.window.addChild(this.map_layer)
        
        this.shape_layer = new Layer()
        this.shape_layer.zIndex = 1
        this.shape_layer.sortableChildren = true
        this.window.addChild(this.shape_layer)

        
        const c = await get_character(1)
        c.position.set(500, 500)
        
        this.shape_layer.addChild(c)

        this.window.follow(c)

        this.map_layer.on("rightclick", (event) => {
            const path = this.mapx.path_find(c.position._x, c.position._y, this.window.left + event.x, this.window.top + event.y)
            c.setNewTarget(path, true)
        })

    // this.ui_layer = new Layer()
    // this.window_layer = new Layer()
    }

    async start() {
        const player_position = {x: 500, y: 500}

        this.updateWindow()
        this.sm.app.ticker.add(() => {
            this.updateWindow()
        })
    }

    updateWindow() {
        const  { start_col, end_col, start_row, end_row } = this.getWindow(500, 500)
        for (let i = start_row; i <= end_row; i++) {
            for (let j = start_col; j <= end_col; j++) {
                const block_index = i * this.mapx.col_num + j
                const block = this.mapx.blocks[block_index]
                if (!block.requested) {
                    this.mapx.getJpeg(block_index)
                } else if (block.loaded) {
                    continue
                } else if (block.texture) {
                    const block_sprite = new Sprite(block.texture)
                    block_sprite.position.x = j * 320
                    block_sprite.position.y = i * 240
                    block_sprite.zOrder = 0
                    block_sprite.zIndex = 0
                    this.map_layer.addChild(block_sprite)
                    block.texture = null
                    block.loaded = true
                }

                for (let k = 0; k < block.ownMasks.length; k++) {
                    const maskIndex = block.ownMasks[k]
                    const mask = this.mapx.masks[maskIndex]
                    if (!mask.requested) {
                        this.mapx.getMask(maskIndex)
                    } else if (mask.loaded) {
                        continue
                    } else if (mask.texture) {
                        const mask_sprite = new Sprite(mask.texture)
                        mask_sprite.position.x = mask.x
                        mask_sprite.position.y = mask.y
                        mask_sprite.zOrder = mask.y + mask.height
                        mask_sprite.zIndex = mask.y + mask.height
                        mask_sprite.blendMode = BLEND_MODES.MULTIPLY
                        
                        mask_sprite.eventMode = "none"
                        
                        this.shape_layer.addChild(mask_sprite)
                        mask.texture = null
                        mask.loaded = true
                    }
                }
            }
        }
    }

    getWindow(x: number, y: number) {
        const innerWidth = window.innerWidth
        const innerHeight = window.innerHeight

        const halfWidth = Math.floor(innerWidth / 2)
        const halfHeight = Math.floor(innerHeight / 2)

        const left = Math.min(Math.max(x - halfWidth, 0), this.mapx.width - innerWidth)
        const top = Math.min(Math.max(y - halfHeight, 0), this.mapx.height - halfHeight)

        const start_col = Math.max(Math.floor(left / 320), 0)
        const window_cols = Math.ceil(innerWidth / 320)
        const end_col = Math.min(start_col + window_cols, this.mapx.col_num)

        const start_row = Math.max(Math.floor(top / 240), 0)
        const window_rows = Math.ceil(innerHeight / 240)
        const end_row = Math.min(start_row + window_rows, this.mapx.row_num)

        return { left, top, start_col, end_col, start_row, end_row }
    }

}