---
title: 原型(上)
date: 2020-08-23
sidebar: auto
tags: 
 - js
categories:
 - Javascript
---

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

这种奇怪的“类似类”的行为利用了函数的一种特殊特性:**所有的函数默认都会拥有一个名为 prototype 的公有并且不可枚举的属性，它会指向另一个对象**:

```js
function Foo() { 
    // ...
}

Foo.prototype; // { }
```

这个对象通常被称为 Foo 的原型，因为我们通过名为 Foo.prototype 的属性引用来访问它。然而不幸的是，这个术语对我们造成了极大的误导，稍后我们就会看到。如果是我的话就会叫它“之前被称为 Foo 的原型的那个对象”。好吧我是开玩笑的，你觉得“被贴上‘Foo 点 prototype’标签的对象”这个名字怎么样?你觉得“被贴上‘Foo 点 prototype’标签的对象”这个名字怎么样?

最直接的解释就是，这个对象是在调用new Foo()(参见第2章)时创建的，最后会被(有点武断地)关联到这个“Foo.prototype”对象上。

```js
function Foo() { 
    // ...
}
var a = new Foo();
Object.getPrototypeOf( a ) === Foo.prototype; // true
```

调用new Foo()时会创建a(具体的4个步骤参见第2章)，其中一步就是将a内部的 [[Prototype]] 链接到 Foo.prototype 所指向的对象。

在面向类的语言中，类可以被复制(或者说实例化)多次，就像用模具制作东西一样。我们在前面中看到过，之所以会这样是因为实例化(或者继承)一个类就意味着“**把类的行为复制到物理对象中**”，对于每一个新实例来说都会重复这个过程。

但是在 JavaScript 中，并没有类似的复制机制。你不能创建一个类的多个实例，只能创建多个对象，它们 [[Prototype]] 关联的是同一个对象。但是在默认情况下并不会进行复制， 因此这些对象之间并不会完全失去联系，它们是互相关联的

new Foo() 会生成一个新对象(我们称之为 a)，这个新对象的内部链接 [[Prototype]] 关联 的是 Foo.prototype 对象。

实际上，绝大多数 JavaScript 开发者不知道的秘密是，new Foo() 这个函数调用实际上并没 有直接创建关联，这个关联只是一个意外的副作用。new Foo()只是间接完成了我们的目 标:一个关联到其他对象的新对象。

那么有没有更直接的方法来做到这一点呢?当然!功臣就是 Object.create(..)，不过我们现在暂时不介绍它

#### 关于名称

在 JavaScript 中，我们并不会将一个对象(“类”)复制到另一个对象(“实例”)，只是将它们 关联起来。从视觉角度来说，[[Prototype]] 机制如下图所示，箭头从右到左，从下到上:

![image](/assets/img/prototype.png)

这个机制通常被称为**原型继承**(稍后我们会分析具体代码)，它常常被视为动态语言版本 的类继承。这个名称主要是为了对应面向类的世界中“继承”的意义，但是违背(写作违 背，读作推翻)了动态脚本中对应的语义。

继承意味着复制操作，JavaScript(默认)并不会复制对象属性。相反，JavaScript 会在两个对象之间创建一个关联，这样一个对象就可以通过**委托**访问另一个对象的属性和函数。 **委托**(参见第 6 章)这个术语可以更加准确地描述 JavaScript 中对象的关联机制。

### 构造函数”

```js
function Foo() { 
    // ...
}
var a = new Foo();
```
到底是什么让我们认为 Foo 是一个“类”呢?

其中一个原因是我们看到了关键字 **new**，在面向类的语言中构造类实例时也会用到它。另一个原因是，看起来我们执行了类的构造函数方法，Foo() 的调用方式很像初始化类时类构造函数的调用方式。

除了令人迷惑的“构造函数”语义外，Foo.prototype 还有另一个绝招。思考下面的代码:

