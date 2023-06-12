import { ResourceLoader } from "~/core/ResourceLoader"
import { Debug } from "../utils/debug"
import { Texture, FORMATS } from "pixi.js"
import { WorkerManager } from "./WorkerManager"

const decoder = new TextDecoder("utf-8")


class Block {
  ownMasks: Array<number>
  offset: number
  jpegOffset: number
  jpegSize: number
  texture: Texture | null
  requested = false
  loaded = false

  constructor() {
    this.ownMasks = []
    this.offset = 0
    this.jpegOffset = 0
    this.jpegSize = 0
  }
}

class Mask {
  offset: number
  x: number
  y: number
  width: number
  height: number
  size: number

  constructor() {
    this.offset = 0
    this.x = 0
    this.y = 0
    this.width = 0
    this.height = 0
    this.size = 0
  }
}

export class MapX {
  id: string
  res: ResourceLoader | null
  wm: WorkerManager | null
  path: string | null
  handle: FileSystemFileHandle | undefined
  buf: ArrayBuffer
  offset: number

  flag: string
  width: number
  height: number

  block_width = 320
  block_height = 240

  row_num: number
  col_num: number
  block_num: number

  cell_row_num: number
  cell_col_num: number

  blocks: Array<Block>
  masks: Array<Mask>
  jpeg_head: ArrayBuffer
  
  constructor(path: string) {
    this.id = Math.random().toString()
    this.res = ResourceLoader.getInstance()
    this.wm = WorkerManager.getInstance()
    this.wm.register(this)
    this.path = path
    this.handle = this.res.getResource().get(this.path)
    this.offset = 0
    this.blocks = []
    this.masks = []
  }

  destroy() {
    this.res = null
    this.path = null
    this.handle = undefined
    this.offset = 0
    this.blocks = []
    this.masks = []
    if (this.wm)
      this.wm.remove(this)
    this.wm = null
  }

  receive(event) {
    if (event.data.id && this.id === event.data.id) {
      this.blocks[event.data.blockIndex].texture = Texture.fromBuffer(event.data.data, 320, 240, { format: FORMATS.RGB})
    }
  }

  async setup() {
    if (this.handle) {
      const file = await this.handle.getFile()
      this.buf = await file.arrayBuffer()
      // let map_head_buf: ArrayBuffer | null = await this.file.slice(0, 12).arrayBuffer()
      
      this.flag = this.readBufToStr(0, 4)
      
      if (this.flag !== "XPAM" && this.flag !== "0.1M") {
        Debug.warn("Incorrect Map Format: " + this.path)
        return
      }
      this.width = this.readBufToU32(4)
      this.height = this.readBufToU32(8)

      this.row_num = Math.ceil(this.height / this.block_height)
      this.col_num = Math.ceil(this.width / this.block_width)
      this.block_num = this.row_num * this.col_num

      this.cell_row_num = this.height / 20
      this.cell_row_num = this.cell_row_num % 12 === 0 ? this.cell_row_num : this.cell_row_num + 12 - this.cell_row_num % 12
      this.cell_col_num = this.width / 20
      this.cell_col_num = this.cell_col_num % 16 === 0 ? this.cell_col_num : this.cell_col_num + 16 - this.cell_col_num % 16
      
      for (let i = 0; i < this.block_num; i++) {
        const block = new Block()
        block.offset = this.readBufToU32(12 + i * 4)
        this.blocks.push(block)
      }
      
      let offset = 12 + this.block_num * 4 + 4  // 最后加4是  跳过无用的4字节 旧地图为MapSize  新地图为MASK Flag

      if (this.flag === "0.1M") {
        Debug.log("Load M1.0 " + this.path)
        const mask_num = this.readBufToU32(offset)
        offset += 4
        for (let i = 0; i < mask_num; i++) {
          const mask = new Mask()
          mask.offset = this.readBufToU32(offset + i * 4)
          mask.x = this.readBufToU32(mask.offset + 0)
          mask.y = this.readBufToU32(mask.offset + 4)
          mask.width = this.readBufToU32(mask.offset + 8)
          mask.height = this.readBufToU32(mask.offset + 12)
          mask.size = this.readBufToU32(mask.offset + 16)
          const mask_row_start = Math.max(Math.ceil(mask.y / this.block_height), 0)
          const mask_row_end = Math.min(Math.ceil((mask.y + mask.height) / this.block_height), this.row_num - 1)
          const mask_col_start = Math.max(Math.ceil(mask.x / this.block_width), 0)
          const mask_col_end = Math.min(Math.ceil((mask.x + mask.width) / this.block_width), this.col_num - 1)
          for (let x = mask_row_start; x <= mask_row_end; x++) {
            for (let y = mask_col_start; y <= mask_col_end; y++) {
              const index = x * this.col_num + y
              if (index >= 0 && index < this.block_num)
                this.blocks[index].ownMasks.push(i)
            }
          }
          this.masks.push(mask)
        }
        offset += mask_num * 4
      } else if (this.flag === "XPAM") {
        Debug.log("Load XPAM " + this.path)
        const flag = this.readBufToStr(offset, offset + 4)
        const size = this.readBufToU32(offset + 4)
        offset += 8
        if (flag === "HGPJ") {
          this.jpeg_head = this.buf.slice(offset, offset + size)
        }
      }
    }
    this.travel()
  }

