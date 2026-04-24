import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // TODO: Replace 'blu-sky-pipeline' with your actual GitHub repo name
  base: '/blu-sky-pipeline/',
})
