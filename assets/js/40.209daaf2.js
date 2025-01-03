(window.webpackJsonp=window.webpackJsonp||[]).push([[40],{488:function(v,_,e){"use strict";e.r(_);var t=e(2),a=Object(t.a)({},(function(){var v=this,_=v._self._c;return _("ContentSlotsDistributor",{attrs:{"slot-key":v.$parent.slotKey}},[_("h2",{attrs:{id:"前言"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#前言"}},[v._v("#")]),v._v(" 前言")]),v._v(" "),_("p",[v._v("第一次接触到垃圾回收算法是在朴老师的"),_("code",[v._v("《深入浅出Node.js》")]),v._v("上，对于 "),_("code",[v._v("垃圾回收")]),v._v(" 这个概念，我不免抛出一些疑问。"),_("code",[v._v("垃圾")]),v._v(" 在日常生活中我们非常熟悉，指的哪些我们用过的或者是无用的东西，那在"),_("code",[v._v("js")]),v._v("中哪些是"),_("code",[v._v("垃圾")]),v._v("呢？ 而"),_("code",[v._v("回收")]),v._v("的这个操作通常都是物业大妈干的事情，那在 "),_("code",[v._v("js")]),v._v("又是谁在做这件事情呢？")]),v._v(" "),_("p",[v._v("我们来举个例子回答上述的问题，")]),v._v(" "),_("div",{staticClass:"language-js line-numbers-mode"},[_("pre",{pre:!0,attrs:{class:"language-js"}},[_("code",[_("span",{pre:!0,attrs:{class:"token keyword"}},[v._v("var")]),v._v(" a "),_("span",{pre:!0,attrs:{class:"token operator"}},[v._v("=")]),v._v(" "),_("span",{pre:!0,attrs:{class:"token punctuation"}},[v._v("{")]),v._v(" "),_("span",{pre:!0,attrs:{class:"token literal-property property"}},[v._v("name")]),_("span",{pre:!0,attrs:{class:"token operator"}},[v._v(":")]),v._v(" "),_("span",{pre:!0,attrs:{class:"token string"}},[v._v("'hello'")]),v._v(" "),_("span",{pre:!0,attrs:{class:"token punctuation"}},[v._v("}")]),v._v("\na "),_("span",{pre:!0,attrs:{class:"token operator"}},[v._v("=")]),v._v(" "),_("span",{pre:!0,attrs:{class:"token string"}},[v._v("'world'")]),v._v("\n")])]),v._v(" "),_("div",{staticClass:"line-numbers-wrapper"},[_("span",{staticClass:"line-number"},[v._v("1")]),_("br"),_("span",{staticClass:"line-number"},[v._v("2")]),_("br")])]),_("p",[_("img",{attrs:{src:"/assets/img/algorithm/gc/gc1.png",alt:"image"}})]),v._v(" "),_("p",[v._v("上述代码中，我们先声明了变量 "),_("code",[v._v("a")]),v._v("，然后将"),_("code",[v._v("a")]),v._v("赋值了一个对象 "),_("code",[v._v("{ name: 'hello' }")]),v._v("，在 "),_("code",[v._v("js引擎")]),v._v(" 分配内存的策略上，这个对象真实所占用的存储空间是在堆上的，而这个内存的地址是存放在栈上的，这就是我们 "),_("code",[v._v("前端")]),v._v(" 常说的引用类型的存储方式。而下一行代码，我们将 "),_("code",[v._v("world")]),v._v(" 赋值给 "),_("code",[v._v("a")]),v._v(" 时，之前的对象就被后续引用，是不是变得有点像 "),_("code",[v._v("垃圾")]),v._v(" 了。我们都知道内存是非常昂贵的，所以这是"),_("code",[v._v("js引擎")]),v._v(" 就会充当一部分 "),_("code",[v._v("物业大妈")]),v._v(" 们的角色将这些垃圾收走。")]),v._v(" "),_("h2",{attrs:{id:"概念介绍"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#概念介绍"}},[v._v("#")]),v._v(" 概念介绍")]),v._v(" "),_("p",[v._v("通过上述例子的描述我们基本上知道了 "),_("code",[v._v("GC(Garbage Collection)")]),v._v("，干了件什么事情。然而对于做这件事情我们需要一定的策略，下面将会介绍两种常见的算法："),_("strong",[v._v("半区复制法")]),v._v("和"),_("strong",[v._v("标记清除法")]),v._v("。\n"),_("strong",[v._v("半区复制法")]),v._v("通常应用于对新生代(在内存中停留不久)对象处理，而"),_("strong",[v._v("标记清除法")]),v._v("通常应用于对老生代(在内存中驻留)对象处理，那老生代对象是如何由来的呢？这个后面来解答一下。")]),v._v(" "),_("p",[v._v("这在里还有一个内存管理中行的概念需要阐述一下："),_("code",[v._v("可达性")]),v._v("。就是那些以某种方式可访问或者说可用的值，它们被保证存储在内存中，反之不可访问则需回收。")]),v._v(" "),_("h2",{attrs:{id:"半区复制法-cheney算法"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#半区复制法-cheney算法"}},[v._v("#")]),v._v(" 半区复制法(Cheney算法)")]),v._v(" "),_("p",[v._v("对于新生代的对象来说，"),_("strong",[v._v("半区复制法")]),v._v("是个不错的应对策略。"),_("code",[v._v("Cheney算法")]),v._v(" 中将堆内存"),_("strong",[v._v("一分为二")]),v._v("，一个是处于使用状态的空间我们暂且称之为 "),_("code",[v._v("使用区")]),v._v("，一个是处于闲置状态的空间我们称之为"),_("code",[v._v("空闲区")]),v._v("，如下图所示\n"),_("img",{attrs:{src:"/assets/img/algorithm/gc/gc2.png",alt:"image"}})]),v._v(" "),_("p",[v._v("新加入的对象都会存放到"),_("code",[v._v("使用区")]),v._v("，当使用区快被写满时，就需要执行一次垃圾清理操作。")]),v._v(" "),_("p",[_("strong",[v._v("当开始进行垃圾回收时，新生代垃圾回收器会对使用区中的活动对象做标记，标记完成之后将使用区的活动对象复制进空闲区并进行排序，随后进入垃圾清理阶段，即将非活动对象占用的空间清理掉。最后进行角色互换，把原来的使用区变成空闲区，把原来的空闲区变成使用区。")])]),v._v(" "),_("p",[v._v("当一个对象经过"),_("strong",[v._v("多次复制")]),v._v("后依然存活，它将会被认为是生命周期较长的对象，随后会被移动到老生代中，采用老生代的垃圾回收策略进行管理。")]),v._v(" "),_("blockquote",[_("p",[v._v("这里有一个疑问就是 "),_("strong",[v._v("标记")]),v._v(" 是如何实现的？有下面几种方法")])]),v._v(" "),_("ol",[_("li",[v._v("当变量进入执行环境时，反转某一位（通过一个二进制字符来表示标记）")]),v._v(" "),_("li",[v._v("可以维护进入环境变量和离开环境变量这样两个列表，可以自由的把变量从一个列表转移到另一个列表")])]),v._v(" "),_("h2",{attrs:{id:"标记清除-mark-sweep-算法"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#标记清除-mark-sweep-算法"}},[v._v("#")]),v._v(" 标记清除（Mark-Sweep）算法")]),v._v(" "),_("p",[v._v("标记清除"),_("code",[v._v("（Mark-Sweep）")]),v._v("，目前在 "),_("code",[v._v("JavaScript引擎")]),v._v(" 里这种算法是最常用的，到目前为止的大多数浏览器的 "),_("code",[v._v("JavaScript引擎")]),v._v(" 都在采用标记清除算法，只是各大浏览器厂商还对此算法进行了优化加工，且不同浏览器的 "),_("code",[v._v("JavaScript引擎")]),v._v(" 在运行垃圾回收的频率上有所差异。")]),v._v(" "),_("p",[v._v("此算法分为 "),_("code",[v._v("标记")]),v._v(" 和 "),_("code",[v._v("清除")]),v._v(" 两个阶段，标记阶段即为所有活动对象做上标记，清除阶段则把没有标记（也就是非活动对象）销毁")]),v._v(" "),_("p",[v._v("引擎在执行 "),_("code",[v._v("GC（使用标记清除算法）")]),v._v("时，需要从出发点去遍历内存中所有的对象去打标记，而这个出发点有很多，我们称之为一组 "),_("strong",[v._v("根")]),v._v(" 对象，而所谓的根对象，其实在浏览器环境中包括又不止于 全局"),_("strong",[v._v("Window对象")]),v._v("、"),_("strong",[v._v("文档DOM树")]),v._v(" 等")]),v._v(" "),_("p",[v._v("标记清除的过程大致如下：")]),v._v(" "),_("ul",[_("li",[v._v("垃圾收集器在运行时会给内存中的所有变量都加上一个标记，假设内存中所有对象都是垃圾，全标记为"),_("code",[v._v("0")])]),v._v(" "),_("li",[v._v("然后从各个根对象开始遍历，把不是垃圾的节点改成"),_("code",[v._v("1")])]),v._v(" "),_("li",[v._v("清理所有标记为"),_("code",[v._v("0")]),v._v("的垃圾，销毁并回收它们所占用的内存空间")]),v._v(" "),_("li",[v._v("最后，把所有内存中对象标记修改为"),_("code",[v._v("0")]),v._v("，等待下一轮垃圾回收")])]),v._v(" "),_("h4",{attrs:{id:"优点"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#优点"}},[v._v("#")]),v._v(" 优点")]),v._v(" "),_("p",[v._v("标记清除算法的优点只有一个，那就是实现比较简单，打标记也无非打与不打两种情况，这使得一位二进制位（0和1）就可以为其标记，非常简单")]),v._v(" "),_("h4",{attrs:{id:"缺点"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#缺点"}},[v._v("#")]),v._v(" 缺点")]),v._v(" "),_("p",[v._v("标记清除算法有一个很大的缺点，就是在清除之后，剩余的对象内存位置是不变的，也会导致空闲内存空间是不连续的，出现了 "),_("code",[v._v("内存碎片")]),v._v("（如下图），并且由于剩余空闲内存不是一整块，它是由不同大小内存组成的内存列表，这就牵扯出了内存分配的问题")]),v._v(" "),_("p",[_("img",{attrs:{src:"/assets/img/algorithm/gc/gc3.png",alt:"image"}})]),v._v(" "),_("p",[v._v("假设我们新建对象分配内存时需要大小为 "),_("code",[v._v("size")]),v._v("，由于空闲内存是间断的、不连续的，则需要对空闲内存列表进行一次单向遍历找出大于等于 "),_("code",[v._v("size")]),v._v(" 的块才能为其分配（如下图）")]),v._v(" "),_("p",[_("img",{attrs:{src:"/assets/img/algorithm/gc/gc4.png",alt:"image"}})]),v._v(" "),_("p",[v._v("那么如何在诸多的 "),_("code",[v._v("内存碎片")]),v._v("碎片中找到一块合适的内存呢？这里有三种分配策略可供选择：")]),v._v(" "),_("ul",[_("li",[_("p",[_("code",[v._v("First-fit")]),v._v("，找到大于等于 "),_("code",[v._v("size")]),v._v(" 的块立即返回")])]),v._v(" "),_("li",[_("p",[_("code",[v._v("Best-fit")]),v._v("，遍历整个空闲列表，返回大于等于 "),_("code",[v._v("size")]),v._v(" 的最小分块")])]),v._v(" "),_("li",[_("p",[_("code",[v._v("Worst-fit")]),v._v("，遍历整个空闲列表，找到最大的分块，然后切成两部分，一部分 "),_("code",[v._v("size")]),v._v(" 大小，并将该部分返回")])])]),v._v(" "),_("p",[v._v("这三种分配策略需要在各种场景中测试来找到最佳策略，本质还是如何去平衡空间和比较次数的。")]),v._v(" "),_("h2",{attrs:{id:"标记整理-mark-compact-算法"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#标记整理-mark-compact-算法"}},[v._v("#")]),v._v(" 标记整理（Mark-Compact）算法")]),v._v(" "),_("p",[v._v("标记清除算法的缺点在于清除之后剩余的对象位置不变而"),_("code",[v._v("导致的空闲内存不连续")]),v._v("，所以只要解决这一点，两个缺点(内存碎片化和分配速度慢)都可以完美解决了")]),v._v(" "),_("p",[_("code",[v._v("标记整理（Mark-Compact）")]),v._v("算法 就可以有效地解决，它的标记阶段和标记清除算法没有什么不同，只是标记结束后，标记整理算法会将活着的对象（即不需要清理的对象）向内存的一端移动，最后清理掉边界的内存（如下图），这样整合之后，内存的地址就会是连续的，这样方便了后续的内存分配。")]),v._v(" "),_("p",[_("img",{attrs:{src:"/assets/img/algorithm/gc/gc5.png",alt:"image"}})]),v._v(" "),_("h2",{attrs:{id:"总结"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[v._v("#")]),v._v(" 总结")]),v._v(" "),_("ol",[_("li",[v._v("通过本文了解什么是所谓的"),_("code",[v._v("垃圾")]),v._v("，什么是"),_("code",[v._v("可达性")]),v._v("。")]),v._v(" "),_("li",[v._v("新生代常用的 "),_("strong",[v._v("半区复制法(Cheney算法)")]),v._v(" 以及 "),_("strong",[v._v("标记清除（Mark-Sweep）算法")]),v._v("的优缺点和 "),_("strong",[v._v("标记整理（Mark-Compact）算法")]),v._v("的优化点。")]),v._v(" "),_("li",[v._v("此外，我们还有几个疑问：")])]),v._v(" "),_("ul",[_("li",[_("code",[v._v("js")]),v._v("是单线程的，那么 "),_("code",[v._v("GC（Garbage Collection）")]),v._v(" 的时机是怎样的？")]),v._v(" "),_("li",[v._v("对于标记过的变量在下一次还需要继续标记吗？")]),v._v(" "),_("li",[v._v("在我们熟悉的 "),_("code",[v._v("v8")]),v._v(" 当中这些算法到底是如何工作的？\n上述的问题我们下一次再来研究")])]),v._v(" "),_("h2",{attrs:{id:"参考文献"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#参考文献"}},[v._v("#")]),v._v(" 参考文献")]),v._v(" "),_("ul",[_("li",[_("a",{attrs:{href:"https://juejin.cn/post/6981588276356317214",target:"_blank",rel:"noopener noreferrer"}},[v._v("「硬核JS」你真的了解垃圾回收机制吗"),_("OutboundLink")],1)]),v._v(" "),_("li",[_("a",{attrs:{href:"https://book.douban.com/subject/25768396/",target:"_blank",rel:"noopener noreferrer"}},[v._v("《深入浅出Node.js》"),_("OutboundLink")],1)])])])}),[],!1,null,null,null);_.default=a.exports}}]);