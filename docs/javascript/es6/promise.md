---
title: Promise 解析
date: 2021-10-20
sidebar: auto
tags: 
 - ES6
categories:
 - Javascript
 - asyncProgramming
sticky: 1
---

## 前言

我们先来看看promise是如何使用的

```js
new Promise(function (resolve, reject) {
}).then(res => {
}).catch(err => {
})

// ==============================

const executor = function (resolve, reject) {
    resolve() // or reject()
}
executor.then(res => {})
executor.catch(err => {})
```

分析一下 promise 拥有的一些特性：

- 构造函数里传一个函数的两个参数（resolve, reject）
- resolve 成功时执行的回调
- reject 失败时执行的回调
- 三种状态
    1. pending [待定] 初始状态
    2. fulfilled [实现] 操作成功
    3. rejected [被否决] 操作失败
- Promise 对象方法 then


## 看看promise的基本实现

- 构造函数里传一个函数的两个参数（resolve, reject）
- resolve 成功时执行的回调
- reject 失败时执行的回调

```js
function MyPromise (executor) {
    const resolve = res => {}
    const reject = res => {}
    // 判断 executor
    executor(resolve, reject)
}
// or
// class Promise {
//     constructor(executor) {
//         const resolve = res => {}
//         const reject = err => {}
//         executor(resolve, reject)
//     }
// }
new MyPromise(function (resolve, reject) {
    console.log('test')
})
// test
```

## Promise的三种状态实现

promise的三种状态
- pending [待定] 初始状态
- fulfilled [实现] 操作成功
- rejected [被否决] 操作失败

promise 初始化的时候状态会变为 pending

当调用resolve成功时，会由pending => fulfilled

当调用reject失败时，会由pending => rejected

::: tip
状态一旦从pending => fulfilled/rejected，是不可修改的
:::

```js
    class MyPromise {
        constructor (executor) {
            this.status = 'pending'
            this.value = ''
            this.error = ''

            const resolve = function (res) {
                if (this.status == 'pending') {
                    this.status = 'fulfilled'
                    this.value = res
                }
            }
            // const resolve = res => {
            //     if (this.status == 'pending') {
            //         this.status = 'fulfilled'
            //         this.value = res
            //     }
            // }
            // 使用箭头函数可以不需要 bind， 内部的this指向的是 resolve 或者是 reject 函数
            // Tip: 因为 resolve，reject 的执行域的上下文在没有指定的情况下是外部的(window)
            // 使用箭头函数orbind的方式都是指定了上下文
            const reject = function (error) {
                if (this.status = 'pending') {
                    this.status = 'rejected'
                    this.error = error
                }
            }
            // executor(resolve, reject)
            executor(resolve.bind(this), reject.bind(this))
        }
    }
```

## Promise 对象方法 then 实现


then 接受两个回调

promise.then(onFulfilled, onRejected)

```js
class MyPromise {
    constructor (executor) {
        this.status = 'pending'
        this.value = ''
        this.error = ''

        const resolve = res => {
            if (this.status == 'pending') {
                this.status = 'fulfilled'
                this.value = res
            }
        }
        const reject = error => {
            if (this.status == 'pending') {
                this.status = 'rejected'
                this.error = error
            }
        }
        executor(resolve, reject)
    }

    then (onFulfilled, onRejected) {
        if (this.status == 'fulfilled') {
            onFulfilled(this.value)
        }
        if (this.status == 'rejected') {
            onRejected(this.error)
        }
    }
}

new MyPromise(function(resolve, reject) {
    resolve('这是测试')
}).then(res => console.log(res))
// 这是测试
```

## 异步实现

但是在 `resolve` 之前存在异步代码，比如 `settimeout` 等，所以状态还是 `pending` 的状态。我们就需要在 `then` 调用的时候，将成功和失败存到各自的数组，一旦 `reject` 或者 `resolve` ，就调用它们。

类似于**分布订阅**，先将 `then` 内的两个函数存储，由于 `promise` 可以有多个 `then` ，所以存在同一个数组内。当成功或失败的时候用 `forEach` 调用他们。

