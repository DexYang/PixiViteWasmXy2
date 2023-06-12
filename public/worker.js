/* eslint-disable no-undef */
importScripts("/public/wasmxy2.js")

onmessage = function (event) {
  const method = event.data.method
  if (method === "getMapx") {
    const data = decodeJpeg(event.data.data, "read_map_x")
    this.postMessage({ data: data, id: event.data.id, blockIndex: event.data.blockIndex})
  } else if (method === "getJpeg") {
    const data = decodeJpeg(event.data.data, "read_map_1")
    this.postMessage({ data: data, id: event.data.id, blockIndex: event.data.blockIndex})
  }
}

function decodeJpeg(data, method) {
  // const start1 = performance.now()

  const inBuffer = Module._malloc(data.byteLength)
  Module.HEAPU8.set(data, inBuffer)
  const outSize = 320 * 240 * 3
  const outBuffer = Module._malloc(outSize)

  Module.ccall(method, 
    Boolean,
    [Number, Number, Number],
    [inBuffer, data.length, outBuffer])

  ret = Module.HEAPU8.slice(outBuffer, outBuffer + outSize)

  Module._free(inBuffer)
  Module._free(outBuffer)
  // const end1 = performance.now()
  // console.log("decodeJpeg cost is", `${end1 - start1}ms`)
  return ret
}
