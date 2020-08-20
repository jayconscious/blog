# 混合对象“类”

在研究类的具体机制之前，我们首先会介绍面向类的设计模式:**实例化(instantiation)**、**继承(inheritance)** 和 **(相对)多态(polymorphism)**。

## 类理论

类的另一个核心概念是多态，这个**概念是说父类的通用行为可以被子类用更特殊的行为重写**。实际上，相对多态性允许我们从重写行为中引用基础行为。

### “类”设计模式

你可能从来没把类作为设计模式来看待，讨论得最多的是面向对象设计模式，比如迭代器 模式、观察者模式、工厂模式、单例模式，等等。从这个角度来说，我们似乎是在(低级) 面向对象类的基础上实现了所有(高级)设计模式，似乎面向对象是优秀代码的基础。

当然，如果你有函数式编程(比如 Monad)的经验就会知道类也是非常常用的一种设计模式。但是对于其他人来说，这可能是第一次知道类并不是必须的编程基础，而是一种可选的代码抽象。

### JavaScript中的“类”

JavaScript“类”库试图掩盖这个现实，但是你迟早会面对它:其他语言中的类和 JavaScript 中的“类”并不一样。

## 类的机制

Stack 类仅仅是一个抽象的表示，它描述了所有“栈”需要做的 事，但是它本身并不是一个“栈”。你必须先**实例化** Stack 类然后才能对它进行操作。

### 构造函数

类实例是由一个特殊的类方法构造的，这个方法名通常和类名相同，被称为构造函数。这个方法的任务就是初始化实例需要的所有信息(状态)。

举例来说，思考下面这个关于类的伪代码(编造出来的语法):

```js
class CoolGuy {
    specialTrick = nothing
    CoolGuy( trick ) {
        specialTrick = trick
    }
    showOff() {
        output( "Here's my trick: ", specialTrick )
    }
}
// 我们可以调用类构造函数来生成一个 CoolGuy 实例:

Joe = new CoolGuy( "jumping rope" )
Joe.showOff() // 这是我的绝技:跳绳
```
注意，CoolGuy 类有一个 CoolGuy() 构造函数，执行 new CoolGuy()时实际上就是调用它。构造函数会返回一个对象(也就是类的一个实例)，之后我们可以在这个对象上调用 showOff() 方法，来输出指定 CoolGuy 的特长。

## 类的继承

首先回顾一下本章前面部分提出的 Vehicle 和 Car 类。思考下面关于类继承的伪代码:

```js
class Vehicle {
    engines = 1
    ignition() {
        output( "Turning on my engine." );
    }
    drive() {
        ignition();
        output( "Steering and moving forward!" )
    }
}

class Car inherits Vehicle { 
    wheels = 4
    drive() {
        inherited:drive()
        output( "Rolling on all ", wheels, " wheels!" )
    } 
}

class SpeedBoat inherits Vehicle { 
    engines = 2
    ignition() {
        output( "Turning on my ", engines, " engines." )
    }
    pilot() {
        inherited:drive()
        output( "Speeding through the water with ease!" )
    }
}
```

Car 和 SpeedBoat。它们都从 Vehicle 继承了通用 的特性并根据自身类别修改了某些特性。汽车需要四个轮子，快艇需要两个发动机，因此 它必须启动两个发动机的点火装置。

### 多态

Car 重写了继承自父类的 drive() 方法，但是之后 Car 调用了 inherited:drive() 方法， 这表明 Car 可以引用继承来的原始 drive() 方法。快艇的 pilot() 方法同样引用了原始 drive() 方法。

这个技术被称为多态或者虚拟多态。在本例中，更恰当的说法是相对多态。

## 混入

由于在其他语言中类**表现出来的都是复制行为**，因此 JavaScript 开发者也想出了一个方法来 模拟类的复制行为，这个方法就是混入。接下来我们会看到两种类型的混入:**显式** 和 **隐式**。

首先我们来回顾一下之前提到的 Vehicle 和 Car。由于 JavaScript 不会自动实现 Vehicle 到 Car 的复制行为，所以我们需要手动实现复制功能。这个功能在许多库和框架中被称为 **extend(..)**，但是为了方便理解我们称之为 **mixin(..)**。

```js
// copy 没有的进入到 targetObj
function mixin( sourceObj, targetObj ) {
    for (var key in sourceObj) {
    // 只会在不存在的情况下复制 
        if (!(key in targetObj)) {
            targetObj[key] = sourceObj[key];
        }
    }
    return targetObj; 
}
var Vehicle = { 
    engines: 1,
    ignition: function() {
        console.log( "Turning on my engine." );
    },
    drive: function() { 
        this.ignition();
        console.log( "Steering and moving forward!" );
    }
};

// 生成新的Car
var Car = mixin( Vehicle, 
    { 
        wheels: 4,
        drive: function() { 
            Vehicle.drive.call( this ); 
            console.log( "Rolling on all " + this.wheels + " wheels!");
        } 
    }
);
```

::: tip
有一点需要注意，我们处理的已经不再是类了，因为在 JavaScript 中不存在类，Vehicle 和 Car 都是对象，供我们分别进行复制和粘贴。
:::








