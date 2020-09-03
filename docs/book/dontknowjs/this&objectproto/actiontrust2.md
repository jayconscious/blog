# 行为委托(下)

## 更简洁的设计

对象关联除了能让代码看起来更简洁(并且更具扩展性)外还可以通过行为委托模式简化代码结构。我们来看最后一个例子，它展示了对象关联如何简化整体设计。

在传统的类设计模式中，我们会把基础的函数定义在名为 Controller 的类中，然后派生两 个子类 LoginController 和 AuthController，它们都继承自 Controller 并且重写了一些基础行为:

```js
// 父类
function Controller() {
    this.errors = []; 
}
Controller.prototype.showDialog = function(title,msg) { 
    // 给用户显示标题和消息
};
Controller.prototype.success = function(msg) {
    this.showDialog( "Success", msg );
};

Controller.prototype.failure = function(err) { 
    this.errors.push( err );
    this.showDialog( "Error", err );
};
// 子类
function LoginController() {
    Controller.call( this );
}

// 把子类关联到父类
LoginController.prototype = Object.create( Controller.prototype );

LoginController.prototype.getUser = function() {
    return document.getElementById( "login_username" ).value;
};

LoginController.prototype.getPassword = function() {
    return document.getElementById( "login_password" ).value; 
};

LoginController.prototype.validateEntry = function(user,pw) { 
    user = user || this.getUser();
    pw = pw || this.getPassword();
    if (!(user && pw)) {
        return this.failure("Please enter a username & password!");
    } else if (pw.length < 5) {
        return this.failure("Password must be 5+ characters!"); 
    }
    // 如果执行到这里说明通过验证
    return true;
};
// 重写基础的 failure() 
LoginController.prototype.failure = function(err) {
    //“super”调用 
    // super.failure(...)
    Controller.prototype.failure.call(this,"Login invalid: " + err);
};

// 子类
function AuthController(login) {
    Controller.call( this ); 
    // 合成
    this.login = login;
}

// 把子类关联到父类
AuthController.prototype = Object.create( Controller.prototype );

AuthController.prototype.server = function(url,data) {
    return $.ajax( { url: url, data: data } );
};

AuthController.prototype.checkAuth = function() {
    var user = this.login.getUser(); 
    var pw = this.login.getPassword();
    if (this.login.validateEntry( user, pw )) {
        this.server( "/check-auth",{ user: user, pw: pw } )
            .then( this.success.bind( this ) )
            .fail( this.failure.bind( this ) ); 
    }
};

// 重写基础的 success() 
AuthController.prototype.success = function() {
    //“super”调用
    Controller.prototype.success.call( this, "Authenticated!" );
};

// 重写基础的 failure() 
AuthController.prototype.failure = function(err) {
    //“super”调用 
    Controller.prototype.failure.call( this,"Auth Failed: " + err);
};

var auth = new AuthController (
    // 除了继承，我们还需要合成 
    new LoginController()
);

auth.checkAuth();
```
所有控制器共享的基础行为是 success(..)、failure(..) 和 showDialog(..)。 子 类 LoginController 和 AuthController 通过重写 failure(..) 和 success(..) 来扩展默认基础类行为。此外，注意 AuthController 需要一个 LoginController 的实例来和登录表单进行 交互，因此这个实例变成了一个数据属性。

另一个需要注意的是我们在继承的基础上进行了一些合成。AuthController 需要使用 LoginController，**因此我们实例化后者(new LoginController())并用一个类成员属性 this.login 来引用它，这样 AuthController 就可以调用 LoginController 的行为**

### 反类
但是，我们真的需要用一个 Controller 父类、两个子类加上合成来对这个问题进行建模吗?能不能使用对象关联风格的行为委托来实现更简单的设计呢?当然可以!

