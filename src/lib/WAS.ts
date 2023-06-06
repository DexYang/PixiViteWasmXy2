

const decoder = new TextDecoder("utf-8")


export class WAS {
  flag: string
  head_size: number
  
  direction_num: number
  frame_num: number

  pic_num: number

  width: number
  height: number

  x: number
  y: number

  pal: ArrayBuffer
  pic_offsets: Array<number>
  frames: Array<Array<unknown>>
  seq: Array<number>

  constructor(buf: ArrayBuffer) {
    this.flag = this.readBufToStr(buf, 0, 2)
    this.head_size = this.readBufToU16(buf, 2)

    this.direction_num = this.readBufToU16(buf, 4)
    this.frame_num = this.readBufToU16(buf, 6)
    this.pic_num = this.direction_num * this.frame_num

    this.width = this.readBufToU16(buf, 8)
    this.height = this.readBufToU16(buf, 10)
    this.x = this.readBufToU16(buf, 12)
    this.y = this.readBufToU16(buf, 14)

    let offset = 16
    if (this.head_size > 12) 
      for (let i = 0; i < this.head_size - 12; i++) 
        this.seq.push(this.readBufToU8(buf, offset + i))
    offset += this.head_size - 12

    this.pal = buf.slice(offset, offset + 512)
    offset += 512
    this.pal = this.convertPal()

    this.pic_offsets = []
    for (let i = 0; i < this.pic_num; i++) {
      this.pic_offsets.push(this.readBufToU32(buf, offset + i * 4) + 4 + this.head_size)
    }

    this.frames = []
    for (let i = 0; i < this.direction_num; i++) {
      this.frames.push([])
      for (let j = 0; j < this.frame_num; j++) {
        const index = i * this.frame_num + j
        const frame_offset = this.pic_offsets[index]
        
      }
    }   
  }

  convertPal() {
    const uint8Array = new Uint8Array(this.pal)
    const inBuffer = Module._malloc(uint8Array.length)
    Module.HEAPU8.set(uint8Array, inBuffer)
    const outSize = 256 * 3
    const outBuffer = Module._malloc(outSize)

    Module.ccall("read_color_pal", 
      null,
      [Number, Number],
      [inBuffer, outBuffer])

    const res = Module.HEAPU8.slice(outBuffer, outBuffer + outSize)

    Module._free(inBuffer)
    Module._free(outBuffer)

    return res
  }

  readBufToStr(buf: ArrayBuffer, start: number, end: number): string {
    return decoder.decode(buf.slice(start, end))
  }

  readBufToU32(buf: ArrayBuffer, offset: number): number {
    return new Uint32Array(buf.slice(offset, offset + 4))[0]
  }

  readBufToU16(buf: ArrayBuffer, offset: number): number {
    return new Uint16Array(buf.slice(offset, offset + 2))[0]
  }

  readBufToU8(buf: ArrayBuffer, offset: number): number {
    return new Uint8Array(buf.slice(offset, offset + 1))[0]
  }
}