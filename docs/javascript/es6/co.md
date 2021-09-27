---
title: co函数库 源码解析
date: 2021-09-17
sidebar: auto
tags: 
 - ES6
categories:
 - Javascript
 - asyncProgramming
sticky: 1
---

## 前言

co函数库是 [TJ Holowaychuk](https://github.com/tj)大神的作用，解决的问题就是 `Generator`  函数的自动执行。

## Generator函数所带来的问题

`Generator`函数是 `es6`规范提出用来解决异步编程的一种方式，我们通过一个例子，来看一下，它是如何解决的。

```js
function asyncFn(msg) {
  setTimeout(() => {
    console.log(msg)
    t.next()
  }, 2000);
}
function* test() {
  console.log('start')
  yield asyncFn('hello')
  yield asyncFn('world')
  console.log('end')
}
const t = test()
t.next()
```
这里我们需要调用 `t.next()` 来开启整个函数的执行，如果内部有多个`yield`需要我们手动调用的话，需要写多个`t.next()`，**co**函数优化了 `Generator`。

```js
function asyncFn (msg) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(msg)
      resolve()
    }, 2000);
  })
}
function* test() {
  console.log('start')
  yield asyncFn('hello')
  yield asyncFn('world')
  console.log('end')
}
co(test).then(() => {
  console.log('test')
})
```
这样的调用方式比上述原始的调用方式要优雅很多，而却避免了 `t.next()` 在异步函数内部调用的问题。

## co函数实现原理

基于 `Promise` 的自动调用执行，在每一个 `yield` 的返回必须是一个 `Promise` 对象，然后判断 `t.next()` 返回值中 `done`的值，决定是否继续执行，这样就可以完成`generator`函数的自执行了。下面是简单实现：

```js
function run(genFn) {
  const t = genFn()
  function next(data) {
    const res = t.next(data)
    if (!res.done) {
      res.value.then((val) => {
        next(val)
      })
    } else {
      return res.value
    }
  }
  next()
}
```
我们来测试一下：
```js
// demo
function asyncFn (msg) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(msg)
      resolve('world')
    }, 2000);
  })
}
function* test() {
  console.log('start')
  const res = yield asyncFn('hello')
  yield asyncFn(res)
  console.log('end')
}
run(test)
// 打印结果
// start
// hello
// world
// end
```
## co函数源码解析

```js
function co(gen) {
  var ctx = this;
  var args = slice.call(arguments, 1);
  // we wrap everything in a promise to avoid promise chaining,
  // which leads to memory leak errors.
  // 我们将所有东西都包装在一个 promise 中以避免 promise 链接，这会导致内存泄漏错误
  // see https://github.com/tj/co/issues/180
  return new Promise(function(resolve, reject) {
  })
}
```
`co` 函数声明第一层就是用 `Promise` 进行包裹，这里有两个作用：
1. 一个是避免`promise`链式调用而导致内存溢出
2. 在后续的回调之中可以使用 `.then` 继续后面逻辑的书写
除此之外我们还需要 `resolve`与`reject` 函数的执行域


```js
return new Promise(function(resolve, reject) {
  if (typeof gen === 'function') gen = gen.apply(ctx, args) // 兼容 gen 方式传入，也可以是 gen()
  if (!gen || typeof gen.next !== 'function') return resolve(gen)

  onFulfilled(); // 开启调用
  function onFulfilled(res) {
    var ret;
    try {
      ret = gen.next(res);
    } catch (e) {
      return reject(e);
    }
    next(ret);
    return null;
  }
})
```

这里主要是调用了 `onFulfilled` 来开启调用，使用 `try-catch` 捕获 `gen.next()` 异常，然后继续调用 `next`, 重点关注 `next` 里面的逻辑。

```js
function next(ret) {
  if (ret.done) return resolve(ret.value);
  var value = toPromise.call(ctx, ret.value);
  if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
  return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
    + 'but the following object was passed: "' + String(ret.value) + '"'));
}
```

这个 `next` 函数的实现大体功能上和我们上述的简易实现差不多。如果`generator`内部执行已完成，即`ret.done`为`true`,直接`resolve()`；否则使用`toPromise`包裹`ret.value`使其`promise`化，`value.then(onFulfilled, onRejected)`，继续上述的循环。

上述的代码已经很好的解决了 `generator` 函数的自执行的问题了，除此之外，还有一些不错的工具函数，我们来看看：

比如 `toPromise` 这个函数，为了保证后续可以使用 `promise.then` 来保证异步的顺序调用。

```js
function toPromise(obj) {
  if (!obj) return obj;
  if (isPromise(obj)) return obj;
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}
```
1. `ret.value` 返回值必须是 `function, promise, generator, array, or object`中的一种，不然就报错了。

Todo: https://github.com/tj/co/issues/180
