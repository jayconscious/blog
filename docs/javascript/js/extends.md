# 继承的几种方式以及优缺点

## 前言

继承作为面向对象编程的几大特征(封装，继承，多态)之一，区别于其他面向对象的编程语言，我们来看看在 `JavaScript` 中继承实现的几种方式以及优缺点。

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













