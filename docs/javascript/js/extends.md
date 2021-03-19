---
title: 继承的几种方式以及优缺点
date: 2021-03-09
sidebar: auto
tags: 
 - js
categories:
 - Javascript
---


## 前言

继承作为面向对象编程的几大特征(封装，继承，多态)之一，区别于其他面向对象的编程语言，我们来看看在 `JavaScript` 中继承实现的几种方式以及优缺点。

继承的核心是子类可以拥有父类的属性和方法，并且把上下文指向子类自己。

## 1、原型链继承

```js
function Person (name) {
    this.name = 'haha'
}

Person.prototype.getName = function () {
    console.log(this.name)
}

function My () { }

My.prototype = new Person()

var me = new My()
me.getName()  // 'haha'

var he = new  My()
he.getName()  // 'haha'

```

::: warning
1、问题一：引用类型的属性被所有实例共享，比如 `me` 和 `he`。
2、问题二：在创建子类时，不能向父类传参。
:::

## 2.借用构造函数(经典继承)

```js
function Person () {
    this.name = ['zzy', 'ldd']
}

function Family() {
    Person.call(this)
}

var f1 = new Family()
f1.name.push('male or female')
console.log(f1.name)    // [ zzy,ldd,male or female ]

var f2 = new Family()
console.log(f2.name)    // [ zzy,ldd ]
```

::: tip
1、避免了引用类型的属性被所有实例共享
2、可以在 `f1` 中向 `Person` 传参
:::

::: warning
1、问题一：方法都在构造函数中定义，每次创建实例都会创建一遍方法。
:::


## 3.组合继承

原型链继承和经典继承双剑合璧。

```js
function Parent (name) {
    this.name = name;
    this.colors = ['red', 'blue', 'green'];
}
Parent.prototype.getName = function () {
    console.log(this.name)
}

function Child (name, age) {
    Parent.call(this, name)
    this.age = age
}

Child.prototype = new Parent()
// Tip: 添加
Child.prototype.constructor = Child;

var child1 = new Child('kevin', '18')

console.log(child1)
child1.colors.push('black')

console.log(child1.name);       // kevin
console.log(child1.age);        // 18
console.log(child1.colors);     // ["red", "blue", "green", "black"]

var child2 = new Child('daisy', '20');
console.log(child2.name);       // daisy
console.log(child2.age);        // 20
console.log(child2.colors);     // ["red", "blue", "green"]
```

::: tip
1、融合原型链继承和构造函数的优点，是 `JavaScript` 中最常用的继承模式。
:::

## 4.原型式继承

```js
function createObj(o) {
    function F(){}
    F.prototype = o;
    return new F();
}
```

就是 `ES5 Object.create` 的模拟实现，将传入的对象作为创建的对象的原型。

::: warning
1、问题一：包含引用类型的属性值始终都会共享相应的值，这点跟原型链继承一样。
:::


```js
var person = {
    name: 'kevin',
    friends: ['daisy', 'kelly']
}

var person1 = createObj(person);
var person2 = createObj(person);

person1.name = 'person1';
person2.name = person2.name + 'person2'
console.log(person2.name); // kevinperson2


person1.friends.push('taylor');
console.log(person2.friends); // ["daisy", "kelly", "taylor"]
```

::: tip
1、注意：修改 `person1.name` 的值， `person2.name` 的值并未发生改变，并不是因为 `person1` 和 `person2` 有独立的 `name` 值，而是因为 `person1.name = 'person1'`，给 `person1` 添加了 `name` 值，并非修改了原型上的 `name` 值。(为什么会这样呢？因为获取是会触发 `get` 操作，会寻址到原型链上的值， `set`的话，若果该对象没有的话会重新赋值。)
:::

## 5.寄生式继承
        
创建一个仅用于封装继承过程的函数，该函数在内部以某种形式来做增强对象，最后返回对象。

```js
function createObj (o) {
    var clone = Object.create(o);
    clone.sayName = function () {
        console.log('hi');
    }
    return clone;
}
```
::: warning
1、问题一：跟借用构造函数模式一样，每次创建对象都会创建一遍方法。比如 这里的 `sayName`
:::

## 6.寄生组合式继承

为了方便大家阅读，在这里重复一下组合继承的代码：

```js
function Parent (name) {
    this.name = name;
    this.colors = ['red', 'blue', 'green'];
}

Parent.prototype.getName = function () {
    console.log(this.name)
}

function Child (name, age) {
    Parent.call(this, name);
    this.age = age;
}

Child.prototype = new Parent();

var child1 = new Child('kevin', '18');

console.log(child1) // age: "18"，colors: (3) ["red", "blue", "green"]，name: "kevin"
```

组合继承最大的缺点是会调用两次父构造函数。

那么我们该如何精益求精，避免这一次重复调用呢？

如果我们**不使用** `Child.prototype = new Parent()`，而是间接的让 `Child.prototype` 访问到 `Parent.prototype` 呢？

```js
function Parent (name) {
    this.name = name;
    this.colors = ['red', 'blue', 'green'];
}

Parent.prototype.getName = function () {
    console.log(this.name)
}

function Child (name, age) {
    Parent.call(this, name);
    this.age = age;
}

// 关键的三步
var F = function () {};
F.prototype = Parent.prototype;


Child.prototype = new F();
var child1 = new Child('kevin', '18');

console.log(child1);
```

最后我们封装一下这个继承方法：

```js
function object(o) {
    function F() {}
    // Todo: 解决了什么问题
    F.prototype = o;
    return new F();
}

function prototype(Child, Parent) {
    var prototype = object(Parent.prototype);
    prototype.constructor = Child;
    Child.prototype = prototype;
}

// 当我们使用的时候：
prototype(Child, Parent);
```

::: tip
这种方式的高效率体现它只调用了一次 `Parent` 构造函数，并且因此避免了在 `Parent.prototype` 上面创建不必要的、多余的属性。与此同时，原型链还能保持不变；因此，还能够正常使用 `instanceof` 和 `isPrototypeOf`。开发人员普遍认为寄生组合式继承是引用类型最理想的继承范式。
:::













