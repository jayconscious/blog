# Promise


## 3.1 什么是 Promise

一个很重要的好处是，可以把这个事件侦听对象提供给代码中多个独立的部分;在 foo(..) 完成的时候，它们都可以独立地得到通知，以执行下一步:

```js
var evt = foo( 42 );
// 让bar(..)侦听foo(..)的完成 
bar( evt );
// 并且让baz(..)侦听foo(..)的完成 
baz( evt );
```

对控制反转的恢复实现了更好的关注点分离，其中 bar(..) 和 baz(..) 不需要牵扯到 foo(..) 的调用细节。类似地，foo(..) 不需要知道或关注 bar(..) 和 baz(..) 是否存在， 或者是否在等待 foo(..) 的完成通知。

从本质上说，evt 对象就是分离的关注点之间一个中立的第三方协商机制。

**Promise“事件”**

你可能已经猜到，事件侦听对象 evt 就是 Promise 的一个模拟。
在基于 Promise 的方法中，前面的代码片段会让 foo(..) 创建并返回一个 Promise 实例，而 且这个 Promise 会被传递到 bar(..) 和 baz(..)。

::: tip
我们侦听的 Promise 决议“事件”严格说来并不算是事件(尽管它们实现目 标的行为方式确实很像事件)，通常也不叫作 "completion" 或 "error"。事 实上，我们通过 then(..) 注册一个 "then" 事件。或者可能更精确地说， then(..) 注册 **"fullfillment"** 和 / 或 **"rejection"** 事件，尽管我们并不会 在代码中直接使用这些术语。
:::

思考：
```js
function foo(x) {
    // 可是做一些可能耗时的工作
    // 构造并返回一个promise
    return new Promise( function(resolve,reject){
        // 最终调用resolve(..)或者reject(..)
        // 这是这个promise的决议回调 
    })
}
var p = foo( 42 )
bar( p )
baz( p )
```

::: tip
new Promise( function(..){ .. } )模式通常称为revealingconstructor (http://domenic.me/2014/02/13/the-revealing-constructor-pattern/)。 传 入 的 函 数 会立即执行(不会像 then(..) 中的回调一样异步延迟)，它有两个参数，在
本例中我们将其分别称为 resolve 和 reject。这些是 promise 的决议函数。 resolve(..) 通常标识完成，而 reject(..) 则标识拒绝。
:::

## 3.2 具有 then 方法的鸭子类型

既然 Promise 是通过 new Promise(..) 语法创建的，那你可能就认为可以通过 p instanceof Promise 来检查。但遗憾的是，这并不足以作为检查方法，原因有许多。

其中最主要的是，Promise 值可能是从其他浏览器窗口(iframe 等)接收到的。这个浏览 器窗口自己的 Promise 可能和当前窗口 /frame 的不同，因此这样的检查无法识别 Promise 实例。

在本章后面讨论 Promise 决议过程的时候，你就会了解为什么有能力识别和判断类似于 Promise 的值是否是真正的 Promise 仍然很重要。


根据一个值的形态(具有哪些属性)对这个值的类型做出一些假定。这种**类型检查(type check)**一般用术语**鸭子类型(duck typing)**来表示——“如果它看起来像只鸭子，叫起来像只鸭子，那它一定就是只鸭子”(参见本书的“类型和语法”部分)。于是，对 thenable 值的鸭子类型检测就大致类似于:

```js
if ( p !== null && ( typeof p === "object" || typeof p === "function") && typeof p.then === "function" ){
    // 假定这是一个thenable! 
} else {
    // 不是thenable
}
```

::: tip
我并不喜欢最后还得用 thenable 鸭子类型检测作为 Promise 的识别方案。还 有其他选择，比如 branding，甚至 anti-branding。
:::

## 3.3 Promise 信任问题

3.3.7 关于promise的信任问题  -  197




很可能前面的讨论现在已经完全“解决”(resolve，英语中也表示“决议”的意思)了你的 疑惑:Promise 为什么是可信任的，以及更重要的，为什么对构建健壮可维护的软件来说， 这种信任非常重要。

可一旦开始思考你在其上构建代码的机制具有何种程度的可预见性和可靠性时，你就会开始意识到回调的可信任基础是相当不牢靠

Promise 这种模式通过可信任的语义把回调作为参数传递，使得这种行为更可靠更合理。 通过把回调的控制反转反转回来，我们把控制权放在了一个可信任的系统(Promise)中， 这种系统的设计目的就是为了使异步编码更清晰



## 3.4 链式流

我们可以把多个 Promise 连接到一起以表示一系列异步步骤。

这种方式可以实现的关键在于以下两个 Promise 固有行为特性:

- 每次你对 Promise 调用 then(..)，它都会创建并返回一个新的 Promise，我们可以将其链接起来;

- 不管从 then(..) 调用的完成回调(第一个参数)返回的值是什么，它都会被自动设置 为被链接 Promise(第一点中的)的完成。(没懂)

先来解释一下这是什么意思，然后推导一下其如何帮助我们创建流程控制异步序列。考虑 如下代码:

```js
var p = Promise.resolve( 21 );

var p2 = p.then( function(v){
    console.log( v )
    // 用值42填充p2
    return v * 2
})
// 连接p2
p2.then( function(v){
    console.log( v )
})
// 21
// 42

```
```js
var p = Promise.resolve( 21 );
p.then( function(v){
    console.log( v );    // 21
    // 用值42完成连接的promise
    return v * 2; 
}).then( function(v){
    console.log(v)      // 42
})
// 这里是链接的promise
```

但这里还漏掉了一些东西。如果需要步骤 2 等待步骤 1 异步来完成一些事情怎么办?我们使用了立即返回 return 语句，这会立即完成链接的 promise。

```js

var p = Promise.resolve( 21 );

p.then( function(v){
    console.log( v )       // 21
    // 创建一个promise并将其返回
    return new Promise( function(resolve,reject){
        // 42
        console.log( v );
        resolve( v * 2 );
    })
    // 用值42填充
}).then( function(v){
    console.log( v );
})
```
让我们来简单总结一下使链式流程控制可行的 Promise 固有特性。
- 调用 Promise 的 then(..) 会自动创建一个新的 Promise 从调用返回。
- 在完成或拒绝处理函数内部，如果返回一个值或抛出一个异常，新返回的(可链接的) Promise 就相应地决议。
- 如果完成或拒绝处理函数返回一个 Promise，它将会被展开，这样一来，不管它的决议值是什么，都会成为当前 then(..) 返回的链接 Promise 的决议值。


## 3.6 Promise 模式

## 3.7 Promise API 概述


































