# this全面解析(上)

> 每个函数的 this 是在调用时被绑定的，完全取决于函数的调用位置(也就是函数的调用方法)。

## 调用位置

在理解 this 的绑定过程之前，首先要理解调用位置:**调用位置就是函数在代码中被调用的位置(而不是声明的位置)**。只有仔细分析调用位置才能回答这个问题:这个 this 到底引用的是什么?

最重要的是要分析调用栈(就是为了到达当前执行位置所调用的所有函数)。**我们关心的调用位置就在当前正在执行的函数的前一个调用中**

下面我们来看看到底什么是调用栈和调用位置:

```js
function baz() {
    debugger
    // 当前调用栈是:baz
    // 因此，当前调用位置是全局作用域
    console.log( "baz" );
    bar(); // <-- bar 的调用位置 
}

function bar() {
    debugger
    // 当前调用栈是 baz -> bar
    // 因此，当前调用位置在 baz 中
    console.log( "bar" );
    foo(); // <-- foo 的调用位置 
}

function foo() {
    debugger
    // 当前调用栈是 baz -> bar -> foo 
    // 因此，当前调用位置在 bar 中
    console.log( "foo" );
}
baz(); // <-- baz 的调用位置
```
![image](/blog/assets/img/callstack.png)

使用开 发者工具得到调用栈，**然后找到栈中第二个元素**（就是这里的bar），这就是真正的调用位置。

## 绑定规则

你必须找到调用位置，然后判断需要应用下面四条规则中的哪一条。我们首先会分别解释这**四条规则**，然后解释多条规则都可用时它们的优先级如何排列。

### 1.默认绑定

首先要介绍的是最常用的函数调用类型:**独立函数调用**。可以把这条规则看作是无法应用其他规则时的默认规则

```js
function foo() { 
    console.log( this.a );
}
var a = 2; 
foo(); // 2
```
在全局声明一个变量等同于在全局对象(window)的一个同名属性,所有 this.a = window.a = a; 可以通过分析调用位置来看看 foo() 是如何调 用的。在代码中，foo() 是直接使用不带任何修饰的函数引用进行调用的，因此只能使用**默认绑定**，无法应用其他规则

```js
function foo() {
    "use strict"; // 严格模式 在这个函数内部
    console.log( this.a );
}
var a = 2;
foo(); // Uncaught TypeError: Cannot read property 'a' of undefined
```

这里有一个微妙但是非常重要的细节，虽然 this 的绑定规则完全取决于调用位置，**但是只有 foo() 运行在非 strict mode 下时**，默认绑定才能绑定到全局对象;在严格模式下调用 foo() 则不影响默认绑定:

```js
function foo() { 
    console.log( this.a );
}
var a = 2;
(function(){
    "use strict";
    foo(); // 2
})();
```

### 2.隐式绑定

另一条需要考虑的规则是调用位置是否有**上下文对象**，或者说是否被某个对象拥有或者包含，不过这种说法可能会造成一些误导。

```js
function foo() { 
    console.log( this.a );
}
var obj = { 
    a: 2,
    foo: foo 
};
obj.foo(); // 2
```
但是无论是直接在 obj 中定义还是先定义再添加为引用属性，这个函数严格来说都不属于 obj 对象。

**然而，调用位置会使用 obj 上下文来引用函数，因此你可以说函数被调用时 obj 对象“拥 有”或者“包含”它。**

::: tip
当 foo() 被调用时，它的前面确实加上了对 obj 的引用,当函数引用有上下文对象时，隐式绑定规则会把函数调用中的 this 绑定到这个上下文对象。因为调用 foo() 时 this 被绑定到 obj，因此 this.a 和 obj.a 是一样的。
:::

对象属性引用链中只有**上一层**或者说**最后一层**在调用位置中起作用


```js
function foo() { 
    console.log( this.a );
}
var obj2 = { 
    a: 42,
    foo: foo 
};
var obj1 = { 
    a: 2,
    obj2: obj2 
};
obj1.obj2.foo(); // 42
```
##### 隐式丢失

一个最常见的 this 绑定问题就是**被隐式绑定的函数会丢失绑定对象**，也就是说它会应用默认绑定，从而把 this 绑定到全局对象或者 undefined 上，取决于是否是严格模式。

