const moment = require('moment');
const { vue2, dontknowjs1, dontknowjs2, tstutorial, webpack } = require('./sidebarCfg')

const isProduction = process.env.NODE_ENV === 'production' 

module.exports = {
	theme: 'reco',
	head: [
		['link', { rel: 'icon', href: '/assets/img/favicon.ico' }]
	],
	// base: 'https://unpkg.com/jayconscious-blog@latest/docs/.vuepress/dist/',
	base: '/',
	title: 'Jayconscious',
	description: 'Just playing around',
	themeConfig: {
		type: 'blog',
		authorAvatar: '/assets/img/avatar.png',
		// navbar: false   禁用所有页面的导航栏
		nav: require('./nav/zh'),
		author: 'jayconscious',
		sidebar: {
			'/javascript/js/': [ 'extends', 'call&bind' ],
			'/javascript/es6/': [ 'promise', 'generator-primary', 'co', 'async', 'proxy' ],
			'/node/egg/': [ 'framework' ],
			'/vue/vue2/': getBookSideBar(vue2),
			'/vue/vuex/': getSingleSidebar('vuex'),
			'/book/dontknowjs1/': getBookSideBar(dontknowjs1),
			'/book/dontknowjs2/': getBookSideBar(dontknowjs2),
			'/book/tstutorial/': getBookSideBar(tstutorial),
			// '/book/explainindepthnodejs/': [ '' ],
			'/engineering/webpack/': getBookSideBar(webpack),
			'/others/server/': [ 'blogBuild', 'cdn' ],
			'/others/redis/': [ 'start' ],
			'/algorithm/gc/': [ 'gc1' ],
		},
		blogConfig: {
			category: {
			  	location: 2, // 在导航栏菜单中所占的位置，默认2
			  	text: 'Category' // 默认 “分类”
			},
			tag: {
			  	location: 3, // 在导航栏菜单中所占的位置，默认3
			  	text: 'Tag' // 默认 “标签”
			}
		},
		sidebarDepth: 0,  // 获取页面的h3标签作为连接锚点
		displayAllHeaders: false, // 显示所有页面的标题链接
		activeHeaderLinks: false, // 禁止页面连接hash更新
		// sidebar: 'auto'  // 自动生成一个侧边栏
		lastUpdated: '上次更新', // string | boolean
		startYear: '2020',
		valineConfig: {
			appId: '35MDGfOk3PtL6D4gtOStzE0c-gzGzoHsz',// your appId
			appKey: 'h9XmKI1NHaLVKlhdwVNRD1QO', // your appKey
			showComment: false,					// 关闭评论
			placeholder: '是时候展现真正的技术了',
			avatar: 'wavatar',
			requiredFields: ['nick','mail'],
			// serverUrl: 'https://leanserver.smallsunnyfox.com'
		  }
	},
	markdown: {
		lineNumbers: true
	},
	plugins: [
		['@vuepress/back-to-top', true]
	],
	configureWebpack: (config, isServer) => {
		if (isProduction) {
			if (!isServer) {
				// 修改客户端的 webpack 配置
				if (config.optimization) {
					config.optimization = {
						splitChunks: {
							chunks: 'all',
							maxAsyncRequests: 5,
							maxSize: 500000,   // 500kb 
							cacheGroups: {
								commons: {
									name: 'commons',  // 命名chunks_name
									chunks: 'all',
								}
							}
						}
					}
				}
				// console.log('env', process.env.NODE_ENV)
				if (config.output && config.output.publicPath) {
					config.output.publicPath = 'https://unpkg.com/jayconscious-blog@latest/docs/.vuepress/dist/'
				}
				// console.log('config', config)
			}
		}
	}
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

function getSingleSidebar (title) {
	return [{
		title,
		collapsable: false,
		sidebarDepth: 2,
		children: [
			['', '介绍'],
			'what-is-vuex',
			'a-simple-demo',
			'store-install',
			'store-init',
			'dispatch',
			'commit'
		]
	}]
}

