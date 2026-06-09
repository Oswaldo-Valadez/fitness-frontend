import { defineConfig } from 'orval'

export default defineConfig({
  fitnessApi: {
    input: {
      target: 'http://localhost:8000/docs?api-docs.json',
    },
    output: {
      target: './src/api/generated/fitness-api.ts',
      schemas: './src/api/generated/model',
      client: 'axios',
      clean: true,
    },
  },
})

