import Scene from "./Scene"
import { Layer } from "@pixi/layers"
import { Viewport } from "pixi-viewport"
import { ResourceLoader } from "./ResourceLoader"
import { Debug } from "~/utils/debug"
import { getMapX, MapX } from "~/lib/MapX"
import { Sprite } from "pixi.js"
import { Character, get_character } from "./Character"


export abstract class GameScene extends Scene {
    map_layer: Layer
    shape_layer: Layer
    ui_layer: Layer
    window_layer: Layer

    player: Character

    mapx: MapX

    window: Viewport
  
    onResize(): void {
        this.window.resize()
    }

    async load(map_id: string) {
        if (!ResourceLoader.getInstance().loaded) {
            Debug.log("直读资源未加载")
            return
        }
        this.mapx = await getMapX(map_id)

        this.window = new Viewport({
            worldWidth: this.mapx.width,
            worldHeight: this.mapx.height,
            events: this.scm.app.renderer.events
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
        this.shape_layer.alpha = 1
        this.shape_layer.useDoubleBuffer = true
        this.shape_layer.group.useRenderTexture
        this.shape_layer.zIndex = 1
        this.shape_layer.sortableChildren = true
        this.shape_layer.group.enableSort = true
        
        this.shape_layer.group.on("sort", (item) => {
            if (item instanceof Character) {
                // const text = item.getChildByName("test") as Text
                
                item.zIndex = item.y
                const block_index = Math.floor(item.y / 240) * this.mapx.col_num + Math.floor(item.x / 320)
                const ownMasks = this.mapx.blocks[block_index].ownMasks
                // if (text) 
                //     text.text = `${block_index}\n`+ownMasks.join(",")
                
                for (let i = 0; i < ownMasks.length; i++) {
                    const mask = this.mapx.masks[ownMasks[i]]
                    if (mask.calc_sort_z(item.x, item.y)) {
                        item.zIndex = Math.max(item.zIndex, mask.z + 1)
                        item.zOrder = item.zIndex
                    }
                }
            }else {
                item.zIndex = item.y
            }
        })
        this.window.addChild(this.shape_layer)

        
        const c = await get_character(1)
        c.position.set(1400, 1400)
        // const basicText = new Text("???")
        // basicText.name = "test"
        // basicText.x = 0
        // basicText.y = 0
        // c.addChild(basicText)
        this.player = c
        this.shape_layer.addChild(c)

        const d = await get_character(2)
        d.position.set(1550, 1550)
        this.shape_layer.addChild(d)

        this.window.follow(c)

        this.map_layer.on("rightclick", (event) => {
            const path = this.mapx.path_find(c.position._x, c.position._y, this.window.left + event.x, this.window.top + event.y)
            c.setNewTarget(path, true)
        })

    // this.ui_layer = new Layer()
    // this.window_layer = new Layer()
    }

    async start() {

        this.updateWindow()
        this.scm.app.ticker.add(() => {
            this.updateWindow()
        })
    }

    updateWindow() {
        const  { start_col, end_col, start_row, end_row } = this.getWindow()
        for (let i = start_row; i <= end_row; i++) {
            for (let j = start_col; j <= end_col; j++) {
                const block_index = i * this.mapx.col_num + j
                const block = this.mapx.blocks[block_index]
                if (!block.requested) {
                    // if (block.PNG) {
                    //     const png_data = this.mapx.buf.slice(block.jpegOffset, block.jpegOffset + block.jpegSize)
                    //     const png_blob = new Blob([png_data])
                    //     createImageBitmap(png_blob).then((png_bitmap: ImageBitmap) => {
                    //         block.texture = Texture.from(png_bitmap)
                    //         png_bitmap.close()
                    //     })
                    //     block.RGB = new Uint8Array(320*240*3)
                    //     block.decoded = true
                    // }
                    this.mapx.getJpeg(block_index)
                    // Texture.from
                    
                } else if (block.texture) {
                    // const graphics = new Graphics()
                    // graphics.lineStyle(10, 0x00FF00, 1)
                    // graphics.beginFill(0xFFFFFF)
                    // graphics.drawRect(j * 320, i * 240, 320, 240)
                    // graphics.endFill()
                    // this.map_layer.addChild(graphics)

                    // const basicText = new Text(`${j * 320}, ${i * 240}`)
                    // basicText.x = j * 320
                    // basicText.y = i * 240
                    
                    // const basicText1 = new Text(`${block_index}\n`+block.ownMasks.join(","), {
                    //     fill: 0xff1010
                    // })
                    // basicText1.x = j * 320 + 100
                    // basicText1.y = i * 240 + 100
                    // this.map_layer.addChild(basicText1)

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
                    } else if (mask.texture) {
                        // ****
                        // const start_col = Math.floor(mask.x / 320)
                        // const end_col = Math.floor((mask.x + mask.width) / 320) - ((mask.x + mask.width) % 320 === 0 ? 1 : 0)
                        // const start_row = Math.floor(mask.y / 240)
                        // const end_row = Math.floor((mask.y + mask.height) / 240) - ((mask.y + mask.height) % 240 === 0 ? 1 : 0)
        
                        // const cross_blocks: Array<number> = []
                        // for (let row = start_row; row <= end_row; row++) {
                        //     for (let col = start_col; col <= end_col; col++) {
                        //         cross_blocks.push(row * this.mapx.col_num + col)
                        //     }
                        // }
                        // ****
                        // const basicText = new Text(`${maskIndex} - ${ mask.x - start_col * 320 + mask.width} - ${(mask.x - start_col * 320 + mask.width) / 320} - ${(mask.x - start_col * 320 + mask.width) % 320 != 0 ? 1 : 0} + ${ (mask.x - start_col * 320 + mask.width) / 320 + ((mask.x - start_col * 320 + mask.width) % 320 != 0 ? 1 : 0)} : ${cross_blocks.join(",")}`)
                        // basicText.x = mask.x
                        // basicText.y = mask.y

                        
                        // const graphics = new Graphics()
                        // graphics.lineStyle(2, 0xFFBD01, 1)
                        // graphics.drawRect(0, 0, mask.width, mask.height)
                        // for (let ii = 0; ii < mask.sort_table.length; ii++) {
                        //     graphics.drawCircle(mask.x + ii * mask.sample_gap, mask.y + mask.sort_table[ii], 2)
                        // }
                        // graphics.endFill()

                        // graphics.eventMode = "none"
                        // mask_sprite.addChild(graphics)
                        // this.shape_layer.addChild(basicText)
                        const mask_sprite = new Sprite(mask.texture)
                        mask_sprite.position.x = mask.x
                        mask_sprite.position.y = mask.y
                        // mask_sprite.blendMode = 30
                        mask_sprite.zOrder = mask.z
                        mask_sprite.zIndex = mask.z
                        mask_sprite.eventMode = "none"
                        
                        this.shape_layer.addChild(mask_sprite)
                        mask.texture = null
                        mask.loaded = true
                    }
                }
            }
        }
    }

    getWindow() {
        const x = this.player.position.x
        const y = this.player.position.y
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