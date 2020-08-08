# this全面解析(下)

## 优先级

已经了解了函数调用中 this 绑定的四条规则，为了 解决这个问题就必须给这些规则设定优先级，默认绑定的优先级是四条规则中最低的，所以我们可以先不考虑它。

隐式绑定和显式绑定哪个优先级更高?我们来测试一下:

```js
function foo() {
    console.log( this.a );
}
var obj1 = {
    a: 2,
    foo: foo 
};
var obj2 = {
    a: 3,
    foo: foo
};
obj1.foo(); // 2
obj2.foo(); // 3

obj1.foo.call(obj2) // 3
obj2.foo.call(obj1) // 2
```
可以看到，显式绑定优先级更高，也就是说在判断时应当先考虑是否可以存在显式绑定(Todo: 真的吗？bind())

现在我们需要搞清楚 new 绑定和隐式绑定的优先级谁高谁低:

```js
function foo(something) {
    this.a = something;
}
var obj1 = {
    foo: foo
};
var obj2 = {};
obj1.foo( 2 );
console.log( obj1.a ); // 2

obj1.foo.call( obj2, 3 );
console.log( obj2.a ); // 3

var bar = new obj1.foo( 4 ); 
console.log( obj1.a ); // 2 
console.log( bar.a ); // 4
```
