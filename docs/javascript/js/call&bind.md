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

### 第一阶段

想想我们高如何实现 `call` 函数。其实我们看 `say.call(person)`所达到的效果，就好像如下的代码，

```js
var person = {
    name: 'jay',
    say: function () {
        console.log(this.name)
    }
}
```
但是我们要给 `person` 这个对象添加一个属性方法显然是不合理的，但是我们可以 `借鸡生蛋`，使用完了，就删除掉这个属性方法就可以了。所以步骤就变成了，
1. 给对象添加属性方法
2. 调用这个属性方法
3. 然后删除这个属性方法

```js
Function.prototype.call2 = function(context) {
    context.fn = this
    context.fn()
    delete context.fn
}
say.call2(person) // jay
```

### 第二阶段

上面我们已经模拟 `.call` 的基础实现了，加下来我们将支持传参。

```js
Function.prototype.call2 = function() {
    let ctx, args = []
    for (let i = 0; i < arguments.length; i++) {
        if (i == 0) {
            ctx = arguments[i]
        } else {
            args.push(arguments[i])
        }
    }
    ctx.fn = this
    ctx.fn(...args)
    delete ctx.fn
}
```

因为 `arguments` 是类数组对象，所以可以使用 `for` 遍历。如果这里不使用 `ES6的 ...` 该如何实现呢？我们的目标是要将不定长参数注入到函数执行的参数位上。

```js
Function.prototype.call2 = function(ctx) {
    let args = []
    for (let i = 1; i < arguments.length; i++) {
        args.push('arguments[' + i + ']')
    }
    ctx.fn = this
    eval('ctx.fn('+ args +')')
    // eval('ctx.fn('+ args.join(',') +')')
    delete ctx.fn
}
```
这里我们可以使用 `eval` 来执行这个函数，`args` 会自动调用 `Array.toString()` 这个方法。


### 第三阶段

以上的代码实现，我们并没有考虑到 `this` 是 `null` 的情况，而且函数是有返回值的，让我们来解决这两个问题：


```js
Function.prototype.call2 = function(ctx) {
    ctx = ctx || window
    ctx.fn = this
    let args = []
    for (let i = 1; i < arguments.length; i++) {
        args.push('arguments[' + i + ']')
    }
    const res = eval('ctx.fn('+ args +')')
    delete ctx.fn
    return res
}
```

这样我们就完成对 `call` 函数的模拟实现了，`apply` 实现同样如此，感兴趣的同学自己去试试看吧~


