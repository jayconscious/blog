# Proxy

## 概述

`Proxy` 用于修改某些操作的默认行为，等同于在语言层面做出修改，所以属于一种`“元编程”（meta programming）`，即对编程语言进行编程。

`Proxy` 可以理解成，在目标对象之前架设一层“拦截”，外界对该对象的访问，都必须先通过这层拦截，因此提供了一种机制，可以对外界的访问进行过滤和改写。`Proxy` 这个词的原意是代理，用在
这里表示由它来“代理”某些操作，可以译为“代理器”。

上面的解释很抽象，我们通过一个🌰来展示一下它的能力：

```js
const obj = new Proxy({}, {
    get: function (target, propKey, receiver) {
        console.log(`getting ${propKey}!`);
        return Reflect.get(target, propKey, receiver);
    },
    set: function (target, propKey, value, receiver) {
        console.log(`setting ${propKey}!`);
        return Reflect.set(target, propKey, value, receiver);
    }
})
```
上面代码对一个空对象架设了一层拦截，重定义了属性的读取（`get`）和设置（`set`）行为。这里暂时先不解释具体的语法，只看运行结果。对设置了拦截行为的对象`obj`，去读写它的属性，就会得到下面的结果：

```js
obj.count = 1
// setting count!
++obj.count
// getting count!
// setting count!
```
上面代码说明，`Proxy` 实际上`重载（overload）`了点运算符，即用自己的定义覆盖了语言的原始定义。`ES6` 原生提供 `Proxy` 构造函数，用来生成 `Proxy` 实例。`Proxy` 对象的所有用法，都是上面这种形式，不同的只是 `handler` 参数的写法。其中，`new Proxy()`表示生成一个 `Proxy` 实例， `target` 参数表示所要拦截的目标对象， `handler` 参数也是一个对象，用来定制拦截行为。

下面是另一个拦截读取属性行为的例子。

```js
const obj = new Proxy({}, {
    get: function (target, propKey, receiver) {
        return 35
    }
})
console.log(obj.name) // 35
console.log(obj.age)  // 35
console.log(obj.time) // 35
```
get方法的两个参数分别是目标对象和所要访问的属性。可以看到，由于拦截函数总是返回35，所以访问任何属性都得到35

注意，要使得 `Proxy` 起作用，必须针对 `Proxy` 实例（上例是 `obj` 对象）进行操作，而不是针对目标对象（上例是空对象）进行操作

如果 `handler` 没有设置任何拦截，那就等同于直接通向原对象。

```js
var target = {};
var handler = {};
var proxy = new Proxy(target, handler);
proxy.a = 'b';
console.log('target.a', target.a) // b
console.log(target === proxy)     // false
```
上面代码中， `handler` 是一个空对象，没有任何拦截效果，访问 `proxy` **就等同于访问** `target`。注意：**这两个对象是不同的**。

一个技巧是将 `Proxy` 对象，设置到 `object.proxy` 属性，从而可以在 `object` 对象上调用：
```js
var object = { proxy: new Proxy(target, handler) };
```

`Proxy` 实例也可以作为其他对象的 **原型对象**。
```js
var proxy = new Proxy({}, {
    get: function(target, propKey) {
        return 35;
    }
});
let obj = Object.create(proxy);
console.log(obj.time) // 35
```
上面代码中， `proxy` 对象是 `obj` 对象的原型， `obj` 对象本身并没有 `time` 属性，所以根据原型链，会在 `proxy` 对象上读取该属性，导致被拦截。

同一个拦截器函数，可以设置拦截多个操作。

```js
var handler = {
    get: function(target, name) {
        if (name === 'prototype') {
            return Object.prototype;
        }
        return 'Hello, ' + name;
    },
    apply: function(target, thisBinding, args) {
        // console.log('target', target)
        // console.log('thisBinding', thisBinding)
        // console.log('args', args)
        return args[0];
    },
    construct: function(target, args) {
        return {value: args[1]};
    }
};
var fproxy = new Proxy(function(x, y) {
    return x + y;
}, handler);

console.log(typeof fproxy)  // function
console.log(fproxy(1, 2)) // 1 (触发了 apply)
console.log(new fproxy(1, 2)) // {value: 2} (触发了 construct)
console.log(fproxy.prototype === Object.prototype) // true
console.log(fproxy.foo === "Hello, foo") // true (触发了 get)
```
对于可以设置、但没有设置拦截的操作，则直接落在目标对象上，按照原先的方式产生结果。

下面是 Proxy 支持的拦截操作一览，一共 13 种。

