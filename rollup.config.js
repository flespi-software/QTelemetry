import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import babel from '@rollup/plugin-babel'

let plugins = [
  resolve(),
  commonjs(),
  babel({
    exclude: 'node_modules/**',
    babelHelpers: 'runtime',
    extensions: ['.js', '.vue']
  }),
  terser()
]

export default [
  {
    input: './src/store/telemetryVuexModule.js',
    output: [
      {
        file: './lib/telemetryVuexModule.js',
        format: 'umd',
        name: 'telemetryVuexModule',
        exports: 'named',
        sourcemap: true
      }
    ],
    plugins: plugins
  }
]
