---
title: Vue 模板解析
date: 2021-02-25
sidebar: auto
tags: 
 - Vue
categories:
 - Vue
---

在使用 `vue` 之前，或许我们已经接触过了其他的模板引擎，比如 `underscore` 的 `template` 方法，或者是 `handlebars` 等之类。他们的作用基本上就是通过结构化的 `html` 模板片段注入一些变量，结合一些辅助函数例如 `each`，生成我们想要的 `html` 片段。这大大简化了我们对原生 `dom` 以及数据拼接操作，提升了我们的研发效率和体验。而 `vue`的模板引擎再次基础上再次封装抽象，并借助抽象语法树 `AST` ，对功能进一步的扩展，和响应式系统很好的结合在一起了。`vue` 模板引擎编译主要分为三个步骤：**将模板字符串转为`AST`，对`AST`进行处理，由 `AST` 生成代码所需的字符串。**


## 模板解析的作用： 模板字符串转为 AST

在 `js` 中我们有 `esprima`等解析器，将我们的 `js` 解析为标准的 `AST`。而在 `vue` 中，需要将`模板字符串` 解析为 `elements AST`，比如将

```html
<div>
    <span>{{ msg }}</span>
</div>
```
解析为如下的 `js` 对象
```js
{
    attrsList: [],
    attrsMap: {},
    children: [{
        attrsList: [],
        attrsMap: {},
        children: [{
            end: 21,
            expression: "_s(msg)",
            start: 11,
            text: "{{ msg }}",
            tokens: [{
                @binding: "msg"
            }],
            type: 2
        }]
        end: 28,
        parent: {type: 1, tag: "div", attrsList: Array(0), attrsMap: {…}, rawAttrsMap: {…}, …},
        plain: true,
        rawAttrsMap: {},
        start: 5,
        tag: "span",
        type: 1,
    }],
    end: 34,
    parent: undefined,
    plain: true,
    rawAttrsMap: {},
    start: 0,
    tag: "div",
    type: 1
}
```
通过上面的🌰，我们可以很清晰的看出来，解析器什么，然后我们来看看它具体是如何去解析的。这部分的功能实现主要是在 `baseCompile` 函数中，`var ast = parse(template.trim(), options)` 调用 `parse` 来实现的。我们会先介绍一下它是怎么做的，然后再去分析源码。

上面这段模板字符串会被扔到 while 中去循环，然后 **一段一段** 的截取，把截取到的 **每一小段字符串** 进行解析，直到最后截没了，也就解析完了。

这个简单的模板截取的过程是这样的：
```html
<div>
    <span>{{ msg }}</span>
</div>
```
```html
    <span>{{ msg }}</span>
</div>
```
```html
<span>{{ msg }}</span>
</div>
```
```html
{{ msg }}</span>
</div>
```
```html
</span>
</div>
```
```html
    
</div>
```
```html
</div>
```

## 模板解析的运行原理

在模板解析的内部其实有好几个不同的解析器，比如Html解析器，文本解析器，以及过滤器解析器。其中主要起作用的Html解析器，顾名思义，它的主要作用就是解析html标签的，在解析标签的不同部分的时候会触发不同的钩子函数，有开始标签的钩子，结束便签的钩子，文本钩子以及注释钩子。伪代码：

```js
parseHtml(template, {
    start(tag, attrs, unary) {
        // 每当解析到标签的开始位置时，触发该函数
    },
    end() {
        // 每当解析到标签的结束位置时，触发该函数
    },
    chars(text) {
        // 每当解析到文本时，触发该函数
    },
    comment(text) {
        // 每当解析到注释时，触发该函数
    }
})
```

需要了解一下每一个钩子大概做了哪些事情。

在**start**钩子函数中，我们可以使用这三个参数来构建一个元素类型的AST节点，例如：

