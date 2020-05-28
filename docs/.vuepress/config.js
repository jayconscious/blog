module.exports = {
  title: 'Hello VuePress',
  description: 'Just playing around',
  themeConfig: {
    logo: '/assets/img/log.png',
    // navbar: false   禁用所有页面的导航栏
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Vue', items: [
        { text: 'vue', link: '/vueclass/vueNative/' },
        { text: 'vuerouter', link: '/vueclass/vuerouter/' },
        { text: 'vuestore', link: '/vueclass/vuestore/' },
      ]},
      { text: 'Guide', link: '/guide/' },
      {
        text: 'Languages',
        ariaLabel: 'Language Menu',
        items: [
          { text: 'Chinese', link: '/language/chinese/' },
          { text: 'Japanese', link: '/language/japanese/' }
        ]
      }
    ],
    sidebar: [
      '/',
      '/page-a',
      ['/page-b', 'Explicit link text']
    ]
  }
}
