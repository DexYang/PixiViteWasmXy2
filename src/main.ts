import { appInjectKey, createApp } from "vue3-pixi"
import App from "~/ui/App.vue"
import SceneManager from "./core/SceneManager"

const sceneManager = SceneManager.getInstance()

await sceneManager.switchScene("Loading")

const app = createApp(App)

app.provide(appInjectKey, sceneManager.app)

app.mount(sceneManager.tip_layer)