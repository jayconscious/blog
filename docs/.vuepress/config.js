module.exports = {
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
				text: '读书', 
				items: [
					{ text: '你不知道的JavaScript', link: '/book/dontknowjs/' },
					{ text: '深入浅出Node.js', link: '/book/explainindepthnodejs/' },
				]
			},
			{ text: 'My Github', link: 'https://github.com/jayconscious' }
		],
		sidebar: {
			// Todo：分组
			'/vue/vue/': [
				'',
				'vueDiff',
			],
			'/book/dontknowjs/': [
				{
					title: '你不知道的JavaScript',   // 必要的
					path: '/book/dontknowjs/',      // 可选的, 标题的跳转链接，应为绝对路径且必须存在
					collapsable: false, // 可选的, 默认值是 true,
					sidebarDepth: 1,    // 可选的, 默认值是 1
					children: [
						'/book/dontknowjs/scope',
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
	},
	markdown: {
		lineNumbers: true
	}
}
