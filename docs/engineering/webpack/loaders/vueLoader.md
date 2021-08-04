---
title: 深入 vue-loader 原理
date: 2021-07-28
sidebar: auto
tags: 
 - webpack
categories:
 - Engineering
---
## 前言
**vue-loader** 相信大家都不陌生，作为 `webpack` 中一个为解析 `.vue` 文件的 `loader`。主要的作用是是将单文件组件(`SFC`) 解析为 `vue runtime`是可识别的组件模块。它的使用如下
```js
// webpack.config.js
module.export = {
  //...
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: ['vue-loader']
      },
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
  ]
  //...
}
```
主要是分为两块：一个是 `module.rules` 的配置，另为一个是 `plugins` 里面 `VueLoaderPlugin` 的实例化。在探索这两部分分别作了什么之前，我们先看看这样的配置之后，通过 `webpack` 会将 `.vue` 文件打包成什么样的 `js` 模块。

```js
{
/***/ "./test.vue":
/***/ (function(module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.r(__webpack_exports__);
var MODULE_0__ = __webpack_require__("./test.vue?vue&type=template&id=13429420&scoped=true&");
var MODULE_1__ = __webpack_require__("./test.vue?vue&type=script&lang=js&");
var MODULE_2__ = __webpack_require__("./test.vue?vue&type=style&index=0&id=13429420&scoped=true&lang=scss&");
var MODULE_3__ = __webpack_require__("./lib/vue-loader/runtime/componentNormalizer.js");
/* normalize component */
var component = Object(MODULE_3__["default"])(
  MODULE_1__["default"],
  MODULE_0__["render"],
  MODULE_0__["staticRenderFns"],
  false,
  null,
  "13429420",
  null  
)
/* hot reload */
if (false) { var api; }
component.options.__file = "test.vue"
__webpack_exports__["default"] = (component.exports);
/***/ }),
}
```
从上面这段简化之后的代码我们很容易看出，被解析之后 `test.vue` 文件为依赖了 `MODULE_0__`，`MODULE_1__`，`MODULE_2__`，`MODULE_3__`这几个模块，其中 `MODULE_0__`，`MODULE_1__`，`MODULE_2__` 正好对应了我们 `.vue` 文件中的 `<template></template>`，`<script></script>`，以及 `<style></style>` 模块。然后再有 `MODULE_3__` 模块将 `MODULE_0__`，`MODULE_1__` 组合成我们标准的 `vue component`。通过对源文件和目标产物的分析，我们就对 `vue-loader` 大致做了哪些事情有了轮廓了。下面将深入分析其具体流程。

## 原理分析

对 `.vue` 文件转换大致分为三个阶段。
1. 第一个阶段：通过 `vue-loader` 将 `.vue` 文件转化为中间产物，大致如下，
```js
import { render, staticRenderFns } from "./test.vue?vue&type=template&id=13429420&scoped=true&"
import script from "./test.vue?vue&type=script&lang=js&"
export * from "./test.vue?vue&type=script&lang=js&"
import style0 from "./test.vue?vue&type=style&index=0&id=13429420&scoped=true&lang=scss&"
import normalizer from "!./lib/vue-loader/runtime/componentNormalizer.js"
var component = normalizer(
  script,
  render,
  staticRenderFns,
  false, 
  null,
  "13429420",
  null 
)
component.options.__file = "test.vue"
export default component.exports
```
2. 第二个阶段：通过 `pitcher-loader`(这个`loader`是通过 `vueloaderplugin`注入到`webpack`中的) 将第一阶段中间产物转化为另一阶段产物。
就以 `import { render, staticRenderFns } from "./test.vue?vue&type=template&id=13429420&scoped=true&"` 为例，会被转化为
`-!./lib/vue-loader/loaders/templateLoader.js??vue-loader-options!./lib/vue-loader/index.js??vue-loader-options!./test.vue?vue&type=template&id=13429420&scoped=true&`

3. 第三个阶段：第二阶段转化 `request` 请求，通过对应的 `loader` 进行处理，比如：`-!./lib/vue-loader/loaders/templateLoader.js??vue-loader-options!./lib/vue-loader/index.js??vue-loader-options!./test.vue?vue&type=template&id=13429420&scoped=true&`，会先用 `vue-loader` 处理然后再用 `templateLoader` 处理，最后就得到了 `MODULE_0__` 的产物了。大致如下：

