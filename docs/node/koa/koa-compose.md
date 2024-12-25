---
title: koa-componse源码解析
date: 2021-11-01
sidebar: auto
tags: 
 - Koa
categories:
 - Node.js
# sticky: 1
---

## 前言

作为 `koa` 框架中间件运行机制实现的核心逻辑，`koa-componse`实现确实让人有些着迷，下面我们通过例子，来进一步深入`koa-componse` 是如何实现的。

## 举个栗子

```js
const Koa = require('koa');
const app = new Koa();
app.use(async (ctx, next) => {
    // console.log(this.url);
    console.log('第一个中间件函数');
    await next();
    console.log('第一个中间件函数next之后!');
})
app.use(async (ctx, next) => {
    console.log('第二个中间件函数')
    await next();
    console.log('第二个中间件函数next之后!');
})

app.use(async ctx => {
    ctx.body = 'Hello World';
});
app.listen(3000);
```

上面的代码执行结果如下：

```js
// 第一个中间件函数
// 第二个中间件函数
// 第一个中间件函数next之后!
// 第二个中间件函数next之后!
```







