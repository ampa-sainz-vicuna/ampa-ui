import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // Los tests pasan de los 5 s por defecto cuando corren todos a la vez en
    // Docker sobre Windows. Igual que en las aplicaciones.
    testTimeout: 20_000,
    setupFiles: ['./src/test/setup.ts'],
  },
})
