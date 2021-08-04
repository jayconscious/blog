const path = require('path')
const hash = require('hash-sum')
const qs = require('querystring')   // 解析参数
const plugin = require('./plugin')  // 
const selectBlock = require('./select')
const loaderUtils = require('loader-utils') // loaderUtils loader的工具库

const { attrsToQuery } = require('./codegen/utils')
const { parse } = require('@vue/component-compiler-utils')
const genStylesCode = require('./codegen/styleInjection')
const { genHotReloadCode } = require('./codegen/hotReload')
const genCustomBlocksCode = require('./codegen/customBlocks')
const componentNormalizerPath = require.resolve('./runtime/componentNormalizer')
const { NS } = require('./plugin')

let errorEmitted = false

function loadTemplateCompiler (loaderContext) {
  try {
    return require('vue-template-compiler')
  } catch (e) {
    if (/version mismatch/.test(e.toString())) {
      loaderContext.emitError(e)
    } else {
      loaderContext.emitError(new Error(
        `[vue-loader] vue-template-compiler must be installed as a peer dependency, ` +
        `or a compatible compiler implementation must be passed via options.`
      ))
    }
  }
}

var count = 0
module.exports = function (source) {
  // source 就是读取到的 test.vue 的源文件
  const loaderContext = this

  if (!errorEmitted && !loaderContext['thread-loader'] && !loaderContext[NS]) {
    loaderContext.emitError(new Error(
      `vue-loader was used without the corresponding plugin. ` +
      `Make sure to include VueLoaderPlugin in your webpack config.`
    ))
    errorEmitted = true
  }

  // 把绝对路径转为相对路径
  const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)

  const {
    target,
    request,
    minimize,
    sourceMap,
    rootContext,
    resourcePath,
    resourceQuery = ''
  } = loaderContext

  const rawQuery = resourceQuery.slice(1)
  const inheritQuery = `&${rawQuery}`
  const incomingQuery = qs.parse(rawQuery)
  const options = loaderUtils.getOptions(loaderContext) || {}

  const isServer = target === 'node'
  const isShadow = !!options.shadowMode
  const isProduction = options.productionMode || minimize || process.env.NODE_ENV === 'production'
  const filename = path.basename(resourcePath)
  const context = rootContext || process.cwd()
  const sourceRoot = path.dirname(path.relative(context, resourcePath))

  // 通过 @vue/component-compiler-utils 的 parse 解析器，将 test.vue 文件转换为文件描述符
  // compiler 参数就是 vue-template-compiler 模板解析器
  const descriptor = parse({
    source,
    compiler: options.compiler || loadTemplateCompiler(loaderContext),
    filename,
    sourceRoot,
    needMap: sourceMap
  })

  // if the query has a type field, this is a language block request
  // e.g. foo.vue?type=template&id=xxxxx
  // and we will return early
  // 如果查询有一个类型字段，这是一个块请求
  // 例如foo.vue?type=template&id=xxxxx 尽早return
  // 我们需要注意 loader 中的return语句，因为多个loader是链式作用的，这个出口的逻辑在第三阶段会有使用，在第一阶段我们暂不讨论
  if (incomingQuery.type) {
    return selectBlock(
      descriptor,
      loaderContext,
      incomingQuery,
      !!options.appendExtension
    )
  }
  // module id for scoped CSS & hot-reload
  const rawShortFilePath = path
    .relative(context, resourcePath)
    .replace(/^(\.\.[\/\\])+/, '')

  const shortFilePath = rawShortFilePath.replace(/\\/g, '/') + resourceQuery
  // 生成模块标识id
  const id = hash(
    isProduction
      ? (shortFilePath + '\n' + source.replace(/\r\n/g, '\n'))
      : shortFilePath
  )

  // feature information
  const hasScoped = descriptor.styles.some(s => s.scoped)
  const hasFunctional = descriptor.template && descriptor.template.attrs.functional
  const needsHotReload = (
    !isServer &&
    !isProduction &&
    (descriptor.script || descriptor.template) &&
    options.hotReload !== false
  )

  // template
  let templateImport = `var render, staticRenderFns`
  let templateRequest
  if (descriptor.template) {
    const src = descriptor.template.src || resourcePath // '/Users/didi/Works/didi/my-site/blog/demos/webpack/vueLoaderAnalysis/test.vue'
    const idQuery = `&id=${id}` // '&id=13429420'
    const scopedQuery = hasScoped ? `&scoped=true` : `` //'&scoped=true'
    const attrsQuery = attrsToQuery(descriptor.template.attrs)
    const query = `?vue&type=template${idQuery}${scopedQuery}${attrsQuery}${inheritQuery}`   // '?vue&type=template&id=13429420&scoped=true&'
    const request = templateRequest = stringifyRequest(src + query)
    templateImport = `import { render, staticRenderFns } from ${request}`
    // 'import { render, staticRenderFns } from "./test.vue?vue&type=template&id=13429420&scoped=true&"'
  }

  // script
  let scriptImport = `var script = {}`
  if (descriptor.script) {
    const src = descriptor.script.src || resourcePath
    const attrsQuery = attrsToQuery(descriptor.script.attrs, 'js')
    const query = `?vue&type=script${attrsQuery}${inheritQuery}`
    const request = stringifyRequest(src + query)
    scriptImport = (
      `import script from ${request}\n` +
      `export * from ${request}` // support named exports
    )
  }

  // styles
  let stylesCode = ``
  if (descriptor.styles.length) {
    stylesCode = genStylesCode(
      loaderContext,
      descriptor.styles,
      id,
      resourcePath,
      stringifyRequest,
      needsHotReload,
      isServer || isShadow // needs explicit injection?
    )
  }

  let code = `
${templateImport}
${scriptImport}
${stylesCode}

/* normalize component */
import normalizer from ${stringifyRequest(`!${componentNormalizerPath}`)}
var component = normalizer(
  script,
  render,
  staticRenderFns,
  ${hasFunctional ? `true` : `false`},
  ${/injectStyles/.test(stylesCode) ? `injectStyles` : `null`},
  ${hasScoped ? JSON.stringify(id) : `null`},
  ${isServer ? JSON.stringify(hash(request)) : `null`}
  ${isShadow ? `,true` : ``}
)
  `.trim() + `\n`

  if (descriptor.customBlocks && descriptor.customBlocks.length) {
    // 解析自定义的 block
    code += genCustomBlocksCode(
      descriptor.customBlocks,
      resourcePath,
      resourceQuery,
      stringifyRequest
    )
  }

  if (needsHotReload) {
    // Todo: 'import { render, staticRenderFns } from "./test.vue?vue&type=template&id=13429420&scoped=true&"\nimport script from "./test.vue?vue&type=script&lang=js&"\nexport * from "./test.vue?vue&type=script&lang=js&"\nimport style0 from "./test.vue?vue&type=style&index=0&id=13429420&scoped=true&lang=scss&"\n\n\n/* normalize component */\nimport normalizer from "!./lib/vue-loader/runtime/componentNormalizer.js"\nvar component = normalizer(\n  script,\n  render,\n  staticRenderFns,\n  false,\n  null,\n  "13429420",\n  nu…node_modules/vue-hot-reload-api/dist/index.js")\n  api.install(require('vue'))\n  if (api.compatible) {\n    module.hot.accept()\n    if (!api.isRecorded('13429420')) {\n      api.createRecord('13429420', component.options)\n    } else {\n      api.reload('13429420', component.options)\n    }\n    module.hot.accept("./test.vue?vue&type=template&id=13429420&scoped=true&", function () {\n      api.rerender('13429420', {\n        render: render,\n        staticRenderFns: staticRenderFns\n      })\n    })\n  }\n}'
    code += `\n` + genHotReloadCode(id, hasFunctional, templateRequest)
  }

  // Expose filename. This is used by the devtools and Vue runtime warnings.
  if (!isProduction) {
    // Expose the file's full path in development, so that it can be opened
    // from the devtools.
    code += `\ncomponent.options.__file = ${JSON.stringify(rawShortFilePath.replace(/\\/g, '/'))}`
  } else if (options.exposeFilename) {
    // Libraries can opt-in to expose their components' filenames in production builds.
    // For security reasons, only expose the file's basename in production.
    code += `\ncomponent.options.__file = ${JSON.stringify(filename)}`
  }

  code += `\nexport default component.exports`
  // Todo: console.log('code', code)
  return code
}

module.exports.pitch = function (remainingRequest) {
  console.log('vue loader pitch')
}

module.exports.VueLoaderPlugin = plugin
