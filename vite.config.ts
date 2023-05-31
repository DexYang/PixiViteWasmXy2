import { defineConfig } from "vite"
import path from "node:path"

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
})
