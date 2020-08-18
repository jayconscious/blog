# 对象(下)

### 10.存在性

前面我们介绍过，如 myObject.a 的属性访问返回值可能是 undefined，但是这个值有可能是属性中存储的 undefined，也可能是因为属性不存在所以返回 undefined。那么如何区分这两种情况呢?

我们可以在不访问属性值的情况下判断对象中是否存在这个属性:

```js
var myObject = {
    a: 2
};
("a" in myObject); // true
("b" in myObject); // false
myObject.hasOwnProperty( "a" ); // true
myObject.hasOwnProperty( "b" ); // false
```
in 操作符会检查属性是否在对象及其 [[Prototype]] 原型链中(参见第 5 章)。相比之下， hasOwnProperty(..) 只会检查属性是否在 myObject 对象中，不会检查 [[Prototype]] 链。 在第 5 章讲解 [[Prototype]] 时我们会详细介绍这两者的区别。

所有的普通对象都可以通过对于 Object.prototype 的委托(参见第 5 章)来访问 hasOwnProperty(..)， 但 是 有 的 对 象 可 能 没 有 连 接 到 Object.prototype( 通 过 Object. create(null) 来创建——参见第 5 章)。在这种情况下，形如 myObejct.hasOwnProperty(..) 就会失败。









