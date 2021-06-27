---
title: Class 的继承
date: 2021-06-27
sidebar: auto
tags: 
 - ES6
categories:
 - Javascript
---


## 简介

通过 `extends` 关键字来实现继承，这比 `es5` 的各种方式继承(比如寄生虫式继承)看上去更加清晰和方便。

```js
class Point {}

class ColorPoint extends Point {}
```

```js
class ColorPoint extends Point {
    constructor(x, y, color) {
        super(x, y); // 调用父类的constructor(x, y)
        this.color = color;
    }

    toString() {
        return this.color + ' ' + super.toString(); // 调用父类的toString()
    }
}
```
上面代码中， `constructor` 方法和 `toString` 方法之中，都出现了 `super` 关键字，它在这里表示父类的构造函数，用来新建父类的 `this` 对象。
::: tip
很长的一段时间内，我都对 `super` 关键字的理解有许多的困惑。

子类必须在 `constructor` 方法中调用 `super` 方法，否则新建实例时会报错。 这是因为子类自己的 `this` 对象，必须先通过父类的构造函数完成塑造，得到与父类同样的实例属性和方法，然后再对其进行加工，加上子类自己的实例属性和方法。如果不调用 `super` 方法，子类就得不到`this` 对象。

核心点，子类的 `this` 对象依赖于父类的构建。
:::

`ES5` 的继承，实质是先创造子类的实例对象 `this` ，然后再将父类的方法添加到 `this` 上面（`Parent.apply(this)`）。
`ES6` 的继承机制完全不同，实质是先将父类实例对象的属性和方法，加到 `this` 上面（所以必须先调用super方法），然后再用子类的构造函数修改 `this`。

最后，父类的静态方法，也会被子类继承。

```js
class A {
    static hello() {
        console.log('hello world');
    }
}

class B extends A {
    // 默认添加初始化代码
}
B.hello()  // hello world
```
上面代码中，hello()是A类的静态方法，B继承A，也继承了A的静态方法。

## Object.getPrototypeOf()

`Object.getPrototypeOf` 方法可以用来从子类上获取父类。

```js
Object.getPrototypeOf(ColorPoint) === Point
// true
```
::: tip
因此，可以使用这个方法判断，一个类是否继承了另一个类。
:::

## super 关键字

`super` 这个关键字，既可以当作函数使用，也可以当作对象使用。在这两种情况下，它的用法完全不同。

- 第一种情况， `super` 作为函数调用时，代表父类的构造函数。 `ES6` 要求，子类的构造函数必须执行一次 `super` 函数

::: tip
`super` 虽然代表了`父类A`的构造函数，但是返回的是`子类B`的实例，即super内部的this指的是B的实例，因此super()在这里相当于
**A.prototype.constructor.call(this)**
:::

```js
class A {
    constructor() {
        console.log(new.target.name);
    }
}
class B extends A {
    constructor() {
        super();
    }
}
new A() // A
new B() // B
```

上面代码中，`new.target`指向当前正在执行的函数。可以看到，在super()执行时，它指向的是子类B的构造函数，而不是父类A的构造函数。也就是说，super()内部的this指向的是B。

- 第二种情况， `super` 作为对象时，**在普通方法中，指向父类的原型对象；在静态方法中，指向父类**。

```js
class A {
p() {
        return 2;
    }
}

class B extends A {
    constructor() {
        super();
        console.log(super.p()); // 2
    }
}

let b = new B();
```

上面代码中，子类B当中的 `super.p()`，就是将super当作一个对象使用。这时，super在普通方法之中，指向`A.prototype`(父类的原型对象化)，所以 super.p() 就相当于 A.prototype.p()。

::: tip
这里需要注意，由于 **super 指向父类的原型对象**，所以定义在父类实例上的方法或属性，是无法通过super调用！
:::

```js
class A {
  constructor() {
    this.p = 2;
  }
}

class B extends A {
  get m() {
    return super.p;
  }
}

let b = new B();
b.m // undefined
```




