```js
// 返回一个 element ast 对象
function createASTElement( tag, attrs, parent ) {
    return {
        type: 1,
        tag: tag,
        attrsList: attrs,
        attrsMap: makeAttrsMap(attrs),
        rawAttrsMap: {},
        parent: parent,
        children: []
    }
}
parseHTML(template, {
    start (tag, attrs, unary) {
        let element = createASTElement(tag, attrs, currentParent)
    }
})
```
上述变量 `element` 就是在 `start` 钩子函数中所构建的 ele AST。


在**chars**钩子函数中，就使用参数中的文本构建一个文本类型的AST节点，例如：

```js
// 伪代码
parseHTML(template, {
    chars (text) {
        let element = {type: 3, text}
    }
})
```
在**comment**钩子函数中，就构建一个注释类型的AST节点，例如：

```js
parseHTML(template, {
    comment (text) {
        let element = {type: 3, text, isComment: true}
    }
})
```

在这里有一个**关键的问题**需要解决，每一层节点的关系在解析的过程中已经被扁平化了，如何知道自己的父节点是谁？这里需要一个stack来存储，用栈来记录层级关系，这个层级关系也可以理解为DOM的深度。

HTML解析器在解析HTML时，是从前向后解析。每当遇到开始标签，就触发钩子函数 `start` 。每当遇到结束标签，就会触发钩子函数 `end` 。

基于HTML解析器的逻辑，我们可以在每次触发钩子函数 `start` 时，把当前构建的节点推入栈中；每当触发钩子函数 `end` 时，就从栈中弹出一个节点。

这样就可以保证每当触发钩子函数 `start` 时，栈的最后一个节点就是当前正在构建的节点的父节点。

![image](/blog/assets/img/vue2/templateEngine/templateEngine1.png)

## HTML解析器

我们发现构建AST非常依赖HTML解析器所执行的钩子函数以及钩子函数中所提供的参数，你一定会非常好奇HTML解析器是如何解析模板的，接下来我们会详细介绍HTML解析器的运行原理。

事实上，解析HTML模板的过程就是循环的过程，简单来说就是用HTML模板字符串来循环，每轮循环都从HTML模板中截取一小段字符串，然后重复以上过程，直到HTML模板被截成一个空字符串时结束循环，解析完毕。

在截取一小段字符串时，有可能截取到开始标签，也有可能截取到结束标签，又或者是文本或者注释，我们可以根据截取的字符串的类型来触发不同的钩子函数。

运行时伪代码如下：

```js
function parseHTML(html, options) {
    while (html) {
        // 截取模板字符串并触发钩子函数
    }
}
```

在上面的截取例子中，被截取的片段分为很多类型，

- 开始标签，例如 `<div>`。
- 结束标签，例如 `</div>`。
- HTML注释，例如<!-- 我是注释 -->。
- DOCTYPE，例如 `<!DOCTYPE html>`。
- 条件注释，例如<!--[if !IE]>-->我是注释<!--<![endif]-->。
- 文本，例如msg。

### 解析截取开始标签

在 `HTML` 解析器中，想分辨出模板是否以开始标签开头并不难，我们需要先判断 `HTML` 模板是不是以 `<` 开头。

如果 `HTML` 模板的第一个字符不是 `<` ，那么它一定不是以开始标签开头的模板，所以不需要进行开始标签的截取操作。

如果 `HTML` 模板以 `<` 开头，那么说明它至少是一个以标签开头的模板，但这个标签到底是什么类型的标签，还需要进一步确认。

那么，如何使用正则表达式来匹配模板以开始标签开头？我们看下面的代码：

```js
var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;
var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z" + (unicodeRegExp.source) + "]*";
var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
var startTagOpen = new RegExp(("^<" + qnameCapture));

// 以开头标签起始
var str = '<div></div>'
str.match(startTagOpen)  // ["<div", "div", index: 0, input: "<div></div>", groups: undefined]

// 以结束标签起始
var str = '</div><div></div>'
str.match(startTagOpen)  // null

// 以文本起始
var str = '阿斯达萨达'
str.match(startTagOpen)  // null
```

