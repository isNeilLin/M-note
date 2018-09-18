import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: require('@/components/LandingPage')
    },
    {
      path: '/oauth_callback',
      name: 'oauth_callback',
      component: require('@/components/oauth_callback').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
