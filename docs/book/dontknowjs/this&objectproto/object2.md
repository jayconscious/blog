# 对象(下)

### 5.属性描述符

在 ES5 之前，JavaScript 语言本身并没有提供可以直接检测属性特性的方法，比如判断属性是否是只读。

但是从 ES5 开始，所有的属性都具备了属性描述符。

```js
var myObject = { 
    a: 2
};
Object.getOwnPropertyDescriptor( myObject, "a" );
// {
//      value: 2,
//      writable: true,
//      enumerable: true,
//      configurable: true 
// }
```
如你所见，这个普通的对象属性对应的属性描述符(也被称为“数据描述符”，因为它 只保存一个数据值)可不仅仅只是一个 2。它还包含另外三个特性:**writable(可写)**、 **enumerable(可枚举)** 和 **configurable(可配置)**。

在创建普通属性时属性描述符会使用默认值，我们也可以使用 Object.defineProperty(..) 来添加一个新属性或者修改一个已有属性(如果它是 configurable)并对特性进行设置。

```js
var myObject = {};
Object.defineProperty( myObject, "a", { 
    value: 2,
    writable: true,
    configurable: true,
    enumerable: true
});
myObject.a; // 2
```
我们使用 defineProperty(..) 给 myObject 添加了一个普通的属性并显式指定了一些特性。 然而，一般来说你不会使用这种方式，除非你想修改属性描述符。

1. **Writable**

writable 决定是否可以修改属性的值。

```js
var myObject = {};

Object.defineProperty( myObject, "a", { 
    value: 2,
    writable: false, // 不可写! 
    configurable: true, 
    enumerable: true
});
myObject.a = 3;

myObject.a; // 2 修改失败

"use strict"; // 在严格模式下面是会报错的
// TypeError 错误表示我们无法修改一个不可写的属性。
```
::: tip
之后我们会介绍 getter 和 setter，不过简单来说，你可以把 writable:false 看作是属性不可改变，相当于你定义了一个空操作setter。严格来说，如果要和 writable:false 一致的话，你的 setter 被调用时应当抛出一个 TypeError 错误。
:::

2. **Configurable**

只要属性是可配置的，就可以使用 defineProperty(..) 方法来修改属性描述符:

```js
var myObject = { 
    a: 2
};
myObject.a = 3;
myObject.a; // 3

Object.defineProperty( myObject, "a", { 
    value: 4,
    writable: true,
    configurable: false, // 不可配置!
    enumerable: true 
});

myObject.a; // 4
myObject.a = 5;
myObject.a; // 5

Object.defineProperty( myObject, "a", { 
    value: 6,
    writable: true, 
    configurable: true, 
    enumerable: true
}); // TypeError
```
最后一个 defineProperty(..) 会产生一个 TypeError 错误，不管是不是处于严格模式，尝试修改一个不可配置的属性描述符都会出错。注意:如你所见，**把 configurable 修改成 false 是单向操作，无法撤销!**

::: tip
要注意有一个小小的例外: 即便属性是 configurable:false，我们还是可以把 writable 的状态由 true 改为 false，但是无法由false 改为 true。
:::

除了无法修改，configurable:false 还会禁止删除这个属性:
```js
var myObject = { 
    a:2
};
myObject.a; // 2
delete myObject.a; 
myObject.a; // undefined
Object.defineProperty( myObject, "a", { 
    value: 2,
    writable: true, 
    configurable: false, 
    enumerable: true
});
myObject.a; // 2 
delete myObject.a; 
myObject.a; // 2
//Tip: 属性并不能被删除
```
最后一个 delete 语句(静默)失败了，**因为属性是不可配置的**。

在本例中，delete 只用来直接删除对象的(可删除)属性。如果对象的某个属性是某个对象 / 函数的最后一个引用者，对这个属性执行 delete 操作之后，**这个未引用的对象/函数就可以被垃圾回收**。但是，不要把 delete 看作一个释放内存的工具(就像 C/C++ 中那 样)，它就是一个删除对象属性的操作，仅此而已。

3. **Enumerable**

从名字就可以看出，这个描述符控制的是属性是否会出现在对象的属性枚举中，比如说 for..in 循环。如果把 enumerable 设置成false，这个属性就不会出现在枚举中，虽然仍 然可以正常访问它。相对地，设置成 true 就会让它出现在枚举中。

用户定义的所有的普通属性默认都是 enumerable:true，这通常就是你想要的。但是如果你 不希望某些特殊属性出现在枚举中，那就把它设置成 enumerable:false。

