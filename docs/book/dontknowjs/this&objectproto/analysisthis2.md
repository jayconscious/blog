# this全面解析(下)

## 优先级

已经了解了函数调用中 this 绑定的四条规则，为了 解决这个问题就必须给这些规则设定优先级，默认绑定的优先级是四条规则中最低的，所以我们可以先不考虑它。

隐式绑定和显式绑定哪个优先级更高?我们来测试一下:

```js
function foo() {
    console.log( this.a );
}
var obj1 = {
    a: 2,
    foo: foo 
};
var obj2 = {
    a: 3,
    foo: foo
};
obj1.foo(); // 2
obj2.foo(); // 3

obj1.foo.call(obj2) // 3
obj2.foo.call(obj1) // 2
```
可以看到，显式绑定优先级更高，也就是说在判断时应当先考虑是否可以存在显式绑定(Todo: 真的吗？bind())

现在我们需要搞清楚 new 绑定和隐式绑定的优先级谁高谁低:

```js
function foo(something) {
    this.a = something;
}
var obj1 = {
    foo: foo
};
var obj2 = {};
obj1.foo( 2 );
console.log( obj1.a ); // 2

obj1.foo.call( obj2, 3 );   // 显示绑定的优先级大于隐形
console.log( obj2.a ); // 3

var bar = new obj1.foo( 4 ); 
console.log( obj1.a ); // 2 
console.log( bar.a ); // 4  // new绑定的优先级大于隐形
```

但是 new 绑定和显式绑定谁的优先级更高呢?

> new 和 call/apply 无法一起使用，因此无法通过 new foo.call(obj1) 来直接 进行测试。但是我们可以使用硬绑定来测试它俩的优先级。

这样看起来硬绑定(也是显式绑定的一种)似乎比 new 绑定的优先级更高，无法使用 new 来控制 this 绑定。我们看看是不是这样:

```js
function foo(something) { 
    this.a = something;
}
var obj1 = {};
var bar = foo.bind( obj1 ); 
bar( 2 );
console.log( obj1.a ); // 2
var baz = new bar(3); 
console.log( obj1.a ); // 2 
console.log( baz.a ); // 3
```
相反，new 修改了硬绑定(到 obj1 的)调用 bar(..) 中的 this。因为使用了 new 绑定，我们得到了一个名字为 baz 的新对象，并且 baz.a 的值是 3。

实际上，**ES5 中内置的 Function.prototype.bind(..) 更加复杂**。下面是 MDN 提供的一种bind(...) 实现，

```js
if (!Function.prototype.bind) {
    (function (){
        var slice = Function.prototype.slice
        Function.prototype.bind = function () {
            var thatFn = this, obj = arguments[0], thatArgs = slice.call(arguments, 1)
            if (typeof thatFn !== 'function') {
                throw new TypeError('illegal arguments: first arguments is not function!')
            }
            return function () {
                const funcArgs = thatArgs.concat(slice.call(arguments))
                thatFn.apply(obj, funcArgs)
            }
        }
    })()
}
```
::: tip
由于 polyfill 并不是内置函数，所以无法创建一个不包含 .prototype 的函数，因此会具有一些**副作用**。如果你要在 new 中使用硬绑定函数并且依赖 polyfill 代码的话，一定要非常小心
:::

下面是 new 修改 this 的相关代码:

```js
this instanceof fNOP &&
oThis ? this : oThis 
// ... 以及:
fNOP.prototype = this.prototype; 
fBound.prototype = new fNOP();
```
我们并不会详细解释这段代码做了什么(这非常复杂并且不在我们的讨论范围之内)，不过简单来说，**这段代码会判断硬绑定函数是否是被 new 调用，如果是的话就会使用新创建 的 this 替换硬绑定的 this。**

MDN上另外一种polyfill

