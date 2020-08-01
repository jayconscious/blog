# 关于this

> this 关键字是 JavaScript 中最复杂的机制之一。它是一个很特别的关键字，被自动定义在 所有函数的作用域中。但是即使是非常有经验的 JavaScript 开发者也很难说清它到底指向什么(任何足够先进的技术都和魔法无异。)


## 为什么要用this

下面我们来解释一下为什么要使用 this:

```js
function identify() {
    return this.name.toUpperCase();
}
function speak() {
    var greeting = "Hello, I'm " + identify.call( this ); 
    console.log( greeting );
}
var me = {
    name: "Kyle"
};
var you = {
    name: "Reader"
};

identify.call( me );    // KYLE
identify.call( you );   // READER
speak.call( me );       // Hello, 我是 KYLE 
speak.call( you );      // Hello, 我是 READER

```
这段代码可以在不同的上下文对象(me 和 you)中重复使用函数identify() 和 speak()， 不用针对每个对象编写不同版本的函数。
如果不使用 this，那就需要给 identify() 和 speak() 显式传入一个上下文对象。比如这样，

```js
function identify(context) {
    return context.name.toUpperCase();
}
function speak(context) {
    var greeting = "Hello, I'm " + identify( context );
    console.log( greeting );
}
identify( you ); // READER
speak( me ); // hello, I'm KYLE
```

## 2 误解

1. **指向自身**

人们很容易把 this 理解成指向函数自身，这个推断从英语的语法角度来说是说得通的。

那么为什么需要从函数内部引用函数自身呢?常见的原因是递归(从函数内部调用这个函 数)或者可以写一个在第一次被调用后自己解除绑定的事件处理器。

JavaScript 的新手开发者通常会认为，既然把函数看作一个对象(JavaScript 中的所有函数都是对象)，那就可以在调用函数时存储状态(属性的值)。这是可行的，有些时候也确实有用，但是在本书即将介绍的许多模式中你会发现，除了函数对象还有许多更合适存储状态的地方。

demo: this 并没有指向自身
```js
function foo(num) {
    console.log( "foo: " + num );// 记录 foo 被调用的次数
    this.count++;
    // foo.count++;  // 可以记录
}
foo.count = 0;
for (i=0; i < 10; i++) {
    if (i > 5) {
        foo( i )
        // foo.call(foo, i)
        // arguments.callee = foo  可以引用函数自身
    }
}
// foo: 6
// foo: 7
// foo: 8
// foo: 9
// foo 被调用了多少次?
console.log( foo.count ); // 0 -- 什么?!
console.log( count ); // NaN -- 什么?!
```

执行 foo.count = 0 时，的确向函数对象 foo 添加了一个属性 count。**但是函数内部代码 this.count 中的 this 并不是指向那个函数对象**，所以虽然属性名相同，**根对象却并不相同**.

::: tip
这段代码在无意中创建了一个全局变量 count，它的值为 NaN。(为什么它是全局的，为什么它的值是 NaN 而不是其他更合适的值?)
:::

2. **它的作用域**

需要明确的是，**this 在任何情况下都不指向函数的词法作用域**。在 JavaScript 内部，作用域确实和对象类似，可见的标识符都是它的属性。但是作用域“对象”无法通过 JavaScript 代码访问，它存在于 JavaScript 引擎内部。

思考一下下面的代码:

```js
function foo () {
    var a = 2
    this.bar()
}

function bar () {
    console.log(this.a)
}

foo() 
// 书上 ReferenceError: a is not defined  // 没有声明
// 谷歌浏览器 undefined   // 有声明，但是没有赋值
```
::: tip
this.bar(),这样调用能成功纯属意外.

试图通过this 联通 foo() 和 bar() 的词法作用域，从而让 bar() 可以访问 foo() 作用域里的变量 a ,是不可能的

每当你想要把 this 和词法作用域的查找混合使用时，一定要提醒自己，这是无法实现的。
:::

## this到底是什么

之前我们说过 this 是在运行时进行绑定的，并不是在编写时绑定，它的上下文取决于函数调 用时的各种条件。**this 的绑定和函数声明的位置没有任何关系，只取决于函数的调用方式。**

**当一个函数被调用时，会创建一个活动记录(有时候也称为执行上下文Todo:是啥？)。这个记录会包含函数在哪里被调用(调用栈)、函数的调用方式、传入的参数等信息。this 就是这个记 录的一个属性，会在函数执行的过程中用到。**


## 总结

学习 **this 的第一步是明白 this 既不指向函数自身也不指向函数的词法作用域**，抛开以前错误的假设和理解。

**this 实际上是在函数被调用时发生的绑定**，它指向什么完全取决于函数在哪里被调用。















