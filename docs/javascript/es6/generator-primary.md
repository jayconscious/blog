---
title: Generator 函数
date: 2021-05-11
sidebar: auto
tags: 
 - ES6
categories:
 - Javascript
 - asyncProgramming
---

## 简介
`Generator` 函数是 `ES6` 提供的一种异步编程解决方案，语法行为与传统函数完全不同。 
`Generator` 函数有多种理解角度。**语法上**，首先可以把它理解成， `Generator` 函数是一个状态机，`封装了多个内部状态`。
**形式上**， `Generator` 函数是一个普通函数，但是有两个特征。
1. `function` 关键字与函数名之间有一个星号；
2. 函数体内部使用 `yield` 表达式，定义不同的内部状态（ yield 在英语里的意思就是“产出”）

```js
function* helloWorldGenerator() {
    yield 'hello';
    yield 'world';
    return 'ending';
}
var hw = helloWorldGenerator()
hw.next()
// { value: 'hello', done: false }
hw.next()
// { value: 'world', done: false }
hw.next()
// { value: 'ending', done: true }
hw.next()
// { value: undefined, done: true }
```
总结一下，调用 `Generator` 函数，返回一个遍历器对象，代表 `Generator` 函数的内部指针。以后，每次调用遍历器对象的 `next` 方法，就会返回一个有着 `value` 和 `done` 两个属性的对象。 `value` 属性表示当前的内部状态的值，是 `yield` 表达式后面那个表达式的值； `done` 属性是一个布尔值，表示是否遍历结束。（Tip: return 也算一个 yield）


### yield 表达式

由于 `Generator` 函数返回的遍历器对象，只有调用 `next` 方法才会遍历下一个内部状态，所以其实提供了一种可以暂停执行的函数。 `yield` 表达式就是暂停标志。

遍历器对象的 `next` 方法的运行逻辑如下:
1. 遇到 `yield` 表达式，就暂停执行后面的操作，并将紧跟在 `yield` 后面的那个表达式的值，作为返回的对象的 `value` 属性值。
2. 下一次调用 `next` 方法时，再继续往下执行，直到遇到下一个 `yield` 表达式。
3. 如果没有再遇到新的 `yield` 表达式，就一直运行到函数结束，直到 `return` 语句为止，并将 `return` 语句后面的表达式的值，作为返回的对象的 `value` 属性值。
4. 如果该函数没有 `return` 语句，则返回的对象的 `value` 属性值为 `undefined`。

需要注意的是， `yield` 表达式后面的表达式，只有当调用 `next` 方法、内部指针指向该语句时才会执行，因此等于为 `JavaScript` 提供了手动的`“惰性求值”`（`Lazy Evaluation`）的语法功能。

### 与 Iterator 接口的关系

上一章说过，任意一个对象的 `Symbol.iterator` 方法，等于该对象的遍历器生成函数，调用该函数会返回该对象的一个遍历器对象。
由于 `Generator` 函数就是遍历器生成函数，因此可以把 `Generator` 赋值给对象的 `Symbol.iterator` 属性，从而使得该对象具有 `Iterator` 接口。

```js
var myIterable = {};
myIterable[Symbol.iterator] = function* () {
    yield 1;
    yield 2;
    yield 3;
};
console.log([...myIterable])
```
上面代码中， `Generator` 函数赋值给 `Symbol.iterator` 属性，从而使得 `myIterable` 对象具有了 `Iterator` 接口，可以被...运算符遍历了。

## next 方法的参数

`yield` 表达式本身没有返回值，或者说总是返回 `undefined`。 `next` 方法可以带一个参数，该参数就会被当作上一个 `yield` 表达式的返回值。

```js
function* foo(x) {
    var y = 2 * (yield (x + 1));
    var z = yield (y / 3);
    return (x + y + z);
}

var a = foo(5);
a.next() // Object{value:6, done:false}
a.next() // Object{value:NaN, done:false}
a.next() // Object{value:NaN, done:true}

var b = foo(5);
b.next() // { value:6, done:false }
b.next(12) // { value:8, done:false }
b.next(13) // { value:42, done:true }
```
上面代码中，第二次运行next方法的时候不带参数，导致 y 的值等于2 * undefined（即NaN），除以 3 以后还是NaN，因此返回对象的value属性也等于NaN。第三次运行Next方法的时候不带参数，所以z等于undefined，返回对象的value属性等于5 + NaN + undefined，即NaN。