```js
if (!Function.prototype.bind) (function(){
  var ArrayPrototypeSlice = Array.prototype.slice;
  Function.prototype.bind = function(otherThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }
    var baseArgs= ArrayPrototypeSlice.call(arguments, 1), // 会发放入到返回函数(exotic function object（怪异函数对象，ECMAScript 2015 中的术语）)实参中
        baseArgsLength = baseArgs.length,
        fToBind = this,  // 要绑定的函数
        fNOP    = function() {},
        fBound  = function() {
            baseArgs.length = baseArgsLength; // reset to default base arguments
            baseArgs.push.apply(baseArgs, arguments); // 合并返回函数执行时的参数
            // isPrototypeOf()方法检查另一个对象的原型链中是否存在某个对象
            // 判断 硬绑定函数是否是被 new 调用
            return fToBind.apply(
                fNOP.prototype.isPrototypeOf(this) ? this : otherThis, baseArgs
            );
        };

    if (this.prototype) {
        // Function.prototype doesn't have a prototype property
        fNOP.prototype = this.prototype; 
    }
    fBound.prototype = new fNOP();

    return fBound;
  };
})();
```

Q: 那么，为什么要在 new 中使用硬绑定函数呢?直接使用普通函数不是更简单吗?
A: 之所以要在 new 中使用硬绑定函数，**主要目的是预先设置函数的一些参数**，这样在使用 new 进行初始化时就可以只传入其余的参数。bind(..) 的功能之一就是可以把除了第一个 参数(第一个参数用于绑定 this)之外的其他参数都传给下层的函数(**这种技术称为“部 分应用”，是“柯里化”的一种**)。例如：
```js
function foo(p1,p2) { 
    this.val = p1 + p2;
}
var bar = foo.bind( null, "p1" );
// 之所以使用 null 是因为在本例中我们并不关心硬绑定的 this 是什么 
// 反正使用 new 时 this 会被修改
var baz = new bar('p2')
console.log(baz.val) // p1p2
```
## 判断this

现在我们可以根据优先级来判断函数在某个调用位置应用的是哪条规则。可以按照下面的顺序来进行判断:

1. 函数是否在new中调用(new绑定)?如果是的话this绑定的是新创建的对象。var bar = new foo()

2. 函数是否通过call、apply(显式绑定)或者硬绑定调用?如果是的话，this绑定的是指定的对象。var bar = foo.call(obj2)

3. 函数是否在某个上下文对象中调用(隐式绑定)?如果是的话，this 绑定的是那个上下文对象。var bar = obj1.foo()

4. 如果都不是的话，使用默认绑定。如果在严格模式下，就绑定到undefined，否则绑定到全局对象。

::: tip
就是这样。对于正常的函数调用来说，理解了这些知识你就可以明白 this 的绑定原理了。不过......凡事总有例外。
:::

## 绑定例外

在某些场景下 this 的绑定行为会出乎意料，你认为应当应用其他绑定规则时，**实际上应用的可能是默认绑定规则**。

### 被忽略的this
如果你把 null 或者 undefined 作为 this 的绑定对象传入 call、apply 或者 bind，这些值在调用时会被忽略，实际应用的是默认绑定规则:

```js
function foo() { 
    console.log( this.a );
}
var a = 2;
foo.call( null ); // 2 真的是2
```
Q: 那么什么情况下你会传入 null 呢?
A: 一种非常常见的做法是使用 apply(..) 来“展开”一个数组，并当作参数传入一个函数。类似地，bind(..) 可以对参数进行柯里化(预先设置一些参数)，这种方法有时非常有用:
```js
// 1
const arr = []
arr.push(2, 3, 4) || Array.prototype.push.call(arr, [2, 3, 4])
// 2
function foo(a,b) {
    console.log( "a:" + a + ", b:" + b );
}
// 把数组“展开”成参数
foo.apply( null, [2, 3] ); // a:2, b:3
// 使用 bind(..) 进行柯里化
var bar = foo.bind( null, 2 ); 
bar( 3 ); // a:2, b:3
```
这两种方法都需要传入一个参数当作 this 的绑定对象。如果函数并不关心 this 的话，你仍然需要传入一个占位值，这时 null 可能是一个不错的选择，就像代码所示的那样。

::: tip
可以用 ... 操作符代替 apply(..) 来“展 开”数组，foo(...[1,2]) 和 foo(1,2) 是一样的。可惜，在 ES6 中没有柯里化的相关语法，因此还是需要使用 bind(..)。
:::

#### 更安全的this