### 6.不变性

有时候你会希望属性或者对象是不可改变(无论有意还是无意)的，在 ES5 中可以通过很多种方法来实现.

很重要的一点是，所有的方法创建的都是浅不变性，也就是说，它们只会影响目标对象和 它的直接属性。如果目标对象引用了其他对象(数组、对象、函数，等)，其他对象的内容不受影响，仍然是可变的:

```js
myImmutableObject.foo; // [1,2,3]
myImmutableObject.foo.push( 4 );
myImmutableObject.foo; // [1,2,3,4]
```
假设代码中的 myImmutableObject 已经被创建而且是不可变的，但是为了保护它的内容 myImmutableObject.foo，你还需要使用下面的方法让 foo 也不可变。

::: tip
在 JavaScript 程序中很少需要深不可变性。有些特殊情况可能需要这样做， 但是根据通用的设计模式，如果你发现需要密封或者冻结所有的对象，**那你或许应当退一步，重新思考一下程序的设计**，让它能更好地应对对象值的改变。
:::

1. **对象常量**

结合 writable:false 和 configurable:false 就可以创建一个真正的常量属性(不可修改、 重定义或者删除):

```js
var myObject = {};
Object.defineProperty( myObject, "FAVORITE_NUMBER", {
    value: 42,
    writable: false,
    configurable: false
});
```

2. **禁止扩展**
如果你想禁止一个对象添加新属性并且保留已有属性，可以使用 **Object.preventExtensions(..)**:

```js
var myObject = { 
    a: 2
};
Object.preventExtensions( myObject );

myObject.b = 3; 
myObject.b; // undefined
```
在非严格模式下，创建属性 b 会静默失败。在严格模式下，将会抛出 TypeError 错误。

3. **密封**

**Object.seal(..)** 会创建一个“密封”的对象，这个方法实际上会在一个现有对象上调用 Object.preventExtensions(..) 并把所有现有属性标记为 configurable:false。

所以，密封之后不仅不能添加新属性，也不能重新配置或者删除任何现有属性(虽然可以 修改属性的值)

4. **冻结**

**Object.freeze(..)** 会创建一个冻结对象，这个方法实际上会在一个现有对象上调用 Object.seal(..) 并把所有“数据访问”属性标记为 writable:false，这样就无法修改它们的值。

你可以“深度冻结”一个对象，具体方法为，首先在这个对象上调用 Object.freeze(..)， 然后遍历它引用的所有对象并在这些对象上调用 Object.freeze(..)。但是一定要小心，因 为这样做有可能会在无意中冻结其他(共享)对象


### 7.[[Get]]

属性访问在实现时有一个微妙却非常重要的细节，思考下面的代码:
```js
var myObject = {
    a: 2
};
myObject.a; // 2
```
myObject.a 是一次属性访问，但是这条语句并不仅仅是在 myObjet 中查找名字为 a 的属性， 虽然看起来好像是这样

在语言规范中，myObject.a 在 myObject 上实际上是实现了 [[Get]] 操作(有点像函数调 用:[[Get]]())。对象默认的内置 [[Get]] 操作首先在对象中查找是否有名称相同的属性， 如果找到就会返回这个属性的值。

然而，如果没有找到名称相同的属性，按照 [[Get]] 算法的定义会执行另外一种非常重要的行为。我们会在第 5 章中介绍这个行为(其实就是遍历可能存在的 [[Prototype]] 链， 也就是原型链)

如果无论如何都没有找到名称相同的属性，那 [[Get]] 操作会返回值 undefined:

```js
var myObject = { 
    a:2
};
myObject.b; // undefined
```
注意，这种方法和访问变量时是不一样的。如果你引用了一个当前词法作用域中不存在的 变量，并不会像对象属性一样返回 undefined，而是会抛出一个 ReferenceError 异常:

```js
var myObject = { 
    a: undefined
};
myObject.a; // undefined 
myObject.b; // undefined
```
从返回值的角度来说，这两个引用没有区别——它们都返回了 undefined。然而，尽管乍 看之下没什么区别，实际上底层的 [[Get]] 操作对 myObject.b 进行了更复杂的处理。

由于仅根据返回值无法判断出到底变量的值为 undefined 还是变量不存在，所以 [[Get]] 操作返回了 undefined。不过稍后我们会介绍如何区分这两种情况。

### 8.[[Put]]











