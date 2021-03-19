---
title: Store挂载实现
date: 2021-03-05
sidebar: auto
tags: 
 - Vuex
categories:
 - Vue
---

`vuex` 需要实现符合 `vue`插件的代码，才可以被 `vue` 使用或者相辅相成。

我们来看看 `vuex` 这个对象有哪些东西。

```js
Vuex = {
    Store,
    install: install,
    version: '3.6.2',
    mapState: mapState,
    mapMutations: mapMutations,
    mapGetters: mapGetters,
    mapActions: mapActions,
    createNamespacedHelpers: createNamespacedHelpers,
    createLogger: createLogger
}
```

## 分析 vuex 对象

- Store

`Store`是我们比较熟悉的了，项目里面是我们所要实例化的数据 `Store`，伪代码如下：

```js
const store = new Vuex.Store({
    // ...
})
```

- install

`install` 是一个 `function`，是作为 `vue plugin`机制的**约定函数**，后面会介绍它的具体实现。

- mapState， mapMutations， mapGetters， mapActions

对于这个几个，是我们常用的辅助函数。举例来说，

`mapState` 辅助函数

```js
computed: mapState([
    // 映射 this.count 为 store.state.count
    'count'
])
```


## Vuex.install 代码分析

```js
// 
function install(_Vue) {
    if (Vue && _Vue === Vue) {

        {
            console.error('[vuex] already installed. Vue.use(Vuex) should be called only once.');
        }
        return
    }
    Vue = _Vue;
    applyMixin(Vue);
}
```

主力要的逻辑都在 `applyMixin`，我们我分析一下

```js
function applyMixin(Vue) {
    var version = Number(Vue.version.split('.')[0]);

    if (version >= 2) {
        Vue.mixin({ beforeCreate: vuexInit });
    } else {
        // override init and inject vuex init procedure
        // for 1.x backwards compatibility.
        var _init = Vue.prototype._init;
        Vue.prototype._init = function (options) {
            if (options === void 0) options = {};

            options.init = options.init ?
                [vuexInit].concat(options.init) :
                vuexInit;
            _init.call(this, options);
        };
    }

    function vuexInit() {
        var options = this.$options;
        // store injection
        if (options.store) {
            this.$store = typeof options.store === 'function' ?
                options.store() :
                options.store;
        } else if (options.parent && options.parent.$store) {
            this.$store = options.parent.$store;
        }
    }
}
```

对于 `vue2.x` 以上的版本，直接使用 `Vue.mixin` 方法，将 `options.store` 挂载到 `vm.$store`上，这样就实现了`this.$store`的调用。
