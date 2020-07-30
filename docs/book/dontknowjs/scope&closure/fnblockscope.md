# 函数作用域和块作用域

## 函数中的作用域

最常见的答案是 JavaScript 具有基于函数的作用域，意味着每声明 一个函数都会为其自身创建一个气泡，而其他结构都不会创建作用域气泡。比如：

```js
function foo(a) { 
    var b = 2;
    // 一些代码
    function bar() { // ...
    }
    // 更多的代码 
    var c = 3;
}
```
在这个代码片段中，foo(..) 的作用域气泡中包含了标识符 a、b、c 和 bar。无论标识符 声明出现在作用域中的何处，这个标识符所代表的变量或函数都将附属于所处作用域的气 泡。

::: tip
简单理解：在函数foo中可以访问到**b,****bar,****c,**,在foo函数之外并不能访问到内部的变量。
:::

## 隐藏内部实现

从所写的代码中挑选出一个任意的片段，然后用函数声明对它进行包装，实际 上就是把这些代码“隐藏”起来了。(可以参考node.js的模块的实现)

有很多原因促成了这种基于作用域的隐藏方法。它们大都是从最小特权原则中引申出来 的，也叫**最小授权**或最**小暴露原则**。这个原则是指在软件设计中，应该最小限度地暴露必 要内容，而将其他内容都“隐藏”起来，比如某个模块或对象的 API 设计。

```js
function doSomething(a) {
    b = a + doSomethingElse( a * 2 );
    console.log( b * 3 );
}
function doSomethingElse(a) { 
    return a - 1;
}
var b;
doSomething( 2 ); // 15
```
在这个实例中，**doSomethingElse** 为**doSomething**内部调用函数，给予外部作用域对 **b** 和 **doSomethingElse(..)** 的“访问权限”不仅 没有必要，而且可能是“危险”的。下面的示例更加合理
```js
function doSomething(a) { 
    function doSomethingElse(a) {
        return a - 1; 
    }
    var b;
    b = a + doSomethingElse( a * 2 );
    console.log( b * 3 );
}
doSomething( 2 ); // 15
```
## 函数作用域
我们已经知道，在任意代码片段外部添加包装函数，可以将内部的变量和函数定义“隐藏”起来，外部作用域无法访问包装函数内部的任何内容。例如

```js
var a = 2;
function foo() { 
    var a = 3; 
    console.log( a );
} 
foo();
console.log( a ); // 2
```

::: tip
必须声明一个具名函数 foo()，意味着 foo 这个名称本身“污染”了所在作用域(在这个 例子中是全局作用域)。
:::

JavaScript 提供了能够同时解决这两个问题的方案

1. 如下：

```js
var a = 2;
(function foo () {// <-- 添加这一行
    var a = 3;
    console.log( a );// 3 
})(); 
// <-- 以及这一行 
console.log( a ); // 2
```
函数会被当作函数表达式而不是一 个标准的函数声明来处理。

::: tip
区分函数声明和表达式最简单的方法是看 **function** 关键字出现在声明中的位 置(不仅仅是一行代码，而是整个声明中的位置)。**如果 function 是声明中 的第一个词，那么就是一个函数声明，否则就是一个函数表达式**。
:::

函数声明和函数表达式之间最重要的区别是它们的名称标识符将会绑定在何处.
比较一下前面两个代码片段。第一个片段中 foo 被绑定在所在作用域中，可以直接通过foo() 来调用它。第二个片段中 foo 被绑定在函数表达式自身的函数中而不是所在作用域中。
换句话说，**(function foo(){ .. })作为函数表达式意味着foo只能在..所代表的位置中 被访问**，外部作用域则不行。foo 变量名被隐藏在自身中意味着不会非必要地污染外部作 用域。

::: tip
在**匿名和具名**中，始终给**函数表达式命名是一个最佳实践**:
:::

## 立即执行函数表达式

这种模式很常见，几年前社区给它规定了一个术语:IIFE，代表立即执行函数表达式 (Immediately Invoked Function Expression)

IIFE 还有一种变化的用途是倒置代码的运行顺序，将需要运行的函数放在第二位，在 IIFE 执行之后当作参数传递进去。这种模式在 UMD(Universal Module Definition)项目中被广 泛使用。尽管这种模式略显冗长，但有些人认为它更易理解。

```js
var a = 2;
(function IIFE( def ) { 
    def( window );
})(function def( global ) {
    var a = 3;
    console.log( a ); // 3 
    console.log( global.a ); // 2
});
```

## 块作用域

尽管你可能连一行带有块作用域风格的代码都没有写过，但对下面这种很常见的 JavaScript 代码一定很熟悉:

```js
for (var i=0; i<10; i++) { 
    console.log( i );
}
// 变量 i 会被暴露到全局
```
#### try/catch
非常少有人会注意到 JavaScript 的 ES3 规范中规定 try/catch 的 catch 分句会创建一个块作用域，其中声明的变量仅在 catch 内部有效。

#### let
使用 let 进行的声明不会在块作用域中进行提升。声明的代码被运行之前，声明并不“存在”。
```js
{
    console.log( bar ); // ReferenceError! 
    let bar = 2;
}
```
1. **垃圾收集**
另一个块作用域非常有用的原因和闭包及回收内存垃圾的回收机制相关。这里简要说明一 下，而内部的实现原理，也就是闭包的机制会在第 5 章详细解释。
考虑以下代码:

```js
function process(data) {
// 在这里做点有趣的事情
}
var someReallyBigData = { .. };

process( someReallyBigData );

var btn = document.getElementById( "my_button" );

btn.addEventListener( "click", function click(evt) {
    console.log("button clicked");
}, /*capturingPhase=*/false );
```
::: tip
click 函数的点击回调并不需要 someReallyBigData 变量。理论上这意味着当 process(..) 执 行后，在内存中占用大量空间的数据结构就可以被垃圾回收了。但是，**由于 click 函数形成了一个覆盖整个作用域的闭包**，JavaScript 引擎极有可能依然保存着这个结构(取决于具体 实现)。
:::

块作用域可以打消这种顾虑，可以让引擎清楚地知道没有必要继续保存 someReallyBigData 了:
```js
function process(data) {
// 在这里做点有趣的事情
}
// 在这个块中定义的内容完事可以销毁! 
{
    let someReallyBigData = { .. }; 
    process( someReallyBigData );
}
var btn = document.getElementById( "my_button" );
    btn.addEventListener( "click", function click(evt){
         console.log("button clicked");
}, /*capturingPhase=*/false );
```
2. **let循环**
一个 let 可以发挥优势的典型例子就是之前讨论的 for 循环

```js
for (let i=0; i<10; i++) { 
    console.log( i );
}
console.log( i ); // ReferenceError
```
由于 let 声明附属于一个新的作用域而不是当前的函数作用域(也不属于全局作用域)，可以理解为块级作用域

#### const
除了 let 以外，ES6 还引入了 const，同样可以用来创建块作用域变量，但其值是固定的 (常量)
```js
var foo = true;
if (foo) {
    var a = 2;
    const b = 3; // 包含在 if 中的块作用域常量
    a = 3; // 正常!
    b = 4; // 错误! 
}
console.log( a ); // 3
console.log( b ); // ReferenceError!
// 但是类型是对象是可以修改的
```
## 总结
有些人认为块作用域不应该完全作为函数作用域的替代方案。两种功能应该同时存在，开发者可以并且也应该根据需要选择使用何种作用域，创造可读、可维护的优良代码(非常赞同~)



















