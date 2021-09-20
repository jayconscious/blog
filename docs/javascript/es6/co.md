---
title: co函数库 源码解析
date: 2021-09-17
sidebar: auto
tags: 
 - ES6
categories:
 - Javascript
---

大纲：
前言
问题是什么？
理想的情况是怎样的？
怎么解决问题的？


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









