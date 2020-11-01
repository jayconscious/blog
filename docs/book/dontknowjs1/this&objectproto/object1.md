# 对象(上)

对象可以通过两种形式定义:声明(文字)形式和构造形式。

## 语法
对象的文字语法大概是这样:
```js
var myObj = { 
    key: value
    // ... 
};
```
构造形式大概是这样:
```js
var myObj = new Object(); 
myObj.key = value;
```
**构造形式和文字形式生成的对象是一样的**。唯一的区别是，在文字声明中你可以添加多个 键 / 值对，但是在构造形式中你必须逐个添加属性。

## 类型

对象是 JavaScript 的基础。在 JavaScript 中一共有六种主要类型(术语是“语言类型”):
- string
- number
- boolean
- null
- undefined 
- object
注意，简单基本类型(string、boolean、number、null 和 undefined)本身并不是对象。 null 有时会被当作一种对象类型(原理是这样的，不同的对象在底层都表示为二进制，在 JavaScript 中二进制前三位都为 0 的话会被判 断为 object 类型，null 的二进制表示是全 0，自然前三位也是 0，所以执行 typeof 时会返回“object”。)，但是这其实只是语言本身的一个 bug，即对 null 执行 typeof null 时会返回字符串 "object"。1 实际上，null 本身是基本类型。

实际上，JavaScript 中有许多特殊的对象子类型，我们可以称之为复杂基本类型。

**函数就是对象的一个子类型(从技术角度来说就是“可调用的对象”)。JavaScript 中的函 数是“一等公民”，因为它们本质上和普通的对象一样(只是可以调用)，所以可以像操作 其他对象一样操作函数(比如当作另一个函数的参数)。**

**数组也是对象的一种类型**，具备一些额外的行为。数组中内容的组织方式比一般的对象要稍微复杂一些。

### 内置对象

JavaScript 中还有一些对象子类型，通常被称为内置对象。有些内置对象的名字看起来和 简单基础类型一样，不过实际上它们的关系更复杂：
- String
- Number
- Boolean 
- Object
- Function 
- Array
- Date
- RegExp
- Error

但是在 JavaScript 中，它们实际上只是一些内置函数。这些内置函数可以当作构造函数 (由 new 产生的函数调用——参见第 2 章)来使用，从而可以构造一个对应子类型的新对象。举例来说:

```js
var strPrimitive = "I am a string"; 
typeof strPrimitive; // "string" 
strPrimitive instanceof String; // false

var strObject = new String( "I am a string" );
typeof strObject; // "object"
strObject instanceof String; // true

// 检查 sub-type 对象
Object.prototype.toString.call( strObject );    // [object String]
Object.prototype.toString.call( strPrimitive ); // [object String] Todo: why?
```

在之后的章节中我们会详细介绍 Object.prototype.toString... 是如何工作的，不过简单 来说，我们可以认为子类型在内部借用了 Object 中的 toString() 方法。从代码中可以看 到，strObject 是由 String 构造函数创建的一个对象。

原始值 "I am a string" 并不是一个对象，它只是一个字面量，并且是一个不可变的值。 如果要在这个字面量上执行一些操作，比如获取长度、访问其中某个字符等，**那需要将其转换为 String 对象。** 在必要时语言会自动把字符串字面量转换成一个 String 对象.

思考下面的代码:

```js
var strPrimitive = "I am a string";

console.log( strPrimitive.length ); // 13

console.log( strPrimitive.charAt( 3 ) ); // "m"
```
使用以上两种方法，我们都可以直接在字符串字面量上访问属性或者方法，之所以可以这样做，**是因为引擎自动把字面量转换成 String 对象**，所以可以访问属性和方法。

null 和 undefined 没有对应的构造形式，它们只有文字形式。相反，Date 只有构造，没有文字形式。

对于 Object、Array、Function 和 RegExp(正则表达式)来说，无论使用文字形式还是构 造形式，它们都是对象，不是字面量。在某些情况下，相比用文字形式创建对象，构造形式可以提供一些额外选项。由于这两种形式都可以创建对象，所以我们首选更简单的文字 形式。建议只在需要那些额外选项时使用构造形式。

## 内容

之前我们提到过，对象的内容是由一些存储在特定命名位置的(任意类型的)值组成的，我们称之为属性(就是key)。

需要强调的一点是，当我们说“内容”时，似乎在暗示这些值实际上被存储在对象内部， 但是这只是它的表现形式。在引擎内部，这些值的存储方式是多种多样的，一般并不会存在对象容器内部。存储在对象容器内部的是这些属性的名称，**它们就像指针(从技术角度来说就是引用)一样**，指向这些值真正的存储位置。

```js
var myObject = {
    a: 2
};
myObject.a; // 2

myObject["a"]; // 2
// Todo: 这两种有什么不同的地方呢...
```
.a 语法通 常被称为“属性访问”，["a"] 语法通常被称为“键访问”。

这两种语法的主要区别在于 . **操作符要求属性名满足标识符的命名规范，而 [".."] 语法可以接受任意 UTF-8/Unicode 字符串作为属性名**。举例来说，如果要引用名称"Super-Fun!" 的属性，那就必须使用 ["Super-Fun!"] 语法访问，因为 Super-Fun! 并不是一个有效 的标识符属性名。

```js
var myObject = { };
myObject[true] = "foo";
myObject[3] = "bar";
myObject[myObject] = "baz";

myObject["true"]; // "foo"
myObject["3"]; // "bar"
myObject["[object Object]"]; // "baz"
```

### 1.可计算属性名

如果你需要通过表达式来计算属性名，那么我们刚刚讲到的 myObject[..] 这种属性访问语 法就可以派上用场了，如可以使用myObject[prefix + name]。但是使用文字形式来声明对象时这样做是不行的。

