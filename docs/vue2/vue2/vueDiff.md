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

1. 第一种情况：如果新旧节点满足以下条件(isStatic相同、key相同、isCloned或者是isOnce(v-once))的话，依旧使用原来的实例

2. 第二种情况：如果 oldVnode 和 vnode 都有 children，就去更新子节点 updateChildren

3. 第三种情况：如果只存在 vnode 的孩子节点，那门只需要将 ch 节点全部插入到 elm 中

4. 第四种情况：如果只存在 oldVnode 的孩子节点，那只需要将 oldCh 全部删除即可

5. 第五种情况种情况： 如果是文本节点的话，更新文本


#### updateChildren

如果满足上述的第二种情况的话，就会执行 `updateChildren`。Diff 的核心，对比新老子节点数据，判定如何对子节点进行操作，在对比过程中，`由于老的子节点存在对当前真实 DOM 的引用，新的子节点只是一个 VNode 数组`，所以在进行遍历的过程中，若发现需要更新真实 DOM 的地方，则会直接在老的子节点上进行真实 DOM 的操作，等到遍历结束，新老子节点则已同步结束。

`updateChildren` 内部定义了4个`索引`变量，分别是`oldStartIdx`、`oldEndIdx`、`newStartIdx`、`newEndIdx`，分别表示正在 Diff 对比的新老子节点的左右边界点索引。
在老子节点数组中，索引在`oldStartIdx`与`oldEndIdx`中间的节点，表示老子节点中为被遍历处理的节点。在新的子节点数组中，索引在`newStartIdx`与`newEndIdx`中间的节点，表示新子节点中为被遍历处理的节点。

所以这里就有了我们循环遍历的条件了，`oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx` 或者 `oldStartIdx > oldEndIdx || newStartIdx > newEndIdx`。

![image](/blog/assets/img/vue2/diff/diff1.png)

在遍历中，取出4索引对应的 Vnode节点：
- oldStartIdx：oldStartVnode
- oldEndIdx：oldEndVnode
- newStartIdx：newStartVnode
- newEndIdx：newEndVnode

diff 过程中，如果存在key，并且满足`sameVnode`，会将该 DOM 节点进行复用，否则则会创建一个新的 DOM 节点。

1. 第一种情况：`oldStartVnode` 不存在， `oldStartIdx` 向后移动 

2. 第二种情况：`oldEndVnode` 不存在， `oldEndIdx` 向前移动

::: tip
为什么在循环开始会优先判断这两种情况，为什么会存在没有节点情况，框架在这里帮我们做了什么？
:::

3. 第三种情况：先 `oldStartVnode` 和 `newStartVnode` 相似，`patch` 节点， `oldStartIdx` 与 `newStartIdx` 向后移动。

![image](/blog/assets/img/vue2/diff/diff2.png)


4. 第四种情况： `oldEndVnode` 和 `newEndVnode` 相似，`patch` 节点， `oldEndIdx` 与 `newEndIdx` 向前移动

![image](/blog/assets/img/vue2/diff/diff3.png)

5. 第五种情况：`oldStartVnode` 与 `newEndVnode` 相似，说明当前的这个节点已经向后移动了，`patch` 节点，还需要将 `oldStartVnode` 的真实 DOM 节点移动到 `oldEndVnode` 的后面，(`nodeOps.nextSibling(oldEndVnode.elm)`)，并且 `oldStartIdx` 前后移，`newEndIdx` 向前移

![image](/blog/assets/img/vue2/diff/diff4.png)

6. 第六种情况：`oldEndVnode` 与 `newStartVnode` 相似，说明当前的这个节点已经向前移动了，`patch` 节点，将 `oldEndVnode` 的真实 DOM 节点移动到`oldStartVnode` 的前面，并且 `oldEndIdx` 向前移，`newStartIdx` 前后移

![image](/blog/assets/img/vue2/diff/diff5.png)

当以上这些情况都不满足时，那么则在 `oldStartIdx` 与 `oldEndIdx` 之间查找与 `newStartVnode` 相似节点，若存在，`patch` 节点，则将匹配的节点真实 DOM 移动到 `oldStartVnode` 的前面。

![image](/blog/assets/img/vue2/diff/diff6.png)

若不存在，说明 `newStartVnode` 为新节点，创建新节点放在 `oldStartVnode` 前面即可。

![image](/blog/assets/img/vue2/diff/diff7.png)

当 `oldStartIdx > oldEndIdx` 或者 `newStartIdx > newEndIdx`，循环结束，这个时候我们需要处理那些未被遍历到的 VNode。

当 `oldStartIdx > oldEndIdx` 时，说明老的节点已经遍历完，而新的节点没遍历完，这个时候需要将新的节点创建之后放在 `oldEndVnode` 后面。

![image](/blog/assets/img/vue2/diff/diff8.png)

当 `newStartIdx > newEndIdx` 时，说明新的节点已经遍历完，而老的节点没遍历完，这个时候要将没遍历的老的节点全都删除。

![image](/blog/assets/img/vue2/diff/diff9.png)