如果向next方法提供参数，返回结果就完全不一样了。上面代码第一次调用b的next方法时，返回x+1的值6；第二次调用next方法，将上一次yield表达式的值设为12，因此y等于24，返回y / 3的值8；第三次调用next方法，将上一次yield表达式的值设为13，因此z等于13，这时x等于5，y等于24，所以return语句的值等于42。

::: tip
由于next方法的参数表示上**一个yield表达式**的返回值，所以在第一次使用next方法时，传递参数是无效的。
:::

## for...of 循环

`for...of` 循环可以自动遍历 `Generator` 函数运行时生成的 `Iterator` 对象，且此时不再需要调用 `next` 方法。

```js
function* foo() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
    yield 5;
    return 6;
}
for (let v of foo()) {
    console.log(v);
}
```

上面代码使用for...of循环，依次显示 5 个yield表达式的值。这里需要注意，一旦 `next` 方法的返回对象的 `done` 属性为 `true`， **for...of循环就会中止**，且不包含该返回对象，所以上面代码的return语句返回的6，不包括在for...of循环之中。

除了**for...of**循环以外，**扩展运算符（...）**、**解构赋值**和**Array.from**方法内部调用的，都是遍历器接口。这意味着，它们都可以将 `Generator` 函数返回的 `Iterator` 对象，作为参数。

## Generator.prototype.throw()

`Generator` 函数返回的遍历器对象，都有一个 `throw` 方法，可以在函数体外抛出错误，然后在 `Generator` 函数体内捕获。

```js
var g = function* () {
    try {
        yield;
    } catch (e) {
        console.log('内部捕获', e);
    }
};
var i = g();
i.next();
try {
    i.throw('a');
    i.throw('b');
} catch (e) {
    console.log('外部捕获', e);
}
```

上面代码中，遍历器对象i连续抛出两个错误。第一个错误被 Generator 函数体内的catch语句捕获。i第二次抛出错误，由于 Generator 函数内部的catch语句已经执行过了，不会再捕捉到这个错误了，所以这个错误就被抛出了 Generator 函数体，被函数体外的catch语句捕获。

## Generator.prototype.return()

`Generator` 函数返回的遍历器对象，还有一个 `return()` 方法，可以返回给定的值，并且终结遍历 `Generator` 函数。

```js
function* gen() {
    yield 1;
    yield 2;
    yield 3;
}
var g = gen();
console.log(g.next())
// { value: 1, done: false }
console.log(g.return('foo'))
// { value: "foo", done: true }
console.log(g.next() )
// { value: undefined, done: true }
```

## Generator 函数的this

`Generator` 函数总是返回一个遍历器，ES6 规定这个遍历器是 `Generator` 函数的实例，也继承了 `Generator` 函数的prototype对象上的方法

```js
function* g() {}

g.prototype.hello = function () {
  return 'hi!';
};

let obj = g();

obj instanceof g // true
obj.hello() // 'hi!'
```

上面代码表明，Generator 函数g返回的遍历器obj，是g的实例，而且继承了g.prototype。但是，**如果把g当作普通的构造函数，并不会生效**，因为g返回的总是遍历器对象，而不是this对象。

## 含义

### Generator 与状态机

`Generator` 是实现**状态机**的最佳结构。比如，下面的clock函数就是一个状态机

```js
var ticking = true;
var clock = function() {
    if (ticking) {
        console.log('Tick!')
    } else {
        console.log('Tock!')
    }
    ticking = !ticking
}
```
这个函数如果用 `Generator` 实现，就是下面这样：

```js
var clock = function* () {
    while (true) {
        console.log('Tick!');
        yield;
        console.log('Tock!');
        yield;
    }
};
const g = clock()
g.next()
g.next()
```
::: tip
上面的 `Generator` 实现与 ES5 实现对比，可以看到少了用来保存状态的外部变量 `ticking` ，这样就更简洁，**更安全（状态不会被非法篡改）、更符合函数式编程的思想**，在写法上也更优雅。Generator 之所以可以不用外部变量保存状态，是因为它本身就包含了一个状态信息，即目前是否处于暂停态。
:::

## Generator 与协程

`协程（coroutine）`是一种程序运行的方式，可以理解成“**协作的线程**”或“**协作的函数**”。
::: tip
协程既可以用单线程实现，也可以用多线程实现。前者是一种**特殊的子例程**，后者是一种**特殊的线程**。
:::

### 1. 协程与子例程的差异

