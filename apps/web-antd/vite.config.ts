import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            // rewrite: (path) => path.replace(/^\/api/, ''),
            // 代理到后端 FastAPI 服务
            target: 'http://localhost:8000',
            ws: true,
          },
        },
      },
    },
  };
});