ES6 增加了可计算属性名，可以在文字形式中使用 [] 包裹一个表达式来当作属性名:

```js
var prefix = "foo";
var myObject = {
    [prefix + "bar"]: "hello", 
    [prefix + "baz"]: "world"
};
myObject["foobar"]; // hello
myObject["foobaz"]; // world
```

可计算属性名最常用的场景可能是 ES6 的符号(Symbol)，本书中不作详细介绍。不过 简单来说，它们是一种新的基础数据类型，包含一个不透明且无法预测的值(从技术角度来说就是一个字符串)。
一般来说你不会用到符号的实际值(因为理论上来说在不 同的 JavaScript 引擎中值是不同的)，所以通常你接触到的是符号的名称，比如 Symbol.Something:

```js
var myObject = {
    [Symbol.Something]: "hello world"
}
// [..]是比. 更好访问对象属性的一种方式
```

### 2.属性与方法

从技术角度来说，函数永远不会“属于”一个对象，所以把对象内部引用的函数称为“方法”似乎有点不妥。

无论返回值是什么类型，每次访问对象的属性就是属性访问。如果属性访问返回的是一个 函数，那它也并不是一个“方法”。属性访问返回的函数和其他函数没有任何区别(除了 可能发生的隐式绑定 this，就像我们刚才提到的)

```js
function foo() { 
    console.log( "foo" );
}
var someFoo = foo; // 对 foo 的变量引用
var myObject = { 
    someFoo: foo
};
foo; // function foo(){..}
someFoo; // function foo(){..} 
myObject.someFoo; // function foo(){..}
```

someFoo 和 myObject.someFoo 只是对于同一个函数的不同引用，并不能说明这个函数是特 别的或者“属于”某个对象。如果 foo() 定义时在内部有一个 this 引用，那这两个函数引用的唯一区别就是 myObject.someFoo 中的 this 会被隐式绑定到一个对象。无论哪种引用 形式都不能称之为“方法”。

最保险的说法可能是，“函数”和“方法”在 JavaScript 中是可以互换的。

::: tip
S6 增加了 super 引用，一般来说会被用在 class 中(参见附录 A)。super 的行为似乎更有理由把 super 绑定的函数称为“方法”。但是再说一次，这 些只是一些语义(和技术)上的微妙差别，本质是一样的。
:::

即使你在对象的文字形式中声明一个函数表达式，这个函数也不会“属于”这个对象—— 它们只是对于相同函数对象的多个引用。

```js
var myObject = {
    foo: function() {
        console.log( "foo" );
    }
};
var someFoo = myObject.foo; 
someFoo; // function foo(){..} 
myObject.foo; // function foo(){..} // 都是一样的
```

### 3.数组

数组也支持 [] 访问形式，不过就像我们之前提到过的，**数组有一套更加结构化的值存储机制**(不过仍然不限制值的类型)。数组期望的是数值下标，也就是说值存储的位置(通常被称为索引)是非负整数，比如说 0 和 42:

```js
var myArray = [ "foo", 42, "bar" ]; 
myArray.length; // 3
myArray[0]; // "foo"
myArray[2]; // "bar"
```
**数组也是对象**，所以虽然每个下标都是整数，你仍然可以给数组添加属性:

```js
var myArray = [ "foo", 42, "bar" ];
myArray.baz = "baz"; 
myArray.length; // 3
myArray.baz; // "baz"
console.log(myArray) // ["foo", 42, "bar", baz: "baz"] 类数组对象
Array.from(myArray) // ["foo", 42, "bar"]
```

### 4.复制对象

JavaScript 初学者最常见的问题之一就是如何复制一个对象。看起来应该有一个内置的 copy()方法，是吧?实际上事情比你想象的更复杂，因为我们无法选择一个默认的复制算法。

举例来说，思考一下这个对象:

```js
function anotherFunction() { /*..*/ }

var anotherObject = { 
    c: true
};

var anotherArray = [];

var myObject = {
    a: 2,
    b: anotherObject, // 引用，不是复本! 
    c: anotherArray, // 另一个引用!
    d: anotherFunction
};

// anotherArray.push( anotherObject, myObject ); 会出现什么恶果
```
**如何准确地表示 myObject 的复制呢?**

对于 JSON 安全(也就是说可以被序列化为一个 JSON 字符串并且可以根据这个字符串解 析出一个结构和值完全一样的对象)的对象来说，有一种巧妙的复制方法:

```js
var newObj = JSON.parse( JSON.stringify( someObj ) )
```
当然，这种方法需要保证对象是 JSON 安全的，所以只适用于部分情况。

相比深复制，浅复制非常易懂并且问题要少得多，所以 ES6 定义了 Object.assign(..) 方 法来实现浅复制。Object.assign(..) 方法的第一个参数是目标对象，之后还可以跟一个或多个源对象。**它会遍历一个或多个源对象的所有可枚举**(enumerable，参见下面的代码) 的自有键(owned key，很快会介绍)并把它们复制(**使用 = 操作符赋值**)到目标对象，最后返回目标对象，就像这样:

```js
var newObj = Object.assign( {}, myObject );
newObj.a; // 2
newObj.b === anotherObject; // true
newObj.c === anotherArray; // true
newObj.d === anotherFunction; // true
// 所以对于引用的属性来说，并没有重新分配一个引用
```
::: tip
后面介绍“属性描述符”以及 Object.defineProperty(..) 的用法。但是需要注意的一点是，由于 Object.assign(..) 就是使用 = 操作符来赋值，所 以源对象属性的一些特性(比如 writable)不会被复制到目标对象。
:::














