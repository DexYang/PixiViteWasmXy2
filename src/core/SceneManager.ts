import { Application } from "pixi.js"
import { Layer, Stage } from "@pixi/layers"
import Scene from "./Scene"
import { Debug } from "../utils/debug"
import { Cursor, getCursor } from "./Cursor"
import { ResourceLoader } from "./ResourceLoader"
import { Cull } from "@pixi-essentials/cull"

if (import.meta.env.DEV) Debug.init()

const cull = new Cull()


export default class SceneManager {
    private static instance: SceneManager

    private sceneConstructors = this.importScenes()

    cursor: Cursor

    app: Application
    sceneInstances = new Map<string, Scene>()
    currentScene?: Scene

    scene_layer: Layer
    tip_layer: Layer
    cursor_layer: Layer

    constructor() {
        this.app = new Application({
            view: document.querySelector("#app") as HTMLCanvasElement,
            autoDensity: true,
            resizeTo: window,
            powerPreference: "default",
            backgroundColor: 0x23272a,
            antialias: true,
            resolution: 1
        })

        document.oncontextmenu  = document.body.oncontextmenu = function(event) {
            event.preventDefault()
        }

        this.app.renderer.on("prerender", () => {
            cull.cull(this.app.renderer.screen)
        })
        

        this.app.stage = new Stage()
        this.app.stage.sortableChildren = true
        this.app.stage.eventMode = "auto"
        this.app.stage.hitArea = this.app.screen

        

        this.tip_layer = new Layer()
        this.tip_layer.zIndex = 1
        this.app.stage.addChild(this.tip_layer)

        this.cursor_layer = new Layer()
        this.cursor_layer.zIndex = 999999
        this.cursor_layer.visible = true
        this.app.stage.addChild(this.cursor_layer)

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

    async switchScene(sceneName: string, map_id?: string, deletePrevious = true): Promise<Scene> {
        await this.removeScene(deletePrevious)
        await this.loadCursor()

        this.currentScene = this.sceneInstances.get(sceneName)

        if (!this.currentScene) this.currentScene = await this.initScene(sceneName, map_id)

        if (!this.currentScene)
            throw new Error(`Failed to initialize scene: ${sceneName}`)

        this.scene_layer = this.currentScene
        this.scene_layer.zIndex = 0
        this.app.stage.addChild(this.scene_layer)

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

    private async initScene(sceneName: string, map_id?: string) {
        const scene = new this.sceneConstructors[sceneName]()

        this.sceneInstances.set(sceneName, scene)

        if (scene.load) await scene.load(map_id)

        return scene
    }

    async loadCursor() {
        if (!ResourceLoader.getInstance().loaded) {
            Debug.log("直读资源未加载")
        } else {
            this.cursor_layer.removeChild(this.cursor)
            this.cursor = await getCursor()
            this.cursor.zIndex = 999
            this.cursor_layer.addChild(this.cursor)
        }
        return true
    }

    public static getInstance() {
        if (!SceneManager.instance) {
            SceneManager.instance = new SceneManager()
        }
      
        return SceneManager.instance
    }
}
