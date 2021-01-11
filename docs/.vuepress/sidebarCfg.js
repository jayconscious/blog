module.exports = {
    // vue2.x
    vue2: [{
        title: '源码分析',
        path: '/vue2/vue2/sourcecode/',
        children: ['vueDiff', 'reactivityInDepth', 'asyncRender' ]
    },{
        title: '问题解答',
        path: '/vue2/vue2/question/',
        children: [ 'dataIsFn', 'checkDupKeys', 'aboutNextTick' ]
    }],
    // 《你不知道的JavaScript》(上卷)
    dontknowjs1: [{
        title: '第一部分：作用域和闭包',
        path: '/book/dontknowjs1/scope&closure/',
        children: ['lexingscope', 'fnblockscope', 'hoisting', 'scopeclosure']
    },{
        title: '第二部分：this和对象原型',
        path: '/book/dontknowjs1/this&objectproto/',
        children: [ 'aboutthis', 'analysisthis1', 'analysisthis2', 'object1', 'object2', 'object3', 'mixedobjects', 'prototype1', 'prototype2', 'actiontrust1', 'actiontrust2' ]
    }],
    // 《你不知道的JavaScript》(中卷)
    dontknowjs2: [{
        title: '第二部分：异步和性能',
        path: '/book/dontknowjs2/async&performance/',
        children: [ 'now&future', 'callback', 'promise']
    }],
    // 《TypeScript入门教程》
    tstutorial: [{
            title: '第一部分：简介',
            path: '/book/tstutorial/intro/',
            children: [ 'home' ]
        },
    ],
}