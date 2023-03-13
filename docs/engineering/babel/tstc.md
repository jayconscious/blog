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



## 源码解析

### tokenizer
**tokenizer** 将原始代码解析为 **tokens**，就像这样：

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
    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')',
      });
      current++;
      continue;
    }
    let WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }
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
这段代码并不是很多，我都贴在这里了。核心思想就是 `while` 循环来遍历代码字符串，通过 `current` 下标指针来枚举判断当前字符是属于那个 `case`，然后用js对象来描述，这样的js对象我们称之为 **token**，对于`字符串`，和`“字符串”`会再加一层`while`循环匹配出完整的子项，放到 **tokens**中。


### parser

### transformer

### codeGenerator

### compiler



## 总结





