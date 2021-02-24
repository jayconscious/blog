const moment = require('moment');
const { vue2, dontknowjs1, dontknowjs2, tstutorial } = require('./sidebarCfg')

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
		nav: require('./nav/zh'),
		sidebar: {
			'/javascript/basicjs/': [ 'promise'],
			'/javascript/es6/': [ 'proxy' ],
			'/vue/vue2/': getBookSideBar(vue2),
			'/vue/vuex/': getVuexSidebar('vuex'),
			'/book/dontknowjs1/': getBookSideBar(dontknowjs1),
			'/book/dontknowjs2/': getBookSideBar(dontknowjs2),
			'/book/tstutorial/': getBookSideBar(tstutorial),
			'/book/explainindepthnodejs/': [
				''
			],
			'/others/server/': [ 'cdn' ],
			'/others/redis/': [ 'start' ],
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
		['@vuepress/last-updated',
			{
				transformer: (timestamp, lang) => {
					lang = 'zh-CN'
					const moment = require('moment')
					moment.locale(lang)
					timestamp = timestamp + 8 * 60 * 60 * 1000
					return moment(timestamp).format('llll');
				}
			}
		],
		['@vuepress/back-to-top', true]
	]
}

/**
 * CfgList []
 */
function getBookSideBar (CfgList) {
	if (Array.isArray(CfgList) && CfgList.length > 0) {
		return CfgList.map(item => ({
			...item,
			collapsable: false, // 可选的, 默认值是 true,
			sidebarDepth: 1,    // 可选的, 默认值是 1
			path: `${item.path}${item.children[0]}`,
			children: item.children.map(child => (
				`${item.path}${child}`
			))
		}))
	}
}

function getVuexSidebar (groupA) {
	return [
		{
			title: groupA,
			collapsable: false,
			sidebarDepth: 2,
			children: [
				['', '目录'],
				'what-is-vuex',
				'a-simple-demo',
			]
		}
	]
}
