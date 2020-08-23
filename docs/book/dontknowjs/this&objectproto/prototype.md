# 原型

## [[Prototype]]

JavaScript 中的对象有一个特殊的 [[Prototype]] 内置属性，其实就是对于其他对象的引用。几乎所有的对象在创建时 [[Prototype]] 属性都会被赋予一个非空的值。

```js
var myObject = { 
    a:2
};

myObject.a; // 2
```
[[Prototype]] 引用有什么用呢? 当你试图引用对象的属性时会触发[[Get]] 操作，比如 myObject.a。对于默认的 [[Get]] 操作来说，第一步是检查对象本身是否有这个属性，如果有的话就使用它。

::: tip
ES6 中的 Proxy 超出了本书的范围(但是在本系列之后的书中会介绍)，但是要注意，如果包含 Proxy 的话，我们这里对 [[Get]] 和 [[Put]] 的讨论就不适用。
:::

但是如果 a 不在 myObject 中，就需要使用对象的 [[Prototype]] 链了。

对于默认的 [[Get]] 操作来说，如果无法在对象本身找到需要的属性，就会继续访问对象的 [[Prototype]] 链:

```js
var anotherObject = { 
    a:  2
};
// 创建一个关联到 anotherObject 的对象
var myObject = Object.create( anotherObject ); 
myObject.a; // 2
```

::: tip
稍后我们会介绍 Object.create(..) 的原理，现在只需要知道它会创建一个 对象并把这个对象的 [[Prototype]] 关联到指定的对象。
:::

现在 myObject 对象的 [[Prototype]] 关联到了 anotherObject。显然 myObject.a 并不存在， 但是尽管如此，属性访问仍然成功地(在 anotherObject 中)找到了值 2。

这个过程会持续到找到匹配的属性名或者查找完整条 [[Prototype]] 链。如果是后者的话， [[Get]] 操作的返回值是 undefined。

使用 for..in 遍历对象时原理和查找 [[Prototype]] 链类似，任何可以通过原型链访问到 (并且是 enumerable，参见第 3 章)的属性都会被枚举。使用 in 操作符来检查属性在对象中是否存在时，同样会查找对象的整条原型链(无论属性是否可枚举):

```js
var anotherObject = { 
    a:  2
};
// 创建一个关联到 anotherObject 的对象
var myObject = Object.create( anotherObject );

for (var k in myObject) { 
    console.log("found: " + k);
}
// found: a
("a" in myObject); // true
```

因此，当你通过各种语法进行属性查找时都会查找 [[Prototype]] 链，直到找到属性或者查找完整条原型链。

### Object.prototype

所有普通的 [[Prototype]] 链最终都会指向内置的 Object.prototype。由于所有的“普通” (内置，不是特定主机的扩展)对象都“源于”(或者说把 [[Prototype]] 链的顶端设置为)这个 Object.prototype 对象，所以它包含 JavaScript 中许多通用的功能。

有些功能你应该已经很熟悉了，比如说 .toString() 和 .valueOf()。 .hasOwnProperty(..)。稍后我们还会介绍 .isPrototypeOf(..)，这个你可能不太熟悉。


### 属性设置和屏蔽

```js
myObject.foo = "bar"
```
如果 myObject 对象中包含名为 foo 的普通数据访问属性，这条赋值语句只会修改已有的属性值。

如果 foo 不是直接存在于 myObject 中，[[Prototype]] 链就会被遍历，类似 [[Get]] 操作。如果原型链上找不到 foo，foo 就会被直接添加到 myObject 上。

然而，如果 foo 存在于原型链上层，赋值语句 myObject.foo = "bar" 的行为就会有些不同(而且可能很出人意料)。稍后我们会进行介绍。

如果属性名 foo 既出现在 myObject 中也出现在 myObject 的 [[Prototype]] 链上层，那 么就会发生屏蔽。myObject 中包含的 foo 属性会屏蔽原型链上层的所有 foo 属性，因为myObject.foo 总是会选择原型链中**最底层**的 foo 属性。

屏蔽比我们想象中更加复杂。下面我们分析一下如果 foo 不直接存在于 myObject 中而是存在于原型链上层时 myObject.foo = "bar" 会出现的三种情况。

