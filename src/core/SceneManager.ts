import { Application } from "pixi.js"
import { Layer, Stage } from "@pixi/layers"
import Scene from "./Scene"
import { Debug } from "../utils/debug"
import AssetLoader from "./AssetLoader"
import { Cursor, getCursor } from "./Cursor"
import { ResourceLoader } from "./ResourceLoader"

if (import.meta.env.DEV) Debug.init()

export interface SceneUtils {
  assetLoader: AssetLoader;
}

export default class SceneManager {
    private static instance: SceneManager

    private sceneConstructors = this.importScenes()

    private cursor: Cursor

    app: Application
    sceneInstances = new Map<string, Scene>()
    currentScene?: Scene

    constructor() {
        this.app = new Application({
            view: document.querySelector("#app") as HTMLCanvasElement,
            autoDensity: true,
            resizeTo: window,
            powerPreference: "high-performance",
            backgroundColor: 0x23272a,
            antialias: true,
            resolution: 1
        })

        this.app.stage = new Stage()
        this.app.stage.sortableChildren = true
        this.app.stage.eventMode = "auto"
        this.app.stage.hitArea = this.app.screen

        window.addEventListener("resize", (ev: UIEvent) => {
            const target = ev.target as Window

            this.currentScene?.onResize?.(target.innerWidth, target.innerHeight)
        })
    }

    importScenes() {
        const sceneModules = import.meta.glob("/src/scenes/*.ts", {
            eager: true,
        }) as Record<string, { default: ConstructorType<typeof Scene> }>

        return Object.entries(sceneModules).reduce((acc, [path, module]) => {
            const fileName = path.split("/").pop()?.split(".")[0]

            if (!fileName) throw new Error("Error while parsing filename")

            acc[fileName] = module.default

            return acc
        }, {} as Record<string, ConstructorType<typeof Scene>>)
    }

    async switchScene(sceneName: string, deletePrevious = true): Promise<Scene> {
        await this.removeScene(deletePrevious)
        await this.loadCursor()

        this.currentScene = this.sceneInstances.get(sceneName)

        if (!this.currentScene) this.currentScene = await this.initScene(sceneName)

        if (!this.currentScene)
            throw new Error(`Failed to initialize scene: ${sceneName}`)

        this.currentScene.zIndex = 0
        this.app.stage.addChild(this.currentScene)

        if (this.currentScene.start) await this.currentScene.start()

        return this.currentScene
    }

    private async removeScene(destroyScene: boolean) {
        if (!this.currentScene) return

        if (destroyScene) {
            this.sceneInstances.delete(this.currentScene.name)

            this.currentScene.destroy({ children: true })
        } else {
            this.app.stage.removeChild(this.currentScene)
        }

        if (this.currentScene.unload) await this.currentScene.unload()

        this.currentScene = undefined
    }

    private async initScene(sceneName: string) {
        const sceneUtils = {
            assetLoader: new AssetLoader(),
        }

        const scene = new this.sceneConstructors[sceneName](sceneUtils)

        this.sceneInstances.set(sceneName, scene)

        if (scene.load) await scene.load()

        return scene
    }

    async loadCursor() {
        if (!ResourceLoader.getInstance().loaded) {
            Debug.log("直读资源未加载")
        } else {
            this.app.stage.removeChild(this.cursor)
            this.cursor = await getCursor()
            this.cursor.zIndex = 999

            this.app.stage.addChild(this.cursor)
            Debug.log("鼠标已加载", this.cursor)
        }
    }

    public static getInstance() {
        if (!SceneManager.instance) {
            SceneManager.instance = new SceneManager()
        }
      
        return SceneManager.instance
    }
}
