# 手撕promise

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
其实从这个设计中我们可以看出，其实promise只是使用一些设计结构包装了一下，解决了之前回调方式所存在的问题
:::




























