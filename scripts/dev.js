const args = require('minimist')(process.argv.slice(2)) //  node script/dev.js  reactivity -f global
console.log(args)

const { build } = require('esbuild')
const { resolve } = require('path')


//  minist 用来解析命令行参数

const target = args._[0] || "reactivity" //打包路径
const format = args.f || "global" //  打包格式

//  获取打包配置
//  开发环境只打包某一个
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))


//输出格式
//  iife 立即执行函数  (function(){})()
//cjs node中模块  module.exports
//esm 浏览器中的esModule模块  import
const outputFormat = format.startsWith('global') ? 'iife' : format === 'cjs' ? 'cjs' : 'esm'

//  输出目录

const outfile = resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`)


build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)], //  打包入口点
  outfile,//  输出文件
  bundle: true,//  吧所有的包全部打包到一起
  sourcemap: true, // 映射
  format: outputFormat, //  输出的格式
  globalName: pkg.buildOptions?.name, //  打包的全局的名字
  platform: format === 'cjs' ? 'node' : 'browser', // 平台
  watch: { //  监控文件变化
    onRebuild (error) {
      if (!error) console.log(`rebuild~~~~`)
    }

  }

}).then(() => {
  console.log('watching~~~')
})