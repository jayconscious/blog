# 作用域闭包

## 启示

闭包是基于词法作用域书写代码时所产生的自然结果，你甚至不需要为了利用它们而有意 识地创建闭包。闭包的创建和使用在你的代码中随处可见。**你缺少的是根据你自己的意愿 来识别、拥抱和影响闭包的思维环境**。


## 实质问题

::: tip
**闭包定义：当函数可以记住并访问所在的词法作用域时，就产生了闭包，即使函数是在当前词法作用域之外执行。**
:::

示例如下：

```js
function foo() {
    var a = 2;
    function bar() {
        console.log( a ); // 2
    }
    bar(); 
}
foo();
```

我认为最准确地用来解释 bar() 对 a 的引用的方法是词法作用域的查找规则，而这些规则只是闭包的一部分。(但却 是非常重要的一部分!)（bar函数的执行并不是在其此法作用域之外，所以不是）

下面我们来看一段代码，清晰地展示了闭包:

```js
function foo() { 
    var a = 2;
    function bar() { 
        console.log( a );
    }
    return bar; 
}
var baz = foo();
baz(); // 2 —— 朋友，这就是闭包的效果。
```
bar函数的执行是在其此法作用域的外部执行的，虽然这个是通过baz这个标识符，但是引用调用了内部的函数 bar()

当然，无论使用何种方式对函数类型的值进行传递，当函数在别处被调用时都可以观察到 **闭包**。

示例如下：
```js
function foo() { 
    var a = 2;
    function baz() { 
        console.log( a ); // 2
    }
    bar( baz ); 
}
function bar(fn) {
    fn(); // 妈妈快看呀，这就是闭包!
}
```
把内部函数 baz 传递给 bar，当调用这个内部函数时(现在叫作 fn)，它涵盖的 foo() 内部作用域的闭包就可以观察到了，因为它能够访问 a。

示例如下：
```js
var fn;
function foo() {
    var a = 2;
    function baz() {
        console.log( a );
    }
    fn = baz; // 将 baz 分配给全局变量 
}

function bar() {
    fn(); // 妈妈快看呀，这就是闭包!
}
foo();
bar(); // 2
```
无论通过何种手段将内部函数传递到所在的词法作用域以外，它都会持有对原始定义作用域的引用，无论在何处执行这个函数都会使用闭包。

## 现在我懂了

前面的代码片段有点死板，并且为了解释如何使用闭包而人为地在结构上进行了修饰。但 我保证闭包绝不仅仅是一个好玩的玩具。你已经写过的代码中一定到处都是闭包的身影。 现在让我们来搞懂这个事实
代码如下：
```js
function wait(message) {
    setTimeout(function timer() {
        console.log( message );
    }, 1000 );
}
wait( "Hello, closure!" );
```
将一个内部函数(名为 timer)传递给 setTimeout(..)。timer 具有涵盖 wait(..) 作用域的闭包，因此还保有对变量 message 的引用。

或者，如果你很熟悉 jQuery(或者其他能说明这个问题的 JavaScript 框架)，可以思考下面 的代码:

```js
function setupBot(name, selector) {
    $( selector ).click( function activator() {
            console.log( "Activating: " + name );
        } 
    );
}
setupBot( "Closure Bot 1", "#bot_1" );
setupBot( "Closure Bot 2", "#bot_2" );
```

::: tip
**在定时器、事件监听器、 Ajax 请求、跨窗口通信、Web Workers 或者任何其他的异步(或者同步)任务中，只要使 用了回调函数，实际上就是在使用闭包!**
:::

> 思考：这些回调函数式如何执行的？

第 3 章介绍了 IIFE 模式。通常认为 IIFE 是典型的闭包例子，但根据先前对 闭包的定义，我并不是很同意这个观点。

```js
var a = 2;
(function IIFE() {
    console.log( a );
})();
```
虽然这段代码可以正常工作，但严格来讲它并不是闭包。为什么?**因为函数(示例代码中 的 IIFE)并不是在它本身的词法作用域以外执行的**。它在定义时所在的作用域中执行(而外部作用域，也就是全局作用域也持有 a)。a 是通过普通的词法作用域查找(RHS)而非闭包被发现的。

## 循环和闭包












