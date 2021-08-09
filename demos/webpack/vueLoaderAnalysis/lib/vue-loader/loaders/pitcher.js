const qs = require('querystring')
const loaderUtils = require('loader-utils')
const hash = require('hash-sum')
const selfPath = require.resolve('../index')
const templateLoaderPath = require.resolve('./templateLoader')
const stylePostLoaderPath = require.resolve('./stylePostLoader')

const isESLintLoader = l => /(\/|\\|@)eslint-loader/.test(l.path)
const isNullLoader = l => /(\/|\\|@)null-loader/.test(l.path)
const isCSSLoader = l => /(\/|\\|@)css-loader/.test(l.path)
const isCacheLoader = l => /(\/|\\|@)cache-loader/.test(l.path)
const isPitcher = l => l.path !== __filename
const isPreLoader = l => !l.pitchExecuted
const isPostLoader = l => l.pitchExecuted

const dedupeESLintLoader = loaders => {
  const res = []
  let seen = false
  loaders.forEach(l => {
    if (!isESLintLoader(l)) {
      res.push(l)
    } else if (!seen) {
      seen = true
      res.push(l)
    }
  })
  return res
}

const shouldIgnoreCustomBlock = loaders => {
  const actualLoaders = loaders.filter(loader => {
    // vue-loader
    if (loader.path === selfPath) {
      return false
    }

    // cache-loader
    if (isCacheLoader(loader)) {
      return false
    }

    return true
  })
  return actualLoaders.length === 0
}
// 注入了一个全局的loader,但是什么也没有干，但是这个loader上挂载了一个pitch，所有vue先关的文件都会先走这个pitch，如果没有那就继续后续的loader
// module.exports = code => code
module.exports = code => {
  console.log('global loader xxxxxxxxxx', +new Date())
  return code
}

// This pitching loader is responsible for intercepting all vue block requests
// and transform it into appropriate requests.
// 这个pitching loader负责拦截所有vue块请求，并将其转换为适当的请求
// 怎么作用的？

module.exports.pitch = function (remainingRequest) {
  const options = loaderUtils.getOptions(this)
  const { cacheDirectory, cacheIdentifier } = options
  const query = qs.parse(this.resourceQuery.slice(1))

  let loaders = this.loaders

  // if this is a language block request, eslint-loader may get matched
  // multiple times
  if (query.type) {
    // if this is an inline block, since the whole file itself is being linted,
    // remove eslint-loader to avoid duplicate linting.
    // 如果这是一个内联块，因为整个文件本身正在被 linting，请删除 eslint-loader 以避免重复的 linting。
    // resourcePath: '/Users/didi/Works/didi/my-site/blog/demos/webpack/vueLoaderAnalysis/test.vue'
    if (/\.vue$/.test(this.resourcePath)) {
      loaders = loaders.filter(l => !isESLintLoader(l))
    } else {
      // This is a src import. Just make sure there's not more than 1 instance
      // of eslint present.
      // 这是一个 src 导入。只要确保不超过 1 个实例eslint 目前。
      loaders = dedupeESLintLoader(loaders)
    }
  }

  // remove self
  loaders = loaders.filter(isPitcher)

  // do not inject if user uses null-loader to void the type (#1239)
  if (loaders.some(isNullLoader)) {
    return
  }

  // 通过 loaders 生成 内联方式来处理 模块
  const genRequest = loaders => {
    // Important: dedupe since both the original rule
    // and the cloned rule would match a source import request.
    // also make sure to dedupe based on loader path.
    // assumes you'd probably never want to apply the same loader on the same
    // file twice.
    // Exception: in Vue CLI we do need two instances of postcss-loader
    // for user config and inline minification. So we need to dedupe baesd on
    // path AND query to be safe.
    const seen = new Map()
    const loaderStrings = []

    loaders.forEach(loader => {
      const identifier = typeof loader === 'string'
        ? loader
        : (loader.path + loader.query)
        
      const request = typeof loader === 'string' ? loader : loader.request
      if (!seen.has(identifier)) {
        seen.set(identifier, true)
        // loader.request contains both the resolved loader path and its options
        // query (e.g. ??ref-0)
        loaderStrings.push(request)
      }
    })

    return loaderUtils.stringifyRequest(this, '-!' + [
      ...loaderStrings,
      this.resourcePath + this.resourceQuery
    ].join('!'))
  }

  // Inject style-post-loader before css-loader for scoped CSS and trimming
  // 在 css-loader 之前注入 style-post-loader 以进行作用域 CSS 和修剪
  if (query.type === `style`) {
    const cssLoaderIndex = loaders.findIndex(isCSSLoader)
    if (cssLoaderIndex > -1) {
      const afterLoaders = loaders.slice(0, cssLoaderIndex + 1)
      const beforeLoaders = loaders.slice(cssLoaderIndex + 1)
      const request = genRequest([
        ...afterLoaders,
        stylePostLoaderPath,
        ...beforeLoaders
      ])
      // console.log(request)
      return query.module
        ? `export { default } from  ${request}; export * from ${request}`
        : `export * from ${request}`
    }
  }

  // for templates: inject the template compiler & optional cache
  // 对于模板：注入模板编译器和可选缓存
  // 缓存标识符
  if (query.type === `template`) {
    const path = require('path')
    const cacheLoader = cacheDirectory && cacheIdentifier
      ? [`${require.resolve('cache-loader')}?${JSON.stringify({
        // For some reason, webpack fails to generate consistent hash if we
        // use absolute paths here, even though the path is only used in a
        // comment. For now we have to ensure cacheDirectory is a relative path.
        cacheDirectory: (path.isAbsolute(cacheDirectory)
          ? path.relative(process.cwd(), cacheDirectory)
          : cacheDirectory).replace(/\\/g, '/'),
        cacheIdentifier: hash(cacheIdentifier) + '-vue-loader-template'
      })}`]
      : []

    // pitch阶段 后置(post)、行内(inline)、普通(normal)、前置(pre)
    // Normal 阶段: loader 上的 常规方法，按照 前置(pre)、普通(normal)、行内(inline)、后置(post) 的顺序调用。
    // preloaders
    // path:'/Users/didi/Works/didi/my-site/blog/demos/webpack/vueLoaderAnalysis/lib/vue-loader/index.js'
    const preLoaders = loaders.filter(isPreLoader)
    // postloaders  pitchExecuted: true
    const postLoaders = loaders.filter(isPostLoader)

    
    // Todo: 生成的链接要如何去解析
    const request = genRequest([
      ...cacheLoader,
      ...postLoaders,
      templateLoaderPath + `??vue-loader-options`,
      ...preLoaders
    ])
    // console.log('pitcher template', request)
    // the template compiler uses esm exports
    return `export * from ${request}`
  }

  // if a custom block has no other matching loader other than vue-loader itself
  // or cache-loader, we should ignore it
  if (query.type === `custom` && shouldIgnoreCustomBlock(loaders)) {
    return ``
  }

  // When the user defines a rule that has only resourceQuery but no test,
  // both that rule and the cloned rule will match, resulting in duplicated
  // loaders. Therefore it is necessary to perform a dedupe here.
  const request = genRequest(loaders)
  return `import mod from ${request}; export default mod; export * from ${request}`
}
