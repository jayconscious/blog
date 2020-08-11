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
    
    var baseArgs= ArrayPrototypeSlice.call(arguments, 1),
        baseArgsLength = baseArgs.length,
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          baseArgs.length = baseArgsLength; // reset to default base arguments
          baseArgs.push.apply(baseArgs, arguments);
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




