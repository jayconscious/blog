const moment = require('moment');
module.exports = {
	head: [
		['link', { rel: 'icon', href: '/assets/img/favicon.ico' }]
	],
	base: '/blog/',
	title: 'Jayconscious',
	description: 'Just playing around',
	themeConfig: {
		logo: '/assets/img/log.png',
		// navbar: false   禁用所有页面的导航栏
		nav: [
			{ text: 'Home', link: '/' },
			{
				text: 'SourceCode',
				items: [
					{ text: 'SourceCode', link: '/sourcecode/basicjs/' },
				]
			},
			{
				text: 'Vue',
				items: [
					{ text: 'vue', link: '/vue/vue/' },
					// { text: 'vueRouter', link: '/vue/vuerouter/' },
					// { text: 'vueStore', link: '/vue/vuestore/' },
				]
			},
			{
				text: 'Reading',
				items: [
					{ text: '《你不知道的JavaScript》(上卷)', link: '/book/dontknowjs1/' },
					{ text: '《你不知道的JavaScript》(中卷)', link: '/book/dontknowjs2/' },
					{ text: '《TypeScript入门教程》', link: '/book/tstutorial/' },
					{ text: '《深入浅出Node.js》', link: '/book/explainindepthnodejs/' }
				]
			},
			{
				text: 'Others',
				items: [
					{ text: '服务器相关', link: '/others/server/cdn' },
					{ text: 'Redis', link: '/others/redis/start' },
				]
			},
			{ text: 'My Github', link: 'https://github.com/jayconscious' }
		],
		sidebar: {
			'/others/server/': [
				'cdn'
			],
			'/others/redis/': [
				'start'
			],
			'/sourcecode/basicjs/': [
				'promise'
			],
			'/vue/vue/': [
				'vueDiff',
			],
			'/book/dontknowjs1/': [
				{
					title: '第一部分：作用域和闭包',   // 必要的
					path: '/book/dontknowjs1/scope&closure/lexingscope',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
					collapsable: false, // 可选的, 默认值是 true,
					sidebarDepth: 1,    // 可选的, 默认值是 1
					children: [
						'/book/dontknowjs1/scope&closure/lexingscope',
						'/book/dontknowjs1/scope&closure/fnblockscope',
						'/book/dontknowjs1/scope&closure/hoisting',
						'/book/dontknowjs1/scope&closure/scopeclosure',
					]
				},
				{
					title: '第二部分：this和对象原型',   // 必要的
					path: '/book/dontknowjs1/this&objectproto/aboutthis',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
					collapsable: false, // 可选的, 默认值是 true,
					sidebarDepth: 1,    // 可选的, 默认值是 1
					children: [
						'/book/dontknowjs1/this&objectproto/aboutthis',
						'/book/dontknowjs1/this&objectproto/analysisthis1',
						'/book/dontknowjs1/this&objectproto/analysisthis2',
						'/book/dontknowjs1/this&objectproto/object1',
						'/book/dontknowjs1/this&objectproto/object2',
						'/book/dontknowjs1/this&objectproto/object3',
						'/book/dontknowjs1/this&objectproto/mixedobjects',
						'/book/dontknowjs1/this&objectproto/prototype1',
						'/book/dontknowjs1/this&objectproto/prototype2',
						'/book/dontknowjs1/this&objectproto/actiontrust1',
						'/book/dontknowjs1/this&objectproto/actiontrust2',
					]
				}
			],
			'/book/dontknowjs2/': [
				// {
				// 	title: '第一部分：类型和语法',   // 必要的
				// 	path: '/book/dontknowjs2/type&grammar/',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
				// 	collapsable: false, // 可选的, 默认值是 true,
				// 	sidebarDepth: 1,    // 可选的, 默认值是 1
				// 	children: [
				// 		'/book/dontknowjs2/type&grammar/',
				// 	]
				// },
				{
					title: '第二部分：异步和性能',   // 必要的
					path: '/book/dontknowjs2/async&performance/now&future',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
					collapsable: false, // 可选的, 默认值是 true,
					sidebarDepth: 1,    // 可选的, 默认值是 1
					children: [
						'/book/dontknowjs2/async&performance/now&future',
						'/book/dontknowjs2/async&performance/callback',
						'/book/dontknowjs2/async&performance/promise'
					]
				}
			],
			'/book/tstutorial/': [
				{
					title: '第一部分：简介',   // 必要的
					path: '/book/tstutorial/intro/home',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
					collapsable: false, // 可选的, 默认值是 true,
					sidebarDepth: 1,    // 可选的, 默认值是 1
					children: [
						'/book/tstutorial/intro/home',
					]
				},
			],
			'/book/explainindepthnodejs/': [
				''
			],
		},
		sidebarDepth: 0,  // 获取页面的h3标签作为连接锚点
		displayAllHeaders: false, // 显示所有页面的标题链接
		activeHeaderLinks: false, // 禁止页面连接hash更新
		// sidebar: 'auto'  // 自动生成一个侧边栏
		lastUpdated: '上次更新', // string | boolean
	},
	markdown: {
		lineNumbers: true
	},
	plugins: [
		[
		  '@vuepress/last-updated',
		  {
			transformer: (timestamp, lang) => {
				lang = 'zh-CN'
				const moment = require('moment')
				moment.locale(lang)
				timestamp = timestamp + 8 * 60 * 60 * 1000
				return moment(timestamp).format('llll');
			}
		  }
		]
	  ]
}
