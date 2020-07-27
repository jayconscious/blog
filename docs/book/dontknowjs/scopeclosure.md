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

要说明闭包，for 循环是最常见的例子。

```js
for (var i=1; i<=5; i++) { 
    setTimeout( function timer() {
        console.log( i );
    }, i*1000 );
}
// 隔一秒输出一个6
```

::: tip
首先解释 6 是从哪里来的。这个循环的终止条件是 i 不再 <=5。条件首次成立时 i 的值是 6。因此，输出显示的是循环结束时 i 的最终值。
仔细想一下，这好像又是显而易见的，延迟函数的回调会在循环结束时才执行。事实上， 当定时器运行时即使每个迭代中执行的是setTimeout(.., 0)，所有的回调函数依然是在循 环结束后才会被执行，因此会每次输出一个 6 出来。
:::

IIFE 会通过声明并立即执行一个函数来创建作用域。
```js
for (var i=1; i<=5; i++) { 
    (function() {
        setTimeout( 
            function timer() { 
                console.log( i );
            }, i*1000 );
    })();
}
```
::: tip
如果作用域是空的，那么仅仅将它们进行封闭是不够的。仔细看一下，我们的 IIFE 只是一 个什么都没有的空作用域。它需要包含一点实质内容才能为我们所用。
:::

```js
for (var i=1; i<=5; i++) { 
    (function(j) {
        setTimeout(
            function timer() { 
                console.log( j );
            }, j*1000 );
    })( i );
}
```
:::tip
当然，这些 IIFE 也不过就是函数，因此我们可以将 i 传递进去，如果愿意的话可以将变量名定为 j，当然也可以还叫作 i。无论如何这段代码现在可以工作了。
在迭代内使用 IIFE 会为每个迭代都生成一个新的作用域，使得延迟函数的回调可以将新的作用域封闭在每个迭代内部，每个迭代中都会含有一个具有正确值的变量供我们访问。
:::

## 重返块作用域

仔细思考我们对前面的解决方案的分析。我们使用 IIFE 在每次迭代时都创建一个新的作用域。换句话说，**每次迭代我们都需要一个块作用域。**第 3 章介绍了 let 声明，**可以用来劫持块作用域**，并且在这个块作用域中声明一个变量。

```js

for (var i=1; i<=5; i++) {
    let j = i; // 是的，闭包的块作用域! 
    setTimeout( function timer() {
        console.log( j );
    }, j*1000 );
}
```

## 模块

还有其他的代码模式利用闭包的强大威力，但从表面上看，它们似乎与回调无关。下面一起来研究其中最强大的一个: **模块**。

例如：
```js
function CoolModule() {
    var something = "cool";
    var another = [1, 2, 3];
    function doSomething() { 
        console.log( something );
    }
    function doAnother() {
        console.log( another.join( " ! " ) );
    }
    return {
        doSomething: doSomething,
        doAnother: doAnother
    }; 
}
var foo = CoolModule(); 
foo.doSomething();      // cool
foo.doAnother();        // 1 ! 2 ! 3
```

我们仔细研究一下这些代码。

::: tip
首先，CoolModule() 只是一个函数，必须要通过调用它来创建一个模块实例。**如果不执行外部函数，内部作用域和闭包都无法被创建。**

其次，CoolModule() 返回一个用对象字面量语法 { key: value, ... } 来表示的对象。**这个返回的对象中含有对内部函数而不是内部数据变量的引用**。我们保持内部数据变量是隐 藏且私有的状态。可以将这个对象类型的返回值看作本质上是模块的公共**API**。
:::


> 从模块中返回一个实际的对象并不是必须的，也可以直接返回一个内部函 数。jQuery 就是一个很好的例子。jQuery 和 $ 标识符就是 jQuery 模块的公共 API，但它们本身都是函数(由于函数也是对象，它们本身也可以拥有属性)。

::: tip
如果要更简单的描述，模块模式需要具备两个必要条件。

1. 必须有外部的封闭函数，该函数必须至少被调用一次(每次调用都会创建一个新的模块 实例)。

2. 封闭函数必须返回至少一个内部函数，这样内部函数才能在私有作用域中形成闭包，并 且可以访问或者修改私有的状态。
:::

上一个示例代码中有一个叫作 CoolModule() 的独立的模块创建器，可以被调用任意多次， 每次调用都会创建一个新的模块实例。当只需要一个实例时，可以对这个模式进行简单的改进来实现**单例模式**:

```js
var foo = (function CoolModule() { 
    var something = "cool";
    var another = [1, 2, 3];
    function doSomething() { 
        console.log( something );
    }
    function doAnother() {
        console.log( another.join( " ! " ) );
    }
    return {
        doSomething: doSomething,
        doAnother: doAnother
    }; 
})();
foo.doSomething(); // cool
foo.doAnother(); // 1 ! 2 ! 3
```
模块模式另一个简单但强大的用法是命名将要作为公共 API 返回的对象:

```js
var foo = (function CoolModule(id) { 
    function change() {
        // 修改公共 API
        publicAPI.identify = identify2;
    }
    function identify1() { 
        console.log( id );
    }
    function identify2() {
        console.log( id.toUpperCase() );
    }
    var publicAPI = { 
        change: change,
        identify: identify1
    };
    return publicAPI; 
})( "foo module" );

foo.identify(); // foo module
foo.change();
foo.identify(); // FOO MODULE
```
通过在模块实例的内部保留对公共 API 对象的内部引用，可以从内部对模块实例进行修 改，包括添加或删除方法和属性，以及修改它们的值。

## 现代的模块机制

大多数**模块依赖加载器** / **管理器**本质上都是将这种模块定义封装进一个友好的 API。这里并不会研究某个具体的库，为了宏观了解我会简单地介绍一些核心概念:

```js
var MyModules = (function Manager() {
    var modules = {};
    function define(name, deps, impl) {
        for (var i=0; i<deps.length; i++) {
            deps[i] = modules[deps[i]];
        }
        modules[name] = impl.apply( impl, deps );
    }
    function get(name) {
        return modules[name];
    }
    return {
        define: define,
        get: get 
    };
})();

```

::: tip
这段代码的核心是 **modules[name] = impl.apply(impl, deps)**。为了模块的定义引入了包装 函数(可以传入任何依赖)，并且将返回值，也就是模块的 API，储存在一个根据名字来管 理的模块列表中
:::

下面展示了如何使用它来定义模块:

```js
MyModules.define( "bar", [], function() {
    function hello(who) {
        return "Let me introduce: " + who; 
    }
    return {
        hello: hello
    }; 
});

MyModules.define( "foo", ["bar"], function(bar) {
    var hungry = "hippo";
    function awesome() {
        console.log( bar.hello( hungry ).toUpperCase() );
    }
    return {
        awesome: awesome
    };
});

var bar = MyModules.get( "bar" );
var foo = MyModules.get( "foo" );

console.log(bar.hello( "hippo" )); // Let me introduce: hippo

foo.awesome(); // LET ME INTRODUCE: HIPPO
```

::: tip
"foo" 和 "bar" 模块都是通过一个返回公共 API 的函数来定义的。"foo" 甚至接受 "bar" 的 实例作为依赖参数，并能相应地使用它。

为我们自己着想，应该多花一点时间来研究这些示例代码并完全理解闭包的作用吧。最重 要的是要理解模块管理器没有任何特殊的“魔力”。它们符合前面列出的模块模式的两个 特点:调用包装了函数定义的包装函数，并且将返回值作为该模块的 API。

换句话说，模块就是模块，即使在它们外层加上一个友好的包装工具也不会发生任何变化。
:::

## 未来的模块机制