- **get(target, propKey, receiver)：**拦截对象属性的读取，比如 `proxy.foo` 和 `proxy['foo']`
- **set(target, propKey, value, receiver)：**拦截对象属性的设置，比如 `proxy.foo = v` 或 `proxy['foo'] = v`，返回一个布尔值。
- **has(target, propKey)：**拦截 `propKey in proxy` 的操作，返回一个布尔值。
- **deleteProperty(target, propKey)：**拦截 `delete proxy[propKey]` 的操作，返回一个布尔值。
- **ownKeys(target)：**拦截 `Object.getOwnPropertyNames(proxy)、Object.getOwnPropertySymbols(proxy)、Object.keys(proxy)、for...in`循环，返回一个数组。该方法返回目标对象所有自身的属性的属性名，而 `Object.keys()` 的返回结果仅包括目标对象自身的可遍历属性。
- **getOwnPropertyDescriptor(target, propKey)：**拦截 `Object.getOwnPropertyDescriptor(proxy, propKey)`，返回属性的描述对象。
- **defineProperty(target, propKey, propDesc)：**拦截`Object.defineProperty(proxy, propKey, propDesc）、Object.defineProperties(proxy, propDescs)，`返回一个布尔值。
- **preventExtensions(target)：**拦截 `Object.preventExtensions(proxy)`，返回一个布尔值。
- **getPrototypeOf(target)：**拦截 `Object.getPrototypeOf(proxy)`，返回一个对象。
- **isExtensible(target)：**拦截 `Object.isExtensible(proxy)`，返回一个布尔值。
- **setPrototypeOf(target, proto)：**拦截`Object.setPrototypeOf(proxy, proto)，`返回一个布尔值。如果目标对象是函数，那么还有两种额外操作可以拦截。
- **apply(target, object, args)：**拦截 `Proxy` 实例作为函数调用的操作，比如`proxy(...args)、proxy.call(object, ...args)、proxy.apply(...)`。
- **construct(target, args)：**拦截 `Proxy` 实例作为构造函数调用的操作，比如`new proxy(...args)`。

## Proxy 实例的方法

下面是上面这些拦截方法的详细介绍。


1. **get()**

`get`方法用于拦截某个属性的读取操作，可以接受三个参数，依次为目标对象、属性名和 `proxy` 实例本身（严格地说，是操作行为所针对的对象），其中最后一个参数可选。

`get`方法的用法，上文已经有一个例子，下面是另一个拦截读取操作的例子。

```js
var person = { name: "张三" };
var proxy = new Proxy(person, {
    get: function(target, propKey) {
        if (propKey in target) {
            return target[propKey];
        } else {
            throw new ReferenceError("Prop name \"" + propKey + "\" does not exist.");
        }
    }
});

console.log(proxy.name) // "张三"
console.log(proxy.age) // 抛出一个错误  
```

上面代码表示，如果访问目标对象不存在的属性，会抛出一个错误。如果没有这个拦截函数，访问不存在的属性，只会返回undefined。

`get` 方法可以继承。

```js
let proto = new Proxy({}, {
    get(target, propertyKey, receiver) {
        console.log('GET ' + propertyKey);
        return target[propertyKey];
    }
});

let obj = Object.create(proto);
console.log(obj.foo) // "GET foo" // undefine
```

上面代码中，拦截操作定义在 `Prototype` 对象上面，所以如果读取obj对象继承的属性时，拦截会生效。

下面的例子使用get拦截，实现数组读取负数的索引。

```js
// 可以把多个参数存为一个数组
function createArray(...elements) {
    console.log('elements', elements)
    // elements == [...arguments]
    let handler = {
        get(target, propKey, receiver) {
            let index = Number(propKey);
            if (index < 0) {
                propKey = String(target.length + index);
            }
            return Reflect.get(target, propKey, receiver);
        }
    };

    let target = [];
    target.push(...elements);
    return new Proxy(target, handler);
}

let arr = createArray('a', 'b', 'c');
console.log(arr[-1]) // c
```
上面代码中，数组的位置参数是 -1，就会输出数组的倒数第一个成员。

利用 `Proxy` 可以将读取属性的操作`（get）`，转变为执行某个函数，从而实现属性的链式操作。

```js
// Array.prototype.reduce()
const array1 = [1, 2, 3, 4];
const reducer = (accumulator, currentValue) => accumulator + currentValue;
// 1 + 2 + 3 + 4
console.log(array1.reduce(reducer));
// expected output: 10
// 5 + 1 + 2 + 3 + 4
console.log(array1.reduce(reducer, 5));
// expected output: 15

var pipe = function (value) {
    var funcStack = [];
    var oproxy = new Proxy({} , {
        get : function (pipeObject, fnName) {
            if (fnName === 'get') {
                return funcStack.reduce(function (val, fn) {
                    return fn(val);
                }, value);
            }
            funcStack.push(window[fnName]);
            return oproxy;
        }
    });
    return oproxy;
}
var double = n => n * 2;

var pow = n => n * n;
var reverseInt = n => n.toString().split("").reverse().join("") | 0;
console.log(pipe(3).double.pow.reverseInt.get); // 63
// ((3 * 2) * (3 * 2)) = 36
```

下面是一个get方法的第三个参数的例子，它总是指向原始的读操作所在的那个对象，一般情况下就是 `Proxy` 实例。

```js
const proxy = new Proxy({}, {
    get: function(target, key, receiver) {
        return receiver;
    }
});
console.log(proxy.get === proxy)
```

上面代码中， `proxy` 对象的 `getReceiver` 属性是由 `proxy` 对象提供的，所以 `receiver` 指向 `proxy` 对象。

```js
const proxy = new Proxy({}, {
  get: function(target, key, receiver) {
    return receiver;
  }
});

const d = Object.create(proxy);
console.log(d.a === d) // true
```

如果一个属性**不可配置**（ `configurable` ）且**不可写**（ `writable` ），则 `Proxy` **不能修改该属性**，否则通过 Proxy 对象访问该属性会报错。
































































