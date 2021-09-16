// main.js
import Vue from 'vue'
import Test from './test.vue'

const haha = new Vue({
  el: '#app',
  render: h => h(Test)
})
console.log(haha)