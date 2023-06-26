---
title: the-super-tiny-compiler 源码解析
date: 2023-03-07
sidebar: auto
tags:
  - Babel
categories:
  - Engineering
sticky: 1
---

## 前言
`babel`是我们前端工程师日常工作经常接触的工具。那么它是什么，官网有这很好的解释。`Babel` 是一个工具链，主要用于将采用 `ECMAScript 2015+` 语法编写的代码转换为向后兼容的 `JavaScript` 语法，以便能够运行在当前和旧版本的浏览器或其他环境中。下面列出的是 `Babel` 能为你做的事情：
- 语法转换
- 通过 `Polyfill` 方式在目标环境中添加缺失的功能（通过引入第三方 `polyfill` 模块，例如 `core-js`)
- 源码转换（`codemods`）
- 以及其他的能力
`the-super-tiny-compiler`项目高屋建瓴地解释了 `Babel` 的工作方式，其大致流程如下图：
![image](/assets/img/tstc.png)

接下来让我们一起对其源码探究一番。
## 源码解析

### tokenizer

**tokenizer** 将原始代码解析为 **tokens**，就像这样：

```
'(add 2 (subtract 4 2))'
```

解析为

```js
[
  { type: 'paren',  value: '('        },
  { type: 'name',   value: 'add'      },
  ...
]
```

每一个 **token** 就是一个原始代码字符描述对象，`type`属性就是类型，比如 `paren`，`value`则是对应具体的字符。我们来结合源码来看看是如何实现的吧~

```js
function tokenizer(input) {
  let current = 0;
  let tokens = [];
  while (current < input.length) {
    let char = input[current];
    if (char === "(") {
      tokens.push({
        type: "paren",
        value: "(",
      });
      current++;
      continue;
    }
    // other case，例如 ‘(’, /\s/,
    let NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {
      let value = "";
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }
      tokens.push({ type: "number", value });
      continue;
    }
    // 字符串情景，例如 "foo"
    if (char === '"') {
      let value = "";
      char = input[++current];
      while (char !== '"') {
        value += char;
        char = input[++current];
      }
      char = input[++current];
      tokens.push({ type: "string", value });
      continue;
    }
    let LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      let value = "";
      // 匹配出整个字符串
      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }
      tokens.push({ type: "name", value });
      continue;
    }
    throw new TypeError("I dont know what this character is: " + char);
  }
  return tokens;
}
```

这段代码并不是很多，我都贴在这里了。核心思想就是 `while` 循环来遍历代码字符串，通过 `current` 下标指针来枚举判断当前字符是属于那个 `case`，然后用 js 对象来描述，这样的 js 对象我们称之为 **token**，例如
`{ type: 'paren',  value: '('}` 。对于`字符串`的 case, 例如`“foo”`会再加一层`while`循环匹配出完整的子项，放到 **tokens**中。

### parser

