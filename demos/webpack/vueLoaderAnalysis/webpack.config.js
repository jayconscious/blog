const path = require('path')
const { VueLoaderPlugin } = require('./lib/vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
console.log('env', process.env.NODE_ENV)
console.log('env', typeof process.env.NODE_ENV)

module.exports = {
  devtool: 'source-map',
  mode: 'development',
  entry: path.resolve(__dirname, './main.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  devServer: process.env.NODE_ENV == 'production' ? {}:{
    contentBase: path.join(__dirname, 'dist'),
    hot: true,
    writeToDisk: true,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: ['vue-loader']
        // loader: 'vue-loader' 'simple-loader'
      },
      // {
      //   resourceQuery: /blockType=foo/,
      //   loader: 'babel-loader'
      // },
      // {
      //   test: /\.pug$/,
      //   oneOf: [
      //     {
      //       resourceQuery: /^\?vue/,
      //       use: ['pug-plain-loader']
      //     },
      //     {
      //       use: ['raw-loader', 'pug-plain-loader']
      //     }
      //   ]
      // },
      // {
      //   test: /\.css$/,
      //   oneOf: [
      //     {
      //       resourceQuery: /module/,
      //       use: [
      //         'vue-style-loader',
      //         {
      //           loader: 'css-loader',
      //           options: {
      //             modules: true,
      //             localIdentName: '[local]_[hash:base64:8]'
      //           }
      //         }
      //       ]
      //     },
      //     {
      //       use: [
      //         'vue-style-loader',
      //         'css-loader'
      //       ]
      //     }
      //   ]
      // },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          // 'vue-style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      // {
      //   test: /\.css$/,
      //   use: ['style-loader', 'css-loader']
      // }
    ]
  },
  resolveLoader: {
    alias: {
      'vue-loader': require.resolve('./lib/vue-loader'),
      'simple-loader': require.resolve('./lib/simple-loader'),
      // 'style-loader': require.resolve('./lib/style-loader'),
    }
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      title: 'webpack loader analysis', 
      template: './public/index.html'
    })
  ]
}