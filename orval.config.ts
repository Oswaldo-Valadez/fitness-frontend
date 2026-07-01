import { defineConfig } from 'orval'

export default defineConfig({
  fitnessApi: {
    input: {
      target: '../fitness-backend/storage/api-docs/api-docs.json',
    },
    output: {
      target: './src/api/generated/fitness-api.ts',
      schemas: './src/api/generated/model',
      client: 'axios',
      clean: true,
    },
  },
})

