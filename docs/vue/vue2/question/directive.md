---
title: vue 中如何自定义指令及其原理
date: 2021-03-15
sidebar: auto
tags: 
 - Vue
categories:
 - Vue2
---

## 如何自定义指令？

其实关于这个问题官方文档上已经有了很好的示例的，我们先来温故一下。

除了核心功能默认内置的指令 (`v-model` 和 `v-show`)，Vue 也允许注册自定义指令。注意，在 Vue2.0 中，代码复用和抽象的主要形式是组件。然而，有的情况下，你仍然需要对普通 DOM 元素进行底层操作，这时候就会用到自定义指令。举个聚焦输入框的例子，如下：


当页面加载时，该元素将获得焦点 (注意： `autofocus` 在移动版 `Safari` 上不工作)。事实上，只要你在打开这个页面后还没点击过任何内容，这个输入框就应当还是处于**聚焦状态**。现在让我们用指令来实现这个功能：

```js
// 注册一个全局自定义指令 `v-focus`
Vue.directive('focus', {
// 当被绑定的元素插入到 DOM 中时……
    inserted: function (el) {
        // 聚焦元素
        el.focus()
    }
})
```

如果想注册局部指令，组件中也接受一个 `directives` 的选项：

```js
directives: {
  focus: {
    // 指令的定义
    inserted: function (el) {
      el.focus()
    }
  }
}
```
然后你可以在模板中任何元素上使用新的 `v-focus property`，如下：

```html
<input v-focus>
```

### 指令内部提供的钩子函数

一个指令定义对象可以提供如下几个钩子函数 (均为可选)：

- `bind:` 只调用一次，指令第一次绑定到元素时调用。在这里可以进行一次性的初始化设置。
- `inserted:` 被绑定元素插入父节点时调用 (仅保证父节点存在，但不一定已被插入文档中)。
- `update:` 所在组件的 VNode 更新时调用，**但是可能发生在其子 VNode 更新之前。**指令的值可能发生了改变，也可能没有。但是你可以通过比较更新前后的值来忽略不必要的模板更新 (详细的钩子函数参数见下)。
- `componentUpdated:` 指令所在组件的 VNode 及**其子VNode**全部更新后调用。
- `unbind:` 只调用一次，指令与元素解绑时调用。

### 钩子函数参数

指令钩子函数会被传入以下参数：

- `el:` 指令所绑定的元素，可以用来直接操作 `DOM` 。
- `binding：` 一个对象，包含以下 property：
1. `name：`指令名，不包括 `v-` 前缀。
2. `value：`指令的绑定值，例如：`v-my-directive="1 + 1"` 中，绑定值为 2。
3. `oldValue：`指令绑定的前一个值，仅在 `update` 和 `componentUpdated` 钩子中可用。无论值是否改变都可用。
4. `expression：`字符串形式的指令表达式。例如 `v-my-directive="1 + 1"` 中，表达式为 `"1 + 1"`。
5. `arg：` 传给指令的参数，可选。例如 `v-my-directive:foo` 中，参数为 "foo"。
6. `modifiers：`一个包含修饰符的对象。例如：`v-my-directive.foo.bar` 中，修饰符对象为 `{ foo: true, bar: true }`。
- `vnode：` `Vue` 编译生成的虚拟节点。可以参考官网的 VNode API 来了解更多详情。
- `oldVnode：`上一个虚拟节点，仅在 `update` 和 `componentUpdated` 钩子中可用。

::: tip
除了 `el` 之外，其它参数都应该是**只读的**，切勿进行修改。如果需要在**钩子之间共享数据**，建议通过元素的 `dataset` 来进行。
:::

我们来看一个 `demo`,

```html
<div id="hook-arguments-example" v-demo:foo.a.b="message"></div>
```
```js
Vue.directive('demo', {
    bind: function (el, binding, vnode) {
        var s = JSON.stringify
        el.innerHTML =
        'name: '       + s(binding.name) + '<br>' +
        'value: '      + s(binding.value) + '<br>' +
        'expression: ' + s(binding.expression) + '<br>' +
        'argument: '   + s(binding.arg) + '<br>' +
        'modifiers: '  + s(binding.modifiers) + '<br>' +
        'vnode keys: ' + Object.keys(vnode).join(', ')
    }
})
new Vue({
    el: '#hook-arguments-example',
    data: {
        message: 'hello!'
    }
})
```
来看一下渲染的结果：