  travel() {
    for(let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i]
      let offset = block.offset
      const eat_num = this.readBufToU32(offset)
      offset += 4
      if (this.flag === "0.1M" )
        offset += eat_num * 4
      let loop = true
      while (loop) {
        const flag = this.readBufToStr(offset, offset + 4)
        const size = this.readBufToU32(offset + 4)
        offset += 8

        if (flag === "GEPJ" || flag === "2GPJ") {
          block.jpegOffset = offset
          block.jpegSize = size
          offset += size
        } else if (flag === "KSAM" || flag === "2SAM") {
          // this.read_old_mask(offset, size, i)
          offset += size
        } else if (flag === "LLEC") {
          // this.read_cell()
          offset += size
        } else if (flag === "GIRB" || flag === "BLOK" || flag === "KOLB") {
          offset += size
        } else {
          loop = false
        }
      }
    }
  }

  // read_old_mask(offset: number, size: number, block_index: number) {
  //   // const mask = new Mask()
  // }

  getJpeg(i: number) {
    const block = this.blocks[i]
    let jpeg 
    jpeg = this.buf.slice(block.jpegOffset, block.jpegOffset + block.jpegSize)
    let ret
    if (this.flag === "XPAM") {
      const size = this.jpeg_head.byteLength + block.jpegSize
      const uint8Array = new Uint8Array(size)
      uint8Array.set(new Uint8Array(this.jpeg_head))
      uint8Array.set(new Uint8Array(jpeg), this.jpeg_head.byteLength)
      // uint8Array.byteLength
      this.wm?.post({
        method: "getMapx",
        data: uint8Array,
        blockIndex: i,
        id: this.id
      })

      // const inBuffer = Module._malloc(size)
      // Module.HEAP8.set(uint8Array, inBuffer)
      // const outSize = 320 * 240 * 3
      // const outBuffer = Module._malloc(outSize)

      // Module.ccall("read_map_x", 
      //   Boolean,
      //   [Number, Number, Number],
      //   [inBuffer, size, outBuffer])

      // ret = Module.HEAPU8.subarray(outBuffer, outBuffer + outSize)
      
      // Module._free(inBuffer)
      // Module._free(outBuffer)
    } else if (this.flag === "0.1M") {
      const uint8Array = new Uint8Array(jpeg)

      this.wm?.post({
        method: "getJpeg",
        data: uint8Array,
        blockIndex: i,
        id: this.id
      })
      // const start1 = performance.now()
      
      // const inBuffer = Module._malloc(uint8Array.length)
      // Module.HEAP8.set(uint8Array, inBuffer)
      // const outSize = 320 * 240 * 3
      // const outBuffer = Module._malloc(outSize)

      // Module.ccall("read_map_1", 
      //   Boolean,
      //   [Number, Number, Number],
      //   [inBuffer, uint8Array.length, outBuffer])

      // ret = Module.HEAPU8.subarray(outBuffer, outBuffer + outSize)
      // Module._free(inBuffer)
      // Module._free(outBuffer)
      // const end1 = performance.now()
      // console.log("readU32 cost is", `${end1 - start1}ms`)
    }
    jpeg = null
    block.requested = true
    return ret
  }

  readBufToStr(start: number, end: number): string {
    return decoder.decode(this.buf.slice(start, end))
  }

  readBufToU32(offset: number): number {
    return new Uint32Array(this.buf.slice(offset, offset + 4))[0]
  }

  readBufToU16(offset: number): number {
    return new Uint16Array(this.buf.slice(offset, offset + 2))[0]
  }

  async readText(file: File, start: number, end: number): Promise<string> {
    const res = await file.slice(start, end).text()
    return res
  }

  async readU32(file: File, offset: number): Promise<number> {
    // const start1 = performance.now()
    const buf = await file.slice(offset, offset + 4).arrayBuffer()
    const number = new Uint32Array(buf)[0]
    // const end1 = performance.now()
    // console.log("readU32 cost is", `${end1 - start1}ms`)
    return number
  }

  async readU16(file: File, offset: number): Promise<number> {
    const buf = await file.slice(offset, offset + 2).arrayBuffer()
    const number = new Uint16Array(buf)[0]
    return number
  }
}

export async function getMapX(path: string): Promise<MapX> {
  const map_x = new MapX(path)
  await map_x.setup()
  return map_x
}