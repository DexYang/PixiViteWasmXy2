import { defineConfig } from "vite"
import path from "node:path"
import Vue from "@vitejs/plugin-vue"
import { compilerOptions, transformAssetUrls } from "vue3-pixi"

export default defineConfig({
    build: {
        target: "esnext",
    },
    resolve: {
        alias: {
            "~/": `${path.resolve(__dirname, "src")}/`
        }
    },
    server: {
        port: 3000,
        host: true,
    },
    preview: {
        host: true,
        port: 8080,
    },
    plugins: [
        Vue({
            template: {
                compilerOptions,
                transformAssetUrls,
            },
        }),
    ],
})
