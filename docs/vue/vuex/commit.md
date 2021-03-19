---
title: commit 源码解析
date: 2021-03-05
sidebar: auto
tags: 
 - Vuex
categories:
 - Vuex
---

**更改** `Vuex` 的 `store` 中的状态的唯一方法是提交 `mutation`。 `Vuex` 中的 `mutation` 非常类似于事件：每个 `mutation` 都有一个字符串的 **事件类型 (type)** 和 一个 **回调函数 (handler)**。

```js
const store = new Vuex.Store({
    state: {
        count: 1
    },
    mutations: {
        increment (state) {
            // 变更状态
            state.count++
        }
    }
})
```

一条重要的原则就是要记住 **mutation 必须是同步函数**。

我们来看看 `commit` 的实现。

```js
Store.prototype.commit = function commit(_type, _payload, _options) {
    var this$1 = this;

    // check object-style commit
    // Tip: 统一(unify)参数格式
    var ref = unifyObjectStyle(_type, _payload, _options);
    var type = ref.type;
    var payload = ref.payload;
    var options = ref.options;

    var mutation = {
        type: type,
        payload: payload
    };
    // 
    var entry = this._mutations[type];
    if (!entry) {
        {
            console.error(("[vuex] unknown mutation type: " + type));
        }
        return
    }
    this._withCommit(function () {
        entry.forEach(function commitIterator(handler) {
            handler(payload);
        });
    });

    this._subscribers
        .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
        .forEach(function (sub) {
            return sub(mutation, this$1.state);
        });

    if ( options && options.silent ) {
        console.warn(
            "[vuex] mutation type: " + type + ". Silent option has been removed. " +
            'Use the filter functionality in the vue-devtools'
        );
    }
};
```

当我们看过 `dispactch` 的源码解析之后，发现 `commit` 的代码非常的类似。只有这段不同，我们来分析一下。

```js
this._withCommit(function () {
    entry.forEach(function commitIterator(handler) {
        handler(payload);
    });
});
```

在 `this._withCommit` 传入我们所要执行的 `mutation` 的集合 `entry`。

```js
Store.prototype._withCommit = function _withCommit(fn) {
    // this._committing false
    var committing = this._committing;
    this._committing = true;
    fn();
    this._committing = committing;
};
```

这里主要是由一个全局的 `_committing` 变量来标识 `mutation` 是否由 `commit` 来提交执行的。如果不是，在 `strict` 模式下，会报错。




















