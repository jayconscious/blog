---
title: 怎么理解Vue中的$nextTick
date: 2021-02-20
sidebar: auto
tags: 
 - Vue
categories:
 - Vue2.x
---

### NextTick是什么

我们来看看官方的文档是如何介绍的

> 在下次 `DOM` 更新循环结束之后执行延迟回调。在修改数据之后立即使用这个方法，获取更新后的 `DOM`

```js
// 修改数据
vm.msg = 'Hello'
// DOM 还没有更新
Vue.nextTick(function () {
  // DOM 更新了
})

// 作为一个 Promise 使用 (2.1.0 起新增，详见接下来的提示)
Vue.nextTick()
  .then(function () {
    // DOM 更新了
  })
```

上面的官方示例已经很清楚的表明这个`API`的作用，即在这个`API`，传入一个 `cb` 获取到数据更新之后的真实 `DOM`。(只是为了我们在某些情况下需要操作真实的 `DOM`)


### 应用场景

我们来举个🌰

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>demo5</title>
    <script src="../../lib/vue.js"></script>
</head>
<body>
    <div id="app">
        {{ message }}
    </div>
    <script>
        const curVue = new Vue({
            data: {
                message: 'hello',
                list: ['a', 'b', 'c', 'd', 'e']
            },
            mounted () {
                this.message = 'world'
                console.log(document.getElementById('app').textContent)  // hello
                this.$nextTick(function () {
                    console.log(document.getElementById('app').textContent)  // world
                })
            },
        }).$mount('#app')
    </script>
</body>
</html>
```
在这里我们拿到了依然是之前的 `message`的内容，虽然已经有新的赋值，但是代码层没有拿到。但是在 `this.$nextTick` 的回调函数我们可以拿到更新之后的内容。所以要一探究尽，要看看源码层面是如何实现的。

::: tip
在我们的脑海中一定要有一个基本的认识，回调函数的执行和它内部上下文环境都是有由正真执行时决定的。
:::

### 源码分析
core/util/next-tick

```js
var isUsingMicroTask = false // 标识是否启用微任务
var callbacks = [] // 利用闭包存放 callback
var pending = false  // 利用闭包标识状态

// 定义微任务执行的要 callbacks
function flushCallbacks () {
    pending = false
    const copies = callbacks.slice(0) // 浅拷贝数组
    callbacks.length = 0  // 清空 callbacks
    for (var i = 0; i < copies.length; i++) {
        copies[i]()
    }
}

// Here we have async deferring wrappers using microtasks.
// 在这里，我们使用微任务异步延迟包装器
// In 2.5 we used (macro) tasks (in combination with microtasks).
// 2.5 的版本 我们使用微任务和宏任务结合的方式
// However, it has subtle problems when state is changed right before repaint
// 但是，在重绘之前更改状态时，它存在一些细微的问题
// (e.g. #6813, out-in transitions).
// Also, using (macro) tasks in event handler would cause some weird behaviors
// that cannot be circumvented (e.g. #7109, #7153, #7546, #7834, #8109).
// 然而如果使用宏任务的话，在事件处理器会有一些避不开的奇怪性
// So we now use microtasks everywhere, again.
// 所以，现在我们在任何地方都选择使用微任务
// A major drawback of this tradeoff is that there are some scenarios
// where microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690, which have workarounds 解决方法)
// or even between bubbling of the same event (#6566).
// 这种权衡的主要缺点是，在某些情况下，微任务的优先级过高，并且在假定的顺序事件之间或同一事件的冒泡之间都会触发
// Tip: 对于一些DOM的交互事件，如v-on绑定的事件回调处理函数的处理，会强制走macroTask。

var timerFunc;

// The nextTick behavior leverages the microtask queue, which can be accessed
// via either native Promise.then or MutationObserver.
// nextTick行为利用了微任务队列，该队列可以通过原生Promise进行访问或者是 变异观察者

// MutationObserver has wider support, however it is seriously bugged in
// UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
// completely stops working after triggering a few times... so, if native
// Promise is available, we will use it:
// MutationObserver 在 ios 9.3.3 以上，在 UIWebView 有bug
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
    var p = Promise.resolve();
    timerFunc = function () {
        p.then(flushCallbacks);
        // In problematic UIWebViews, Promise.then doesn't completely break, but
        // 在有问题的 UIWebViews 中, Promise.then没有完全打破,
        // it can get stuck in a weird state where callbacks are pushed into the
        // microtask queue but the queue isn't being flushed, until the browser
        // needs to do some other work, e.g. handle a timer. Therefore we can
        // "force" the microtask queue to be flushed by adding an empty timer.
        // 它可能会陷入怪异的状态，在这种状态下，回调被推送到微任务队列中，但是队列没有被刷新，
        // 直到浏览器需要执行其他一些工作，例如处理一个计时器。
        // 因此，我们可以通过添加一个空计时器来“强制”刷新微任务队列。
        if (isIOS) {
            setTimeout(noop);
        }
    };
    isUsingMicroTask = true;
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
        isNative(MutationObserver) ||
        // PhantomJS and iOS 7.x
        MutationObserver.toString() === '[object MutationObserverConstructor]'
    )) {
    // Use MutationObserver where native Promise is not available,
    // e.g. PhantomJS, iOS7, Android 4.4
    // (#6466 MutationObserver is unreliable in IE11)
    // MutationObserver 可以监听dom的变化，会开启一个微任务 https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver
    var counter = 1;
    var observer = new MutationObserver(flushCallbacks);
    var textNode = document.createTextNode(String(counter));
    observer.observe(textNode, {
        characterData: true
    });
    timerFunc = function () {
        counter = (counter + 1) % 2;
        textNode.data = String(counter);
    };
    isUsingMicroTask = true;
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
    // Tip: 该方法可能不会被批准成为标准，目前只有最新版本的 Internet Explorer 和Node.js 0.10+实现了该方法。它遇到了 Gecko(Firefox) 和Webkit (Google/Apple) 的阻力.
    // Fallback to setImmediate.
    // Technically it leverages the (macro) task queue,
    // but it is still a better choice than setTimeout.
    timerFunc = function () {
        setImmediate(flushCallbacks);
    };
} else {
    // Fallback to setTimeout.
    // 兜底使用 setTimeout 作为异步执行的容器
    timerFunc = function () {
        setTimeout(flushCallbacks, 0);
    };
}

function nextTick(cb, ctx) {
    var _resolve;
    // 传入的 cb 都会被存放在 callbacks 中
    callbacks.push(function () {
        if (cb) {
            try {
                cb.call(ctx);
            } catch (e) {
                handleError(e, ctx, 'nextTick');
            }
        } else if (_resolve) {
            _resolve(ctx);
        }
    });
    // 确保上一个 微任务开启执行，再进行下一个，否则只会将要执行的 cb 推入到 callbacks 中，(即多次调用nextTick，只开启一个 microtask)
    if (!pending) {
        pending = true;
        timerFunc();
    }
    // $flow-disable-line
    // 保证了 this.nextTick().then() 的调用
    if (!cb && typeof Promise !== 'undefined') {
        return new Promise(function (resolve) {
            _resolve = resolve;
        })
    }
}
```

其实这里还会牵涉到 vue的异步渲染，js 的事件队列，以及浏览器的UI渲染相关的内容我们后面在继续研究。





