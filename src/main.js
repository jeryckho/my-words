import Vue from 'vue'
import AsyncComputed from 'vue-async-computed'
import App from './App.vue'
import '../node_modules/photonkit/dist/css/photon.css'
import store from './store'

Vue.use(AsyncComputed);
Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