1. 如果在[[Prototype]]链上层存在名为foo的普通数据访问属性(参见第3章)并且没 有被标记为只读(writable:false)，那就会直接在 myObject 中添加一个名为 foo 的新 属性，它是屏蔽属性。
2. 如果在[[Prototype]]链上层存在foo，但是它被标记为只读(writable:false)，那么无法修改已有属性或者在 myObject 上创建屏蔽属性。如果运行在严格模式下，代码会 抛出一个错误。否则，这条赋值语句会被忽略。总之，不会发生屏蔽。
3. 如果在[[Prototype]]链上层存在foo并且它是一个setter(参见第3章)，那就一定会 调用这个 setter。foo 不会被添加到(或者说屏蔽于)myObject，也不会重新定义 foo 这 个 setter。


大多数开发者都认为如果向 [[Prototype]] 链上层已经存在的属性([[Put]])赋值，就一 定会触发屏蔽，但是如你所见，三种情况中只有一种(第一种)是这样的。

如果你希望在第二种和第三种情况下也屏蔽 foo，那就不能使用 = 操作符来赋值，而是使 用 Object.defineProperty(..)(参见第 3 章)来向 myObject 添加 foo。

有些情况下会隐式产生屏蔽，一定要当心。思考下面的代码:

```js
var anotherObject = { 
    a:  2
};
var myObject = Object.create( anotherObject );

anotherObject.a; // 2
myObject.a; // 2

anotherObject.hasOwnProperty( "a" ); // true
myObject.hasOwnProperty( "a" ); // false

myObject.a++; // 隐式屏蔽! 
anotherObject.a; // 2
myObject.a; // 3
myObject.hasOwnProperty( "a" ); // true
```

尽管 myObject.a++ 看起来应该(通过委托)查找并增加 anotherObject.a 属性，但是别忘 了 ++ 操作相当于 myObject.a = myObject.a + 1。因此 ++ 操作首先会通过 [[Prototype]] 查找属性 a 并从 anotherObject.a 获取当前属性值 2，然后给这个值加 1，接着用 [[Put]] 将值 3 赋给 myObject 中新建的屏蔽属性 a，天呐!

修改委托属性时一定要小心。如果想让 anotherObject.a 的值增加，唯一的办法是 anotherObject.a++。

## “类”

现在你可能会很好奇:为什么一个对象需要关联到另一个对象?这样做有什么好处?这个问题非常好，但是在回答之前我们首先要理解 [[Prototype]]“不是”什么。

第 4 章中我们说过，JavaScript 和面向类的语言不同，它并没有类来作为对象的抽象模式或者说蓝图。JavaScript 中只有对象。

实际上，JavaScript 才是真正应该被称为“面向对象”的语言，因为它是少有的可以不通过类，直接创建对象的语言。

在 JavaScript 中，类无法描述对象的行为，(因为根本就不存在类!)对象直接定义自己的行为。**再说一遍，JavaScript 中只有对象。**

### “类”函数

多年以来，JavaScript 中有一种奇怪的行为一直在被无耻地滥用，那就是模仿类。我们会仔细分析这种方法。

这种奇怪的“类似类”的行为利用了函数的一种特殊特性:所有的函数默认都会拥有一个 名为 prototype 的公有并且不可枚举的属性，它会指向另一个对象:

```js
function Foo() { 
    // ...
}

Foo.prototype; // { }
```

这个对象通常被称为 Foo 的原型，因为我们通过名为 Foo.prototype 的属性引用来访问它。然而不幸的是，这个术语对我们造成了极大的误导，稍后我们就会看到。如果是我的话就会叫它“之前被称为 Foo 的原型的那个对象”。好吧我是开玩笑的，你觉得“被贴上‘Foo 点 prototype’标签的对象”这个名字怎么样?你觉得“被贴上‘Foo 点 prototype’标签的对象”这个名字怎么样?

最直接的解释就是，这个对象是在调用new Foo()(参见第2章)时创建的，最后会被(有点武断地)关联到这个“Foo.prototype”对象上。






