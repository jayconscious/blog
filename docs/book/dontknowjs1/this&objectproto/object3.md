---
title: 对象(下)
date: 2020-08-19
sidebar: auto
tags: 
 - js
categories:
 - Javascript
---

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

这时可以使用一种更加强硬的方法来进行判断:Object.prototype.hasOwnProperty.call(myObject,"a")，它借用基础的 hasOwnProperty(..) 方法并把它显式绑定(参见第 2 章)到 myObject 上。

::: tip
看起来 in 操作符可以检查容器内是否有某个值，但是它实际上检查的是某 个属性名是否存在。对于数组来说这个区别非常重要，4 in [2, 4, 6]的结 果并不是你期待的 True，因为 [2, 4, 6] 这个数组中包含的属性名是 0、1、 2，没有 4。(**只是检测属性**)
:::

**1. 枚举**

之前介绍 enumerable 属性描述符特性时我们简单解释过什么是“可枚举性”

```js
var myObject = { };
Object.defineProperty(
    myObject,
    "a",
    // 让 a 像普通属性一样可以枚举 
    {
        enumerable: true, 
        value: 2 
    }
);

Object.defineProperty(
    myObject,
    "b",
    // 让b不可枚举
    { 
        enumerable: false, 
        value: 3 
    }
);
myObject.b; // 3
("b" in myObject); // true 
myObject.hasOwnProperty( "b" ); // true

for (var k in myObject) {s
    console.log( k, myObject[k] );
}
// "a" 2
```
可以看到，myObject.b 确实存在并且有访问值，但是却不会出现在 for..in 循环中(尽管 可以通过 in 操作符来判断是否存在)。原因是“可枚举”就相当于“可以出现在对象属性的遍历中”。（很神奇，为什么遍历的时候就看不到这个属性了，为什么要这样设计？Todo）

::: tip
在数组上应用 for..in 循环有时会产生出人意料的结果，因为这种枚举不 仅会包含所有数值索引，还会包含所有可枚举属性。最好只在对象上应用 for..in 循环，如果要遍历数组就使用传统的 for 循环来遍历数值索引。
:::

也可以通过另一种方式来区分属性是否可枚举:

```js
var myObject = { };
Object.defineProperty(
    myObject,
    "a",
    // 让 a 像普通属性一样可以枚举 
    { 
        enumerable: true, 
        value: 2
    }
);
bject.defineProperty(
    myObject,
    "b",
    // 让 b 不可枚举
    { 
        enumerable: false, 
        value: 3
    }
);
myObject.propertyIsEnumerable( "a" ); // true
myObject.propertyIsEnumerable( "b" ); // false

Object.keys( myObject ); // ["a"]
Object.getOwnPropertyNames( myObject ); // ["a", "b"]
```

in 和 hasOwnProperty(..) 的区别在于是否查找 [[Prototype]] 链，然而，Object.keys(..) 和 Object.getOwnPropertyNames(..) 都只会查找对象直接包含的属性。

(目前)并没有内置的方法可以获取 in 操作符使用的属性列表(对象本身的属性以 及 [[Prototype]] 链中的所有属性，参见第 5 章)。不过你可以递归遍历某个对象的整条 [[Prototype]] 链并保存每一层中使用 Object.keys(..) 得到的属性列表——只包含可枚举属性。

## 遍历

for..in 循环可以用来遍历对象的可枚举属性列表(包括 [[Prototype]] 链)。但是如何遍历属性的值呢?

```js
var myArray = [1, 2, 3];
for (var i = 0; i < myArray.length; i++) { 
    console.log( myArray[i] );
}
// 1 2 3
```
这实际上并不是在遍历值，而是遍历下标来指向值，如 myArray[i]。

forEach(..) 会遍历数组中的所有值并**忽略回调函数的返回值**(这意味着不是从回调函数中跳出)。every(..) 会一直运行直到回调函数返回 false(或者“假”值)，some(..) 会一直运行直到回调函数返回 true(或者 “真”值)。

::: tip
遍历数组下标时采用的是数字顺序(for 循环或者其他迭代器)，但是遍历对 象属性时的顺序是不确定的，在不同的 JavaScript 引擎中可能不一样。因此， 在不同的环境中需要保证一致性时，一定不要相信任何观察到的顺序，它们是不可靠的（**无法保证顺序**）
:::

那么如何直接遍历值而不是数组下标(或者对象属性)呢?幸好，ES6 增加了一种用来遍 历数组的 for..of 循环语法(如果对象本身定义了迭代器的话也可以遍历对象):

```js
var myArray = [ 1, 2, 3 ];
for (var v of myArray) { 
    console.log( v );
}
// 1 // 2 // 3
```

**for..of 循环首先会向被访问对象请求一个迭代器对象，然后通过调用迭代器对象的 next() 方法来遍历所有返回值。**

数组有内置的 @@iterator，因此 for..of 可以直接应用在数组上。我们使用内置的 @@ iterator 来手动遍历数组，看看它是怎么工作的:

