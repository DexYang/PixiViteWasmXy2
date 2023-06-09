import { directoryOpen } from "browser-fs-access"


export class ResourceLoader {
  private static instance: ResourceLoader

  resources: Map<string, FileSystemFileHandle>

  loaded = false

  exploreFiles = ["scene", "newscene", "font"]

  private constructor() {
    this.resources = new Map<string, FileSystemFileHandle>()
  }
  
  public static getInstance() {
    if (!ResourceLoader.instance) {
      ResourceLoader.instance = new ResourceLoader()
    }
  
    return ResourceLoader.instance
  }
  
  async load() {
    const blobsInDirectory = await directoryOpen({
      recursive: true,
      skipDirectory: (entry) => {
        return (this.exploreFiles.indexOf(entry.name) === -1)
      }
    })
    blobsInDirectory.forEach(item => {
      if (item instanceof File && item.directoryHandle && item.handle) {
        if (this.exploreFiles.indexOf(item.directoryHandle.name) !== -1)
          this.resources.set(`${item.directoryHandle.name}/${item.handle.name}`, item.handle)
        else
          this.resources.set(`${item.handle.name}`, item.handle)
      }
    })
    this.loaded = true
  }

  isLoaded() { return this.loaded }

  getResource() { return this.resources }
}