```js
var LoginController = { 
    errors: [],
    getUser: function() {
        return document.getElementById("login_username").value;
    },
    getPassword: function() {
        return document.getElementById( "login_password").value; 
    },
    validateEntry: function(user,pw) { 
        user = user || this.getUser(); 
        pw = pw || this.getPassword();
        if (!(user && pw)) { 
            return this.failure("Please enter a username & password!");
        } else if (pw.length < 5) {
            return this.failure("Password must be 5+ characters!");
        }
        // 如果执行到这里说明通过验证
        return true; 
    },
    showDialog: function(title,msg) {
        // 给用户显示标题和消息
    },
    failure: function(err) {
        this.errors.push( err );
        this.showDialog( "Error", "Login invalid: " + err ); 
    }
};

```
由于 AuthController 只是一个对象(LoginController 也一样)，因此我们不需要实例化(比如 new AuthController())，只需要一行代码就行:

```js
AuthController.checkAuth();
```
借助对象关联，你可以简单地向委托链上添加一个或多个对象，而且同样不需要实例化:

```js
var controller1 = Object.create( AuthController ); 
var controller2 = Object.create( AuthController );
```
在行为委托模式中，AuthController 和 LoginController 只是对象，它们之间是兄弟关系， 并不是父类和子类的关系。代码中 AuthController 委托了 LoginController，反向委托也完全没问题。

最后，我们避免了面向类设计模式中的多态。我们在不同的对象中没有使用相同的函 数名 success(..) 和 failure(..)，这样就不需要使用丑陋的显示伪多态。相反，在 AuthController 中它们的名字是 accepted(..) 和 rejected(..)——可以更好地描述它们的行为。


总结:我们用一种(极其)简单的设计实现了同样的功能，这就是对象关联风格代码和**行为委托**设计模式的力量。

## 更好的语法

ES6 的 class 语法可以简洁地定义类方法，这个特性让 class 乍看起来更有吸引力

```js
class Foo {
    methodName() { /* .. */ }
}
```

在 ES6 中，你可以使用对象的字面形式(这样就可以使用简洁方法定义)来改写之前繁琐的属性赋值语法(比如 AuthController 的定义)，然后用 Object.setPrototypeOf(..) 来修改它的 [[Prototype]]:

```js
// 使用更好的对象字面形式语法和简洁方法 
var AuthController = {
    errors: [],
    checkAuth() {
        // ... 
    },
    server(url,data) {
        // ...
    }
    // ...
};
// 现在把 AuthController 关联到 LoginController 
Object.setPrototypeOf( AuthController, LoginController );
```

### 反词法

简洁方法有一个非常小但是非常重要的缺点。思考下面的代码:

```js
var Foo = {
    bar() { /*..*/ },
    baz: function baz() { /*..*/ }
};
去掉语法糖之后的代码如下所示:

var Foo = {
    bar: function() { /*..*/ }, 
    baz: function baz() { /*..*/ }
};
```
看到区别了吗? 由于函数对象本身没有名称标识符， 所 以 bar() 的 缩 写 形 式 (function()..)实际上会变成一个匿名函数表达式并赋值给 bar 属性。相比之下，具名函数表达(function baz()..)会额外给 .baz 属性附加一个词法名称标识符 baz。

匿名函数没有 name 标识符，这会导致:
1. 调试栈更难追踪;
2. 自我引用(递归、事件(解除)绑定，等等)更难; 
3. 代码(稍微)更难理解。
简洁方法没有第 1 和第 3 个缺点。

很不幸，简洁方法无法避免第 2 个缺点，它们不具备可以自我引用的词法标识符。思考下面的代码:

```js
var Foo = {
    bar: function(x) {
        if(x<10){
            return Foo.bar( x * 2 );
        }
    },
    baz: function baz(x) { 
        if(x < 10){
            return baz( x * 2 ); 
        }
        return x; 
    }
};

```
在本例中使用 Foo.bar(x*2) 就足够了，但是在许多情况下无法使用这种方法，**比如多个对象通过代理共享函数、使用 this 绑定**，等等。这种情况下最好的办法就是使用函数对象的 name 标识符来进行真正的自我引用。

