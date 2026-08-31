import { defineConfig } from "tsdown"

export default defineConfig({
  format: {
    esm: {
      target: ["es2015"]
    },
    cjs: {
      target: ['node20']
    }
  },
  dts: true
})
