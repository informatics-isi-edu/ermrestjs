import { resolve } from 'path';
import { defineConfig } from 'vite';

// if NODE_DEV defined properly, uset it. otherwise set it to production.
const nodeDevs = ['production', 'development'];
let mode = process.env.NODE_ENV;
if (!mode || nodeDevs.indexOf(mode) === -1) {
  mode = nodeDevs[0];
}

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  build: {
    minify: 'terser',
    reportCompressedSize: true,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'ermrest',
    },
    rollupOptions: {
      output: [
        // some static sites use this version:
        {
          name: 'ERMrest',
          format: 'umd',
          entryFileNames: 'ermrest.js',
          inlineDynamicImports: true,
        },
        // the following is the main build that chaise uses:
        {
          name: 'ERMrest',
          format: 'umd',
          entryFileNames: 'ermrest.min.js',
          inlineDynamicImports: true,
        },
      ],
    },
    commonjsOptions: {
      include: [/vendor/, /node_modules/],
    },
    terserOptions: {
      // this will make sure the exposed modules are using their original names
      // chaise for example uses error class types to display the error messages.
      mangle: false,
    },
  },
  resolve: {
    alias: {
      '@isrd-isi-edu/ermrestjs': resolve(__dirname),
    },
  },
});
