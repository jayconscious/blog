---
title: 原型(下)
date: 2020-08-26
sidebar: auto
tags: 
 - js
categories:
 - Javascript
---

## (原型)继承

我们已经了解了通常被称作原型继承的机制，a 可以“继承”Foo.prototype 并访 问 Foo.prototype 的 myName() 函数。但是之前我们只把继承看作是类和类之间的关系，并 没有把它看作是类和实例之间的关系:

![image](/assets/img/prototype.png)

它不仅展示出对象(实例)a1 到 Foo.prototype 的委托关系，还展示出 Bar.prototype 到 Foo.prototype 的委托关系，而后者和类继承很相似，只有箭头的方向不 同。图中由下到上的箭头表明这是委托关联，不是复制操作。

下面这段代码使用的就是典型的“原型风格”:

```js
function Foo(name) { 
    this.name = name
}
Foo.prototype.myName = function() { 
    return this.name
};

function Bar(name,label) {
    Foo.call( this, name )
    this.label = label
}
// 我们创建了一个新的 Bar.prototype 对象并关联到 Foo.prototype 
Bar.prototype = Object.create( Foo.prototype )

// 注意!现在没有 Bar.prototype.constructor 了 
// 如果你需要这个属性的话可能需要手动修复一下它

Bar.prototype.myLabel = function() {
    return this.label
};
var a = new Bar( "a", "obj a" );
a.myName(); // "a"
a.myLabel(); // "obj a"
```
这段代码的核心部分就是语句 Bar.prototype = Object.create( Foo.prototype ),调用 Object.create(..) 会凭空创建一个“新”对象并把新对象内部的 [[Prototype]] 关联到你指定的对象(本例中是 Foo.prototype)。

注意，下面这两种方式是常见的错误做法，实际上它们都存在一些问题:

```js
// 和你想要的机制不一样! 
Bar.prototype = Foo.prototype;

// 基本上满足你的需求，但是可能会产生一些副作用 :( 
Bar.prototype = new Foo();
```

Bar.prototype = Foo.prototype 并不会创建一个关联到 Bar.prototype 的新对象，它只 是 让 Bar.prototype 直 接 引 用 Foo.prototype 对 象。 因 此 当 你 执 行 类 似 Bar.prototype. myLabel = ... 的赋值语句时会直接修改 Foo.prototype 对象本身。显然这不是你想要的结果，否则你根本不需要 Bar 对象，直接使用 Foo 就可以了，这样代码也会更简单一些。

Bar.prototype = new Foo() 的确会创建一个关联到 Bar.prototype 的新对象。但是它使用 了 Foo(..) 的“构造函数调用”，如果函数 Foo 有一些副作用(比如写日志、修改状态、注 册到其他对象、给 this 添加数据属性，等等)的话，就会影响到 Bar() 的“后代”，后果 不堪设想。(就是Foo内部的this有一些其他的操作的话)

因此，要创建一个合适的关联对象，我们必须使用 Object.create(..) 而不是使用具有副作用的 Foo(..)。**这样做唯一的缺点就是需要创建一个新对象然后把旧对象抛弃掉，不能直接修改已有的默认对象。**

我们来对比一下两种把 Bar.prototype 关联到 Foo.prototype 的方法: 

```js
// ES6 之前需要抛弃默认的 Bar.prototype
Bar.ptototype = Object.create( Foo.prototype )

// ES6 开始可以直接修改现有的 Bar.prototype 
Object.setPrototypeOf( Bar.prototype, Foo.prototype )
```
如果忽略掉 Object.create(..) 方法带来的轻微性能损失(抛弃的对象需要进行垃圾回收)，它实际上比 ES6 及其之后的方法更短而且可读性更高。不过无论如何，这是两种完 全不同的语法。

### 检查“类”关系

假设有对象 a，如何寻找对象 a 委托的对象(如果存在的话)呢?在传统的面向类环境中，检查一个实例(JavaScript 中的对象)的继承祖先(JavaScript 中的委托关联)通常被称为**内省**(或者反射)。

Thinking code

```js
function Foo() { 
    // ...
}
Foo.prototype.blah = ...
var a = new Foo()
```

我们如何通过内省找出 a 的“祖先”(委托关联)呢?第一种方法是站在“类”的角度来判断:

```js
a instanceof Foo; // true
```
instanceof 操作符的左操作数是一个普通的对象，右操作数是一个函数。instanceof 回答的问题是:**在 a 的整条 [[Prototype]] 链中是否有指向 Foo.prototype 的对象?**

可惜，这个方法只能处理对象(a)和函数(带 .prototype 引用的 Foo)之间的关系。如果你想判断两个对象(比如 a 和 b)之间是否通过 [[Prototype]] 链关联，只用 instanceof 无法实现。

下面这段荒谬的代码试图站在“类”的角度使用 instanceof 来判断两个对象的关系:

```js
// 用来判断 o1 是否关联到(委托)o2 的辅助函数 
function isRelatedTo(o1, o2) {
    function F(){} 
    F.prototype = o2; return o1 instanceof F;
}
var a = {};
var b = Object.create( a ); 
isRelatedTo( b, a ); // true
```
在 isRelatedTo(..) 内部我们声明了一个一次性函数 F，把它的 .prototype 重新赋值并指 向对象 o2，然后判断 o1 是否是 F 的一个“实例”。显而易见，o1 实际上并没有继承 F 也不 是由 F 构造，所以这种方法非常愚蠢并且容易造成误解。问题的关键在于思考的角度，强 行在 JavaScript 中应用类的语义(在本例中就是使用 instanceof)就会造成这种尴尬的局面。

下面是第二种判断 [[Prototype]] 反射的方法，它更加简洁:

```js
Foo.prototype.isPrototypeOf( a ); // true
```

注意，在本例中，我们实际上并不关心(甚至不需要)Foo，我们只需要一个可以用来判 断的对象(本例中是 Foo.prototype)就行。isPrototypeOf(..) 回答的问题是:在 a 的整 条 [[Prototype]] 链中是否出现过 Foo.prototype ?

我们只需要两个对象就可以判断它们之间的关系。举例来说:

```js
// 非常简单:b 是否出现在 c 的 [[Prototype]] 链中?
b.isPrototypeOf( c );
```

我们也可以直接获取一个对象的 [[Prototype]] 链。在 ES5 中，标准的方法是:

```js
Object.getPrototypeOf( a );
```
可以验证一下，这个对象引用是否和我们想的一样:

```js
Object.getPrototypeOf( a ) === Foo.prototype; // true
```
绝大多数(不是所有!)浏览器也支持一种非标准的方法来访问内部 [[Prototype]] 属性:

```js
a.__proto__ === Foo.prototype; // true
```
这个奇怪的 .__proto__(在 ES6 之前并不是标准!)属性“神奇地”引用了内部的 [[Prototype]] 对象，如果你想直接查找(甚至可以通过 .__proto__.__ptoto__... 来遍历) 原型链的话，这个方法非常有用。

和我们之前说过的 .constructor 一样，.__proto__ 实际上并不存在于你正在使用的对象中 (本例中是 a)。实际上，它和其他的常用函数(.toString()、.isPrototypeOf(..)，等等)一样，存在于内置的 Object.prototype 中。(它们是不可枚举的，参见第 2 章。)

此外，.__proto__ 看起来很像一个属性，但是实际上它更像一个 getter/setter

.__proto__ 的实现大致上是这样的

```js
Object.defineProperty( Object.prototype, "__proto__", 
    {
        get: function() {
            return Object.getPrototypeOf( this ); 
        },
        set: function(o) {
            // ES6 中的 setPrototypeOf(..) 
            Object.setPrototypeOf( this, o ); 
            return o;
        } 
    } 
);
```
因此，访问(获取值)a.__proto__ 时，实际上是调用了 a.__proto__()(调用 getter 函 数)。虽然 getter 函数存在于 Object.prototype 对象中，但是它的 this 指向对象 a，所以和 Object.getPrototypeOf( a ) 结果相同。

此外，最好把 [[Prototype]] 对象关联**看作是只读特性**，从而增加代码的可读性。

::: tip
JavaScript 社区中对于双下划线有一个非官方的称呼，他们会把类似 __proto__的属性称为“笨蛋(dunder)”。所以，JavaScript 潮人会把 __proto__ 叫作 “笨蛋 proto”。
:::

## 对象关联

通常来说，这个链接的作用是:如果在对象上没有找到需要的属性或者方法引用，引擎就 会继续在 [[Prototype]] 关联的对象上进行查找。同理，如果在后者中也没有找到需要的 引用就会继续查找它的 [[Prototype]]，以此类推。这一系列对象的链接被称为“**原型链**”。

### 创建关联

那 [[Prototype]] 机制的意义是什么呢?为什么 JavaScript 开发者费这么大的力气(模拟 类)在代码中创建这些关联呢?

还记得吗，本章前面曾经说过 Object.create(..) 是一个大英雄，现在是时候来弄明白为 什么了:


```js

var foo = {
    something: function() {
        console.log( "Tell me something good..." );
    }
};

var bar = Object.create( foo ); 

bar.something(); // Tell me something good...

```

::: tip
Object.create(null) 会 创 建 一 个 拥 有 空( 或 者 说 null)[[Prototype]] 链接的对象，这个对象无法进行委托。由于这个对象没有原型链，所以 instanceof 操作符(之前解释过)无法进行判断，因此总是会返回 false。 这些特殊的空 [[Prototype]] 对象通常被称作“字典”，它们完全不会受到原 型链的干扰，**因此非常适合用来存储数据**。
:::

