import { WDF } from "~/lib/WDF"


export class WDFManager {
  private static instance: WDFManager
  
  map: Map<string, WDF>
  
    
  constructor() {
    this.map = new Map()
  }

  get(wdf: string, path_or_hash: string | number) {
    let wdf_instance
    if (!this.map.has(wdf)) {
      wdf_instance = new WDF(wdf)
      this.map.set(wdf, wdf_instance)
    } else {
      wdf_instance = this.map.get(wdf)
    }

    let hash
    if (typeof path_or_hash === "string") {
      if (path_or_hash.startsWith("0x")) {
        hash= Number.parseInt("0x12", 16)
      } else {
        const strBuffer = new TextEncoder().encode(path_or_hash)
        const strPointer = Module._malloc(strBuffer.length + 1)
        Module.HEAP8.set(strBuffer, strPointer)
        Module.HEAP8[strPointer + strBuffer.length] = 0 // 以 0 结尾
        hash = Module._get_hash(strPointer)
        Module._free(strPointer)
      }
    } else {
      hash = path_or_hash
    }

    const item = wdf_instance?.get(hash)

  }
  
      
  public static getInstance() {
    if (!WDFManager.instance) {
      WDFManager.instance = new WDFManager()
    }
      
    return WDFManager.instance
  }
}