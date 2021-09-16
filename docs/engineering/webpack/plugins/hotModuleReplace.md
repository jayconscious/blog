---
title: 深入Webpack的HMR机制
date: 2021-09-16
sidebar: auto
tags: 
 - webpack
categories:
 - Engineering
sticky: 1
---

## 前言

在我刚学习 `vue` 的时候，接触`vue-cli`的时候，在开发是被其提供的热加载功能深深的吸引住了。很好奇它是如何将我们所修改的代码通过不刷新方式，来更新 `web` 应用，与此同时还能保持应用的一些状态，这在我们平时日常开发之中是非常有用。后来再知道提供浙一功能的是 `webpack` 的一个插件模块 `hotModuleReplace` 所提供的能力，本文就带大家一起来探究一下它是如何实现的。

## 抛出疑问

对于我们不熟悉或者压根没有接触的东西，通过抛出疑问，自己解决这些疑问可以很好帮我们去提升自己的能力，这是很好成长的机会。

1. 通过 `webpack` 打包之后的文件存放在哪里？在没有 `writeToDisk: true` 这个配置项时。

2. 打包器在工作时是如何和 `client` 进行交互的？

3. 新生成的模块是如何作用于浏览器应用的。

一开始的时候我们抛出的问题的颗粒度比较粗，没有关系，随着我们一步步的探索，我们又会遇到一些细节的问题，把这细节问题梳理清楚了，从而对整个问题就有了更深的理解了。

## HMR 流程图解

![image](/assets/img/webpack/plugin/hmr4.png)

上图描述了一个完整`HMR`流程，我们来看看它是如何运转的。


1. 在 `webpack` 的监听模式下，在我们所编写的文件保存之后，会触发其重新编译，完成之后的`bundle`保存在内存之中。在编译打包时，`webpack`的`ProgressPlugin`这个插件将编译进度通过 `websocket` 推送到浏览器端。

2. 在 `webpack-dev-server`与`webpack`之间主要是由 `webpack-dev-middleware`来进行交互的，这里它主要做了两件事：一是，通过 `webpack-dev-middleware` 调用`webpack`生成的`compiler`的相关api，告诉其将打包之后的文件是写入内存之后，还是写到硬盘上，依据`writeToDisk`配置项。二是，`webpack-dev-middleware`调用返回的是一个`express`标准的中间件，向`app`上注册路由，拦截 `HTTP` 收到的请求，根据请求路径响应对应的文件内容；

3. 这一步，浏览器主要是通过 `sockjs` 这个库与服务器端的 `websocket`服务建立长连接通信，将 `webpack`编译打包的各个阶段推送浏览器端，依此会有不同的操作，最为核心的就是服务端推送新`hash`时，浏览器端会依据这个`hash`来进行后续的热更新逻辑。

4. 当服务端推送的消息`type`为`ok`时，`webpack-dev-server/client`会执行`reloadApp`方法，主要是为了触发`webpackHotUpdate`事件，在`webpack/hot/dev-server`依据相关的配置和传递的信息决定是否要刷新页面还是要热更新，这两者联系的纽带是`webpack/hot/emitter`，依赖的是`node`的`events`模块，在浏览器也能生效，说明其是和平台无关的。

5. 在`webpack/hot/dev-server`中会通过调用`module.hot.check`方法映射到`HotModuleReplacement.runtime`中的`hotCheck`方法，这些方法是通过 `HotModuleReplacementPlugin`注入到`bendle`之中。

6. `hotCheck` 然后会调用`JsonpMainTemplate.runtime`中的`hotDownloadManifest`和`hotDownloadUpdateChunk`方法。

7. `hotDownloadManifest`携带上推送的 `hash`发起`ajax`请求，获取最新的文件列表。

8. `hotDownloadUpdateChunk` 依据文件列表发起`jsonp`请求相应的最新的代码块，继续后续代码更新的逻辑。

9. 代码更新时，会进行新旧模块的对比，决定是否要更新。如果要更新，将梳理清楚模块之间的依赖，然后更新模块以及相关的依赖；如果更新失败了，就会通过刷新的方式来进行兜底操作。

## 运行Demo

下面我们通过一个简单的例子来说明。来说明一些其中的一些细节问题，以大家最为熟悉的 `vue`为例。

我们来初始化一个基本`vue`项目，相关目录以及核心配置如下：

```js
Demo
├─ main.js
├─ package.json
├─ public
│    └─ index.html
├─ test.vue
├─ webpack.config.js
```
`webpack.config.js` 的配置如下，

```js
{
  devtool: 'source-map',
  mode: 'development',
  entry: path.resolve(__dirname, './main.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  devServer: process.env.NODE_ENV == 'production' ? {}:{
    contentBase: path.join(__dirname, 'dist'),
    hot: true,
    writeToDisk: true,
  },
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
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ]
}
```
`package.json` 的配置如下，