传统的“子例程”（subroutine）采用堆栈式“后进先出”的执行方式，只有当调用的子函数完全执行完毕，才会结束执行父函数。协程与其不同，多个线程（单线程情况下，即多个函数）可以并行执行，但是只有一个线程（或函数）处于正在运行的状态，其他线程（或函数）都处于暂停态（suspended），线程（或函数）之间可以交换执行权。也就是说，一个线程（或函数）执行到一半，可以暂停执行，将执行权交给另一个线程（或函数），等到稍后收回执行权的时候，再恢复执行。**这种可以并行执行、交换执行权的线程（或函数），就称为协程**

从实现上看，在内存中，子例程只使用一个`栈（stack）`，而协程是同时存在多个栈，但只有一个栈是在运行状态，**也就是说，协程是以多占用内存为代价，实现多任务的并行**。


### 2. 协程与普通线程的差异

不难看出，协程适合用于多任务运行的环境。在这个意义上，它与普通的线程很相似，都有自己的执行上下文、可以分享全局变量。它们的不同之处在于，同一时间可以有多个线程处于运行状态，但是运行的协程只能有一个，其他协程都处于暂停状态。此外，**普通的线程是抢先式的，到底哪个线程优先得到资源，必须由运行环境决定，但是协程是合作式的，执行权由协程自己分配**。

由于 JavaScript 是单线程语言，只能保持一个调用栈。引入协程以后，每个任务可以保持自己的调用栈。**这样做的最大好处，就是抛出错误的时候，可以找到原始的调用栈。不至于像异步操作的回调函数那样，一旦出错，原始的调用栈早就结束**。

`Generator` 函数是 ES6 对协程的实现，但属于不完全实现。 `Generator` 函数被称为“**半协程**”（semi-coroutine），意思是只有 Generator 函数的调用者，才能将程序的执行权还给 `Generator` 函数。如果是完全执行的协程，任何函数都可以让暂停的协程继续执行。如果将 `Generator` 函数当作协程，完全可以将多个需要互相协作的任务写成 Generator 函数，它们之间使用 `yield` **表达式交换控制权**。


## Generator 与上下文

JavaScript 代码运行时，会产生一个全局的上下文环境（context，又称运行环境），包含了当前所有的变量和对象。然后，执行函数（或块级代码）的时候，又会在当前上下文环境的上层，产生一个函数运行的上下文，变成当前（active）的上下文，由此形成一个上下文环境的堆栈（context stack）。这个堆栈是“后进先出”的数据结构，最后产生的上下文环境首先执行完成，退出堆栈，然后再执行完成它下层的上下文，直至所有代码执行完成，堆栈清空。

Generator 函数不是这样，它执行产生的上下文环境，**一旦遇到yield命令，就会暂时退出堆栈，但是并不消失，里面的所有变量和对象会冻结在当前状态**。等到对它执行next命令时，这个上下文环境又会重新加入调用栈，冻结的变量和对象恢复执行。

比如下面的这个例子：
```js
function parent () {
    var clock = function* () {
        while (true) {
            console.log('Tick!');
            yield;
            console.log('Tock!');
            yield;
        }
    };
    const g = clock()
    g.next()
    console.log('111');
    console.log('222');
    console.log('333');
    g.next()
}
parent()
```

等遇到 `yield` 时， clock 上下文退出堆栈，内部状态冻结。第二次执行g.next()时，gen上下文重新加入堆栈，变成当前的上下文，重新恢复执行。


## 应用

### 异步操作的同步化表达

Generator 函数的暂停执行的效果，意味着可以把异步操作写在yield表达式里面，等到调用next方法时再往后执行。这实际上等同于不需要写回调函数了，因为异步操作的后续操作可以放在yield表达式下面，反正要等到调用next方法时再执行。所以，Generator 函数的一个重要实际意义就是用来处理异步操作，改写回调函数。

```js
function* loadUI() {
    showLoadingScreen();
    yield loadUIDataAsynchronously();
    hideLoadingScreen();
}
var loader = loadUI();
// 加载UI
loader.next()
// 卸载UI
loader.next()
```

```js
function asyncApi() {
    setTimeout(function() {
        g.next('haha')
    }, 2000)
}

function* getTest() {
    console.log('strat')
    const res = yield asyncApi();
    console.log(res);
    console.log('end')
}
const g = getTest()
g.next()
```

::: tip
在异步的回调中执行 `g.next`，感觉怪怪的，虽然它保证了代码执行的顺序，但是在写法上依然有点难受。所以在 `js` 中异步回调是没法正真意义上解决的，只是使用的各种障眼法来让我们书写的代码看上去是顺序结构的。
:::


