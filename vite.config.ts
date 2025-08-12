import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // ✅ 정적 배포 경로 깨짐 방지
  server: { port: 5173, host: true }
})