## 内省

如果你写过许多面向类的程序(无论是使用 JavaScript 还是其他语言)，那你可能很熟悉**内省**。内省就是检查实例的类型。类实例的内省主要目的是通过创建方式来判断对象的结构和功能

下面的代码使用 instanceof 来推测对象 a1 的功能:

```js
function Foo() { 
    // ...
}
Foo.prototype.something = function(){
    // ... 
}
var a1 = new Foo();
// 之后
if (a1 instanceof Foo) { 
    a1.something();
}

```
因为 Foo.prototype(不是 Foo !)在 a1 的 [[Prototype]] 链上(参见第 5 章)，所以 instanceof 操作(会令人困惑地)告诉我们 a1 是 Foo“类”的一个实例。知道了这点后， 我们就可以认为 a1 有 Foo“类”描述的功能。

instanceof 语法会产生语义困惑而且非常不直观。如果你想检查对象 a1 和某个对象的关 系，那必须使用另一个引用该对象的函数才行——你不能直接判断两个对象是否关联。

还记得本章之前介绍的抽象的 Foo/Bar/b1 例子吗，简单来说是这样的:

```js
function Foo() { /* .. */ }
Foo.prototype...

function Bar() { /* .. */ }
Bar.prototype = Object.create( Foo.prototype );

var b1 = new Bar( "b1" );
```

如果要使用 instanceof 和 .prototype 语义来检查本例中实体的关系，那必须这样做:

```js
// 让Foo和Bar互相关联
Bar.prototype instanceof Foo; // true Todo:

Object.getPrototypeOf( Bar.prototype ) === Foo.prototype; // true

Foo.prototype.isPrototypeOf( Bar.prototype ); // true

// 让b1关联到Foo和Bar
b1 instanceof Foo; // true
b1 instanceof Bar; // true

Object.getPrototypeOf( b1 ) === Bar.prototype; // true 
Foo.prototype.isPrototypeOf( b1 ); // true 
Bar.prototype.isPrototypeOf( b1 ); // true
```

还有一种常见但是可能更加脆弱的内省模式，许多开发者认为它比 instanceof 更好。这种模式被称为“鸭子类型”。这个术语源自这句格言“**如果看起来像鸭子，叫起来像鸭子，那就一定是鸭子**。”

举例来说:

```js
if (a1.something) { 
    a1.something();
}
```
我们并没有检查 a1 和委托 something() 函数的对象之间的关系，而是假设如果 a1 通过了 测试 a1.something 的话，那 a1 就一定能调用 .something()(无论这个方法存在于 a1 自身是委托到其他对象)。这个假设的风险其实并不算很高。

我们没有使用 instanceof，因为它会产生一些和类有关的误解。现在我们想问的问题是 “你是我的原型吗?”我们并不需要使用间接的形式，比如 Foo.prototype 或者繁琐的 Foo.prototype.isPrototypeOf(..)。

我觉得和之前的方法比起来，这种方法显然更加简洁并且清晰。再说一次，我们认为JavaScript 中对象关联比类风格的代码更加简洁(而且功能相同)

## 总结

在软件架构中你可以选择是否使用类和继承设计模式。大多数开发者理所当然地认为类是 唯一(合适)的代码组织方式，但是本章中我们看到了另一种更少见但是更强大的设计模式: **行为委托**。

行为委托认为对象之间是兄弟关系，互相委托，而不是父类和子类的关系。JavaScript 的 [[Prototype]] 机制本质上就是行为委托机制。也就是说，我们可以选择在 JavaScript 中努 力实现类机制(参见第 4 和第 5 章)，也可以拥抱更自然的 [[Prototype]] 委托机制。

当你只用对象来设计代码时，不仅可以让语法更加简洁，而且可以让代码结构更加清晰。

对象关联(对象之前互相关联)是一种编码风格，它倡导的是直接创建和关联对象，不把它们抽象成类。对象关联可以用基于 [[Prototype]] 的行为委托非常自然地实现。










