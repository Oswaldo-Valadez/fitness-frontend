import { defineConfig } from 'orval'

export default defineConfig({
  fitnessApi: {
    input: {
      target: './openapi/api-docs.json',
    },
    output: {
      client: 'axios',
      mode: 'tags-split',
      workspace: './src/api/generated',
      target: 'index.ts',
      schemas: 'model',
      clean: true,
      override: {
        mutator: {
          path: '../mutator.ts',
          name: 'customInstance',
        },
      },
    },
  },
})
