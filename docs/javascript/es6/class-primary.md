---
title: Class 的基本语法
date: 2021-03-22
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
3. **name 属性**
















































