import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: 'out/main',
            lib: {
                entry: path.resolve(__dirname, 'app/main/index.ts')
            }
        },
        resolve: {
            alias: {
                '@core': path.resolve(__dirname, 'app/core'),
                '@database': path.resolve(__dirname, 'app/database')
            }
        }
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: 'out/preload',
            lib: {
                entry: path.resolve(__dirname, 'app/main/preload.ts')
            }
        },
        resolve: {
            alias: {
                '@core': path.resolve(__dirname, 'app/core')
            }
        }
    },
    renderer: {
        root: path.resolve(__dirname, 'app/renderer'),
        build: {
            outDir: path.resolve(__dirname, 'out/renderer'),
            rollupOptions: {
                input: path.resolve(__dirname, 'app/renderer/index.html')
            }
        },
        resolve: {
            alias: {
                '@renderer': path.resolve(__dirname, 'app/renderer'),
                '@core': path.resolve(__dirname, 'app/core')
            }
        },
        plugins: [tailwindcss(), react()]
    }
});
