import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Permite abrir la vista previa a través de un túnel público (Cloudflare)
  preview: { allowedHosts: ['.trycloudflare.com'] },
})
