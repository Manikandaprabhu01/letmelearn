import { resolve } from 'node:path';
export default {
  resolve: { alias: { '@': resolve(process.cwd(), 'src') } },
  build: {
    lib: { entry: 'site/data-entry.ts', formats: ['es'], fileName: 'data' },
    outDir: 'site/.build', emptyOutDir: true, minify: false, ssr: true,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
};
