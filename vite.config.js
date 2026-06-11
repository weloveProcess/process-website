import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 멀티페이지: 루트(/) = 마케팅 홈, /studio/ = React 스튜디오, /guide/ = 사용법 가이드.
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        studio: 'studio/index.html',
        guide: 'guide/index.html',
      },
    },
  },
})