```js
var myArray = [ 1, 2, 3 ]
var it = myArray[Symbol.iterator]()

it.next(); // { value:1, done:false } 
it.next(); // { value:2, done:false } 
it.next(); // { value:3, done:false } 
it.next(); // { done:true }
```

::: tip
我们使用 ES6 中的符号 Symbol.iterator 来获取对象的 @@iterator 内部属 性。之前我们简单介绍过符号(Symbol，参见 3.3.1 节)，跟这里的原理是相 同的。引用类似 iterator 的特殊属性时要使用符号名，而不是符号包含的 值。此外，虽然看起来很像一个对象，**但是 @@iterator 本身并不是一个迭代器对象，而是一个返回迭代器对象的函数**——这点非常精妙并且非常重要。（为什么药品设计为一个函数，函数的运行才返回这个对象，作为js常用的设计模式 Todo）
:::

注意，和值“3”一起返回的是 done:false，乍一看好像很奇怪，你必须再调用一次 next() 才能得到 done:true，从而确定完成遍历。这个**机制和 ES6 中发生器函数的语义相关**，不过已经超出了我们的讨论范围。

和数组不同，普通的对象没有内置的 @@iterator，所以无法自动完成 for..of 遍历。之所以要这样做，有许多非常复杂的原因，不过简单来说，这样做是为了避免影响未来的对象类型。

当然，你可以给任何想遍历的对象定义 @@iterator，举例来说:

```js
var myObject = { 
    a: 2,
    b: 3 
};
Object.defineProperty(
    myObject, 
    Symbol.iterator, 
    { 
        enumerable: false,
        writable: false,
        configurable: true,
        value: function() {
            var o = this;
            var idx = 0;
            var ks = Object.keys( o ); 
            return {
                next: function() { 
                    return {
                         value: o[ks[idx++]],
                         done: (idx > ks.length)
                     };
                } 
            };
        } 
    }
);

// 手动遍历 myObject
var it = myObject[Symbol.iterator]();
it.next(); // { value:2, done:false } 
it.next(); // { value:3, done:false } 
it.next(); // { value:undefined, done:true }

// 用 for..of 遍历 myObject 
for (var v of myObject) {
    console.log( v );
}
// 2
// 3
// 实际中有哪些应用? Todo
```

::: tip
我们使用 Object.defineProperty(..) 定义了我们自己的 @@iterator(主要是为了让它不可枚举)，不过注意，我们把符号当作可计算属性名。此外，也可以直接在定义对象时进行声明，比如 var myObject = { a:2, b:3, [Symbol.iterator]: function() { /* .. */ } }。
:::

for..of 循环每次调用 myObject 迭代器对象的 next() 方法时，内部的指针都会向前移动并 返回对象属性列表的下一个值(再次提醒，需要注意遍历对象属性 / 值时的顺序)。

实际上，你甚至可以定义一个“无限”迭代器，它永远不会“结束”并且总会返回一个新值(比如随机数、递增值、唯一标识符，等等)。你可能永远不会在 for..of 循环中使用这 样的迭代器，因为它永远不会结束，你的程序会被挂起:

```js
var randoms = {
    [Symbol.iterator]: function() {
        return {
            next: function() {
                return { value: Math.random() }; 
            }
        }; 
    }
};
var randoms_pool = []; 
for (var n of randoms) {
    randoms_pool.push( n )
    // 防止无限运行!
    if (randoms_pool.length === 100) break
}
// 很调皮的代码;
```

## 总结

1. JavaScript 中的对象有字面形式(比如 var a = { .. })和构造形式(比如 var a = new Array(..))。字面形式更常用，不过有时候构造形式可以提供更多选项。

2. 许多人都以为“JavaScript 中万物都是对象”，这是错误的。对象是 6 个(或者是 7 个，取 决于你的观点)基础类型之一。对象有包括 function 在内的子类型，不同子类型具有不同的行为，比如内部标签 [object Array] 表示这是对象的子类型数组

3. 对象就是键 / 值对的集合。可以通过 .propName 或者 ["propName"] 语法来获取属性值。访 问属性时，引擎实际上会调用内部的默认 [[Get]] 操作(在设置属性值时是 [[Put]])， [[Get]] 操作会检查对象本身是否包含这个属性，如果没找到的话还会查找 [[Prototype]] 链

4. 属性的特性可以通过属性描述符来控制，比如 writable 和 configurable。此外，可以使用 Object.preventExtensions(..)、Object.seal(..) 和 Object.freeze(..) 来设置对象(及其 属性)的不可变性级别。

5. 属性不一定包含值——它们可能是具备 getter/setter 的“访问描述符”。此外，属性可以是 可枚举或者不可枚举的，这决定了它们是否会出现在 for..in 循环中。

6. 你可以使用 ES6 的 for..of 语法来遍历数据结构(数组、对象，等等)中的值，for..of 会寻找内置或者自定义的 @@iterator 对象并调用它的 next() 方法来遍历数据值。














