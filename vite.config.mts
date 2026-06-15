import { resolve } from 'path';
import { defineConfig, UserConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';
// import dts from 'vite-plugin-dts';

// if NODE_DEV defined properly, uset it. otherwise set it to production.
const nodeDevs = ['production', 'development'];
let mode = process.env.NODE_ENV;
if (!mode || nodeDevs.indexOf(mode) === -1) {
  mode = nodeDevs[0];
}
const isDev = mode === 'development';

export default defineConfig(async (): Promise<UserConfig> => {
  const plugins = [
    /**
     * generate the *.js.gz files so server can directly serve them
     */
    compression({
      algorithms: ['gzip'],
    }),
  ];

  // dev related plugins
  if (isDev) {
    // visualize the bundle size
    const { visualizer } = await import(/* @vite-ignore */ 'rollup-plugin-visualizer');
    plugins.push(
      visualizer({
        filename: resolve(__dirname, 'dist', 'stats.html'),
      }),
    );
  }

  return {
    // vite config
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      minify: isDev ? false : 'terser',
      reportCompressedSize: false,
      sourcemap: isDev,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        fileName: 'ermrest',
      },
      rollupOptions: {
        /**
         * suppress warnings on `js` folder.
         */
        onwarn(warning, warn) {
          if (warning.id && warning.id.includes('/js/')) {
            return;
          }
          warn(warning);
        },
        output: [
          // nodejs (test cases) and some static sites use this:
          {
            name: 'ERMrest',
            format: 'umd',
            entryFileNames: 'ermrest.js',
          },
          // the following is the main build that chaise uses:
          {
            name: 'ERMrest',
            format: 'umd',
            entryFileNames: 'ermrest.min.js',
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
        /**
         * markdown-it imports the deprecated Node `punycode` builtin. In a browser
         * build that gets externalized to a stub and logs a warning. markdown-it only
         * calls it inside try/catch for hostname normalization, so an empty shim is
         * safe (ASCII URLs unaffected) and silences the warning.
         */
        punycode: resolve(__dirname, 'vendor/punycode-shim.js'),
      },
    },
    plugins,
  };
});
