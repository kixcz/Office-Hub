import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import {
    defineConfig
} from 'vite';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('html2pdf')) {
                            return 'vendor-pdf';
                        }
                        if (id.includes('lucide-react')) {
                            return 'vendor-icons';
                        }
                        if (id.includes('@radix-ui') || id.includes('@headlessui')) {
                            return 'vendor-ui';
                        }
                    }
                },
            },
        },
    },
});
