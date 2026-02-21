import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { grpcProxyPlugin } from './vite-grpc-proxy'

export default defineConfig({
  plugins: [react(), grpcProxyPlugin()],
  server: {
    port: 3000,
    open: true,
  },
})