```js
name: "demo"
value: "hello!"
expression: "message"
argument: "foo"
modifiers: {"a":true,"b":true}
vnode keys: tag, data, children, text, elm, ns, context, fnContext, fnOptions, fnScopeId, key, componentOptions, componentInstance, parent, raw, isStatic, isRootInsert, isComment, isCloned, isOnce, asyncFactory, asyncMeta, isAsyncPlaceholder
```

## 指令实现原理解析

通过上面官网的例子和我们平时的coding，我们基本上了解了 vue 的指令是如何使用的了，接下来我们从**源码**的视角来解析其实现的原理。

### Vue.directive 的定义：

```js
function initAssetRegisters(Vue) {
    ASSET_TYPES.forEach(function (type) {
        Vue[type] = function ( id, definition ) {
            if (!definition) {
                return this.options[type + 's'][id]
            } else {
                if (type === 'component') {
                    validateComponentName(id);
                }
                if (type === 'component' && isPlainObject(definition)) {
                    definition.name = definition.name || id;
                    definition = this.options._base.extend(definition);
                }
                if (type === 'directive' && typeof definition === 'function') {
                    // Tip: 兼容传参
                    definition = {
                        bind: definition,
                        update: definition
                    };
                }
                // Tip: 储存一个 [ 'component', 'directive', 'filter' ]
                this.options[type + 's'][id] = definition;
                return definition
            }
        };
    });
}
```
其实这个方法比较简单，就是在`vm.options.directives` 挂载了一个映射，比如 `vm.$options.directives.demo = { xxx }`，我们要看看这个指令是如何生效的。

在没有下一步对源码进行分析之前，我们也能大概猜测出自定义指令是如何实现的。在模板编译阶段，从元素的属性中解析到指令属性，在不同生命周期元素阶段调用自定指令中不同的自定义逻辑。接下来配合源码来分析一下，将这个指令解析和生效分为三个阶段：**模板编译阶段，** **生成VNode阶段，** **以及生成真实Dom的patch阶段。**

我们以下面的代码片段为例：

```html
<div id="hook-arguments-example" v-demo:foo.a.b="message"></div>
```

### 模板编译阶段

对模板编译不熟悉的同学可以去回顾一下，这个阶段大致做了什么。这里不去详细介绍了，只关注指令这一部分。指令是元素的属性的一部分，所以在解析标签元素时，会被放入 `Ele Ast` 这个对象的 `attrs` 属性中。上述的示例，会被解析为这样：
```js
[
    {name: "id", value: "hook-arguments-example", start: 5, end: 32},
    {name: "v-demo:foo.a.b", value: "message", start: 33, end: 57}
]
```
在匹配到结束标签时，会进一步处理这些属性，比如：如果是指令的话，会被处理为`directives`挂载到这个`Ele Ast`对象上。

具体的流程如下，在 `endTagMatch` 匹配到结束标签的时候，会去调用处理结束标签的 `parseEndTag` 函数，在这个函数内部回去调用 `parseHtml` 的配置项的 `options.end`，其中又回去调用 `closeElement`。

```js
function closeElement(element) {
    // ...
    if (!inVPre && !element.processed) {
        element = processElement(element, options);
    }
    // ...
}
```

注意这里的 `processElement` 方法，主要是对解析过程中的元素进行各种加工。我们来看一下 `processElement` 的代码。

```js
function processElement( element, options ) {
    processKey(element);
    processRef(element);
    processSlotContent(element);
    processSlotOutlet(element);
    processComponent(element);
    // ...
    processAttrs(element);
    return element
}
```
主要针对一堆元素属性的处理方法，我们需要关注 `processAttrs` 方法，它是处理指令和修饰符相关的方法。我们我看一下 `processAttrs` 的伪代码：

