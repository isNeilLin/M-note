import Vue from 'vue'
import axios from 'axios'
import electron from 'electron'
import nedb from 'nedb'
import App from './App'
import router from './router'
import store from './store'
import Win from 'electron-vue-windows'
Win.init()

const remote = electron.remote;
const app = remote.app;
const path = require('path');
const db = new nedb({
  filename: path.join(app.getPath('appData'),'folder.db'),
  autoload: true
})

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.prototype.$Win = Win
Vue.prototype.$db = db
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