在这个阶段，主要将**tokens**进行此法解析，得到我们想要的 **AST(抽象语法树)**。对抽象语法树，不了解的同学，可以点击这里哈。[抽象语法树](https://zh.wikipedia.org/wiki/%E6%8A%BD%E8%B1%A1%E8%AA%9E%E6%B3%95%E6%A8%B9)。我的理解就是通过**对象**这个数据类型，来描述一段程序代码。这里的重点是**描述**，即在解析阶段可以标记相关词法语法，在代码生成阶段，根据标记生成对应的代码。

```js
const ast = {
  type: "Program",
  body: [
    {
      type: "CallExpression",
      name: "add",
      params: [
        {
          // ...
        },
        {
          // ...
        },
      ],
    },
  ],
};
```

```js
function parser(tokens) {
  let current = 0;
  function walk() {
    let token = tokens[current];
    if (token.type === "number") {
      current++;
      return {
        type: "NumberLiteral",
        value: token.value,
      };
    }
    if (token.type === "string") {
      current++;
      return {
        type: "StringLiteral",
        value: token.value,
      };
    }
    if (token.type === "paren" && token.value === "(") {
      // 函数调用
      token = tokens[++current];
      let node = {
        type: "CallExpression",
        name: token.value,
        params: [],
      };
      token = tokens[++current];
      while (
        token.type !== "paren" ||
        (token.type === "paren" && token.value !== ")")
      ) {
        // 函数调用参数整理
        node.params.push(walk());
        token = tokens[current];
      }
      current++;
      return node;
    }
    throw new TypeError(token.type);
  }
  let ast = {
    type: "Program",
    body: [],
  };
  while (current < tokens.length) {
    ast.body.push(walk());
  }
  return ast;
}
```

这段代码`50`行的样子，主要实现了**递归解析 tokens 生成 AST 的功能**。主要分为两个部分，第一部分，通过 `current`下标指针来标记每一个 **token**，配合 `while`循环来开启递归解析。第二部分，就是 `walk`函数，通过类型判断，如果是 `number`类型，就返回 `{type: 'NumberLiteral',value: token.value }`的节点来描述，那有的同学可能就有疑问了，这和 `tokenizer`没有什么区别啊！只是变换了一下类型罢了。稍安勿躁，我们接着往下看，当有 `(`左括号时，那意味着将开启一个函数的调用，通常会有函数名和相关参数组成。即在语法解析返回`{type: 'CallExpression',name: 'xxx' ,params: []};`，函数名很容易取得，`current`向前移动可得。`params` 的获取，通过`while循环`调用 `walk`函数，生成 `params` 参数，这里我们要注意一下循环的条件，不可以是有括号`)`，那样的话就表示函数调用结束的。这样就得到了，我们想要的抽象语法树了。

### transformer

在这个阶段，将一种 `lisp ast` 转变为另一种`c ast`,一起看看是如何实现的吧。

```js
function transformer(ast) {
  let newAst = {
    type: "Program",
    body: [],
  };
  ast._context = newAst.body;

  function traverser(ast, visitor) {
    function traverseArray(array, parent) {
      array.forEach((child) => {
        traverseNode(child, parent);
      });
    }
    function traverseNode(node, parent) {
      let methods = visitor[node.type];
      // Tip: 1、先去调用 visitor 内置的转换函数
      if (methods && methods.enter) {
        methods.enter(node, parent);
      }
      // Tip: 2、再去判断node的类型
      switch (node.type) {
        case "Program":
          traverseArray(node.body, node);
          break;
        case "CallExpression":
          traverseArray(node.params, node);
          break;
        // ...
      }
      // ...
    }
    traverseNode(ast, null);
  }

  traverser(ast, {
    NumberLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: "NumberLiteral",
          value: node.value,
        });
      },
    },
    // ...
  });

  return newAst;
}
```

在进入 `transformer` 函数之后，先定义了一个新的用于返回的 `newAst` 对象; `ast._context = newAst.body`将 `newAst.body`挂载在 `ast._context`下面，有的同学可能会有疑惑这是要干啥，看不懂没关系，先跳过。 之后是调用`traverser`函数，有两个入参，一个是`ast`，还有一个是对象，这个对象是一组映射，比如`NumberLiteral`属性下面，有一个`enter`函数，没有上下文的联系，只知道在 `parent._context` 看下推入了一个新的节点。

我们定位到 `traverser` 函数，内部的启动是在 `traverseNode` 函数，我们看看它干了些啥。第一步，现将当前节点转化为符合 `c ast`规范的节点，比如是 `NumberLiteral`类型，将新的`ast` 节点推入到 `parent._context`。我们再以 `node.type == CallExpression`来看一下，是如何转换的。

```js
traverser(ast, {
  CallExpression: {
    enter(node, parent) {
      let expression = {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: node.name,
        },
        arguments: [],
      };
      node._context = expression.arguments;
      if (parent.type !== "CallExpression") {
        expression = {
          type: "ExpressionStatement",
          expression: expression,
        };
      }
      parent._context.push(expression);
    },
  },
});
```

先创建一个 `expression`对象，包含描述一个函数`c ast`的基本要素，`node._context = expression.arguments` 这一步很重要，是否感觉似曾相识。在如上这个例子，此时当时`node`为 `add`这个函数时，它的`parent`即为根节点，`parent._context.push(expression)`，也就是将这个放入到了`newAst.body`中，所以`node._context = expression.arguments`也是如此。

这样通过 `traverseArray`的循环和`traverseNode`的递归就将所有的节点转换完成了。

### codeGenerator

这个阶段主要是将已经转换之后的 `ast` 生成代码。我们来看看是如何实现滴

```js
function codeGenerator(node) {
  switch (node.type) {
    case "Program":
      return node.body.map(codeGenerator).join("\n");
    case "ExpressionStatement":
      return codeGenerator(node.expression) + ";";
    case "CallExpression":
      return (
        codeGenerator(node.callee) +
        "(" +
        node.arguments.map(codeGenerator).join(", ") +
        ")"
      );
    case "Identifier":
      return node.name;
    case "NumberLiteral":
      return node.value;
    case "StringLiteral":
      return '"' + node.value + '"';
    default:
      throw new TypeError(node.type);
  }
}
```
主要是一个依据有限类型判断，生成对应字符串的递归函数，没有什么可说的。
### compiler
```js
function compiler(input) {
  let tokens = tokenizer(input);
  let ast = parser(tokens);
  let newAst = transformer(ast);
  let output = codeGenerator(newAst);
  return output;
}
```
`compiler`就是将如上的各个步骤穿了起来，可以整体对外暴露。
## 总结
本文通过对 `the-super-tiny-compiler` 源码的解析，了解了 `babel`转换代码的几个功能模块，以及他们是如何协作的。仓库代码含有大量的注释，可以帮助我们很好的了解其原理。欢迎大家自行探究~

## 参考文献
- [the-super-tiny-compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)