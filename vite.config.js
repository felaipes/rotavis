import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Custom plugin to rewrite /admin requests to the admin/index.html in dev server
const mpaPlugin = () => {
  return {
    name: 'mpa-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/admin') && !req.url.includes('.')) {
          req.url = '/admin/index.html';
        }
        next();
      });
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mpaPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
})
