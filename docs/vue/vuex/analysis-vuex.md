# 解析 vuex.Store

## 看看 Store 整个构造函数的声明



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
this._committing = false;
this._actions = Object.create(null);
this._actionSubscribers = [];
this._mutations = Object.create(null);
this._wrappedGetters = Object.create(null);

this._modules = new ModuleCollection(options);
this._modulesNamespaceMap = Object.create(null);
this._subscribers = [];

this._watcherVM = new Vue();
this._makeLocalGettersCache = Object.create(null);
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

可以看到，将当前实例化的对象`this`分别赋值给两个变量，获取到原型链上的`dispatch` 和 `commit`方法，


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

`installModule` 方法主要是初始化 `root module state`，`resetStoreVM` 初始化 `store.state`，并把它变成响应式。















