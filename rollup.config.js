import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';

let plugins = [
    resolve(),
    commonjs(),
    babel({
        exclude: 'node_modules/**',
        externalHelpers: false,
        runtimeHelpers: true
    }),
    uglify()
]

export default [
    {
        input: './src/telemetryVuexModule.js',
        output: [
            { file: './dist/telemetryVuexModule.js', format: 'cjs' }
        ],
        plugins: plugins
    }
];