```js
class MyPromise {
    constructor (executor) {
        this.status = 'pending'
        this.value = ''
        this.error = ''
        this.resolvsQueue = []       // 存放成功的后需要执行的函数
        this.rejectQueue = []        // 存放失败的后需要执行的函数

        const resolve = res => {
            if (this.status == 'pending') {
                this.status = 'fulfilled'
                this.value = res
                resolvsQueue.forEach(fn => fn())
            }
        }
        const reject = error => {
            if (this.status == 'pending') {
                this.status = 'rejected'
                this.error = error
                rejectQueue.forEach(fn => fn())
            }
        }
        executor(resolve, reject)
    }

    then (onFulfilled, onRejected) {
        if (this.status == 'fulfilled') {
            this.resolvsQueue.push(() => {
                onFulfilled(this.value)
            })
        }
        if (this.status == 'rejected') {
            this.rejectQueue.push(() => {
                onRejected(this.value)
            })
        }
        // How ?
        if (this.status == 'pending') {
            this.resolvsQueue.push(() => {
                onFulfilled(this.value)
            })
            this.rejectQueue.push(() => {
                onRejected(this.value)
            })
        }
    }
}
```

::: tip
其实从这个设计中我们可以看出，其实promise只是使用一些设计结构包装了一下，解决了之前回调方式所存在的问题, promise内部then利用event-loop的机制，现将成功和失败的回调函数塞到数组中，当异步任务完成的时候，再将其取出执行。
:::


## then 的链式调用

有时候 `new Promise().then().then()` 的用法，这样的链式调用为了解决回调地狱（`callback hell`）问题。那么如何去实现呢？我们可以再第一个 `then` 函数内再返回一个 `Promise` ，让这个新的 `Promise` 返回的值传递到下一个 `then` 中。

代码如下:

```js
class MyPromise {
    constructor (executor){
        this.status = 'pending'
        this.value = ''
        this.error = ''
        this.resolveQueue = []
        this.rejectQueue = []
        const resolve = res => {
            if (this.status === 'pending') {
                this.status = 'fulfilled'
                this.value = res
                this.resolveQueue.forEach(fn => fn())
            }
        }
        const reject = err => {
            if (this.status === 'pending') {
                this.status = 'rejected'
                this.error = err
                this.rejectQueue.forEach(fn => fn())
            }
        }
        executor(resolve, reject)
    }
    // 偶有的函数执行都是在resolve 这一步做的
    then (onFulfilled, onRejected) {
        let promise2
        promise2 = new Promise((resolve, reject) => {
            if (this.status === 'pending') {
                // 这个回调函数的这行有多种可能性, 还有在写 onFulfilled/onRejected 必须要 return 这个值x
                // 1. x = 普通对象
                // 2. x = promise对象
                this.resolveQueue.push(() => {
                    let x = onFulfilled(this.value)
                    resolvePromise(promise2, x, resolve, reject)
                })
                this.rejectQueue.push(() => {
                    let x = onRejected(this.error)
                    resolvePromise(promise2, x, resolve, reject)
                })
            }
            // 前一个promise的状态已经改变就不需要 Push 了
            if (this.status === "fulfilled") {
                let x = onFullfilled(this.value)
                resolvePromise(promise2, x, resolve, reject)
            }
            if (this.status === "rejected") {
                let x = onRejected(this.error)
                resolvePromise(promise2, x, resolve, reject)
            }
        })
        return promise2
    }
}
```

::: tip
在 `resolvePromise` 在这个函数中， `data` 是作为第一个 `then` 的返回值 我们要去判断 `data` 是否为 `promise`,
- Yes,则取他的结果，作为新的 promise2 成功的结果
- No,直接作为新的 promise2 成功的结果
:::

```js
/**
 * 处理promise递归的函数
 * promiseObj {Promise} 默认返回的promise
 * data {*} 我们自己 return 的对象
 * resolve
 * reject
 */
function resolvePromise (promise2, x, resolve, reject) {
    // 1.判断x对象是否为promise对象
    if (promise2 === x) {
        // 循环引用
        // reject 报错抛出
        return reject(new TypeError('Chaining cycle detected for promise'));
    }
    let called = false
    // Why? called 锁的作用
    // 因为在 onFulfilled 这个函数中，我们需要关注是它执行的返回值，而不是 `then` 的多次调用(如果是promise的话)
    // x 可能为 promise
    if (x !== null && (typeof x == 'object' || typeof x == 'function') ) {
        try {
            // 依据 promise A+ 规范，x 为 promise
            let then = x.then
            if (typeof then === 'function') {
                then.call(x, y => {
                    if (called) return
                    called = true
                    resolvePromise(promise2, y, resolve, reject)
                }, (e) => {
                    if (called) return
                    called = true
                    reject(e)
                })
            } else {
                resolve(x)
            }
        } catch (e) {
            if (called) return
            called = true
            reject(e)
        }
    } else {
        resolve(x)
    }
}
```

## onFulfilled 和 onRejected 的异步调用