```js
function foo() { 
    console.log( this.a );
}
var obj = { 
    a: 2,
    foo: foo 
    // foo: foo.bind(obj) Todo：为什么bind也不可以呢？
};
var bar = obj.foo; // 函数别名!
var a = "oops, global"; // a 是全局对象的属性 
bar(); // "oops, global"

```
虽然 bar 是 obj.foo 的一个引用，但是实际上，它引用的是 foo 函数本身，因此此时的 bar() 其实是一个**不带任何修饰的函数调用**，因此应用了默认绑定。

一种更微妙、更常见并且更出乎意料的情况发生在传入回调函数时:
```js
function foo() { 
    console.log( this.a );
}
function doFoo(fn) {
    // fn 其实引用的是 foo
    fn(); // <-- 调用位置!
}
var obj = {
    a: 2,
    foo: foo 
};

var a = "oops, global"; // a 是全局对象的属性 
doFoo( obj.foo ); // "oops, global"
```
参数传递其实就是一种隐式赋值，因此我们传入函数时也会被隐式赋值

如果把函数传入语言内置的函数而不是传入你自己声明的函数，会发生什么呢?结果是一 样的，没有区别:

```js
function foo() { 
    console.log( this.a );
}
var obj = { 
    a: 2,
    foo: foo 
};
var a = "oops, global"; // a 是全局对象的属性 
setTimeout( obj.foo, 100 ); // "oops, global"
```
JavaScript 环境中内置的 setTimeout() 函数实现和下面的伪代码类似:
```js
function setTimeout(fn,delay) { 
    // 等待 delay 毫秒
    fn(); // <-- 调用位置!
}
```
回调函数丢失 this 绑定是非常常见的。除此之外，还有一种情 况 this 的行为会出乎我们意料:调用回调函数的函数可能会修改 this。**在一些流行的 JavaScript 库中事件处理器常会把回调函数的 this 强制绑定到触发事件的 DOM 元素上**（比如：fn.call(this, ...)）。 这在一些情况下可能很有用，但是有时它可能会让你感到非常郁闷。

### 3.显式绑定

JavaScript 中的“所有”函数都有一些有用的特性(这和它们的 [[Prototype]] 有关——之后 我们会详细介绍原型)，可以用来解决这个问题。

可以使用函数的 call(..) 和 apply(..) 方法。

严格来说，JavaScript 的宿主环境有时会提供一些非常特殊的函数，它们 并没有这两个方法。但是这样的函数非常罕见，JavaScript 提供的绝大多数函数以及你自己创建的所有函数都可以使用 call(..) 和 apply(..) 方法。

这两个方法是如何工作的呢?它们的第一个参数是一个对象，是给 this 准备的，接着在调 用函数时将其绑定到 this。**因为你可以直接指定 this 的绑定对象，因此我们称之为显式绑定**

```js
function foo() { 
    console.log( this.a );
}
var obj = { 
    a:2
};
foo.call( obj ); // 2
```
通过 foo.call(..)，我们可以在调用 foo 时强制把它的 this 绑定到 obj 上。

::: tip
如果你传入了一个原始值(字符串类型、布尔类型或者数字类型)来当作 this 的绑定对象，这个原始值会被转换成它的对象形式(也就是new String(..)、new Boolean(..)或者 new Number(..))。这通常被称为*“**装箱**”*。
:::

**可惜，显式绑定仍然无法解决我们之前提出的丢失绑定问题(因为回调函数的执行或者说调用时期我们是不能改变的)。**

- **硬绑定**
但是显式绑定的一个变种可以解决这个问题。
```js
function foo () {
    console.log(this.a)
}
var obj = {
    a: 2
}
var bar = function () {
    foo.call(obj)
}
bar() // 2

setTimeout(bar, 100) // 2
bar.apply(window)    // 2
```
我们来看看这个变种到底是怎样工作的。我们创建了函数 bar()，并在它的内部手动调用 了 foo.call(obj)，因此强制把 foo 的 this 绑定到了 obj。无论之后如何调用函数 bar，它总会手动在 obj 上调用 foo。这种绑定是一种显式的强制绑定，因此我们称之为**硬绑定**。

硬绑定的典型应用场景就是创建一个包裹函数，负责接收参数并返回值:

```js
function foo (something) {
    return this.a + something
}
var obj = {
    a: 2
}

var bar = function () {
    return foo.apply(obj, arguments)
}
const b = bar(3)
console.log(b) // 5 这样设计代码的优势是什么？封装一些默认的参数逻辑，比如基于不同的环境参数将obj记录下来，抽象一层出来
```
另一种使用方法是创建一个可以重复使用的辅助函数:
```js
function foo (something) {
    console.log(this.a, something)
    return this.a + something
}
function weAreTogether (fn, obj) {
    return function () {
        return fn.apply(obj, arguments)
    }
}
var obj = {
    a: 1
}
const bar = weAreTogether(foo, obj)
console.log(bar(1)) // 2 如果有加工函数需要，可以将其抽象出来
```
由于**硬绑定**是一种非常常用的模式，所以 ES5 提供了内置的方法 **Function.prototype.bind**， 它的用法如下:

```js
function foo (something) {
    console.log(this.a, something)
    return this.a + something
}
var obj = {
    a: 1
}
const bar = foo.bind(obj)

console.log(bar(2)) // 3

```
- **API调用的“上下文”**

第三方库的许多函数，以及 JavaScript 语言和宿主环境中许多新的内置函数，都提供了一个可选的参数，通常被称为“上下文”(context)，其作用和 bind(..) 一样，确保你的回调函数使用指定的 this。例如：

```js
function foo(el) {
    console.log( el, this.id );
}
var obj = {
    id: "awesome"
};
// 调用 foo(..) 时把 this 绑定到 obj 
[1, 2, 3].forEach( foo, obj );
// 1 awesome 2 awesome 3 awesome
// [1, 2, 3].forEach(item => {
//   foo.call(obj, item)
// });  // 不然那要这样写
// forEach()方法的第二个参数会自动绑定到第一个参数的回调函数中
```
这些函数实际上就是通过 call(..) 或者 apply(..) 实现了显式绑定

### 4.new绑定

这是第四条也是最后一条 this 的绑定规则，在讲解它之前我们首先需要澄清一个非常常见的关于 JavaScript 中函数和对象的**误解**。

JavaScript 也有一个 new 操作符，使用方法看起来也和那些面向类的语言一样，绝大多数开 发者都认为 JavaScript 中 new 的机制也和那些语言一样。**然而，JavaScript 中 new 的机制实际上和面向类的语言完全不同**

Q: 其他语言的new和Js的new有什么区别。

**首先我们重新定义一下 JavaScript 中的“构造函数”。在 JavaScript 中，构造函数只是一些使用 new 操作符时被调用的函数。它们并不会属于某个类，也不会实例化一个类。实际上， 它们甚至都不能说是一种特殊的函数类型，它们只是被 new 操作符调用的普通函数而已。**

首先我们重新定义一下 JavaScript 中的“构造函数”。在 JavaScript 中，构造函数只是一些 使用 new 操作符时被调用的函数。它们并不会属于某个类，也不会实例化一个类。实际上， 它们甚至都不能说是一种特殊的函数类型，它们只是被 new 操作符调用的普通函数而已。
举例来说，思考一下 Number(..) 作为构造函数时的行为，ES5.1 中这样描述它:
15.7.2 Number 构造函数
当 Number 在 new 表达式中被调用时，它是一个构造函数:它会初始化新创建的对象。
所以，包括内置对象函数(比如 Number(..)，详情请查看第 3 章)在内的所有函数都可 以用 new 来调用，这种函数调用被称为构造函数调用。这里有一个重要但是非常细微的区 别:实际上并不存在所谓的“构造函数”，**只有对于函数的“构造调用”**。

使用 new 来调用函数，或者说发生构造函数调用时，会自动执行下面的操作。

1. 创建(或者说构造)一个全新的对象。
2. 这个新对象会被执行[[Prototype]]连接。
3. 这个新对象会绑定到函数调用的this。
4. 如果函数没有返回其他对象，那么new表达式中的函数调用会自动返回这个新对象。

```js
function foo(a) { 
    this.a = a;
}
var bar = new foo(2); 
console.log( bar.a ); // 2
```

使用 new 来调用 foo(..) 时，我们会构造一个新对象并把它绑定到 foo(..) 调用中的 this 上。new 是最后一种可以影响函数调用时 this 绑定行为的方法，我们称之为 new 绑定。



























