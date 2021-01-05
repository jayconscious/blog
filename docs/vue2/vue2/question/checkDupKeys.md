# 为什么列表组件不用 index 作为 key

### 背景

在我们写 `v-for` 列表渲染时，如果没有给要被循环渲染的元素添加 `key` 的话是会报 `warning`。为什么会会这样，背后到底有什么的逻辑联系？

我们来举个栗子，代码如下

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>demo5</title>
    <script src="../lib/vue.js"></script>

</head>
<body>
    <div id="app">
        <li v-for="item in list">{{ item }}</li>
    </div>
    <script>
        const curVue = new Vue({
            data: {
                list: ['a', 'b', 'c', 'd', 'e']
            },
            mounted () {
                setTimeout(() => {
                    this.list.splice(2, 0, 'f')
                }, 1000)
            },
        }).$mount('#app')
        console.log(curVue)
        console.log(curVue.$options.render.toString())
    </script>
</body>
</html>
```

### 不写 key 和 写 key 的区别

如果不写 `key` 的话，在 `patch` 的时候，`sameVnode` 方法会返回 `true`，会执行 `patchVnode`，复用当前的节点，更新 `DOM` 数据，流程如下：

![image](/blog/assets/img/vue2/question/checkDupKeys1.png)

在没有设置 `key` 的情况下，流程如下：

1. 比较`a`，`a`，相同类型的节点，进行 `patchVnode`，但数据相同，不发生 `DOM` 操作
2. 比较`b`，`b`，相同类型的节点，进行 `patchVnode`，但数据相同，不发生 `DOM` 操作
3. 比较`c`，`f`，不相同类型的节点，进行 `patchVnode`，数据不同，发生 `DOM` 操作
4. 比较`d`，`c`，不相同类型的节点，进行 `patchVnode`，数据不同，发生 `DOM` 操作
5. 比较`e`，`d`，不相同类型的节点，进行 `patchVnode`，数据不同，发生 `DOM` 操作
5. 循环结束，将 `e` 插入到 `DOM` 中

有 3 次更新操作，1次插入操作

我们再来看看，在有设置 `key` 的情况下：

1. 比较`a`，`a`，相同类型的节点，进行 `patchVnode`，但数据相同，不发生 `DOM` 操作
2. 比较`b`，`b`，相同类型的节点，进行 `patchVnode`，但数据相同，不发生 `DOM` 操作
3. 比较`c`，`f`，不相同类型的节点
    - 比较`e`，`e`，相同类型的节点，进行 `patchVnode`，但数据相同，不发生 `DOM` 操作
4. 比较`d`，`d`，相同类型的节点，进行 `patchVnode`，但数据相同，不发生 `DOM` 操作
5. 比较`c`，`c`，相同类型的节点，进行 `patchVnode`，但数据相同，不发生 `DOM` 操作
6. 循环结束，将 `f` 插入到 `c` 之前

只发生了 1 次插入操作

在这上述情况下，设置 `key` 值显然是提高 `diff` 的效率，而且减少了不必要的 `DOM`，但是如果上述在在末尾插入的，设置也没有什么卵用了。

::: tip
1. <li v-for="(item, index) in list" :key="index">{{ item }}</li>,这种把 `index` 作为 `key` 显然也没有什么卵用。
2. 我们想象一种极端的情况，比如在列表中嵌套许多的子节点，如果有 curd 相关的操作，设置 key 的唯一值，对性能的提升是巨大的。
:::

### 原理分析

我们可以简单看一下源码：

主要是在 `sameVnode` 这个方法中，这里判断是否为同一个`key`，首先判断的是`key`值是否相等如果没有设置`key`，那么`key`为`undefined`，这时候`undefined`是恒等于`undefined`

```js
function sameVnode(a, b) {
    return (
        a.key === b.key && (
            (
                a.tag === b.tag &&
                a.isComment === b.isComment &&
                isDef(a.data) === isDef(b.data) &&
                sameInputType(a, b)
            ) || (
                isTrue(a.isAsyncPlaceholder) &&
                a.asyncFactory === b.asyncFactory &&
                isUndef(b.asyncFactory.error)
            )
        )
    )
}
```

`updateChildren` 方法中会对新旧 `vnode` 进行 `diff`，然后将比对出的结果用来更新真实的 `DOM`
```js
function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
    // ...
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (isUndef(oldStartVnode)) {
            // ...
        } else if (isUndef(oldEndVnode)) {
            // ...
        } else if (sameVnode(oldStartVnode, newStartVnode)) {
            // ...
        } else if (sameVnode(oldEndVnode, newEndVnode)) {
            // ...
        } else if (sameVnode(oldStartVnode, newEndVnode)) {
            // ...
        } else if (sameVnode(oldEndVnode, newStartVnode)) {
            // ...
        } else {
            // ...
        }
    }
    // ...
}
```
::: tip
diff 的详细过程可以参考 [virtual DOM && Diff](https://jayconscious.github.io/blog/vue2/vue2/vueDiff.html)
:::

















