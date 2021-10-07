import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import { terser } from "rollup-plugin-terser";

const extensions = [
    '.js', '.jsx', '.ts', '.tsx',
];

export default {
    input: './src/Main.ts',

    // Specify here external modules which you don't want to include in your bundle (for instance: 'lodash', 'moment' etc.)
    // external: [],

    plugins: [
        // Allows node_modules resolution
        resolve({ extensions }),

        // Allow bundling cjs modules. Rollup doesn't understand cjs
        commonjs(),

        // Compile TypeScript/JavaScript files
        babel({
            extensions,
            babelHelpers: 'bundled',
            include: ['src/**/*'],
        }),

        //terser()

        copy({
            targets: [
                { src: 'web/*', dest: 'dist/' },
            ]
        }),
    ],

    output: [
        {
            file: "dist/js/three-gpu-skinning.js",
            sourcemap: true,
            format: 'esm'
        }
    ],
};
