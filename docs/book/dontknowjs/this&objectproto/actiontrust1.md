# 行为委托

首先简单回顾一下的结论:[[Prototype]] 机制就是指对象中的一个内部链接引用另一个对象。

如果在第一个对象上没有找到需要的属性或者方法引用，引擎就会继续在 [[Prototype]] 关联的对象上进行查找。同理，如果在后者中也没有找到需要的引用就会继续查找它的 [[Prototype]]，以此类推。这一系列对象的链接被称为“原型链”。

换句话说，**JavaScript 中这个机制的本质就是对象之间的关联关系**。 这个观点对于理解本章的内容来说是非常基础并且非常重要的。


## 面向委托的设计

**我们需要试着把思路从类和继承的设计模式转换到委托行为的设计模式**。

### 类理论

假设我们需要在软件中建模一些类似的任务(“XYZ”、“ABC”等)

如果使用类，那设计方法可能是这样的:定义一个通用父(基)类，可以将其命名为 Task，在 Task 类中定义所有任务都有的行为。接着定义子类 XYZ 和 ABC，它们都继承自 Task 并且会添加一些特殊的行为来处理对应的任务。

非常重要的是，类设计模式鼓励你在继承时使用方法重写(和多态)，比如说在 XYZ 任务中重写 Task 中定义的一些通用方法，甚至在添加新行为时通过 super 调用这个方法的原始 版本。你会发现许多行为可以先“抽象”到父类然后再用子类进行特殊化(重写)。

下面是对应的伪代码:

```js
class Task { 
    id;
    // 构造函数 Task()
    Task(ID) { id = ID; } 
    outputTask() {
        output( id ); 
    }
}

class XYZ inherits Task { 
    label;
    // 构造函数 XYZ()
    XYZ(ID,Label) { 
        super( ID ); 
        label = Label; 
    } 
    utputTask() { 
        super(); 
        output( label ); 
    }
}

class ABC inherits Task { 
    // ...
}
```
现在你可以实例化子类 XYZ 的一些副本然后使用这些实例来执行任务“XYZ”。这些实例 会复制 Task 定义的通用行为以及 XYZ 定义的特殊行为。同理，ABC 类的实例也会复制 Task 的行为和 ABC 的行为。在构造完成后，你通常只需要操作这些实例(而不是类)，因为每个实例都有你需要完成任务的所有行为。


### 委托理论

但是现在我们试着来使用**委托行为**而不是类来思考同样的问题。

首先你会定义一个名为 Task 的对象(和许多 JavaScript 开发者告诉你的不同，它既不是类也不是函数)，它会包含所有任务都可以使用(写作使用，读作委托)的具体行为。接着， 对于每个任务(“XYZ”、“ABC”)你都会定义一个对象来存储对应的数据和行为。你会把 特定的任务对象都关联到 Task 功能对象上，让它们在需要的时候可以进行委托。

基本上你可以想象成，执行任务“XYZ”需要两个兄弟对象(XYZ 和 Task)协作完成。但 是我们并不需要把这些行为放在一起，通过类的复制，我们可以把它们分别放在各自独立 的对象中，需要时可以允许 XYZ 对象委托给 Task。

下面是推荐的代码形式，非常简单:

```js
Task = {
    setID: function(ID) { this.id = ID; },
    outputID: function() { console.log( this.id ); }
}

// 让XYZ委托Task
XYZ = Object.create( Task );

XYZ.prepareTask = function(ID,Label) { 
    this.setID( ID );
    this.label = Label;
};

XYZ.outputTaskDetails = function() { 
    this.outputID();
    console.log( this.label );
};
// ABC = Object.create( Task ); 
// ABC ... = ...
```

在这段代码中，Task 和 XYZ 并不是类(或者函数)，它们是对象。XYZ 通过 Object. create(..) 创建，它的 [[Prototype]] 委托了 Task 对象。

相比于面向类(或者说面向对象)，我会把这种编码风格称为“对象关联”(OLOO， objects linked to other objects)。我们真正关心的只是 XYZ 对象(和 ABC 对象)委托了 Task 对象。

在 JavaScript 中，[[Prototype]] 机制会把对象关联到其他对象。无论你多么努力地说服自 己，JavaScript 中就是没有类似“类”的抽象机制。这有点像逆流而上:你确实可以这么做，但是如果你选择对抗事实，那要达到目的就显然会更加困难。

