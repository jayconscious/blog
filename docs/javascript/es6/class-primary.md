---
title: Class 的基本语法
date: 2021-03-23
sidebar: auto
tags: 
 - ES6
categories:
 - Javascript
---

## 类的由来

ES6 的class可以看作只是一个语法糖，它的绝大部分功能，ES5 都可以做到，新的class写法只是让对象原型的写法更加清晰、更像面向对象编程的语法而已。上面的代码用 ES6 的class改写:

```js
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toString() {
        return '(' + this.x + ', ' + this.y + ')';
    }
}
```

ES6 的类，完全可以看作构造函数的另一种写法。

```js
typeof Point // "function"
Point === Point.prototype.constructor // true
```

构造函数的prototype属性，在 ES6 的“类”上面继续存在。事实上，类的所有方法都定义在类的prototype属性上面。

```js
class Point {
  constructor() {
    // ...
  }
  toString() {
    // ...
  }
  toValue() {
    // ...
  }
}

// 等同于

Point.prototype = {
  constructor() {},
  toString() {},
  toValue() {},
};
```
::: tip
由于类的方法都定义在 `prototype` 对象上面，所以类的新方法可以添加在 `prototype` 对象上面。`Object.assign()` 方法可以很方便地一次向类添加多个方法。
:::

```js
class Point {
    constructor(){
        // ...
    }
}
Object.assign(Point.prototype, {
    toString(){
        console.log('toString')
    },
    toValue(){}
})
new Point().toString()  // toString
```

另外，类的内部所有定义的方法，都是不可枚举的(**non-enumerable**)。这一点与 `ES5` 的**行为不一致**。

## constructor 方法

`constructor()` 方法是类的默认方法，通过new命令生成对象实例时，自动调用该方法。一个类必须有constructor() 方法，如果没有显式定义，一个空的 constructor() 方法会被默认添加。

`constructor()` 方法默认返回实例对象（即this），完全可以指定返回另外一个对象。


## 类的实例

与 ES5 一样，实例的属性除非显式定义在其本身（即定义在this对象上），否则都是定义在**原型**上（即定义在class上）

与 ES5 一样，类的所有实例共享一个**原型对象**。

```js
class Point { }
var p1 = new Point(2,3);
var p2 = new Point(3,2);

p1.__proto__ === p2.__proto__ // true
```
上面代码中，p1和p2都是Point的实例，它们的原型都是 `Point.prototype` ，所以 **__proto__** 属性是**相等**的。

::: warning
**__proto__** 并不是语言本身的特性，这是**各大厂商具体实现时添加的私有属性**。生产环境中，我们可以使用 **Object.getPrototypeOf** 方法来获取实例对象的原型，然后再来为原型添加方法/属性。
:::

```js
var p1 = new Point(2,3);
var p2 = new Point(3,2);

p1.__proto__.printName = function () { return 'Oops' };

p1.printName() // "Oops"
p2.printName() // "Oops"

var p3 = new Point(4,2);
p3.printName() // "Oops"
```

## 取值函数（getter）和存值函数（setter）

与 ES5 一样，在“类”的内部可以使用get和set关键字，对某个属性设置存值函数和取值函数，拦截该属性的存取行为。

```js
class MyClass {
    constructor() {
        // ...
    }
    get prop() {
        return 'getter';
    }
    set prop(value) {
        console.log('setter: '+value);
    }
}
let inst = new MyClass()

inst.prop = 123;
// setter: 123
inst.prop
// 'getter'
```

存值函数和取值函数是设置在属性的 `Descriptor` 对象上的。

```js
class CustomHTMLElement {
    constructor(element) {
        this.element = element
    }
    get html() {
        return this.element.innerHTML
    }
    set html(value) {
        this.element.innerHTML = value
    }
}
var descriptor = Object.getOwnPropertyDescriptor(
    CustomHTMLElement.prototype, "html"
)
console.log(descriptor)
"get" in descriptor  // true
"set" in descriptor  // true
```

## 属性表达式

类的属性名，可以采用表达式。

```js
let methodName = 'getArea';

class Square {
    constructor(length) {
        // ...
    }
    [methodName]() {
        // ...
    }
}
```

::: tip
为了避免属性名冲突，可以使用 `Symbol` 来声明。
:::

## Class 表达式

与函数一样，类也可以使用表达式的形式定义。

```js
const MyClass = class Me {
    getClassName() {
        return Me.name
    }
}
```

**Tips:**
1. **严格模式**
类和模块的内部，默认就是严格模式，所以不需要使用 `use strict` 指定运行模式。
2. **不存在提升**
类不存在变量提升（**hoist**），这一点与 ES5 完全不同。
```js
new Foo(); // Uncaught ReferenceError: Cannot access 'Foo' before initialization
class Foo {}
```
3. **name 属性**
由于本质上，ES6 的类只是 ES5 的构造函数的一层包装，所以函数的许多特性都被Class继承，包括name属性。
```js
class Point {}
console.log(Point.name) // "Point"
```
4. **Generator 方法**
如果某个方法之前加上**星号（*）**，就表示该方法是一个 `Generator` 函数。

```js
class Foo {
    constructor(...args) {
        this.args = args;
    }
    * [Symbol.iterator]() {
        for (let arg of this.args) {
            yield arg;
        }
    }
}
for (let x of new Foo('hello', 'world')) {
    console.log(x)
}
// hello
// world
```
上面代码中，Foo类的 `Symbol.iterator` 方法前有一个星号，表示该方法是一个 `Generator` 函数。`Symbol.iterator`方法返回一个Foo类的默认遍历器，for...of循环会自动调用这个遍历器。

5. **this 的指向**

类的方法内部如果含有 `this` ，它默认指向类的**实例**。但是，必须非常小心，一旦单独使用该方法，很可能报错。
```js
class Logger {
    printName(name = 'there') {
        this.print(`Hello ${name}`);
    }

    print(text) {
        console.log(text);
    }
}
const logger = new Logger();
const { printName } = logger;
printName(); // Cannot read property 'print' of undefined
```
可以使用 `bind` 或者是箭头函数来指定 `this`。

## 静态方法

类相当于实例的原型，所有在类中定义的方法，都会被实例继承。如果在一个方法前，加上 `static` 关键字，就表示该方法**不会被实例继承**，而是直接通过类来调用，这就称为`“静态方法”`。

```js
class Person {
    static say () {
        console.log('haha')
    }
}
const p1 = new Person()
Person.say() // haha
p1.say()     // Uncaught TypeError: p1.say is not a function
```

::: tip
注意，如果静态方法包含 `this` 关键字，这个 `this` 指的是类，而不是实例。
:::

```js
class Foo {
    static bar() {
        this.baz()
    }
    static baz() {
        console.log('hello')
    }
    baz() {
        console.log('world')
    }
}
Foo.bar() // hello
```
上面代码中，静态方法 bar 调用了 this.baz，这里的this指的是Foo类，而不是Foo的实例，等同于调用Foo.baz。另外，从这个例子还可以看出，**静态方法可以与非静态方法重名**。

父类的静态方法，可以被子类继承。

```js
class Foo {
    static classMethod() {
        console.log('hello');
    }
}
class Bar extends Foo { }
Bar.classMethod() // 'hello'
```

静态方法也是可以从 `super` 对象上调用的。

```js
class Foo {
    static classMethod() {
        return 'hello';
    }
}
class Bar extends Foo {
    static classMethod() {
        return super.classMethod() + ', too';
    }
}
console.log(Bar.classMethod()) // hello, too
```

## 实例属性的新写法

实例属性除了定义在 `constructor()` 方法里面的 `this` 上面，也可以定义在类的最顶层。

```js
class IncreasingCounter {
    constructor() {
        this._count = 0;
    }
    get value() {
        console.log('Getting the current value!');
        return this._count;
    }
    increment() {
        this._count++;
    }
}
```
上面代码中，实例属性 `this._count` 定义在 `constructor()` 方法里面。另一种写法是，这个属性也可以定义在类的最顶层，其他都不变。
```js
class foo {
    bar = 'hello';
    baz = 'world';

    constructor() {
        // ...
    }
}
```
上面的代码，一眼就能看出，foo类有两个实例属性，一目了然。另外，写起来也比较简洁。

## 静态属性

静态属性指的是 `Class` 本身的属性，即 `Class.propName` ，而**不是定义**在实例对象（this）上的属性。

```js
class Foo {
}
Foo.prop = 1;
Foo.prop // 1
```

目前，只有这种写法可行，因为 `ES6` 明确规定， `Class` 内部只有**静态方法**，没有静态属性。

## 私有方法和私有属性

**私有方法** 和 **私有属性**，是只能在类的内部访问的方法和属性，外部不能访问。这是常见需求，**有利于代码的封装**，但 ES6 不提供，只能通过变通方法模拟实现。

一种做法是在命名上加以区别。

```js
class Widget {
    // 公有方法
    foo (baz) {
        this._bar(baz);
    }
    // 私有方法
    _bar(baz) {
        return this.snaf = baz;
    }
    // ...
}
```
还有一种方法是利用 `Symbol` 值的唯一性，将私有方法的名字命名为一个 `Symbol` 值。

```js
const bar = Symbol('bar');
const snaf = Symbol('snaf');
export default class myClass{
    // 公有方法
    foo(baz) {
        this[bar](baz)
    }
    // 私有方法
    [bar](baz) {
        return this[snaf] = baz
    }
    // ...
}
```

## new.target 属性

`new` 是从构造函数生成实例对象的命令。ES6 为 `new` 命令引入了一个 `new.target` 属性，该属性一般用在构造函数之中，返回 `new` 命令作用于的那个构造函数。

如果构造函数**不是**通过new命令或 `Reflect.construct()` 调用的， `new.target` 会返回 `undefined`。

```js
function Person(name) {
    if (new.target !== undefined) {
        this.name = name;
    } else {
        throw new Error('必须使用 new 命令生成实例');
    }
}
// 另一种写法
function Person(name) {
    if (new.target === Person) {
        this.name = name;
    } else {
        throw new Error('必须使用 new 命令生成实例');
    }
}
```

需要注意的是，子类继承父类时，`new.target`会返回子类。

```js
class Rectangle {
    constructor(length, width) {
        console.log(new.target === Rectangle);
        // ...
    }
}
class Square extends Rectangle {
    constructor(length, width) {
        super(length, width);
    }
}
var obj = new Square(3); // 输出 false
```

利用这个特点，可以写出**不能独立使用、必须继承**后才能使用的类。

```js
class Shape {
    constructor() {
        if (new.target === Shape) {
            throw new Error('本类不能实例化');
        }
    }
}
class Rectangle extends Shape {
    constructor(length, width) {
        super();
        // ...
    }
}
var x = new Shape();  // 报错
var y = new Rectangle(3, 4);  // 正确
```

