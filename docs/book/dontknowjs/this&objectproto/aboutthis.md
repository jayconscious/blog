# 关于this

> this 关键字是 JavaScript 中最复杂的机制之一。它是一个很特别的关键字，被自动定义在 所有函数的作用域中。但是即使是非常有经验的 JavaScript 开发者也很难说清它到底指向什么(任何足够先进的技术都和魔法无异。)


## 为什么要用this

下面我们来解释一下为什么要使用 this:

```js
function identify() {
    return this.name.toUpperCase();
}
function speak() {
    var greeting = "Hello, I'm " + identify.call( this ); 
    console.log( greeting );
}
var me = {
    name: "Kyle"
};
var you = {
    name: "Reader"
};

identify.call( me );    // KYLE
identify.call( you );   // READER
speak.call( me );       // Hello, 我是 KYLE 
speak.call( you );      // Hello, 我是 READER

```
这段代码可以在不同的上下文对象(me 和 you)中重复使用函数identify() 和 speak()， 不用针对每个对象编写不同版本的函数。
如果不使用 this，那就需要给 identify() 和 speak() 显式传入一个上下文对象。比如这样，

```js
function identify(context) {
    return context.name.toUpperCase();
}
function speak(context) {
    var greeting = "Hello, I'm " + identify( context );
    console.log( greeting );
}
identify( you ); // READER
speak( me ); //hello, I'm KYLE
```

## 2 误解

1. **指向自身**

人们很容易把 this 理解成指向函数自身，这个推断从英语的语法角度来说是说得通的。






