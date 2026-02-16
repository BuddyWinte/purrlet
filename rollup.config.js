const resolve = require('@rollup/plugin-node-resolve').default;
const terser = require('@rollup/plugin-terser');

module.exports = [
  {
    input: 'src/purrlet.js',
    output: [
      {
        file: 'dist/purrlet.min.js',
        format: 'umd',
        name: 'Purrlet',
        sourcemap: true,
        plugins: [terser({ format: { comments: /^!/ } })],
      },
      {
        file: 'dist/purrlet.mjs',
        format: 'es',
        sourcemap: true,
      },
    ],
    plugins: [resolve()],
  },
  {
    input: 'src/integrations/react.js',
    output: {
      file: 'dist/react.mjs',
      format: 'es',
      sourcemap: true,
    },
    external: ['react'],
    plugins: [resolve()],
  },
  {
    input: 'src/integrations/vue.js',
    output: {
      file: 'dist/vue.mjs',
      format: 'es',
      sourcemap: true,
    },
    external: ['vue'],
    plugins: [resolve()],
  },
  {
    input: 'src/integrations/astro.js',
    output: {
      file: 'dist/astro.mjs',
      format: 'es',
      sourcemap: true,
    },
    plugins: [resolve()],
  },
];