```js
function processAttrs(el) {
    var list = el.attrsList;
    var i, l, name, rawName, value, modifiers, syncGen, isDynamic;
    for (i = 0, l = list.length; i < l; i++) {
        name = rawName = list[i].name;
        value = list[i].value;
        // Tip: 解析指令 dirRE = /^v-|^@|^:|^#/;
        if (dirRE.test(name)) {
            // ...
            if (bindRE.test(name)) {
                // 处理 v-bind 情形
                if ((modifiers && modifiers.prop) || (
                        !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
                    )) {
                    addProp(el, name, value, list[i], isDynamic);
                } else {
                    addAttr(el, name, value, list[i], isDynamic);
                }
            } else if (onRE.test(name)) { 
                // 处理 v-on 情形
                addHandler(el, name, value, modifiers, false, warn$2, list[i], isDynamic);
            } else { 
                // 处理 常规指令情形
                // Tip：给被解析到的元素，添加 directives 属性
                addDirective(el, name, rawName, value, arg, isDynamic, modifiers, list[i]);
            }
        } else {
            // ... 处理 literal attribute(文字属性)
        }
    }
}
```
这里有个 `for` 循环去 `Ele Ast` 的 `attrsList`，然后按照不同的正则去解析他们，分别处理 `v-bind`，`v-on`以及 `v-xx`的情形。对于自定义的指令会通过 `addDirective` 给 `Ele Ast` 添加 directives 属性，如下：
```js
directives = [
    {
        arg: "foo" , end: 57, isDynamicArg: false, modifiers: { a: true, b: true }, name: "demo", rawName: "v-demo:foo.a.b", start: 33, value: "message"
    }
]
```
在模板解析的第一段阶段指令解析为上述模样。在模板解析的第二阶段 `generate` 将解析得到的 `Ele Ast` 生成产生 `vNode` 的函数字符串。自定义指令也转化为下面的形式了，成为 `_c` 函数的第二个参数了。

```
"{directives:[{name:"demo",rawName:"v-demo:foo.a.b",value:(message),expression:"message",arg:"foo",modifiers:{"a":true,"b":true}}],attrs:
{"id":"hook-arguments-example"}}"
```

### 生成vNode阶段

在这个 `render` 函数生成 `vNode` 的阶段，生面的指令字符串会被挂载到 `vNode.data.directives` 属性下，

```js
vNode.data.directives = [{
    arg: "foo"
    expression: "message"
    modifiers: { a: true, b: true }
    name: "demo"
    rawName: "v-demo:foo.a.b"
    value: "hello!"
}]
```

### 生成真实Dom的patch阶段

在这个由 `vNode` 生成真实 `Dom` 的阶段，`createElm` 会去调用 `invokeCreateHooks` （调用 `crate` 阶段所需要的函数）， 会去调用 `updateDirectives` 函数，这里面最终会去调用 `_update` 我们来看下代码：

```js
function _update(oldVnode, vnode) {
    var isCreate = oldVnode === emptyNode;
    
    // Tip: 获取到全局上自定义的指令函数
    var oldDirs = normalizeDirectives$1(oldVnode.data.directives, oldVnode.context);
    var newDirs = normalizeDirectives$1(vnode.data.directives, vnode.context);

    for (key in newDirs) {
        if (!oldDir) {
            // new directive, bind
            callHook$1(dir, 'bind', vnode, oldVnode);
            if (dir.def && dir.def.inserted) {
                dirsWithInsert.push(dir);
            }
        } else {
            callHook$1(dir, 'update', vnode, oldVnode);
        }
    }
    if (dirsWithInsert.length) {
        var callInsert = function () {
            for (var i = 0; i < dirsWithInsert.length; i++) {
                callHook$1(dirsWithInsert[i], 'inserted', vnode, oldVnode);
            }
        };
        if (isCreate) {
            mergeVNodeHook(vnode, 'insert', callInsert);
        } else {
            callInsert();
        }
    }
    if (dirsWithPostpatch.length) {
        mergeVNodeHook(vnode, 'postpatch', function () {
            for (var i = 0; i < dirsWithPostpatch.length; i++) {
                callHook$1(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode);
            }
        });
    }
    if (!isCreate) {
        for (key in oldDirs) {
            if (!newDirs[key]) {
                // no longer present, unbind
                callHook$1(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy);
            }
        }
    }
}
```
在 `_update` 中，`normalizeDirectives$1` 很重要，是它将我们一开始全局自定义的指令函数对应到当前的节点上。此外，在不同的生命周期也会依据不同的条件去调用不同自定义指令函数。比如，不存在 `oldDir`，就会去调用初始化的`bind`。

## 总结

没有想象中的那么神秘，从一开始的 `Vue.directive` 全局函数的定义以及文档中给不同钩子函数的定义和灌入的参数，我们就有了大概的思路了。通过对自定义指令实现的一步步探究，对整个 `vue` 的流程有了更进一步的了解。此外让我印象深刻的是整个代码逻辑的组织，值得我们去进去挖掘和学习。