```js
"scripts": {
  "dev": "rm -rf ./dist && NODE_ENV=development webpack-dev-server --config webpack.config.js --open --inline --progress"
}
```
`test.vue`中的文件大家看心情来就好，`main.js`就是正常的`vue`启动入口，这里我就不多赘述了。

当我们修改的`test.vue`时，

### 第一步：webpack将打包之后的文件放入内存之中

`webpack-dev-middleware` 通过调用 `webpack`的 `compiler` 的 `api`将打包之后的文件放到内存之中。核心代码如下：
```js
// webpack-dev-middleware/index.js
if (!options.lazy) {
  context.watching = compiler.watch(options.watchOptions, (err) => {
    // ...
  })
}
```
在配置了 `writeToDisk` 这个配置项时，打包之后的文件会写入到相应的文件夹中。但是在没有这个配置的时候，那么文件有存放在哪里呢？这里我们提到`webpack-dev-middleware`中的一个依赖`memory-fs`，看这个名字我们大概就能猜到他是干什么的了。在 `webpack`的`compiler.outputFileSystem`会被挂在上`memory-fs`的实例。核心代码如下：
```js
// webpack-dev-middleware/lib/fs.js
const isMemoryFs = !isConfiguredFs && !compiler.compilers && compiler.outputFileSystem instanceof MemoryFileSystem;
if (isConfiguredFs) {
  const { fs } = context.options;
  compiler.outputFileSystem = fs;
  fileSystem = fs;
} else if (isMemoryFs) {
  fileSystem = compiler.outputFileSystem;
} else {
  fileSystem = new MemoryFileSystem();
  compiler.outputFileSystem = fileSystem;
}
```
如果当前 `compiler.outputFileSystem` 不是 `MemoryFileSystem`，那就用 `MemoryFileSystem` 替换，这样打包的文件就存放在 `MemoryFileSystem` 所构建的文件系统之中，加快了访问读取的速度了。

### 第二步：devServer在文件编译通知浏览器端

在`webpack`的`compiler`会添加`ProgressPlugin`插件，统计编译打包的进度，然后通过`sockjs`与服务端 `websocket` 通信，将打包的各个状态推送到客户端。此时，还需要知道打包完成的状态，在 `compiler.hooks` 中监听了 `done` 事件，然后通过调用 `_sendStats` 将打包之后的 `stats.hash`推送浏览器端。核心代码如下：

```js
// webpack-dev-server/lib/Server.js
new webpack.ProgressPlugin((percent, msg, addInfo) => {
  // ... 使用 ProgressPlugin 插件
  this.sockWrite(this.sockets, 'progress-update', { percent, msg });
  // ...
}).apply(this.compiler);

setupHooks() {
  // ...
  const addHooks = (compiler) => {
    const { compile, invalid, done } = compiler.hooks;
    // ...
    // 添加done事件监听
    done.tap('webpack-dev-server', (stats) => {
      this._sendStats(this.sockets, this.getStats(stats));
      this._stats = stats;
    });
  };
  if (this.compiler.compilers) {
    this.compiler.compilers.forEach(addHooks);
  } else {
    addHooks(this.compiler);
  }
}
_sendStats(sockets, stats, force) {
  // ...
  // 推送新的 hash 到浏览器端
  this.sockWrite(sockets, 'hash', stats.hash);
  // ...
}
```
### 第三步：webpack-dev-server/client 接受和处理服务端推送的信息

在一开始梳理这逻辑的时候，我有点好奇 `webpack-dev-server/client` 这部分的处理代码是如何打到 `bundle`之中的？其实在 `webpack-dev-server` 启动的时候，回去更新 `webpack` 的 `compiler`, 然后通过 `addEntries` 这个插件将这部分的代码注入到客户端之中。核心代码如下：
```js
// webpack-dev-server/lib/Server.js
updateCompiler(this.compiler, this.options)
// webpack-dev-server/lib/utils/updateCompiler.js
addEntries(webpackConfig, options);
compilers.forEach((compiler) => {
// ...
const providePlugin = new webpack.ProvidePlugin({
  __webpack_dev_server_client__: getSocketClientPath(options),
});
providePlugin.apply(compiler);
});
```

`webpack-dev-server/client`在处理 `websocket`消息会依据不同的 `type` 来处理消息。当收到 `type` 为 `hash`时记录下传递过来的`hash`值，当前消息的`type`为`ok`时，会调用 `reloadApp`。如下图所示：

![image](/assets/img/webpack/plugin/hmr1.png)

