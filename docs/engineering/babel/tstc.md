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
<!-- TODO: -->


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
    if (char === '(') {
      tokens.push({
        type: 'paren',
        value: '(',
      });
      current++;
      continue;
    }
    // other case，例如 ‘(’, /\s/, 
    let NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {
      let value = '';
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }
      tokens.push({ type: 'number', value });
      continue;
    }
    // 字符串情景，例如 "foo"
    if (char === '"') {
      let value = '';
      char = input[++current];
      while (char !== '"') {
        value += char;
        char = input[++current];
      }
      char = input[++current];
      tokens.push({ type: 'string', value });
      continue;
    }
    let LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      let value = '';
      // 匹配出整个字符串
      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }
      tokens.push({ type: 'name', value });
      continue;
    }
    throw new TypeError('I dont know what this character is: ' + char);
  }
  return tokens;
}
```

这段代码并不是很多，我都贴在这里了。核心思想就是 `while` 循环来遍历代码字符串，通过 `current` 下标指针来枚举判断当前字符是属于那个 `case`，然后用js对象来描述，这样的js对象我们称之为 **token**，例如
`{ type: 'paren',  value: '('}` 。对于`字符串`的case, 例如`“foo”`会再加一层`while`循环匹配出完整的子项，放到 **tokens**中。

### parser
在这个阶段，主要将**tokens**进行此法解析，得到我们想要的 **AST(抽象语法树)**。对抽象语法树，不了解的同学，可以点击这里哈。[抽象语法树](https://zh.wikipedia.org/wiki/%E6%8A%BD%E8%B1%A1%E8%AA%9E%E6%B3%95%E6%A8%B9)。我的理解就是通过**对象**这个数据类型，来描述一段程序代码。这里的重点是**描述**，即在解析阶段可以标记相关词法语法，在代码生成阶段，根据标记生成对应的代码。

```js
const ast = {
  type: 'Program',
  body: [{
    type: 'CallExpression',
    name: 'add',
    params: [{
      // ...
    }, {
      // ...
    }]
  }]
};
```
```js
function parser(tokens) {
  let current = 0;
  function walk() {
    let token = tokens[current];
    if (token.type === 'number') {
      current++;
      return {
        type: 'NumberLiteral',
        value: token.value,
      };
    }
    if (token.type === 'string') {
      current++;
      return {
        type: 'StringLiteral',
        value: token.value,
      };
    }
    if (token.type === 'paren' && token.value === '(') {
      // 函数调用
      token = tokens[++current];
      let node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      };
      token = tokens[++current];
      while ((token.type !== 'paren') || (token.type === 'paren' && token.value !== ')')) {
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
    type: 'Program',
    body: [],
  };
  while (current < tokens.length) {
    ast.body.push(walk());
  }
  return ast;
}
```
这段代码`50`行的样子，主要实现了**递归解析tokens生成AST的功能**。主要分为两个部分，第一部分，通过 `current`下标指针来标记每一个 **token**，配合 `while`循环来开启递归解析。第二部分，就是 `walk`函数，通过类型判断，如果是 `number`类型，就返回 `{type: 'NumberLiteral',value: token.value }`的节点来描述，那有的同学可能就有疑问了，这和 `tokenizer`没有什么区别啊！只是变换了一下类型罢了。稍安勿躁，我们接着往下看，当有 `(`左括号时，那意味着将开启一个函数的调用，通常会有函数名和相关参数组成。即在语法解析返回`{type: 'CallExpression',name: 'xxx' ,params: []};`，函数名很容易取得，`current`向前移动可得。`params` 的获取，通过`while循环`调用 `walk`函数，生成 `params` 参数，这里我们要注意一下循环的条件，不可以是有括号`)`，那样的话就表示函数调用结束的。这样就得到了，我们想要的抽象语法树了。

### transformer


### codeGenerator

### compiler



## 总结