```js
function Foo() { 
    // ...
}
Foo.prototype.constructor === Foo; // true

var a = new Foo();
a.constructor === Foo; // true

a.constructor === Foo === Foo.prototype.constructor
```
Foo.prototype 默认(在代码中第一行声明时!)有一个公有并且不可枚举的属性 .constructor，这个属性引用的是对象关联的函数(本例中是 Foo)。此外，我们可以看到通过“构造函数”调用 new Foo() 创建的对象也有一个 .constructor 属性，指向 “创建这个对象的函数”。

::: tip
实际上 a 本身并没有 .constructor 属性。而且，虽然 a.constructor 确实指 向 Foo 函数，但是这个属性并不是表示 a 由 Foo“构造”，稍后我们会解释
:::

**1. 构造函数还是调用**

实际上，Foo 和你程序中的其他函数没有任何区别。函数本身并不是构造函数，然而，当 你在普通的函数调用前面加上 new 关键字之后，就会把这个函数调用变成一个“构造函数 调用”。实际上，**new 会劫持所有普通函数并用构造对象的形式来调用它**。

举例来说:

```js 
function NothingSpecial() { 
    console.log( "Don't mind me!" );
}
var a = new NothingSpecial();
// "Don't mind me!" 
a; // {}
```

换句话说，在 JavaScript 中对于“构造函数”最准确的解释是，所有带 new 的函数调用。

函数不是构造函数，但是当且仅当使用 new 时，函数调用会变成“构造函数调用”

### 技术

JavaScript 开发者绞尽脑汁想要模仿类的行为:

```js
function Foo(name) { 
    this.name = name;
}
Foo.prototype.myName = function() {
    return this.name;
};
var a = new Foo( "a" );
var b = new Foo( "b" ); 
a.myName(); // "a"
b.myName(); // "b"
```
这段代码展示了另外两种“面向类”的技巧:

1. this.name = name 给每个对象(也就是 a 和 b，参见第 2 章中的 this 绑定)都添加 了 .name 属性，有点像类实例封装的数据值。

2. Foo.prototype.myName = ... 可能个更有趣的技巧，它会给 Foo.prototype 对象添加一个属性(函数)。现在，a.myName() 可以正常工作，但是你可能会觉得很惊讶，这是什么原理呢?

因此，在创建的过程中，a 和 b 的内部 [[Prototype]] 都会关联到 Foo.prototype 上。当 a 和 b 中无法找到 myName 时，它会(通过委托，参见第 6 章)在 Foo.prototype 上找到。

举例来说，Foo.prototype 的 .constructor 属性只是 Foo 函数在声明时的默认属性。**如果你创建了一个新对象并替换了函数默认的 .prototype 对象引用，那么新对象并不会自动获得 .constructor 属性。**

Thinking code:

```js
function Foo() { /* .. */ }
Foo.prototype = { /* .. */ }; 
// 创建一个新原型对象
// 如果只是添加一个属性呢？
var a1 = new Foo();

a1.constructor === Foo; // false! 
a1.constructor === Object; // true!
```

到底怎么回事? a1 并没有 .constructor 属性，所以它会委托 [[Prototype]] 链上的 Foo. prototype。但是这个对象也没有 .constructor 属性(不过默认的 Foo.prototype 对象有这个属性!)，所以它会继续委托，这次会委托给委托链顶端的 Object.prototype。这个对象有 .constructor 属性，指向内置的 Object(..) 函数。

实际上，对象的 .constructor 会默认指向一个函数，这个函数可以通过对象的 .prototype 引用。“constructor”和“prototype”这两个词本身的含义可能适用也可能不适用。最好的 办法是记住这一点“**constructor 并不表示被构造**”。

.constructor 并不是一个不可变属性。它是不可枚举(参见上面的代码)的，但是它的值 是可写的(可以被修改)。此外，你可以给任意 [[Prototype]] 链中的任意对象添加一个名 为 constructor 的属性或者对其进行修改，**你可以任意对其赋值**。

**a1.constructor 是一个非常不可靠并且不安全的引用。通常来说要尽量避免使用这些引用。**