对象关联风格的代码还有一些不同之处。

1. 在上面的代码中，id 和 label 数据成员都是直接存储在 XYZ 上(而不是 Task)。通常 来说，在 [[Prototype]] 委托中最好把状态保存在委托者(XYZ、ABC)而不是委托目标
(Task)上。

2. 在类设计模式中，我们故意让父类(Task)和子类(XYZ)中都有outputTask方法，这样就可以利用重写(多态)的优势。在委托行为中则恰好相反:我们会尽量**避免**在 [[Prototype]] 链的不同级别中使用**相同的命名**，否则就需要使用笨拙并且脆弱的语法来消除引用歧义。

3. this.setID(ID);XYZ中的方法首先会寻找XYZ自身是否有setID(..)，但是XYZ中并没 有这个方法名，因此会通过 [[Prototype]] 委托关联到 Task 继续寻找，这时就可以找到 setID(..) 方法。此外，由于调用位置触发了 this 的隐式绑定规则(参见第 2 章)，因 此虽然 setID(..) 方法在 Task 中，运行时 this 仍然会绑定到 XYZ，这正是我们想要的。 在之后的代码中我们还会看到 this.outputID()，原理相同。

**委托行为意味着某些对象(XYZ)在找不到属性或者方法引用时会把这个请求委托给另一个对象(Task)**。

::: tip
在 API 接口的设计中，委托最好在内部实现，不要直接暴露出去。在之前的例子中我们并没有让开发者通过 API 直接调用 XYZ.setID()。
:::

#### Tips

**1. 互相委托(禁止)**

你无法在两个或两个以上互相(双向)委托的对象之间创建循环委托。如果你把 B 关联到 A 然后试着把 A 关联到 B，就会出错。


**2. 调试**

当然，这并不是对象关联风格代码的缺点。当你使用对象关联风格来编写代码并使用行 为委托设计模式时，**并不需要关注是谁“构造了”对象**(就是使用 new 调用的那个函数)。 只有使用类风格来编写代码时 Chrome 内部的“构造函数名称”跟踪才有意义，使用对象 关联时这个功能不起任何作用。

### 比较思维模型

现在你已经明白了“类”和“委托”这两种设计模式的理论区别，接下来我们看看它们在思维模型方面的区别。

我们会通过一些示例(Foo、Bar)代码来比较一下两种设计模式(面向对象和对象关联) 具体的实现方法。下面是典型的(“原型”)面向对象风格:

```js
function Foo(who) { 
    this.me = who
}

Foo.prototype.identify = function() {
    return "I am " + this.me; 
};

function Bar(who) { 
    Foo.call( this, who );
}

Bar.prototype = Object.create( Foo.prototype );

Bar.prototype.speak = function() {
    alert( "Hello, " + this.identify() + "." );
}

var b1 = new Bar( "b1" );
var b2 = new Bar( "b2" );

b1.speak();
b2.speak();
```
子类 Bar 继承了父类 Foo，然后生成了 b1 和 b2 两个实例。b1 委托了 Bar.prototype，Bar.prototype 委托了 Foo.prototype。这种风格很常见，你应该很熟悉了。

下面我们看看如何使用对象关联风格来编写功能完全相同的代码:

```js
Foo = {
    init: function(who) {
        this.me = who; 
    },
    identify: function() {
        return "I am " + this.me;
    } 
};
Bar = Object.create( Foo );

Bar.speak = function() {
    alert( "Hello, " + this.identify() + "." );
}
var b1 = Object.create( Bar );
b1.init( "b1" );
var b2 = Object.create( Bar );
b2.init( "b2" );

b1.speak();
b2.speak();
```

这段代码中我们同样利用 [[Prototype]] 把 b1 委托给 Bar 并把 Bar 委托给 Foo，和上一段 代码一模一样。我们仍然实现了三个对象之间的关联

但是非常重要的一点是，这段代码简洁了许多，我们只是把对象关联起来，并不需要那些 既复杂又令人困惑的模仿类的行为(构造函数、原型以及 new)。

下面我们看看两段代码对应的思维模型。

首先，类风格代码的思维模型强调实体以及实体间的关系:


