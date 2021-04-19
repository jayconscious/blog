---
title: call&bind实现
date: 2021-04-20
sidebar: auto
tags: 
 - js
categories:
 - Javascript
---

## 前言

先来聊聊我对这两个函数一个认知的过程吧，当我初学 `js`的时候，我只知道有这么两个函数，就像文档描述的那样 `改变函数运行时内部 this 的指向`，也就有个大概的印象。随着阅读别人的代码和一些源码的逐渐深入才发现这两个函数的强大之处，在日常的业务开发和技术框架开发之中都是必不可少的利器。

## call & apply 功能

**call & apply**

> call() 方法在使用一个指定的 this 值和若干个指定的参数值的前提下调用某个函数或方法。apply只是传递的参数格式不同。

举个栗子：

```js
var person = {
    name: 'jay'
}
function say() {
    console.log(this.name)
}
say.call(person) // jay
```
::: tip
1、say函数内部的指向被改变了，如果没有改变指向的是window
2、say函数式被执行了的
:::

## call 的模拟实现

想想我们高如何实现 `call` 函数。






