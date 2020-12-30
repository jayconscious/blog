# virtual DOM && Diff

## 背景

算法都是为了解决实际的问题而诞生的，由于vue是有数据驱动视图的，由于浏览器的原生Dom节点信息复杂，操作十分消耗浏览器的性能，(其实单次的dom操作原生是最快的，但是多次的操作还是基于vNode机制最佳)由于虚拟dom，就是重要的中间产物。`virtual dom`就是vue为了描述真实dom，自己定义的一套 `AST`，再有相关的渲染函数生成真实的Dom。其中就有一个问题，但数据驱动视图不一定是全量更新，应该取用最小化差量更新原则，所以Diff算法由此诞生。

在vue中 `template` 会被编译为 `render function`，然后配合响应式系统，将`render function`挂载在`render-watcher`中，当有数据更改的时候，调度中心 `Dep` 通知该`render-watcher` 执行 `render function`，完成视图的渲染与更新。

整个流程的链路是没有什么问题的，但是我们思考一个极端的问题，每当我们去更新一个细微的节点都要全局更新，这显然是很浪费性能的。`为了解决这个问题`,vue中为了实现最小化更新，在vue中将真实dom 抽象成了 `virtual DOM`，即用一个js对象(VNode)来描述一个真实的dom。在有数据更新时，新旧VNode进行 `Diff`，找出尽可能少的我们需要更新的真实 DOM 节点，然后只更新需要更新的节点，从而解决频繁更新 DOM 产生的性能问题。

::: tip
实际上，当某个数据被修改的时候，set方法会让闭包中的 `Dep` 调用 `notify` 通知所有订阅者 `Watcher`，`Watcher` 通过get方法执行 `vm._update(vm._render(), hydrating)`。`vm._render()` 生成新的VNode，`vm._update` 则实际是调用的是 `patch` 函数, 而 `patch` 则由 `createPatch` 生成。
:::


## VNode 的定义

`virtual node`即虚拟节点，用来描述真实dom，本质上市一个js对象，在 Vue 的每一个组件实例中，会挂载一个`$createElement`函数，所有的`VNode`都是由这个函数创建的。当前全局的vnode生成函数挂载`vm.$options.render`，实质上是调用 `$createElement`，函数的入参是有模板编译器生成为可执行的string，然后调用`new Function`生成的函数。然后`vnode`作为`vm._update`入参，渲染页面。

比如我们创建一个 test 的vnode节点：

```js {.line-numbers}
// 声明 render function
render: function (createElement) {
    // 也可以使用 this.$createElement 创建 VNode
    return createElement('div', 'test');
}
// 以上 render 方法返回html片段 <div>test</div>
```

<!-- Todo: 添加 vue vNode 的定义 -->

## Diff

Diff 将新老 VNode 节点进行比对，然后将根据两者的比较结果进行最小单位地修改视图，而不是将整个视图根据新的 VNode 重绘，进而达到提升性能的目的

#### patch

Vue.js 内部的 diff 被称为patch。其 diff 算法的是通过同层的树节点进行比较，而非对树进行逐层搜索遍历的方式，所以时间复杂度只有O(n)，是一种相当高效的算法。

<!-- Todo: 添加图片 -->

首先定义新老节点是否`相似`判定函数`sameVnode`：满足键值`key`和标签名`tag`必须一致等条件，返回`true`，否则`false`。

```js {.line-numbers}
function sameVnode(a, b) {
    return (
        a.key === b.key && (
            (
                a.tag === b.tag &&
                a.isComment === b.isComment &&
                isDef(a.data) === isDef(b.data) &&
                sameInputType(a, b)
            ) || (
                // 判断 isAsyncPlaceholder ...
            )
        )
    )
}
```
在进行`patch`之前，新老 `VNode` 是否满足条件`sameVnode(oldVnode, newVnode)`，满足条件之后，进入流程`patchVnode`，否则被判定为不相同节点，此时会移除老节点，创建新节点。

::: tip
1. `sameVnode`这个方法几个判断节点是否相似的维度非常重要，可以在这样的场景下，最高效去判别当前的两个节点是否`相似`或者`相同`。`vNodeData`的不同会在后续 `pacthVnode` 中更新
2. `vm._updata` 调用的是 `vm.__patch__`, `vm.__patch__` === `patch`, 后者是由 `createPatch` 生成，这样做的目的是为了抽象出 `dom 操作` 这一层，比如在 `server` 环境。
:::

#### patchVnode

`patchVnode` 的主要作用是判定如何对子节点进行更新。












