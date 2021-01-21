# 模板引擎

在使用 `vue` 之前，或许我们已经接触过了其他的模板引擎，比如 `underscore` 的 `template` 方法，或者是 `handlebars` 等之类。他们的作用基本上就是通过结构化的 `html` 模板片段注入一些变量，结合一些辅助函数例如 `each`，生成我们想要的 `html` 片段。这大大简化了我们对原生 `dom` 以及数据拼接操作，提升了我们的研发效率和体验。而 `vue`的模板引擎再次基础上再次封装抽象，并借助抽象语法树 `AST` ，对功能进一步的扩展，和响应式系统很好的结合在一起了。`vue` 模板引擎编译主要分为三个步骤：**将模板字符串转为`AST`，对`AST`进行处理，由 `AST` 生成代码所需的字符串。**


## 模板字符串转为 AST

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
具体的逻辑和规则是怎么样的呢？只要判断模板字符串是不是以 `<`开头我们就可以知道我们接下来要截取的这一小段字符串是 `标签` 还是 `文本`。我们来举个🌰：

`<div></div>` 这样的一段字符串是以 `<` 开头的，那么我们通过正则把 `<div>` 这一部分 `match` 出来，就可以拿到这样的数据：

```js
{
  tagName: 'div',
  attrs: [],
  unarySlash: '',
  start: 0,
  end: 5
}
```
如何用正则解析出 `tagName` 和 `attrs` 这些字段可以看下面这个代码：




















































