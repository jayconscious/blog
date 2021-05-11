---
title: Generator 函数
date: 2021-05-11
sidebar: auto
tags: 
 - ES6
categories:
 - Javascript
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

`yield` 表达式本身没有返回值，或者说总是返回 `undefined` 。 `next` 方法可以带一个参数，该参数就会被当作上一个 `yield` 表达式的返回值。






