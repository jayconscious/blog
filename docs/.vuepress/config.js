module.exports = {
  base: '/blog/',
  title: 'Jayconscious',
  description: 'Just playing around',
  themeConfig: {
    logo: '/assets/img/log.png',
    // navbar: false   禁用所有页面的导航栏
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Vue', items: [
        { text: 'vue', link: '/vue/vue/vueDiff' },
        { text: 'vueRouter', link: '/vue/vuerouter/' },
        { text: 'vueStore', link: '/vue/vuestore/' },
      ]},
      { text: 'My Github', link: 'https://github.com/jayconscious' }
    ],
    sidebar: {
      '/vue/vue/': [
        'vueDiff',
      ]
    }
  }
}