我们并不需要类来创建两个对象之间的关系，只需要通过委托来关联对象就足够了。而 Object.create(..) 不包含任何“类的诡计”，所以它可以完美地创建我们想要的关联关系。

Object.create(..) 是在 ES5 中新增的函数，所以在 ES5 之前的环境中(比如旧 IE)如 果要支持这个功能的话就需要使用一段简单的 polyfill 代码，它部分实现了 Object. create(..) 的功能:

```js
// Object.create()的polyfill代码
if (!Object.create) { 
    Object.create = function(o) {
        function F(){};
        F.prototype = o; 
        return new F();
    }; 
}
```
标准 ES5 中内置 的 Object.create(..) 函数还提供了一系列附加功能，但是 ES5 之前的版本不支持这些功能。

```js
var anotherObject = {
    a:2
};
var myObject = Object.create( anotherObject, 
{   
    b: {
        enumerable: false, 
        writable: true, 
        configurable: false, 
        value: 3
    }, 
    c: {
        enumerable: true, 
        writable: false, 
        configurable: false, 
        value: 4
    } 
});
myObject.hasOwnProperty( "a" ); // false
myObject.hasOwnProperty( "b" ); // true
myObject.hasOwnProperty( "c" ); // true

myObject.a; // 2
myObject.b; // 3
myObject.c; // 4
```
Object.create(..) 的第二个参数指定了需要添加到新对象中的属性名以及这些属性的属性描述符。因为 ES5 之前的版本无法模拟属性操作符，所以 polyfill 代码无法 实现这个附加功能。


### 关联关系是备用

看起来对象之间的关联关系是处理“缺失”属性或者方法时的一种备用选项。这个说法有点道理，但是我认为这并不是 [[Prototype]] 的本质。

```js
var anotherObject = { 
    cool: function() {
        console.log( "cool!" );
    }
};
var myObject = Object.create( anotherObject ); 
myObject.cool(); // "cool!"
```

这并不是说任何情况下都不应该选择备用这种设计模式，但是这在 JavaScript 中并不是很 常见。所以如果你使用的是这种模式，那或许应当退后一步并重新思考一下这种模式是否 合适。

::: tip
在 ES6 中有一个被称为“代理”(Proxy)的高端功能，它实现的就是“方法 无法找到”时的行为。代理超出了本书的讨论范围，但是在本系列之后的书中会介绍。
:::

但是你可以让你的 API 设计不那么“神奇”，同时仍然能发挥 [[Prototype]] 关联的威力:

```js
var anotherObject = { 
    cool: function() {
        console.log( "cool!" );
    }
};
var myObject = Object.create( anotherObject );

myObject.doCool = function() { 
    this.cool(); // 内部委托!
};

myObject.doCool(); // "cool!"
```

这里我们调用的 myObject.doCool() 是实际存在于 myObject 中的，这可以让我们的 API 设 计更加清晰(不那么“神奇”)。从内部来说，我们的实现遵循的是**委托设计模式**，通过 [[Prototype]] 委托到 anotherObject.cool()。

## 总结

1. 如果要访问对象中并不存在的一个属性，[[Get]] 操作就会查找对象内部[[Prototype]] 关联的对象。这个关联关系实际上定义了一条“原型链”(有点像嵌套的作用域链)，在查找属性时会对它进行遍历。

2. 所有普通对象都有内置的 Object.prototype，指向原型链的顶端(比如说全局作用域)，如 果在原型链中找不到指定的属性就会停止。toString()、valueOf() 和其他一些通用的功能都存在于 Object.prototype 对象上，因此语言中所有的对象都可以使用它们。

3. 关联两个对象最常用的方法是使用 new 关键词进行函数调用，在调用的 4 个步骤中会创建一个关联其他对象的新对象。

4. 使用 new 调用函数时会把新对象的 .prototype 属性关联到“其他对象”。带 new 的函数调用 通常被称为“构造函数调用”，尽管它们实际上和传统面向类语言中的类构造函数不一样。

5. 虽然这些 JavaScript 机制和传统面向类语言中的“类初始化”和“类继承”很相似，但 是 JavaScript 中的机制有一个核心区别，那就是不会进行复制，对象之间是通过内部的 [[Prototype]] 链关联的。

6. 出于各种原因，以“继承”结尾的术语(包括“原型继承”)和其他面向对象的术语都无 法帮助你理解 JavaScript 的真实机制(不仅仅是限制我们的思维模式)。

7. 相比之下，“委托”是一个更合适的术语，因为对象之间的关系不是复制而是**委托**。





