在分辨模板是否以开始标签开始时，就可以得到标签名，而属性和自闭合标识则需要进一步解析。

当完成上面的解析后，我们可以得到这样一个数据结构：

```js
const start = '<div></div>'.match(startTagOpen)
if (start) {
    const match = {
        tagName: start[1],
        attrs: []
    }
}
```

这里有一个细节很重要：在前面的例子中，我们匹配到的开始标签并不全。例如：

```js
const ncname = '[a-zA-Z_][\\w\\-\\.]*'
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`)

'<div></div>'.match(startTagOpen)
// ["<div", "div", index: 0, input: "<div></div>"]

'<p></p>'.match(startTagOpen)
// ["<p", "p", index: 0, input: "<p></p>"]

'<div class="box"></div>'.match(startTagOpen)
// ["<div", "div", index: 0, input: "<div class="box"></div>"]
```

可以看出，上面这个正则表达式虽然可以分辨出模板是否以开始标签开头，但是它的匹配规则并不是匹配整个开始标签，而是开始标签的一小部分。

事实上，开始标签被拆分成三个小部分，分别是标签名、属性和结尾。

![image](/blog/assets/img/vue2/templateEngine/templateEngine2.png)

通过“标签名”这一段字符，就可以分辨出模板是否以开始标签开头，此后要想得到属性和自闭合标识，则需要进一步解析。

之后我们需要解析标签的相关属性。

```js
' class="box"></div>'
```
通常，标签属性是可选的，一个标签的属性有可能存在，也有可能不存在，所以需要判断标签是否存在属性，如果存在，对它进行截取。

```js
// var dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; 起始还有动态属性这块
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
let html = ' class="box"></div>'
let attr = html.match(attribute)
html = html.substring(attr[0].length)

console.log(attr)
// [' class="box"', 'class', '=', 'box', undefined, undefined, index: 0, input: ' class="box"></div>']
```

如果标签上有很多属性，那么上面的处理方式就不足以支撑解析任务的正常运行。例如下面的代码：

```js
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
let html = ' class="box" id="el"></div>'
let attr = html.match(attribute)
html = html.substring(attr[0].length)
console.log(attr)
// [" class="box"", "class", "=", "box", undefined, undefined, index: 0, input: " class="box" id="el"></div>", groups: undefined]
```
可以看到，这里只解析出了class属性，而id属性没有解析出来。
此时剩余的HTML模板是这样的：

```js
' id="el"></div>'
```
那要怎么办呢？所以属性也可以分成多个小部分，一小部分一小部分去解析与截取。

解决这个问题时，我们只需要每解析一个属性就截取一个属性。如果截取完后，剩下的HTML模板依然符合标签属性的正则表达式，那么说明还有剩余的属性需要处理，此时就重复执行前面的流程，直到剩余的模板不存在属性，也就是剩余的模板不存在符合正则表达式所预设的规则。

```js
const startTagClose = /^\s*(\/?)>/
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
let html = ' class="box" id="el"></div>'
let end, attr
const match = {tagName: 'div', attrs: []}

