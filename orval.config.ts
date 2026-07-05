import { defineConfig } from 'orval'

export default defineConfig({
  fitnessApi: {
    input: {
      target: '../fitness-backend/storage/api-docs/api-docs.json',
    },
    output: {
      client: 'axios',
      mode: 'tags-split',
      workspace: './src/api/generated',
      target: 'index.ts',
      schemas: 'model',
      clean: true,
    },
  },
})
