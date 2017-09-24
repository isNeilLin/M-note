import Vue from 'vue'
import axios from 'axios'
import electron from 'electron'
import nedb from 'nedb'
import App from './App'
import router from './router'
import store from './store'

const remote = electron.remote;
const app = remote.app;
const path = require('path');
const folder = new nedb({
  filename: path.join(app.getPath('appData'),'folder.db'),
  autoload: true
})
const files = new nedb({
  filename: path.join(app.getPath('appData'),'file.db'),
  autoload: true
})

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.prototype.$folder = folder
Vue.prototype.$file = files
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