while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
    html = html.substring(attr[0].length)
    match.attrs.push(attr)
}
```
上面这段代码的意思是，如果剩余HTML模板不符合开始标签结尾部分的特征，并且符合标签属性的特征，那么进入到循环中进行解析与截取操作。

通过match方法解析出的结果为：

```js
{
    tagName: 'div',
    attrs: [
        [' class="box"', 'class', '=', 'box', null, null],
        [' id="el"', 'id','=', 'el', null, null]
    ]
}
```
可以看到，标签中的两个属性都已经解析好并且保存在了attrs中。

此时剩余模板是下面的样子：

```js
"></div>"
```

可以看到，标签上的所有属性都已经被成功解析出来，并保存在attrs属性中。

### 解析自闭合标识

如果我们接着上面的例子继续解析的话，目前剩余的模板是下面这样的：

```js
"></div>"
```
开始标签中结尾部分解析的主要目的是解析出当前这个标签是否是自闭合标签。

这样的div标签就不是自闭合标签，而下面这样的input标签就属于自闭合标签：

```html
<input type="text" />
```
自闭合标签是没有子节点的，所以前文中我们提到构建 `AST` 层级时，需要维护一个栈，而一个节点是否需要推入到栈中，可以使用这个自闭合标识来判断。

```js
end = html.match(startTagClose)
if (end) {
    // Tip: 处理自闭和标签
    match.unarySlash = end[1];
    advance(end[0].length);
    match.end = index;
    return match
}
```
这段代码可以正确解析出开始标签是否是自闭合标签。

从代码中打印出来的结果可以看到，自闭合标签解析后的 `unarySlash` 属性为 `/` ，而非自闭合标签为空字符串。

### 截取结束标签

结束标签的截取要比开始标签简单得多，因为它不需要解析什么，只需要分辨出当前是否已经截取到结束标签，如果是，那么触发钩子函数就可以了。

那么，如何分辨模板已经截取到结束标签了呢？其道理其实和开始标签的截取相同。

如果HTML模板的第一个字符不是<，那么一定不是结束标签。只有HTML模板的第一个字符是<时，我们才需要进一步确认它到底是不是结束标签。

进一步确认时，我们只需要判断剩余HTML模板的开始位置是否符合正则表达式中定义的规则即可：

```js
const ncname = '[a-zA-Z_][\\w\\-\\.]*'
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)

const endTagMatch = '</div>'.match(endTag)
const endTagMatch2 = '<div>'.match(endTag)

console.log(endTagMatch) //  ["</div>", "div", index: 0, input: "</div>", groups: undefined]
console.log(endTagMatch2) // null
```
上面代码可以分辨出剩余模板是否是结束标签。当分辨出结束标签后，需要做两件事，**一件事是截取模板**，另**一件事是触发钩子函数**。而Vue.js中相关源码被精简后如下：

```js
// 精简代码
const endTagMatch = html.match(endTag)
if (endTagMatch) {
    html = html.substring(endTagMatch[0].length)
    options.end(endTagMatch[1])
    continue
}
```

### 截取注释

分辨模板是否已经截取到注释的原理与开始标签和结束标签相同，先判断剩余HTML模板的第一个字符是不是<，如果是，再用正则表达式来进一步匹配：

```js
const comment = /^<!--/

