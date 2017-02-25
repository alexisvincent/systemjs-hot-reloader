import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
// import uglify from 'rollup-plugin-uglify'

export default {
  entry: './lib/index.js',
  dest: './dist/index.js',
  moduleName: 'systemjs-hot-reloader',
  format: 'cjs',
  // sourceMap: 'inline',
  external: ['systemjs-hmr'],
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    commonjs({
      exclude: [ 'node_modules/systemjs-hmr/**']
    }),
    babel({
      exclude: 'node_modules/**'
    }),
    // (process.env.NODE_ENV === 'production' && uglify())
  ]
}