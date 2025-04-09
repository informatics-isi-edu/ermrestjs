import { resolve } from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    minify: true,
    reportCompressedSize: true,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'ermrest',
    },
    rollupOptions: {
      output: [
        {
          name: 'ERMrest',
          format: 'umd',
          entryFileNames: 'ermrest.js',
          inlineDynamicImports: true,
        },
        // {
        //   name: 'ERMrest',
        //   format: 'cjs',
        //   entryFileNames: 'ermrest.cjs',
        // },
      ],
    },
    commonjsOptions: {
      include: [/vendor/, /node_modules/],
    },
  },
  resolve: {
    alias: {
      '@isrd-isi-edu/ermrestjs': resolve(__dirname),
    },
  },
});
