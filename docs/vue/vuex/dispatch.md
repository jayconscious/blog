---
title: dispatch 源码解析
date: 2021-03-05
sidebar: auto
tags: 
 - Vuex
categories:
 - Vue
---

`Action` 通过 `store.dispatch` 方法触发：

```js
store.dispatch('request')
```
`Action` 的内部是不受约束的，即不管是异步还是同步都是可以支持的。 `Actions` 支持同样的载荷方式和对象方式进行分发：

```js
// 以载荷形式分发
store.dispatch('incrementAsync', {
    amount: 10
})

// 以对象形式分发
store.dispatch({
    type: 'incrementAsync',
    amount: 10
})
```

来看一个更加实际的购物车示例，涉及到调用异步 `API` 和分发多重 `mutation` ：

```js
actions: {
    checkout ({ commit, state }, products) {
        // 把当前购物车的物品备份起来
        const savedCartItems = [...state.cart.added]
        // 发出结账请求，然后乐观地清空购物车
        commit(types.CHECKOUT_REQUEST)
        // 购物 API 接受一个成功回调和一个失败回调
        shop.buyProducts(
            products,
            // 成功操作
            () => commit(types.CHECKOUT_SUCCESS),
            // 失败操作
            () => commit(types.CHECKOUT_FAILURE, savedCartItems)
        )
    }
}
```

上面的 `actions.checkout`，第一个参数位是 `context`，第二个参数位是 `payload`。我们来看看代码是如何实现的。

```js
Store.prototype.dispatch = function dispatch(_type, _payload) {
    var this$1 = this;

    // check object-style dispatch
    // Tip: 统一(unify)参数格式
    var ref = unifyObjectStyle(_type, _payload);
    var type = ref.type;
    var payload = ref.payload;

    var action = {
        type: type,
        payload: payload
    };
    // Tip: this._actions 里面存储的是啥？ entry是一个Promise Array, 
    var entry = this._actions[type];
    if (!entry) {
        {
            console.error(("[vuex] unknown action type: " + type));
        }
        return
    }
    try {
        // Tip： 在 dispatch 使用 sub.before 加工 action
        // Tip: 在 dispatch action 之前，触发订阅 actions 的猴子函数，这里是 before
        // 如果订户同步调用退订，则浅表副本可防止迭代器无效
        this._actionSubscribers
            .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
            .filter(function (sub) {
                return sub.before;
            })
            .forEach(function (sub) {
                return sub.before(action, this$1.state);
            });
    } catch (e) {
        {
            console.warn("[vuex] error in before action subscribers: ");
            console.error(e);
        }
    }

    // 执行 entry 里面的函数，即被封装的 actions
    var result = entry.length > 1 ?
        // Todo: 一个 type 会对应多个 action 吗？
        Promise.all(entry.map(function (handler) {
            return handler(payload);
        })) :
        entry[0](payload);

    return new Promise(function (resolve, reject) {
        result.then(function (res) {
            try {
                // Tip：在 dispatch 使用 sub.after 加工 action
                this$1._actionSubscribers
                    .filter(function (sub) {
                        return sub.after;
                    })
                    .forEach(function (sub) {
                        return sub.after(action, this$1.state);
                    });
            } catch (e) {
                {
                    console.warn("[vuex] error in after action subscribers: ");
                    console.error(e);
                }
            }
            resolve(res);
        }, function (error) {
            try {
                this$1._actionSubscribers
                    .filter(function (sub) {
                        return sub.error;
                    })
                    .forEach(function (sub) {
                        return sub.error(action, this$1.state, error);
                    });
            } catch (e) {
                {
                    console.warn("[vuex] error in error action subscribers: ");
                    console.error(e);
                }
            }
            reject(error);
        });
    })
};
``` 
使用 `unifyObjectStyle` 统一接口所要支持的传参方式，即 `以载荷形式分发` 和 `以对象形式分发`，生成标准化 `action`。

依据 `action.type`从 `this._actions` 获取到 `wrappedActionHandler`。

拿到 `action` 执行结束的 `ressult`，这是个 `Promise`, `Promise.then` 中分别执行 `_actionSubscribers`中 `after` 和 `error`钩子函数。

::: tip
在这里还有一个疑问：action 的上下文是如何注入的？可以去了解一下初始化的过程。
:::
