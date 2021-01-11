# 深入响应式原理

### 什么是数据响应式

在上古(jq)时代，比如我们要渲染一个列表是，我们需要借助DOM操作(jq)和模板引擎(underscore…)，结合数据来完成，非常的繁琐。有了 vue 的之后，借助数据响应式系统，只需要 <div v-for=“item in list”></div> 就可以完成。这个简单的demo, 体现了 Vue.js 一个核心思想就是数据驱动。所谓数据驱动，是指视图是由数据驱动生成的，我们对视图的修改，不会直接操作 DOM，而是通过修改数据。接下来我们，深入源码分析这一部分。这个过程大致分为三个部分`让数据变成响应式`、`依赖收集` 和 `派发更新`。

### 什么是数据响应式

这里我们借助官网的一张图，如下图：

![image](/blog/assets/img/vue2/reactivity/reactivity.png)

在渲染时，`vm._update()`方法重新渲染，这个会 `touch` 到模板中的数据，会发响应数据的 `get` 函数，收集本次渲染的依赖。收集依赖和更新派发都是基于 `Watcher` 观察者。在我们给某些数据进行复制操作时，会触发响应数据的 `set` 函数，`set` 会调用 `dep.notify()`，通知依赖它的 `watcher`, 触发试图更新。

总之数据驱动的核心，就是通过 `Object.defineProperty` 方法去重写数据的`get`和`set`属性描述符，**让数据在被渲染时把所有用到自己的订阅者存放在自己的订阅者列表中，当数据发生变化时将该变化通知到所有订阅了自己的订阅者**，达到重新渲染的目的。


### 让数据变成响应式

Vue 的数据响应式原理是 `ES5` 内置对象方法 `Object.defineProperty`(一些浏览器上不支持的，IE8: 大家都看我干吗？) 来实现的。[这个方法的作用是在一个对象上定义一个新属性，或者修改一个对象的现有属性。](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)，在新的vue3当前是使用了 `ES6` 的 `Proxy`代替了它。接下来我们理清整个响应式的初始化链路，如下图：

![image](/blog/assets/img/vue2/reactivity/defineProperty.png)

##### Vue的初始化

```js
function Vue(options) {
    if (!(this instanceof Vue)) {
        warn('Vue is a constructor and should be called with the `new` keyword');
    }
    this._init(options);
}

initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);
// ...
```
上述的代码中，我们可以看到 `new Vue` 时，实际上调用了 `this._init(options)` 这个方法，`_init` 这个方法是在 `initMixin(Vue)`时，添加到 `Vue.prototype` 上的。`_init` 中有调用了一堆初始化的方法，关于响应式的主要是在 `initState` 中。

```js
function initState(vm) {
    vm._watchers = [];
    var opts = vm.$options;
    if (opts.props) { initProps(vm, opts.props); }
    if (opts.methods) { initMethods(vm, opts.methods); }
    if (opts.data) {
        initData(vm);
    } else {
        observe(vm._data = {}, true /* asRootData */ );
    }
    if (opts.computed) { initComputed(vm, opts.computed); }
    if (opts.watch && opts.watch !== nativeWatch) { initWatch(vm, opts.watch); }
}
```

##### 将options.data 变为响应式









