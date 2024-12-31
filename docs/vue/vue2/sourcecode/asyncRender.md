---
title: 异步渲染
date: 2021-03-17
sidebar: auto
tags: 
 - Vue
categories:
 - Vue2
---

### 背景

在这里我们引述一段 `vue` 官方文档介绍：

> 可能你还没有注意到，`Vue` 在更新 `DOM` 时是==异步执行==的。只要侦听到数据变化，Vue 将开启一个队列，并缓冲在同一事件循环中发生的所有数据变更。如果同一个 `watcher` 被多次触发，`只会被推入到队列中一次`。这种在缓冲时去除重复数据对于避免不必要的计算和 DOM 操作是非常重要的。然后，在下一个的事件循环`“tick”`中，`Vue` 刷新队列并执行实际 (已去重的) 工作。Vue 在内部对异步队列尝试使用原生的 `Promise.then`、`MutationObserver` 和 `setImmediate`，如果执行环境不支持，则会采用 `setTimeout(fn, 0)` 代替。

> 例如，当你设置 `vm.someData = 'new value'`，该组件不会立即重新渲染。当刷新队列时，组件会在下一个事件循环`“tick”`中更新。多数情况我们不需要关心这个过程，但是如果你想基于更新后的 DOM 状态来做点什么，这就可能会有些棘手。虽然 `Vue.js` 通常鼓励开发人员使用“数据驱动”的方式思考，避免直接接触 DOM，但是有时我们必须要这么做。为了在数据变化之后等待 Vue 完成更新 DOM，可以在数据变化之后立即使用 `Vue.nextTick(callback)`。这样回调函数将在 DOM 更新完成后被调用

::: tip
关于 `Vue.nextTick(callback)` 实现原理，我们已经在[怎么理解Vue中的$nextTick](https://jayconscious.github.io/blog/vue/vue2/question/aboutNextTick.html)讲过了，这部分我们将重点关注 `异步渲染的策略`
:::

### 源码分析

敲黑板啦，我们关注这句话：如果同一个 `watcher` 被多次触发，`只会被推入到队列中一次`。我们直接怼源码。

```js
/**
 * Subscriber interface.
 * 订户界面
 * Will be called when a dependency changes.
 * 依赖项更改时将被调用
 */
Watcher.prototype.update = function update() {
    /* istanbul ignore else */
    if (this.lazy) {
        this.dirty = true;
    } else if (this.sync) {
        // 同步更新视图，但是 this.sync 默认值是 false
        this.run();
    } else {
        // 异步将 watcher 推入到 queue 中，在下一个 "tick" 执行
        queueWatcher(this);
    }
}
```
我们再来看看 `queueWatcher(this)`

```js
/**
 * Push a watcher into the watcher queue.
 * 将一个 watcher push 到 watcher队列中
 * Jobs with duplicate IDs will be skipped unless it's
 * 具有重复ID的作业将被跳过，除非在刷新队列时将其推送。
 * pushed when the queue is being flushed.
 */
function queueWatcher(watcher) {
    var id = watcher.id;
    if (has[id] == null) {  // Todo: 为什么不是 undefined，而是null
        // 闭包变量 has 去重 id
        has[id] = true;
        if (!flushing) {
            queue.push(watcher);
        } else {
            // if already flushing, splice the watcher based on its id
            // 如果已经冲洗，则根据其ID拼接观察者
            // if already past its id, it will be run next immediately.
            // 如果已经超过其ID，它将立即立即运行。
            var i = queue.length - 1;
            while (i > index && queue[i].id > watcher.id) {
                i--;
            }
            queue.splice(i + 1, 0, watcher);
        }
        // queue the flush
        if (!waiting) {
            waiting = true;
            // 同步
            if (!config.async) {
                flushSchedulerQueue();
                return
            }
            nextTick(flushSchedulerQueue);
        }
    }
}
```

::: tip
1. 首先需要知道的是 `watcher` 执行 `update` 的时候，默认情况下肯定是异步的，它会做以下的两件事：
- 判断 `has` 对象中是否有这个 `watcher` 的 `id`
- 如果有的话是不需要把 `watcher` 加入 `queue` 中的，否则不做任何处理
2. `flushScheduleQueue` 就是更新视图，这里主要是使用 `nextTick`，开启一个微任务
:::

`watcher`这部分，我们会在响应式原理中解析它，并带你手写响应式源码。





