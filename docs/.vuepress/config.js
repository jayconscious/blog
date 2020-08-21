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
					{ text: '《你不知道的JavaScript》(上卷)', link: '/book/dontknowjs/' },
					{ text: '《深入浅出Node.js》', link: '/book/explainindepthnodejs/' },
				]
			},
			{ text: 'My Github', link: 'https://github.com/jayconscious' }
		],
		sidebar: {
			'/vue/vue/': [
				'vueDiff',
			],
			'/book/dontknowjs/': [
				{
					title: '第一部分：作用域和闭包',   // 必要的
					path: '/book/dontknowjs/scope&closure/lexingscope',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
					collapsable: false, // 可选的, 默认值是 true,
					sidebarDepth: 1,    // 可选的, 默认值是 1
					children: [
						'/book/dontknowjs/scope&closure/lexingscope',
						'/book/dontknowjs/scope&closure/fnblockscope',
						'/book/dontknowjs/scope&closure/hoisting',
						'/book/dontknowjs/scope&closure/scopeclosure',
					]
				},
				{
					title: '第二部分：this和对象原型',   // 必要的
					path: '/book/dontknowjs/this&objectproto/aboutthis',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
					collapsable: false, // 可选的, 默认值是 true,
					sidebarDepth: 1,    // 可选的, 默认值是 1
					children: [
						'/book/dontknowjs/this&objectproto/aboutthis',
						'/book/dontknowjs/this&objectproto/analysisthis1',
						'/book/dontknowjs/this&objectproto/analysisthis2',
						'/book/dontknowjs/this&objectproto/object1',
						'/book/dontknowjs/this&objectproto/object2',
						'/book/dontknowjs/this&objectproto/object3',
						'/book/dontknowjs/this&objectproto/mixedobjects',
						'/book/dontknowjs/this&objectproto/prototype',
					]
				}
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
