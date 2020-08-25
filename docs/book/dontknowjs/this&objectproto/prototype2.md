# 原型(下)

## (原型)继承

我们已经了解了通常被称作原型继承的机制，a 可以“继承”Foo.prototype 并访 问 Foo.prototype 的 myName() 函数。但是之前我们只把继承看作是类和类之间的关系，并 没有把它看作是类和实例之间的关系:

![image](/blog/assets/img/prototype.png)

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

















