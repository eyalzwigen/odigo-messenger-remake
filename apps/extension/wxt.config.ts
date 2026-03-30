import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
    modules: ['@wxt-dev/module-react'],
    vite: () => ({
        plugins: [tailwindcss()],
        server: {
            port: 3001  // ← different port from Next.js
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, '.'),
            }
        }
    }),
    manifest: {
        action: {},
        host_permissions: ['https://*/*'],
        permissions: ['tabs', 'storage']
    }
});