const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const dts = require('rollup-plugin-dts').default;
const { readFileSync } = require('fs');

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const banner = `/**
 * @esengine/ai v${pkg.version}
 * 高性能TypeScript AI系统库 - 行为树、实用AI和有限状态机
 * 
 * @author ${pkg.author}
 * @license ${pkg.license}
 */`;

const external = ['@esengine/ecs-framework'];

const commonPlugins = [
  resolve({
    browser: true,
    preferBuiltins: false
  }),
  commonjs({
    include: /node_modules/
  })
];

module.exports = [
  // ES模块构建
  {
    input: 'bin/index.js',
    output: {
      file: 'dist/index.js',
      format: 'es',
      banner,
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      ...commonPlugins,
      terser({
        format: {
          comments: /^!/
        }
      })
    ],
    external,
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false
    }
  },
  
  // UMD构建（可选）
  {
    input: 'bin/index.js',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'BehaviourTreeAI',
      banner,
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      ...commonPlugins,
      terser({
        format: {
          comments: /^!/
        }
      })
    ],
    external,
    treeshake: {
      moduleSideEffects: false
    }
  },
  
  // 类型定义构建
  {
    input: 'bin/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
      banner: `/**
 * @esengine/ai v${pkg.version}
 * TypeScript definitions
 */`
    },
    plugins: [
      dts({
        respectExternal: true
      })
    ],
    external: []
  }
]; 