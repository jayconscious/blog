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
        { text: 'vueNative', link: '/vueclass/vueNative/' },
        { text: 'vuerouter', link: '/vueclass/vuerouter/' },
        { text: 'vuestore', link: '/vueclass/vuestore/' },
      ]},
      { text: 'My Github', link: 'https://github.com/jayconscious' }
    ],
    sidebar: {
      '/vueclass/vueNative/': [
        '',
        'one',
        'two'
      ]
    }
  }
}
