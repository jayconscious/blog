---
title: 最简单的 Store
date: 2021-02-28
sidebar: auto
tags: 
 - Vuex
categories:
 - Vue
---

每一个 `Vuex` 应用的核心就是 `store（仓库）` 。`“store”`基本上就是一个容器，它包含着你的应用中大部分的状态 (state)。 `Vuex` 和单纯的全局对象有以下两点不同：

1、 `Vuex` 的状态存储是响应式的。当 `Vue` 组件从 `store` 中读取状态的时候，若 `store` 中的状态发生变化，那么相应的组件也会相应地得到高效更新。

2、你不能直接改变 `store` 中的状态。改变 `store` 中的状态的唯一途径就是显式地**提交 (commit) mutation**。这样使得我们可以方便地跟踪每一个状态的变化，从而让我们能够实现一些工具帮助我们更好地了解我们的应用。


## 写个demo

创建过程直截了当——仅需要提供一个初始 `state` 对象和一些 `mutation`：

```js
Vue.use(Vuex);
const store = new Vuex.Store({
state: {
    count: 0
},
mutations: {
        increment (state) {
            state.count++
        }
    }
})
```

现在，你可以通过 `store.state` 来获取状态对象，以及通过 `store.commit` 方法触发状态变更：

```js
store.commit('increment')

console.log(store.state.count) // -> 1
```

为了在 `Vue` 组件中访问 `this.$store` property，你需要为 `Vue` 实例提供创建好的 `store` 。 `Vuex` 提供了一个从根组件向所有子组件，以 `store` 选项的方式“注入”该 `store` 的机制：

```js
new Vue({
    el: '#app',
    store: store
})
```

现在我们可以从组件的方法提交一个变更：

```js
methods: {
    increment() {
        this.$store.commit('increment')
        console.log(this.$store.state.count)
    }
}
```
再次强调，我们通过提交 `mutation` 的方式，而非直接改变 `store.state.count`，是因为我们想要更明确地追踪到状态的变化。

这个简单的约定能够让你的意图更加明显，这样你在阅读代码的时候能更容易地解读应用内部的状态改变。

此外，这样也让我们有机会去实现一些能记录每次状态改变，保存状态快照的调试工具。有了它，我们甚至可以实现如时间穿梭般的调。



