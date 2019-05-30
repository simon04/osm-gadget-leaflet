import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';

export default {
  input: 'src/index.js',
  output: {
    file: 'build/bundle.js',
    format: 'iife',
    sourcemap: true
  },
  plugins: [resolve(), commonjs(), uglify()]
};
