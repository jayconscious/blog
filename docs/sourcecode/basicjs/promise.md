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

    executor(resolve, reject)
}

new MyPromise(function (resolve, reject) {
    console.log('test')
})



```
