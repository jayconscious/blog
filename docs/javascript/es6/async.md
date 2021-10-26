---
title: async/await 函数
date: 2021-09-29
sidebar: auto
tags: 
 - ES6
categories:
 - Javascript
 - asyncProgramming
sticky: 1
---

## 前言

对于我而言来说，在刚接触异步编程的时候，还沉浸在 `ajax` 请求更新数据的喜悦中，然而下一个需求，我就发现需要依赖上一个请求响应的数据来完成它，两个回调函数的堆叠，让我意识到，会有多个回调函数堆叠的情况吗？回答是的，这样会使我们陷入`callback hell`回调地狱。当我向组长咨询这个问题时，他向我展示了 `async/await` 这种写法，完美的解决了目前这种回调函数写法所带来的的困扰。


## async函数是什么呢？

对于刚接触`async/await`的同学来说，肯定会困惑他到底是如何实现的？可能还会有这样的疑问，如果有多个 `await`他们到底是并行执行的还是串行？下面我们来解答这些问题。对于看过或者是研究过 `co 函数`的同学，我们是不是就能发现，对于 `async/await` 来说，它就像是 `co函数` 包裹的 `Generator`的变体，只不过 `yeild => await`，`* => async`，`co(run) => run`。都猜想到这了，`async函数是什么呢?`，**它就是Generator的一种变体而已**。

## async函数带来了哪些优点

1. **内置执行器**，其实这点与 `co函数`所带来的是一样的，只不过 `async/await` 这种语法糖，进一步优化了这个问题。

2. **更好的语义**，比起 `*`与`generator`这种方式语义更好；`async`表示异步，`await`表示后面的任务要等一等。

3. **适用性更好**，

## async函数实现原理

```js
function sapwn (genFn) {
  return new Promise(function(resolve, reject) {
    const gen = genFn()
    function next (data) {
      const t = gen.next(data)
      if (!t.done) {
        // Tip: resolve res
        t.value.then((res) => next(res)).catch(err => reject(err))
        // Promise.resolve(t.value).then((res) => next(res)).catch(err => reject(err))
      } else {
        resolve(t.value)
      }
    }
    next()
  })
}
```
或者

```js
function sapwn (genFn) {
  return new Promise(function(resolve, reject) {
    const gen = genFn()
    function next (fn) {
      const t = fn()
      if (!t.done) {
        // Tip: resolve res
        t.value.then((res) => next(
          function() { return gen.next(res) }
        )).catch(err => reject(err))
      } else {
        resolve(t.value)
      }
    }
    next(function() { return gen.next() })
  })
}
```

阮一峰老师版本：

```js

function spawn(genF) {
  return new Promise(function(resolve, reject) {
    var gen = genF();
    function step(nextF) {
      try {
        var next = nextF();
      } catch(e) {
        return reject(e); 
      }
      if (next.done) {
        return resolve(next.value);
      } 
      Promise.resolve(next.value).then(function(v) {
        step(function() { return gen.next(v); });      
      }, function(e) {
        step(function() { return gen.throw(e); });
      });
    }
    step(function() { return gen.next(undefined); });
  });
}
```

## 注意点

但是，如果将 `forEach` 方法的参数改成 `async` 函数，也有问题。

```js
async function dbFuc(db) {
  let docs = [{}, {}, {}]

  // 可能得到错误结果
  docs.forEach(async function (doc) {
    await db.post(doc);
  });
}
```
上面代码可能不会正常工作，原因是这时三个 `db.post` 操作将是**并发执行**，也就是同时执行，而**不是继发执行**。正确的写法是采用 **for** 循环。
<!-- Why -->

```js
async function dbFuc(db) {
  let docs = [{}, {}, {}];
  for (let doc of docs) {
    await db.post(doc);
  }
}
```
如果确实希望多个**请求并发执行**，可以使用 `Promise.all` 方法。

```js
async function dbFuc(db) {
  let docs = [{}, {}, {}];
  Promise.all(docs.map((doc) => db.post(doc))).then(
    results => console.log(results)
  )
}
// or
async function dbFuc(db) {
  let docs = [{}, {}, {}];
  let promises = docs.map((doc) => db.post(doc));

  let results = await Promise.all(promises);
  console.log(results);
}
```

## 总结 

1. `async/await` 就是 `generator + promise` 的语法糖，并且上下使用 `await` 他一定是串行执行的。(疑问：可以使他们并行执行吗？在不是用 `Promise.all`)
2. `Promise.all` 是可以进行请求并发的，但是浏览器对同一域名的最大请求数是有控制的，那门如何来实现最大请求数控制呢？