在 `reloadApp` 这个函数中，主要是通过`webpack/hot/emitter`触发`webpackHotUpdate`事件，并将最新的 `hash`作为参数传递过去，如果没有配置`hot参数`，则会在宏任务中来进行页面刷新的操作。
核心代码如下：

```js
// webpack-dev-server/client-src/default/index.js
const onSocketMessage = {
  hash(hash) {
    status.currentHash = hash;
  },
  ok() {
    reloadApp(options, status);
  }
}
function reloadApp(
  { hotReload, hot, liveReload },
  { isUnloading, currentHash }
) {
  if (hot) {
    const hotEmitter = require('webpack/hot/emitter');
    hotEmitter.emit('webpackHotUpdate', currentHash);
  } else if (liveReload) {
    // ...
    self.setInterval(() => {
      rootWindow.location.reload()
    })
  }
}
```
### 第四步：webpack接受到最新的hash验证以及更新模块

在上一步当中我们派发了 `webpackHotUpdate` 事件，要看在哪里消费了这个事件。在 `webpack/hot/dev-server`中消费的回调函数中主要是调用了 `module.hot.check` 方法，

`module.hot`这个对象是通过`HotModuleReplacementPlugin`插件将`HotModuleReplacement.runtime`之中的代码注入。核心代码如下：

```js
// webpack/hot/dev-server.js
hotEmitter.on("webpackHotUpdate", function(currentHash) {
  //...
  module.hot.check(true).then(() => {
    //...
  })
});
// webpack/lib/HotModuleReplacementPlugin.js
const Template = require("./Template")
const hotInitCode = Template.getFunctionContent(
	require("./HotModuleReplacement.runtime")
)
mainTemplate.hooks.moduleObj.tap(
  "HotModuleReplacementPlugin",
  (source, chunk, hash, varModuleId) => {
    return Template.asString([
      `${source},`,
      `hot: hotCreateModule(${varModuleId}),`, // 将 hmr.runtime 中的 api 注入到 module 之中
      "parents: (hotCurrentParentsTemp = hotCurrentParents, hotCurrentParents = [], hotCurrentParentsTemp),",
      "children: []"
    ]);
  }
);
// webpack/lib/HotModuleReplacement.runtime.js
function hotCreateModule(moduleId) {
		var hot = {
			check: hotCheck,
      // other api
		};
		return hot;
	}
```

`hotCheck`方法会调用 `JsonpMainTemplate.runtime`中的两个方法 `hotDownloadManifest`和`hotDownloadUpdateChunk`，前者通过上一步传入的`hash`发起`ajax`请求服务端获取文件更新列表，如图所示；后者依据文件列表发起`jsonp`请求相应的最新的代码块，继续后续代码更新的逻辑。

![image](/assets/img/webpack/plugin/hmr2.png)

`hotDownloadManifest`方法获取更新文件列表

![image](/assets/img/webpack/plugin/hmr3.png)

`hotDownloadUpdateChunk`获取到更新的新模块代码。

::: tip
在这里我一直有一个疑问，并且我自己想了一段时间也没有想通用的问题，就是为什么要通过上述的这种方式来更新。从技术来说，当服务端推送消息`type`为`ok`时，可以吧更新之后的代码块也一并推送过来，但是为什么没有这么做呢？看了其他的解释是，**模块解耦**，`dev-server/client` 只负责消息的传递，`HotModuleReplacement`来负责代码模块的的更新，这样复合单一设计的原则，而且 `webpack` 在不使用 `dev-server`的情况下，可以配合 `webpack-hot-middleware` 来实现热更新功能，`webpack-hot-middleware`使用的协议并不是`websocket`而是`SSE`协议，这种协议在`flutter-devtools`也有使用到，可以很好的把模块的功能进行解耦。
:::

### 第五步：HotModuleReplacement.runtime 更新模块

在上述 `jsonp` 请求中我们看到其调用了 `webpackHotUpdate` 这个方法，通过打包出来的 `bundle.js`可以看到它又调用了`JsonpMainTemplate.runtime`中的`webpackHotUpdateCallback`，这其中主要是调用了 `HotModuleReplacement.runtime`的 `hotAddUpdateChunk`，后面一系列的调用就不一一详述了，我们来看一下最为核心的方法`hotApply`。由于这个方法实现的代码较多，我们可以追踪`hotStatus`的状态变化来梳理更新的逻辑。