if (comment.test(html)) {
    const commentEnd = html.indexOf('-->')

    if (commentEnd >= 0) {
        if (options.shouldKeepComment) {
            options.comment(html.substring(4, commentEnd))
        }
        html = html.substring(commentEnd + 3)
        continue
    }
}
```
在上面的代码中，我们使用正则表达式来判断剩余的模板是否符合注释的规则，如果符合，就将这段注释文本截取出来。

这里有一个有意思的地方，那就是注释的钩子函数可以通过选项来配置，只有options.shouldKeepComment为真时，才会触发钩子函数，否则只截取模板，不触发钩子函数。


### 截取条件注释

条件注释不需要触发钩子函数，我们只需要把它截取掉就行了。

截取条件注释的原理与截取注释非常相似，如果模板的第一个字符是 `<` ，并且符合我们事先用正则表达式定义好的规则，就说明需要进行条件注释的截取操作。

在下面的代码中，我们通过 `indexOf` 找到条件注释结束位置的下标，然后将结束位置前的字符都截取掉：

```js
const conditionalComment = /^<!\[/
if (conditionalComment.test(html)) {
    const conditionalEnd = html.indexOf(']>')

    if (conditionalEnd >= 0) {
        html = html.substring(conditionalEnd + 2)
        continue
    }
}
```

我们来举个例子：

```js
const conditionalComment = /^<!\[/
let html = '<![if !IE]><link href="non-ie.css" rel="stylesheet"><![endif]>'
if (conditionalComment.test(html)) {
    const conditionalEnd = html.indexOf(']>')
    if (conditionalEnd >= 0) {
        html = html.substring(conditionalEnd + 2)
    }
}

console.log(html) // '<link href="non-ie.css" rel="stylesheet"><![endif]>'
```

通过这个逻辑可以发现，在Vue.js中条件注释其实没有用，**写了也会被截取掉，通俗一点说就是写了也白写。**

### 截取DOCTYPE

`DOCTYPE` 与条件注释相同，都是不需要触发钩子函数的，只需要将匹配到的这一段字符截取掉即可。下面的代码将 `DOCTYPE` 这段字符匹配出来后，根据它的length属性来决定要截取多长的字符串：

```js
const doctype = /^<!DOCTYPE [^>]+>/i
const doctypeMatch = html.match(doctype)
if (doctypeMatch) {
    html = html.substring(doctypeMatch[0].length)
    continue
}
```
示例如下：

```js
const doctype = /^<!DOCTYPE [^>]+>/i
let html = '<!DOCTYPE html><html lang="en"><head></head><body></body></html>'
const doctypeMatch = html.match(doctype)
if (doctypeMatch) {
    html = html.substring(doctypeMatch[0].length)
}

console.log(html) // '<html lang="en"><head></head><body></body></html>'
```
从打印结果可以看到， `HTML` 中的 `DOCTYPE` 被成功截取掉了。

### 截取文本

若想分辨在本轮循环中 `HTML` 模板是否已经截取到文本，其实很简单，我们甚至不需要使用正则表达式。

在前面的其他标签类型中，我们都会判断剩余 `HTML` 模板的第一个字符是否是 `<` ，如果是，再进一步确认到底是哪种类型。这是因为以 `<` 开头的标签类型太多了，如开始标签、结束标签和注释等。然而文本只有一种，如果 `HTML` 模板的第一个字符不是 `<` ，那么它一定是文本了

伪代码实践

```js
while (html) {
    let text
    let textEnd = html.indexOf('<')
    // 截取文本
    if (textEnd >= 0) {
        text = html.substring(0, textEnd)
        html = html.substring(textEnd)
    }
    // 如果模板中找不到<，就说明整个模板都是文本
    if (textEnd < 0) {
        text = html
        html = ''
    }
    // 触发钩子函数
    if (options.chars && text) {
        options.chars(text)
    }
}
```

这个 `while` 循环中有三个 `if` 逻辑判断，
- 第一个， `<` 之前的所有字符都是文本，直接使用 `html.substring` 从模板的最开始位置截取到 `<` 之前的位置，就可以将文本截取出来。
- 第二个，如果在整个模板中都找不到 `<` ，那么说明整个模板全是文本。
- 第三个，触发钩子函数并将截取出来的文本放到参数中。

这里其实有一种比较操蛋的情况，就是有人在文本中写了 `<`,这种要怎么处理？

我们来举个栗子，

```js
1<2</div>
```

有一个思路是，如果将 `<` 前面的字符截取完之后，剩余的模板不符合任何需要被解析的片段的类型，就说明这个 `<` 是文本的一部分。

什么是需要被解析的片段的类型？我们说过HTML解析器是一段一段截取模板的，而被截取的每一段都符合某种类型，这些类型包括**开始标签**、**结束标签**和**注释**等。

说的再具体一点，那就是上面这段代码中的1被截取完之后，剩余模板是下面的样子：

```js
<2</div>
```
在接下来的循环中，我们会判断这段文本复合什么样子的规则。

`<2` 符合开始标签的特征么？不符合。
`<2` 符合结束标签的特征么？不符合。
`<2` 符合注释的特征么？不符合。

当剩余的模板什么都不符合时，就说明 `<` 属于文本的一部分。

当判断出 `<` 是属于文本的一部分后，我们需要做的事情是找到下一个 `<` 并将其前面的文本截取出来加到前面截取了一半的文本后面

这里还用上面的例子，第二个<之前的字符是<2，那么把<2截取出来后，追加到上一次截取出来的1的后面，此时的结果是：

```js
1<2
```
如果剩余的模板依然不符合任何被解析的类型，那么重复此过程。直到所有文本都解析完。

```js
while (html) {
    let text, rest, next
    let textEnd = html.indexOf('<')
    
    // 截取文本
    if (textEnd >= 0) {
        rest = html.slice(textEnd)
        while ( !endTag.test(rest) && !startTagOpen.test(rest) && !comment.test(rest) && !conditionalComment.test(rest) ) {
            // 如果'<'在纯文本中，将它视为纯文本对待
            next = rest.indexOf('<', 1) // fromIndex 从哪个位置开始找 // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf
            if (next < 0) break
            textEnd += next
            rest = html.slice(textEnd)
        }
        text = html.substring(0, textEnd)
        html = html.substring(textEnd)
    }
    
    // 如果模板中找不到<，那么说明整个模板都是文本
    if (textEnd < 0) {
        text = html
        html = ''
    }
    // 触发钩子函数
    if (options.chars && text) {
        options.chars(text)
    }
}
```
::: tip
在代码中，我们通过while来解决这个问题（注意是里面的while）。如果剩余的模板不符合任何被解析的类型，那么重复解析文本，直到剩余模板符合被解析的类型为止。
:::

### 纯文本内容元素的处理

当我看到**纯文本内容元素**这几个字的时候，我感觉有点陌生，因为它和想象的不太一样，是这几个元素`script`,`style`,`textare`，解析它们的时候，会把这三种标签内包含的所有内容都当作文本处理。那么，具体该如何处理呢？

事实上，在 `while` 循环中，最外层的判断条件就是父级元素是不是纯文本内容元素。例如下面的伪代码：

```js
var isPlainTextElement = makeMap('script,style,textarea', true);

while (html) {
    if (!lastTag || !isPlainTextElement(lastTag)) {
        // 父元素为正常元素的处理逻辑
    } else {
        // 父元素为script、style、textarea的处理逻辑
    }
}
```

在上面的代码中， `lastTag` 代表父元素。可以看到，在 `while` 中，首先进行判断，如果父元素不存在或者不是纯文本内容元素，那么进行正常的处理逻辑，也就是前面介绍的逻辑。

而当父元素是 `script` 这种纯文本内容元素时，会进入到 `else` 这个语句里面。由于纯文本内容元素都被视作文本处理，所以我们的处理逻辑就变得很简单，只需要把这些文本截取出来并触发钩子函数 `chars` ，然后再将结束标签截取出来并触发钩子函数 `end` 。

伪代码如下：

```js
while (html) {
    if (!lastTag || !isPlainTextElement(lastTag)) {
        // 父元素为正常元素的处理逻辑
    } else {
        // 父元素为script、style、textarea的处理逻辑
        const stackedTag = lastTag.toLowerCase()
        const reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
        const rest = html.replace(reStackedTag, function (all, text) {
            if (options.chars) {
                options.chars(text)
            }
            return ''
        })
        html = rest
        options.end(stackedTag)
    }
}
```
上面代码中的正则表达式可以匹配结束标签前包括结束标签自身在内的所有文本。

我们可以给 `replace` 方法的第二个参数传递一个函数。在这个函数中，我们得到了参数 `text` （代表结束标签前的所有内容），触发了钩子函数 `chars` 并把 `text` 放到钩子函数的参数中传出去。最后，返回了一个空字符串，代表将匹配到的内容都截掉了。注意，这里的截掉会将内容和结束标签一起截取掉。

### 梳理整体逻辑

前面我们把开始标签、结束标签、注释、文本、纯文本内容元素等的截取方式拆分开，单独进行了详细介绍。本节中，我们就来介绍如何将这些解析方式组装起来完成HTML解析器的功能。

首先，HTML解析器是一个函数。就像9.2节介绍的那样，HTML解析器最终的目的是实现这样的功能：

```js
parseHTML(template, {
    start (tag, attrs, unary) {
        // 每当解析到标签的开始位置时，触发该函数
    },
    end () {
        // 每当解析到标签的结束位置时，触发该函数
    },
    chars (text) {
        // 每当解析到文本时，触发该函数
    },
    comment (text) {
        // 每当解析到注释时，触发该函数
    }
})
```
所以HTML解析器在实现上肯定是一个函数，它有两个参数——模板和选项,我们的模板是一小段一小段去截取与解析的，所以需要一个循环来不断截取，直到全部截取完毕：

```js
export function parseHTML (html, options) {
    while (html) {
        // 做点什么
    }
}
```
在循环中，首先要判断父元素是不是纯文本内容元素，因为不同类型父节点的解析方式将完全不同：

```js
export function parseHTML (html, options) {
    while (html) {
        if (!lastTag || !isPlainTextElement(lastTag)) {
            // 父元素为正常元素的处理逻辑
        } else {
            // 父元素为script、style、textarea的处理逻辑
        }
    }
}
```
在上面的代码中，我们发现这里已经把整体逻辑分成了两部分，一部分是父标签是正常标签的逻辑，另一部分是父标签是 `script` 、 `style` 、 `textarea` 这种纯文本内容元素的逻辑。

如果父标签为正常的元素，那么有几种情况需要分别处理，比如需要分辨出当前要解析的一小段模板到底是什么类型。是开始标签？还是结束标签？又或者是文本？


我们把所有需要处理的情况都列出来，有下面几种情况：

- 文本
- 注释
- 条件注释
- DOCTYPE
- 结束标签
- 开始标签

我们会发现，在这些需要处理的类型中，除了文本之外，其他都是以标签形式存在的，而标签是以<开头的。

所以逻辑就很清晰了，我们先根据<来判断需要解析的字符是文本还是其他的：

```js
function parseHTML (html, options) {
    while (html) {
        if (!lastTag || !isPlainTextElement(lastTag)) {
            let textEnd = html.indexOf('<')
            if (textEnd === 0) {
                // 做点什么
            }
            let text, rest, next
            if (textEnd >= 0) {
                // 解析文本
            }
            if (textEnd < 0) {
                text = html
                html = ''
            }
            if (options.chars && text) {
                options.chars(text)
            }
        } else {
            // 父元素为script、style、textarea的处理逻辑
        }
    }
}
```
如果通过 `<` 分辨出即将解析的这一小部分字符不是文本而是标签类，那么标签类有那么多类型，我们需要进一步分辨具体是哪种类型：

```js
function parseHTML (html, options) {
    while (html) {
        if (!lastTag || !isPlainTextElement(lastTag)) {
            let textEnd = html.indexOf('<')
            if (textEnd === 0) {
                // 注释
                if (comment.test(html)) {
                    // 注释的处理逻辑
                    continue
                }
                // 条件注释
                if (conditionalComment.test(html)) {
                    // 条件注释的处理逻辑
                    continue
                }
                // DOCTYPE
                const doctypeMatch = html.match(doctype)
                if (doctypeMatch) {
                    // DOCTYPE的处理逻辑
                    continue
                }
                // 结束标签
                const endTagMatch = html.match(endTag)
                if (endTagMatch) {
                    // 结束标签的处理逻辑
                    continue
                }
                // 开始标签
                const startTagMatch = parseStartTag()
                if (startTagMatch) {
                    // 开始标签的处理逻辑
                    continue
                }
            }
            let text, rest, next
            if (textEnd >= 0) {
                // 解析文本
            }
            if (textEnd < 0) {
                text = html
                html = ''
            }
            if (options.chars && text) {
                options.chars(text)
            }
        } else {
            // 父元素为script、style、textarea的处理逻辑
        }
    }
}
```

## 文本解析器

文本解析器的作用是解析文本。你可能会觉得很奇怪，文本不是在HTML解析器中被解析出来了么？准确地说，文本解析器是对HTML解析器解析出来的文本进行二次加工。为什么要进行二次加工？

在这里主要是为了解决 `vue` 的模板渲染所自定义的语法，比如 `{{ msg }}`，因为模板解析最终是要为生成 `VNode` 而服务。

我们先看看，通过文本解析的解析将上述表达式解析成数目样子了。

```js
'_s(msg)'
```
```js
// _s就是 toString 函数
function toString(val) {
    return val == null ?
        '' :
        Array.isArray(val) || (isPlainObject(val) && val.toString === _toString) ?
        JSON.stringify(val, null, 2) :
        String(val)
}
```

在文本解析器中，第一步要做的事情就是使用正则表达式来判断文本是否是带变量的文本，也就是检查文本中是否包含 `{{xxx}}` 这样的语法。如果是纯文本，则直接返回 `undefined` ；如果是带变量的文本，再进行二次加工。所以我们的代码是这样的：

```js
function parseText (text) {
    const tagRE = /\{\{((?:.|\n)+?)\}\}/g
    if (!tagRE.test(text)) {
        return
    }
}
```
在上面的代码中，如果是纯文本，则直接返回。如果是带变量的文本，该如何处理呢？

一个解决思路是使用正则表达式匹配出文本中的变量，先把变量左边的文本添加到数组中，然后把变量改成 `_s(x)` 这样的形式也添加到数组中。如果变量后面还有变量，则重复以上动作，直到所有变量都添加到数组中。如果最后一个变量的后面有文本，就将它添加到数组中。

这时我们其实已经有一个数组，数组元素的顺序和文本的顺序是一致的，此时将这些数组元素用+连起来变成字符串，就可以得到最终想要的效果了。

```js
function parseText (text) {
    const tagRE = /\{\{((?:.|\n)+?)\}\}/g
    if (!tagRE.test(text)) {
        return
    }

    const tokens = []
    let lastIndex = tagRE.lastIndex = 0
    let match, index
    while ((match = tagRE.exec(text))) {
        index = match.index
        // 先把 {{ 前边的文本添加到tokens中
        if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)))
        }
        // 把变量改成`_s(x)`这样的形式也添加到数组中
        tokens.push(`_s(${match[1].trim()})`)
        
        // 设置lastIndex来保证下一轮循环时，正则表达式不再重复匹配已经解析过的文本
        lastIndex = index + match[0].length
    }
    
    // 当所有变量都处理完毕后，如果最后一个变量右边还有文本，就将文本添加到数组中
    if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)))
    }
    return tokens.join('+')
}
console.log(parseText('哈哈{{name}}')) // "哈哈"+_s(name)
console.log(parseText('哈哈{{name}}asdas{{hobby}}')) // templateEngine.html:95 "哈哈"+_s(name)+"asdas"+_s(hobby)
```
从上面代码的打印结果可以看到，文本已经被正确解析了。

## 总结

解析器的作用是通过模板得到AST（抽象语法树）。

生成AST的过程需要借助HTML解析器，当HTML解析器触发不同的钩子函数时，我们可以构建出不同的节点。

随后，我们可以通过栈来得到当前正在构建的节点的父节点，然后将构建出的节点添加到父节点的下面。

最终，当HTML解析器运行完毕后，我们就可以得到一个完整的带DOM层级关系的AST。

HTML解析器的内部原理是一小段一小段地截取模板字符串，每截取一小段字符串，就会根据截取出来的字符串类型触发不同的钩子函数，直到模板字符串截空停止运行。

文本分两种类型，不带变量的纯文本和带变量的文本，后者需要使用文本解析器进行二次加工。