规定 `onFulfilled` 或 `onRejected` 不能同步被调用，必须**异步调用**。我们就用 `setTimeout` 解决异步问题。

代码如下：
```js
MyPromise.prototype.then = function(onFulfilled, onRejected) {
    let p = new MyPromise((resolve, reject) => {
        if (this.status === 'fulfilled') {
            setTimeout(function() {
                let x = onFulfilled(this.value)
                resolvePromise(p, x, resolve, reject)
            }, 0)
        }
        if (this.status === 'rejected') {
            setTimeout(function() {
                let x = onRejected(this.value)
                resolvePromise(p, x, resolve, reject)
            }, 0)
        }
        if (this.status === 'pending') {
            onFulfilled && this.successList.push(() => {
                setTimeout(function() {
                    let x = onFulfilled(this.value)
                    resolvePromise(p, x, resolve, reject)
                }, 0)
            })
            onRejected && this.failedList.push(() => {
                setTimeout(function() {
                    let x = onRejected(this.value)
                    resolvePromise(p, x, resolve, reject)
                }, 0)
            })
        }
    })
    return p
}
```
## 值穿透调用

我们想要的效果
```js
new Promise(function(resolve, reject){
    resolve('hello world~')
}).then().then().......then(res => {
    console.log(res)
})
// hello world~
```
其实解决的思路也很简单，在没有传递 `onFulfilled` 和 `onRejected`，我们需要添加一些默认值

```js
MyPromise.prototype.then = function (onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled != 'function ' ? onFulfilled : value => value
    onRejected = typeof onFulfilled != 'function ' ? onRejected : error => throw error
    // ...
}
```

## catch 方法

```js
MyPromise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected)
    // ...
}
```

## all 方法

::: tip
这是面试中一道非常经典的面试题
:::
```js
MyPromise.all = function (promiseArray) {
    let count = 0, resList = []
    return new MyPromise(function(resolve, reject) {
    for (let i = 0; i < promiseArray.length; i++) {
        promiseArray[i].then(res => {
            count++
            resList.push(res)
            if (count === promiseArray.length) {
                resolve(resList)
            }
        })
    }
    }).catch(err => reject(err))
}
```

## race 方法

```js
MyPromise.race = function(promiseArray) {
    return new MyPromise(function(resolve, reject) {
        for (let i = 0; i < promiseArray.length; i++) {
          promiseArray[i].then(res => {
            resolve(res)
          }).catch(err => reject(err))
        }
    })
}
```

## resolve 方法
```js
MyPromise.resolve = function(res) {
    return new MyPromise(function(resolve, reject) {
    resolve(res)
    })
}
```

## reject 方法
```js
MyPromise.reject = function(err) {
    return new MyPromise(function(resolve, reject) {
        reject(err)
    })
}
```

## allSettled 方法

```js
MyPromise.allSettled = function(promiseArray) {
    let count = 0, result = []
    return new MyPromise(function(resolve, reject) {
        for (let i = 0; i < promiseArray.length; i++) {
            promiseArray[i].then(res => {
                count++
                result[index] = {
                    status: 'fulfilled',
                    value
                }
                if (count === promiseArray.length) {
                    resolve(result)
                }
            }).catch(err => {
                count++
                result[index] = {
                    status: 'rejected',
                    err
                }
                if (count === promiseArray.length) {
                    resolve(result)
                }
            })
        }
    }).catch(err => reject(err))
}
```

## 总结

::: tip
要点总结：
1. `resolve` 和 `reject` 内部 `this` 指向问题
2. `resolvePromise` 的实现，多写写，多消化几遍
3. 为什么要使用 `setTimeout` 包裹，这由于 `promise A+` 所规范的
4. 为什么要使用数组来维护 `onFulfilled和onRejected`，因为还可以这样调用`p1.then(x, x), p1.then(x, x), p1.then(x, x)...`，
5. 在 `then` 的实现中还支持了其他的状态，我的理解是可以支持同步操作
6. `all`，`race` 这些方法是面试题中常见的
:::

所有的异步解决方法都只是让回调函数这种编程方法变得更加`好看`，更加符合人的思维方式，但是这不能改变 `js` 单线程的运行方式。所以上层的改变都是障眼法。


## 参考文献
- [Promise A+](https://promisesaplus.com/)
- [BAT前端经典面试问题：史上最最最详细的手写Promise教程](https://juejin.cn/post/6844903625769091079#heading-8)
- [手撕 Promise](https://juejin.cn/post/6845166891061739528#heading-1)

