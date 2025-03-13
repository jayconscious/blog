(window.webpackJsonp=window.webpackJsonp||[]).push([[21],{563:function(t,e,a){"use strict";a.r(e);var s=a(0),n=Object(s.a)({},(function(){var t=this,e=t._self._c;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h3",{attrs:{id:"vue-vuestore"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#vue-vuestore"}},[t._v("#")]),t._v(" vue  vuestore")]),t._v(" "),e("blockquote",[e("p",[t._v("sadasdasdsa")])]),t._v(" "),e("div",{staticClass:"custom-block danger"},[e("p",{staticClass:"title"},[t._v("STOP")]),e("p",[t._v("危险区域，禁止通行")])]),e("details",{staticClass:"custom-block details"},[e("summary",[t._v("点击查看代码")]),t._v(" "),e("div",{staticClass:"language-js line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-js"}},[e("code",[t._v("console"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("log")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token string"}},[t._v("'你好，VuePress！'")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[t._v("1")]),e("br")])])])])}),[],!1,null,null,null);e.default=n.exports},566:function(t,e,a){"use strict";a.r(e);var s=a(0),n=Object(s.a)({},(function(){var t=this,e=t._self._c;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h3",{attrs:{id:"outline"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#outline"}},[t._v("#")]),t._v(" Outline")]),t._v(" "),e("blockquote",[e("p",[t._v("记录学习 vuex")])]),t._v(" "),e("ul",[e("li",[e("p",[e("RouterLink",{attrs:{to:"/vue/vuex/what-is-vuex.html"}},[t._v("Vuex 是什么？")])],1)]),t._v(" "),e("li",[e("p",[e("RouterLink",{attrs:{to:"/vue/vuex/a-simple-demo.html"}},[t._v("最简单的 Store")])],1)]),t._v(" "),e("li",[e("p",[e("RouterLink",{attrs:{to:"/vue/vuex/store-install.html"}},[t._v("Store 挂载实现")])],1)]),t._v(" "),e("li",[e("p",[e("RouterLink",{attrs:{to:"/vue/vuex/store-init.html"}},[t._v("Store 初始化")])],1)]),t._v(" "),e("li",[e("p",[e("RouterLink",{attrs:{to:"/vue/vuex/dispatch.html"}},[t._v("dispatch 源码解析")])],1)]),t._v(" "),e("li",[e("p",[e("RouterLink",{attrs:{to:"/vue/vuex/commit.html"}},[t._v("commit 源码解析")])],1)])])])}),[],!1,null,null,null);e.default=n.exports},569:function(t,e,a){"use strict";a.r(e);var s=a(0),n=Object(s.a)({},(function(){var t=this,e=t._self._c;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h2",{attrs:{id:"背景"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#背景"}},[t._v("#")]),t._v(" 背景")]),t._v(" "),e("p",[t._v("算法都是为了解决实际的问题而诞生的，由于vue是有数据驱动视图的，由于浏览器的原生Dom节点信息复杂，操作十分消耗浏览器的性能，(其实单次的dom操作原生是最快的，但是多次的操作还是基于vNode机制最佳)由于虚拟dom，就是重要的中间产物。"),e("code",[t._v("virtual dom")]),t._v("就是vue为了描述真实dom，自己定义的一套 "),e("code",[t._v("AST")]),t._v("，再有相关的渲染函数生成真实的Dom。其中就有一个问题，但数据驱动视图不一定是全量更新，应该取用最小化差量更新原则，所以Diff算法由此诞生。")]),t._v(" "),e("p",[t._v("在vue中 "),e("code",[t._v("template")]),t._v(" 会被编译为 "),e("code",[t._v("render function")]),t._v("，然后配合响应式系统，将"),e("code",[t._v("render function")]),t._v("挂载在"),e("code",[t._v("render-watcher")]),t._v("中，当有数据更改的时候，调度中心 "),e("code",[t._v("Dep")]),t._v(" 通知该"),e("code",[t._v("render-watcher")]),t._v(" 执行 "),e("code",[t._v("render function")]),t._v("，完成视图的渲染与更新。")]),t._v(" "),e("p",[t._v("整个流程的链路是没有什么问题的，但是我们思考一个极端的问题，每当我们去更新一个细微的节点都要全局更新，这显然是很浪费性能的。"),e("code",[t._v("为了解决这个问题")]),t._v(",vue中为了实现最小化更新，在vue中将真实dom 抽象成了 "),e("code",[t._v("virtual DOM")]),t._v("，即用一个js对象(VNode)来描述一个真实的dom。在有数据更新时，新旧VNode进行 "),e("code",[t._v("Diff")]),t._v("，找出尽可能少的我们需要更新的真实 DOM 节点，然后只更新需要更新的节点，从而解决频繁更新 DOM 产生的性能问题。")]),t._v(" "),e("div",{staticClass:"custom-block tip"},[e("p",{staticClass:"title"}),e("p",[t._v("实际上，当某个数据被修改的时候，set方法会让闭包中的 "),e("code",[t._v("Dep")]),t._v(" 调用 "),e("code",[t._v("notify")]),t._v(" 通知所有订阅者 "),e("code",[t._v("Watcher")]),t._v("，"),e("code",[t._v("Watcher")]),t._v(" 通过get方法执行 "),e("code",[t._v("vm._update(vm._render(), hydrating)")]),t._v("。"),e("code",[t._v("vm._render()")]),t._v(" 生成新的VNode，"),e("code",[t._v("vm._update")]),t._v(" 则实际是调用的是 "),e("code",[t._v("patch")]),t._v(" 函数, 而 "),e("code",[t._v("patch")]),t._v(" 则由 "),e("code",[t._v("createPatch")]),t._v(" 生成。")])]),e("h2",{attrs:{id:"vnode-的定义"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#vnode-的定义"}},[t._v("#")]),t._v(" VNode 的定义")]),t._v(" "),e("p",[e("code",[t._v("virtual node")]),t._v("即虚拟节点，用来描述真实dom，本质上市一个js对象，在 Vue 的每一个组件实例中，会挂载一个"),e("code",[t._v("$createElement")]),t._v("函数，所有的"),e("code",[t._v("VNode")]),t._v("都是由这个函数创建的。当前全局的vnode生成函数挂载"),e("code",[t._v("vm.$options.render")]),t._v("，实质上是调用 "),e("code",[t._v("$createElement")]),t._v("，函数的入参是有模板编译器生成为可执行的string，然后调用"),e("code",[t._v("new Function")]),t._v("生成的函数。然后"),e("code",[t._v("vnode")]),t._v("作为"),e("code",[t._v("vm._update")]),t._v("入参，渲染页面。")]),t._v(" "),e("p",[t._v("比如我们创建一个 test 的vnode节点：")]),t._v(" "),e("div",{staticClass:"language-js line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-js"}},[e("code",[e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 声明 render function")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token function-variable function"}},[t._v("render")]),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token parameter"}},[t._v("createElement")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 也可以使用 this.$createElement 创建 VNode")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("createElement")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token string"}},[t._v("'div'")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token string"}},[t._v("'test'")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 以上 render 方法返回html片段 <div>test</div>")]),t._v("\n")])]),t._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[t._v("1")]),e("br"),e("span",{staticClass:"line-number"},[t._v("2")]),e("br"),e("span",{staticClass:"line-number"},[t._v("3")]),e("br"),e("span",{staticClass:"line-number"},[t._v("4")]),e("br"),e("span",{staticClass:"line-number"},[t._v("5")]),e("br"),e("span",{staticClass:"line-number"},[t._v("6")]),e("br")])]),t._v(" "),e("h2",{attrs:{id:"diff"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#diff"}},[t._v("#")]),t._v(" Diff")]),t._v(" "),e("p",[t._v("Diff 将新老 VNode 节点进行比对，然后将根据两者的比较结果进行最小单位地修改视图，而不是将整个视图根据新的 VNode 重绘，进而达到提升性能的目的")]),t._v(" "),e("h4",{attrs:{id:"patch"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#patch"}},[t._v("#")]),t._v(" patch")]),t._v(" "),e("p",[t._v("Vue.js 内部的 diff 被称为patch。其 diff 算法的是通过同层的树节点进行比较，而非对树进行逐层搜索遍历的方式，所以时间复杂度只有O(n)，是一种相当高效的算法。")]),t._v(" "),e("p",[t._v("首先定义新老节点是否"),e("code",[t._v("相似")]),t._v("判定函数"),e("code",[t._v("sameVnode")]),t._v("：满足键值"),e("code",[t._v("key")]),t._v("和标签名"),e("code",[t._v("tag")]),t._v("必须一致等条件，返回"),e("code",[t._v("true")]),t._v("，否则"),e("code",[t._v("false")]),t._v("。")]),t._v(" "),e("div",{staticClass:"language-js line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-js"}},[e("code",[e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("sameVnode")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token parameter"}},[t._v("a"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" b")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n        a"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("key "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" b"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("key "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("&&")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n            "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n                a"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("tag "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" b"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("tag "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("&&")]),t._v("\n                a"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("isComment "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" b"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("isComment "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("&&")]),t._v("\n                "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("isDef")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("a"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("data"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("isDef")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("b"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("data"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("&&")]),t._v("\n                "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("sameInputType")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("a"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" b"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n            "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("||")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n                "),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 判断 isAsyncPlaceholder ...")]),t._v("\n            "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n        "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])]),t._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[t._v("1")]),e("br"),e("span",{staticClass:"line-number"},[t._v("2")]),e("br"),e("span",{staticClass:"line-number"},[t._v("3")]),e("br"),e("span",{staticClass:"line-number"},[t._v("4")]),e("br"),e("span",{staticClass:"line-number"},[t._v("5")]),e("br"),e("span",{staticClass:"line-number"},[t._v("6")]),e("br"),e("span",{staticClass:"line-number"},[t._v("7")]),e("br"),e("span",{staticClass:"line-number"},[t._v("8")]),e("br"),e("span",{staticClass:"line-number"},[t._v("9")]),e("br"),e("span",{staticClass:"line-number"},[t._v("10")]),e("br"),e("span",{staticClass:"line-number"},[t._v("11")]),e("br"),e("span",{staticClass:"line-number"},[t._v("12")]),e("br"),e("span",{staticClass:"line-number"},[t._v("13")]),e("br"),e("span",{staticClass:"line-number"},[t._v("14")]),e("br")])]),e("p",[t._v("在进行"),e("code",[t._v("patch")]),t._v("之前，新老 "),e("code",[t._v("VNode")]),t._v(" 是否满足条件"),e("code",[t._v("sameVnode(oldVnode, newVnode)")]),t._v("，满足条件之后，进入流程"),e("code",[t._v("patchVnode")]),t._v("，否则被判定为不相同节点，此时会移除老节点，创建新节点。")]),t._v(" "),e("div",{staticClass:"custom-block tip"},[e("p",{staticClass:"title"}),e("ol",[e("li",[e("code",[t._v("sameVnode")]),t._v("这个方法几个判断节点是否相似的维度非常重要，可以在这样的场景下，最高效去判别当前的两个节点是否"),e("code",[t._v("相似")]),t._v("或者"),e("code",[t._v("相同")]),t._v("。"),e("code",[t._v("vNodeData")]),t._v("的不同会在后续 "),e("code",[t._v("pacthVnode")]),t._v(" 中更新")]),t._v(" "),e("li",[e("code",[t._v("vm._updata")]),t._v(" 调用的是 "),e("code",[t._v("vm.__patch__")]),t._v(", "),e("code",[t._v("vm.__patch__")]),t._v(" === "),e("code",[t._v("patch")]),t._v(", 后者是由 "),e("code",[t._v("createPatch")]),t._v(" 生成，这样做的目的是为了抽象出 "),e("code",[t._v("dom 操作")]),t._v(" 这一层，比如在 "),e("code",[t._v("server")]),t._v(" 环境。")])])]),e("h4",{attrs:{id:"patchvnode"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#patchvnode"}},[t._v("#")]),t._v(" patchVnode")]),t._v(" "),e("p",[e("code",[t._v("patchVnode")]),t._v(" 的主要作用是判定如何对子节点进行更新。")]),t._v(" "),e("ol",[e("li",[e("p",[t._v("第一种情况：如果新旧节点满足以下条件(isStatic相同、key相同、isCloned或者是isOnce(v-once))的话，依旧使用原来的实例")])]),t._v(" "),e("li",[e("p",[t._v("第二种情况：如果 oldVnode 和 vnode 都有 children，就去更新子节点 updateChildren")])]),t._v(" "),e("li",[e("p",[t._v("第三种情况：如果只存在 vnode 的孩子节点，那门只需要将 ch 节点全部插入到 elm 中")])]),t._v(" "),e("li",[e("p",[t._v("第四种情况：如果只存在 oldVnode 的孩子节点，那只需要将 oldCh 全部删除即可")])]),t._v(" "),e("li",[e("p",[t._v("第五种情况种情况： 如果是文本节点的话，更新文本")])])]),t._v(" "),e("h4",{attrs:{id:"updatechildren"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#updatechildren"}},[t._v("#")]),t._v(" updateChildren")]),t._v(" "),e("p",[t._v("如果满足上述的第二种情况的话，就会执行 "),e("code",[t._v("updateChildren")]),t._v("。Diff 的核心，对比新老子节点数据，判定如何对子节点进行操作，在对比过程中，"),e("code",[t._v("由于老的子节点存在对当前真实 DOM 的引用，新的子节点只是一个 VNode 数组")]),t._v("，所以在进行遍历的过程中，若发现需要更新真实 DOM 的地方，则会直接在老的子节点上进行真实 DOM 的操作，等到遍历结束，新老子节点则已同步结束。")]),t._v(" "),e("p",[e("code",[t._v("updateChildren")]),t._v(" 内部定义了4个"),e("code",[t._v("索引")]),t._v("变量，分别是"),e("code",[t._v("oldStartIdx")]),t._v("、"),e("code",[t._v("oldEndIdx")]),t._v("、"),e("code",[t._v("newStartIdx")]),t._v("、"),e("code",[t._v("newEndIdx")]),t._v("，分别表示正在 Diff 对比的新老子节点的左右边界点索引。\n在老子节点数组中，索引在"),e("code",[t._v("oldStartIdx")]),t._v("与"),e("code",[t._v("oldEndIdx")]),t._v("中间的节点，表示老子节点中为被遍历处理的节点。在新的子节点数组中，索引在"),e("code",[t._v("newStartIdx")]),t._v("与"),e("code",[t._v("newEndIdx")]),t._v("中间的节点，表示新子节点中为被遍历处理的节点。")]),t._v(" "),e("p",[t._v("所以这里就有了我们循环遍历的条件了，"),e("code",[t._v("oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx")]),t._v(" 或者 "),e("code",[t._v("oldStartIdx > oldEndIdx || newStartIdx > newEndIdx")]),t._v("。")]),t._v(" "),e("p",[e("img",{attrs:{src:"/blog/assets/img/vue2/diff/diff1.png",alt:"image"}})]),t._v(" "),e("p",[t._v("在遍历中，取出4索引对应的 Vnode节点：")]),t._v(" "),e("ul",[e("li",[t._v("oldStartIdx：oldStartVnode")]),t._v(" "),e("li",[t._v("oldEndIdx：oldEndVnode")]),t._v(" "),e("li",[t._v("newStartIdx：newStartVnode")]),t._v(" "),e("li",[t._v("newEndIdx：newEndVnode")])]),t._v(" "),e("p",[t._v("diff 过程中，如果存在key，并且满足"),e("code",[t._v("sameVnode")]),t._v("，会将该 DOM 节点进行复用，否则则会创建一个新的 DOM 节点。")]),t._v(" "),e("ol",[e("li",[e("p",[t._v("第一种情况："),e("code",[t._v("oldStartVnode")]),t._v(" 不存在， "),e("code",[t._v("oldStartIdx")]),t._v(" 向后移动")])]),t._v(" "),e("li",[e("p",[t._v("第二种情况："),e("code",[t._v("oldEndVnode")]),t._v(" 不存在， "),e("code",[t._v("oldEndIdx")]),t._v(" 向前移动")])])]),t._v(" "),e("div",{staticClass:"custom-block tip"},[e("p",{staticClass:"title"}),e("p",[t._v("为什么在循环开始会优先判断这两种情况，为什么会存在没有节点情况，框架在这里帮我们做了什么？")])]),e("ol",{attrs:{start:"3"}},[e("li",[t._v("第三种情况：先 "),e("code",[t._v("oldStartVnode")]),t._v(" 和 "),e("code",[t._v("newStartVnode")]),t._v(" 相似，"),e("code",[t._v("patch")]),t._v(" 节点， "),e("code",[t._v("oldStartIdx")]),t._v(" 与 "),e("code",[t._v("newStartIdx")]),t._v(" 向后移动。")])]),t._v(" "),e("p",[e("img",{attrs:{src:"/blog/assets/img/vue2/diff/diff2.png",alt:"image"}})]),t._v(" "),e("ol",{attrs:{start:"4"}},[e("li",[t._v("第四种情况： "),e("code",[t._v("oldEndVnode")]),t._v(" 和 "),e("code",[t._v("newEndVnode")]),t._v(" 相似，"),e("code",[t._v("patch")]),t._v(" 节点， "),e("code",[t._v("oldEndIdx")]),t._v(" 与 "),e("code",[t._v("newEndIdx")]),t._v(" 向前移动")])]),t._v(" "),e("p",[e("img",{attrs:{src:"/blog/assets/img/vue2/diff/diff3.png",alt:"image"}})]),t._v(" "),e("ol",{attrs:{start:"5"}},[e("li",[t._v("第五种情况："),e("code",[t._v("oldStartVnode")]),t._v(" 与 "),e("code",[t._v("newEndVnode")]),t._v(" 相似，说明当前的这个节点已经向后移动了，"),e("code",[t._v("patch")]),t._v(" 节点，还需要将 "),e("code",[t._v("oldStartVnode")]),t._v(" 的真实 DOM 节点移动到 "),e("code",[t._v("oldEndVnode")]),t._v(" 的后面，("),e("code",[t._v("nodeOps.nextSibling(oldEndVnode.elm)")]),t._v(")，并且 "),e("code",[t._v("oldStartIdx")]),t._v(" 前后移，"),e("code",[t._v("newEndIdx")]),t._v(" 向前移")])]),t._v(" "),e("p",[e("img",{attrs:{src:"/blog/assets/img/vue2/diff/diff4.png",alt:"image"}})]),t._v(" "),e("ol",{attrs:{start:"6"}},[e("li",[t._v("第六种情况："),e("code",[t._v("oldEndVnode")]),t._v(" 与 "),e("code",[t._v("newStartVnode")]),t._v(" 相似，说明当前的这个节点已经向前移动了，"),e("code",[t._v("patch")]),t._v(" 节点，将 "),e("code",[t._v("oldEndVnode")]),t._v(" 的真实 DOM 节点移动到"),e("code",[t._v("oldStartVnode")]),t._v(" 的前面，并且 "),e("code",[t._v("oldEndIdx")]),t._v(" 向前移，"),e("code",[t._v("newStartIdx")]),t._v(" 前后移")])]),t._v(" "),e("p",[e("img",{attrs:{src:"/blog/assets/img/vue2/diff/diff5.png",alt:"image"}})]),t._v(" "),e("p",[t._v("当以上这些情况都不满足时，那么则在 "),e("code",[t._v("oldStartIdx")]),t._v(" 与 "),e("code",[t._v("oldEndIdx")]),t._v(" 之间查找与 "),e("code",[t._v("newStartVnode")]),t._v(" 相似节点，若存在，"),e("code",[t._v("patch")]),t._v(" 节点，则将匹配的节点真实 DOM 移动到 "),e("code",[t._v("oldStartVnode")]),t._v(" 的前面。")]),t._v(" "),e("p",[e("img",{attrs:{src:"/blog/assets/img/vue2/diff/diff6.png",alt:"image"}})]),t._v(" "),e("p",[t._v("若不存在，说明 "),e("code",[t._v("newStartVnode")]),t._v(" 为新节点，创建新节点放在 "),e("code",[t._v("oldStartVnode")]),t._v(" 前面即可。")]),t._v(" "),e("p",[e("img",{attrs:{src:"/blog/assets/img/vue2/diff/diff7.png",alt:"image"}})]),t._v(" "),e("p",[t._v("当 "),e("code",[t._v("oldStartIdx > oldEndIdx")]),t._v(" 或者 "),e("code",[t._v("newStartIdx > newEndIdx")]),t._v("，循环结束，这个时候我们需要处理那些未被遍历到的 VNode。")]),t._v(" "),e("p",[t._v("当 "),e("code",[t._v("oldStartIdx > oldEndIdx")]),t._v(" 时，说明老的节点已经遍历完，而新的节点没遍历完，这个时候需要将新的节点创建之后放在 "),e("code",[t._v("oldEndVnode")]),t._v(" 后面。")]),t._v(" "),e("p",[e("img",{attrs:{src:"/blog/assets/img/vue2/diff/diff8.png",alt:"image"}})]),t._v(" "),e("p",[t._v("当 "),e("code",[t._v("newStartIdx > newEndIdx")]),t._v(" 时，说明新的节点已经遍历完，而老的节点没遍历完，这个时候要将没遍历的老的节点全都删除。")]),t._v(" "),e("p",[e("img",{attrs:{src:"/blog/assets/img/vue2/diff/diff9.png",alt:"image"}})])])}),[],!1,null,null,null);e.default=n.exports}}]);