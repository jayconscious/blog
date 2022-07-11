---
title: 如何劫持 window.location.href 的思考
date: 2022-06-13
sidebar: auto
tags: 
 - js
categories:
 - Javascript
---

## 思路
背景：群里的小伙伴提问，`window.location.href` 能否被拦截
1、第一想到的解决方案：使用 `Object.getOwnPropertyDescriptor(window.location, 'href')` 获取其对象属性描述符；然后再使用 `Object.defineProperty` 去重写 `window.location.href`
2、发现再使用 `Object.defineProperty` 劫持时，有报错。`Object.defineProperty`有生效的作用范围。
3、好奇 `window.location.href` 底层是如何实现的？
4、思路：1、从原因入手去分析解决。2、搜索
5、尝试使用其他的方式看看能否劫持 `window.location.href`
6、`window.location` 是一个只读的属性，js层面是不可以操作他的，想要拦截的话只能在浏览器层面去做
7、比如 chrome 浏览器，制作一个插件去解决这个问题







