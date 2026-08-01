import { createRouter, createMemoryHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/add'
  },
  {
    path: '/add',
    name: 'AddRecord',
    component: () => import('@/views/AddRecord.vue')
  },
  {
    path: '/bills',
    name: 'BillList',
    component: () => import('@/views/BillList.vue')
  },
  {
    path: '/stats',
    name: 'Statistics',
    component: () => import('@/views/Statistics.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue')
  }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})

export default router