```js
(function(module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, "render", function() { return render; });
__webpack_require__.d(__webpack_exports__, "staticRenderFns", function() { return staticRenderFns; });
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c("div", [
    _c("span", { staticClass: "haha" }, [
      _vm._v("\n    " + _vm._s(_vm.msg) + "\n  ")
    ])
  ])
}
var staticRenderFns = []
render._withStripped = true
}),
```
::: tip
对于熟悉 `vue` 源码的同学，对于上述的产物肯定是比较熟悉的，生成的这个 `render` 函数就是对 `template` 模板解析的结果，`render`函数的执行结果就是其对应的 `vNode`，也就是 `vue patch` 阶段的入口参数。
:::
下面会对每一个阶段做详细的阐述。

### 第一阶段

如图所示，
<!-- Todo缺少图片 -->
对 `.vue` 文件在目前所有已配置的规则中，只有 `vue-loader`可以命中，我们来看看 `vue-loader`做了哪些事情。(/lib/index.js)[https://github.com/vuejs/vue-loader/blob/master/lib/index.js]。

```js
module.exports = function (source) {
  // source 就是读取到的 test.vue 的源文件
  const loaderContext = this
  // 通过 @vue/component-compiler-utils 的 parse 解析器，将 test.vue 文件转换为文件描述符
  // compiler 参数就是 vue-template-compiler 模板解析器
  const descriptor = parse({
    source,
    compiler: options.compiler || loadTemplateCompiler(loaderContext),
    filename,
    sourceRoot,
    needMap: sourceMap
  })
  // template
  let templateRequest
  if (descriptor.template) {
    templateImport = `import { render, staticRenderFns } from ${request}`
    // 'import { render, staticRenderFns } from "./test.vue?vue&type=template&id=13429420&scoped=true&"'
  }
  let scriptImport = `var script = {}`
  if (descriptor.script) {
    scriptImport = // ...
  }
  let stylesCode = ``
  if (descriptor.styles.length) {
    stylesCode = //...
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
)`.trim() + `\n`
  code += `\nexport default component.exports`
  return code
}
```
通过上面的注释，`vue-lodaer` 现将读取的源文件，然后通过 `@vue/component-compiler-utils`中的 `parse` 解析器将得到源文件的描述符。对每个 `block` 进行处理，生成对应的模块请求。由 `normalizer` 函数把每个 `block` 拼接到一起，形成一个 `vue` 组件。这里面还有很多的细节，这里不多描述了。

### 第二阶段

如图所示，
<!-- Todo缺少图片 -->

通过 `pitcher-loader`(这个`loader`是通过 `vueloaderplugin`注入到`webpack`中的) 将第一阶段中间产物转化为另一阶段产物。
就以 `import { render, staticRenderFns } from "./test.vue?vue&type=template&id=13429420&scoped=true&"` 为例，会被转化为
`-!./lib/vue-loader/loaders/templateLoader.js??vue-loader-options!./lib/vue-loader/index.js??vue-loader-options!./test.vue?vue&type=template&id=13429420&scoped=true&`
这里会有两个疑问？
1. `pitcher-loader`是如何注入到 `loaders` 中的？
2. `./test.vue?vue&type=template&id=13429420&scoped=true&`这个`request`会被哪些`loader`处理，以及如何处理的？

我们先来解答第一个问题，这段逻辑主要是在  (/lib/plugin-webpack4.js)[https://github.com/vuejs/vue-loader/blob/master/lib/plugin-webpack4.js]。以 `webpack v4`为例。
```js
class VueLoaderPlugin {
  apply (compiler) {
    // ...
    // global pitcher (responsible for injecting template compiler loader & CSS post loader)
    const pitcher = {
      loader: require.resolve('./loaders/pitcher'),
      resourceQuery: query => {
        const parsed = qs.parse(query.slice(1))
        return parsed.vue != null
      },
      options: {
        cacheDirectory: vueLoaderUse.options.cacheDirectory,
        cacheIdentifier: vueLoaderUse.options.cacheIdentifier
      }
    }
    compiler.options.module.rules = [
      pitcher,
      // other rules ....     
    ]
  }
}
```
在 `webpack`生成`compiler`之后，注入 `pitcher-loader`，我们徐主要这个`loader`的命中规则`resourceQuery`。我们常用的是使用 `test: /\.vue$/`，

