- "idle" => "check"，这个阶段 `module.hot.check` 方法。
- "check" => "prepare"，这个阶段通过上述的 `hotDownloadManifest`获取到了最新的文件列表。
- "prepare" => "ready"，这个阶段，将新的模块存贮到了 `hotUpdate` 之中。
- "ready" => "dispose"，这个阶段经历了两个循环，在第一个循环中，先通过 `getAffectedStuff` 方法找到当前这个新模块所有相关的**模块outdatedModules**和**依赖outdatedDependencies**，`result`返回值如下，如果没有找到的话，将 `result.type` 表示为 `disposed`。正常返回 `result.type`为`accepted`。
```js
let result = {
  "type":"accepted",
  "moduleId":"./lib/vue-loader/index.js?!./test.vue?vue&type=script&lang=js&",
  "outdatedModules":[
      "./lib/vue-loader/index.js?!./test.vue?vue&type=script&lang=js&",
      "./test.vue?vue&type=script&lang=js&",
      "./test.vue"
  ],
  "outdatedDependencies":{}
}
```
在第二个循环中，找出**outdatedModules**中，并且已经被使用的模块中 `hot._selfAccepted`为 `true`的模块，这些模块通过都自己调用的 ![module.hot.accep](https://webpack.docschina.org/api/hot-module-replacement/#accept)这个方法，对于 `vue`组件来说，这部分的代码是在`vue-loader`中注入的，核心代码如下：
```js
if (
  installedModules[moduleId] &&
  installedModules[moduleId].hot._selfAccepted &&
  // removed self-accepted modules should not be required 不需要移除自我接受的模块
  appliedUpdate[moduleId] !== warnUnexpectedRequire
) {
  outdatedSelfAcceptedModules.push({
    module: moduleId,
    errorHandler: installedModules[moduleId].hot._selfAccepted
  });
}
```
- "dispose" => "apply"，在这个阶段，遍历**outdatedModules**，从**installedModules**已经安装的模块中删除过期模块以及被该模块引用的子模块，还要删除删除依赖，核心代码如下：
```js
var queue = outdatedModules.slice();
while (queue.length > 0) {
  moduleId = queue.pop();
  module = installedModules[moduleId];
  if (!module) continue;
  // remove module from cache
  delete installedModules[moduleId];
  // when disposing there is no need to call dispose handler
  delete outdatedDependencies[moduleId];
  // remove "parents" references from all children
  for (j = 0; j < module.children.length; j++) {
    var child = installedModules[module.children[j]];
    if (!child) continue;
    idx = child.parents.indexOf(moduleId);
    if (idx >= 0) {
      child.parents.splice(idx, 1);
    }
  }
}
```
- "apply" => "fail" or "idle"，在这个阶段主要是更新模块，先将可被更新的模块`appliedUpdate`挂载到全局的`modules`上，对于 `outdatedSelfAcceptedModules`中的模块，会调用 `$require$(moduleId)`，这里的`$require$`就是打包出来的 `__webpack_require__`函数，主要是用来加载模块的。

### 第六步：对 vue 组件是如何自定更新的

`test.vue`这个模块在被`vue-loader`解析时，会通过`vue-loader/codegen/hotReload.js`中的`genHotReloadCode`方法添加如下代码，其中实现不刷新页面来更新`vue`组件的核心逻辑在`vue2`都是由`vue-hot-reload-api`这个库提供的。
```js
// vue-loader/codegen/hotReload.js genHotReloadCode
if (module.hot) {
  var api = require("xxx/node_modules/vue-hot-reload-api/dist/index.js")
  api.install(require('vue'))
  if (api.compatible) {
    module.hot.accept()
    if (!api.isRecorded('13429420')) {
      api.createRecord('13429420', component.options)
    } else {
      api.reload('13429420', component.options)
    }
    module.hot.accept("./test.vue?vue&type=template&id=13429420&scoped=true&", function () {
      api.rerender('13429420', {
        render: render,
        staticRenderFns: staticRenderFns
      })
    })
  }
}
```
这里 `vue-hot-reload-api` 为了支持更热新，它的**核心实现逻辑**是，在组件的生命周期的钩子函数中，插入保存组件上下文的对象的函数，初次渲染是保存当前的组件上下文；当第二次热更新的，先替换组件的 `options`, 然后调用组件的 `$forceUpdate`方法来重新渲染。

## 总结

1. 通过本文大概了解 `webpack hmr`整个工作的流程，还有很多的细节没有捕捉到位，比如 `webpack-dev-server/client` 代码的插入，`hotapply`里面的弯弯绕绕，以及整个`webpack`的模块机制的实现，欢迎小伙伴积极探讨。
2. 本文参考了 [Webpack HMR 原理解析](https://zhuanlan.zhihu.com/p/30669007)，感谢大佬的付出，觉得这样的行文思路非常值得借鉴。


## 参考文献
- [Webpack HMR 原理解析](https://zhuanlan.zhihu.com/p/30669007)
- [Hot Module Replacement](https://webpack.docschina.org/api/hot-module-replacement/#accept)

