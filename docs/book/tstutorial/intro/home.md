# 简介

# 关于 TypeScript

[TypeScript](https://www.typescriptlang.org/zh/) 是 JavaScript 的一个**超集**，主要提供了类型系统和对 ES6 的支持，它由 Microsoft 开发，代码开源于 [GitHub](https://github.com/Microsoft/TypeScript) 上。

## 什么是 TypeScript

> TypeScript 是 JavaScript 的类型的超集，它可以编译成纯 JavaScript。编译出来的 JavaScript 可以运行在任何浏览器上。TypeScript 编译工具可以运行在任何服务器和任何系统上。TypeScript 是开源的。

## 为什么选择 TypeScript

1. ### TypeScript 增加了代码的可读性和可维护性
- 类型系统实际上是最好的文档，大部分的函数看看类型的定义就可以知道如何使用了
- 可以在编译阶段就发现大部分错误，这总比在运行时候出错好
- 增强了编辑器和 IDE 的功能，包括代码补全、接口提示、跳转到定义、代码重构

2. ### TypeScript 非常包容
- TypeScript 是 JavaScript 的超集，.js 文件可以直接重命名为 .ts 即可
- 即使不显式的定义类型，也能够自动做出**类型推论**
- TypeScript 的类型系统是图灵完备的，可以定义从简单到复杂的几乎一切类型
- 即使 TypeScript 编译报错，也可以生成 JavaScript 文件
- 兼容第三方库，即使第三方库不是用 TypeScript 写的，也可以编写单独的类型文件供 TypeScript 读取

3. ### TypeScript 拥有活跃的社区
- 大部分第三方库都有提供给 TypeScript 的类型定义文件
- Angular、Vue、VS Code、Ant Design 等等耳熟能详的项目都是使用 TypeScript 编写的
- TypeScript 拥抱了 ES6 规范，支持 ESNext 草案中处于第三阶状态（Stage 3）的特性

4. ### TypeScript 的缺点
- 有一定的学习成本，需要理解接口（Interfaces）、泛型（Generics）、类（Classes）、枚举类型（Enums）等前端工程师可能不是很熟悉的概念
- 短期可能会增加一些开发成本，毕竟要多写一些类型的定义，不过对于一个需要长期维护的项目，TypeScript 能够减少其维护成本
- 集成到构建流程需要一些工作量
- 可能和一些库结合的不是很完美

# 安装 TypeScript
TypeScript 的命令行工具安装方法如下：
>  npm install -g typescript
以上命令会在全局环境下安装 tsc 命令，安装完成之后，我们就可以在任何地方执行 **tsc** 命令了。

编译一个 TypeScript 文件很简单：
> tsc hello.ts

## 编辑器

vs

# Hello TypeScript

我们从一个简单的例子开始。

将以下代码复制到 hello.ts 中：

```js
function sayHello(person: string) {
    return 'Hello, ' + person;
}

let user = 'Tom';
console.log(sayHello(user));
console.log(sayHello(123)); // 比如
```
tsc hello.ts,这时候会生成一个编译好的文件 hello.js：

```js
function sayHello(person) {
    return 'Hello, ' + person;
}
var user = 'Tom';
console.log(sayHello(user));
console.log(sayHello(123)); // 比如
```

::: tip
rgument of type 'number' is not assignable to parameter of type 'string'.7 console.log(sayHello(123));
:::

在 TypeScript 中，我们使用 : 指定变量的类型，: 的前后有没有空格都可以。

这是因为 **TypeScript 只会在编译时对类型进行静态检查，如果发现有错误，编译的时候就会报错**。而在运行时，与普通的 JavaScript 文件一样，不会对类型进行检查。

如果我们需要保证运行时的参数类型，**还是得手动对类型进行判断：** (此时我觉得ts有点鸡肋~)

```js
function sayHello(person: string) {
    if (typeof person === 'string') {
        return 'Hello, ' + person;
    } else {
        throw new Error('person is not a string');
    }
}
let user = 'Tom';
console.log(sayHello(user));
```

这是因为 **TypeScript 编译的时候即使报错了，还是会生成编译结果**，我们仍然可以使用这个编译之后的文件。

如果要在报错的时候终止 js 文件的生成，可以在 tsconfig.json 中配置 noEmitOnError 即可。关于 tsconfig.json [文档](https://zhongsp.gitbooks.io/typescript-handbook/content/doc/handbook/tsconfig.json.html)





