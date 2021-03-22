---
title: 提升
date: 2020-07-22
sidebar: auto
tags: 
 - js
categories:
 - Javascript
---

## 先有鸡还是先有蛋

直觉上会认为 JavaScript 代码在执行时是由上到下一行一行执行的。但实际上这并不完全正确，有一种特殊情况会导致这个假设是错误的。

```js
// demo 1
a = 2;
var a; 
console.log( a ); // 2

// demo 2
console.log( a );  // undefined
var a = 2;
```
有上面的例子我们可以知道，js不是自上往下一步步执行的，那么到底发生了什么?看起来我们面对的是一个先有鸡还是先有蛋的问题。到底是声明(蛋)在前，还是赋值(鸡)在前?

## 编译器再度来袭

引擎会 在解释 JavaScript 代码之前首先对其进行编译。编译阶段中的一部分工作就是找到所有的 声明，并用合适的作用域将它们关联起来。第 2 章中展示了这个机制，也正是词法作用域 的核心内容。

我们的第一个代码片段会以如下形式进行处理:

```js
var a;
a = 2; 
console.log( a );
```
我们的第二个代码片段实际是按照以下流程处理的:

```js
var a;
console.log( a ); // undefined
a = 2; 
```

::: tip
这个过程就好像变量和函数声明从它们在代码中出现的位置被“移动” 到了最上面。这个过程就叫作**提升**。
:::

下面代码：
```js
foo(); // 不是 ReferenceError, 而是 TypeError: foo is not a function
var foo = function bar() { // ...
};
```

::: tip
同时也要记住，即使是具名的函数表达式，**名称标识符在赋值之前也无法在所在作用域中**
:::
下面代码：
```js
foo(); // TypeError 会中断js的执行?
bar(); // ReferenceError
var foo = function bar() { // ...
};
```
上面的代码，实际上是这样的
```js
var foo;
foo(); // TypeError
bar(); // ReferenceError
foo = function() {
    var bar = ...self... // ...
}
```

## 函数优先

::: tip
函数声明和变量声明都会被提升。但是一个值得注意的细节(这个细节可以出现在有多个“重复”声明的代码中)是**函数会首先被提升**，然后才是变量。
:::
下面代码：
```js
foo(); // 1
var foo;
function foo() { 
    console.log( 1 );
}
foo = function() { 
    console.log( 2 );
};
```
::: tip
**一个普通块内部的函数声明通常会被提升到所在作用域的顶部**，这个过程不会像下面的代 码暗示的那样可以被条件判断所控制:
:::

```js
foo(); // "b"  TypeError: foo is not a function 在谷歌浏览器中
var a = true;
if (a) {
    function foo() { console.log("a"); } }
else {
    function foo() { console.log("b"); }
}
```
::: warning
**因此应该 尽可能避免在块内部声明函数。**
:::

## 总结

我们习惯将var a = 2;看作一个声明，而实际上JavaScript引擎并不这么认为。它将var a和 a = 2 当作两个单独的声明，第一个是编译阶段的任务，而第二个则是执行阶段的任务。
这意味着无论作用域中的声明出现在什么地方，都将在代码本身被执行前首先进行处理。 可以将这个过程形象地想象成所有的声明(变量和函数)都会被“移动”到各自作用域的 最顶端，这个过程被称为提升。




