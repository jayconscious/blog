# Promise 解析

## 前言

看看promise是如何使用的


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

但是在 resolve 之前存在异步代码，比如 settimeout 等，所以状态还是 pending 的状态。我们就需要在 then 调用的时候，将成功和失败存到各自的数组，一旦 reject 或者 resolve，就调用它们。

类似于**分布订阅**，先将 then 内的两个函数存储，由于 promise 可以有多个 then，所以存在同一个数组内。当成功或失败的时候用 forEach 调用他们。

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

有时候 `new Promise().then().then()` 的用法，这样的链式调用为了解决回调地狱（`callback hell`）问题。那么如何去实现呢？我们可以再第一个 then 函数内再返回一个 Promise，让这个新的 Promise 返回的值传递到下一个 then 中。

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
            if (this.status === "fulfilled") {
                // 前一个promise的状态已经改变就不需要 Push 了
                let x = onFullfilled(this.value)
                resolvePromise(promise2, x, resolve, reject)
            }
            if (this.status === "rejected") {
                // 前一个promise的状态已经改变就不需要 Push 了
                let x = onRejected(this.error)
                resolvePromise(promise2, x, resolve, reject)
            }
            if (this.status === 'pending') {
                this.resolveQueue.push(() => {
                    // 这个回调函数的这行有多种可能性, 还有在写onFulfilled 必须要 return 这个值x
                    // 1. x = 普通对象
                    // 2. x = promise对象
                    let x = onFulfilled(this.value)
                    resolvePromise(promise2, x, resolve, reject)
                })
                this.rejectQueue.push(() => {
                    // 这个回调函数的这行有多种可能性, 还有在写onFulfilled 必须要 return 这个值x
                    // 1. x = 普通对象
                    // 2. x = promise对象
                    let x = onRejected(this.error)
                    resolvePromise(promise2, x, resolve, reject)
                })
            }
        })
        return promise2
    }
}
```

::: tip
在resolvePromise 在这个函数中，data是作为第一个then的返回值 我们要去判断 data 是否为 promise,
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
    // x 即为 promise
    if (x !== null && (typeof x == 'object' || typeof x == 'function') ) {
        try {
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

核心思路：

> 用setTimeout解决异步问题

代码如下：

```js

```


































