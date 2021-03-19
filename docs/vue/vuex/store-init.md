---
title: 解析 vuex.Store
date: 2021-02-28
sidebar: auto
tags: 
 - Vuex
categories:
 - Vue
---

## 看看 Store 整个构造函数的声明
<!-- 待深入 -->

```js
var Vue; // bind on install
var Store = function Store(options) {
    var this$1 = this;
    if (options === void 0) options = {};

    // Auto install if it is not done yet and `window` has `Vue`.
    // To allow users to avoid auto-installation in some cases,
    // this code should be placed here. See #731
    
    if (!Vue && typeof window !== 'undefined' && window.Vue) {
        install(window.Vue);
    }
    {
        assert(Vue, "must call Vue.use(Vuex) before creating a store instance.");
        assert(typeof Promise !== 'undefined', "vuex requires a Promise polyfill in this browser.");
        assert(this instanceof Store, "store must be called with the new operator.");
    }
};
```

在第二个 `if` 判断我们可以看到，如果 `vuex` 内部的 `Vue` 变量没有绑定 `vue` 的话，`Store` 初始化也会自动注入。



```js
this._committing = false;                   // flag state 只能被 mutation 修改，在严格模式下会报错
this._actions = Object.create(null);        // 存储所有的 actions 
this._actionSubscribers = [];               // 存储所有的 actions 订阅，
this._mutations = Object.create(null);      // 存储所有的 mutations 
this._subscribers = [];                     // 存储所有的 mutations 订阅，

this._wrappedGetters = Object.create(null);
this._modulesNamespaceMap = Object.create(null);    // 存放有 命名空间的 module
this._makeLocalGettersCache = Object.create(null);

this._watcherVM = new Vue();                        // 挂载 vue 实例，主要是利用 vue 一些全局的 api
this._modules = new ModuleCollection(options);      // 挂载所有的 state 模块, 包括 root 模块
```

对于 `this` 挂载的变量基本上都是要全部使用的，看到 `Object.create(null);` 赋值的变量，基本上都是用于键值存储的，值得注意的是 `this._modules`, 这是由 `new ModuleCollection(options)` 实例化而来， `this._watcherVM` 同样如此。

```js
var store = this; 
var ref = this;

var dispatch = ref.dispatch;
var commit = ref.commit;

this.dispatch = function boundDispatch(type, payload) {
    return dispatch.call(store, type, payload)
};

this.commit = function boundCommit(type, payload, options) {
    return commit.call(store, type, payload, options)
};
```

可以看到，将当前实例化的对象`this`分别赋值给两个变量 `store `和 `ref`，获取到原型链上的`dispatch` 和 `commit`方法，


```js
this.strict = strict;

var state = this._modules.root.state;

installModule(this, state, [], this._modules.root);

resetStoreVM(this, state);

// 加载插件
plugins.forEach(function (plugin) {
    return plugin(this$1);  // this$1 === store === this
});

var useDevtools = options.devtools !== undefined ? options.devtools : Vue.config.devtools;

if (useDevtools) {
    devtoolPlugin(this);
}
```

这部分主要是使用了 `installModule` 和 `resetStoreVM` 来初始化一些逻辑以及插件的加载，我们来看看这两个方法的具体实现。


```js
function installModule(store, rootState, path, module, hot) {
    var isRoot = !path.length;
    var namespace = store._modules.getNamespace(path);

    // register in namespace map
    if (module.namespaced) {
        if (store._modulesNamespaceMap[namespace] && true) {
            console.error(("[vuex] duplicate namespace " + namespace + " for the namespaced module " + (path.join('/'))));
        }
        store._modulesNamespaceMap[namespace] = module;
    }

    // set state
    if (!isRoot && !hot) {
        var parentState = getNestedState(rootState, path.slice(0, -1));
        var moduleName = path[path.length - 1];
        store._withCommit(function () {
            {
                if (moduleName in parentState) {
                    console.warn(
                        ("[vuex] state field \"" + moduleName + "\" was overridden by a module with the same name at \"" + (path.join('.')) + "\"")
                    );
                }
            }
            Vue.set(parentState, moduleName, module.state);
        });
    }

    var local = module.context = makeLocalContext(store, namespace, path);

    module.forEachMutation(function (mutation, key) {
        var namespacedType = namespace + key;
        registerMutation(store, namespacedType, mutation, local);
    });

    module.forEachAction(function (action, key) {
        var type = action.root ? key : namespace + key;
        var handler = action.handler || action;
        registerAction(store, type, handler, local);
    });

    module.forEachGetter(function (getter, key) {
        var namespacedType = namespace + key;
        registerGetter(store, namespacedType, getter, local);
    });

    module.forEachChild(function (child, key) {
        installModule(store, rootState, path.concat(key), child, hot);
    });
}
```




















