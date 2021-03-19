---
title: vue组件里的data为什么是函数返回一个对象
date: 2021-02-18
sidebar: auto
tags: 
 - Vue
categories:
 - Vue2.x
---

事实上如果组件里 `data` 直接写了一个对象的话，那么如果你在模板中多次声明这个组件，组件中的 `data` 会指向同一个引用。

### 那么为什么会这样呢？

举个栗子：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>demo4</title>
    <script src="../lib/vue.js"></script>

</head>
<body>
    <div id="app">
        <counter id="a"></counter>
        <counter id="b"></counter>
    </div>
    <script>
        var Counter = {
            template: `<span @click="count++">{{ count }}</span>`,
            data: {
                count: 0
            }
            // data: function () {
            //     return {
            //        count: 0
            //     }
            // }
        }
        const curVue = new Vue({
            components: {
                Counter,
            },
            data: {
            },
            methods: {
                
            },
        }).$mount('#app')

        console.log(curVue)
        console.log(curVue.$options.render.toString())
    </script>
</body>
</html>
```

点击 `counter` 的时，两个组件的数字会变成一样，这无疑证实了，上述的判断是正确的，这两个组件的 `data` 使用的是同一个索引，其实在 `vue` 的内部会检测组件内部的 `data` 是不是 `function`，如果不是，会直接报错的。如下，

```js
strats.data = function ( parentVal, childVal, vm ) {
    if (!vm) {
        if (childVal && typeof childVal !== 'function') {
            warn(
                'The "data" option should be a function ' +
                'that returns a per-instance value in component ' +
                'definitions.',
                vm
            );
            return parentVal
        }
        return mergeDataOrFn(parentVal, childVal)
    }
    return mergeDataOrFn(parentVal, childVal, vm)
};
```

在 meger 数据时，如果不是函数的话， merge 的就是一个对象，从而总成组件内部使用的是同一个对象索引。

```js
typeof childVal === 'function' ? childVal.call(this, this) : childVal
```




