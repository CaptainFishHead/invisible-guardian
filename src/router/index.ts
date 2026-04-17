import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'







const routes =
  [
    {
      path: '/',
      name: 'MainMenu',
      component: () => import('@/views/MainMenu.vue')
    },
    {
      path: '/chapters',
      name: 'ChapterSelect',
      component: () => import('@/views/ChapterSelect.vue')
    },
    {
      path: '/game',
      name: 'Game',
      component: () => import('@/views/GameView.vue')
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/SettingsView.vue')
    },
    {
      path: '/gallery',
      name: 'Gallery',
      component: () => import('@/views/GalleryView.vue')
    },
    {
      path: '/credits',
      name: 'Credits',
      component: () => import('@/views/CreditsView.vue')
    },
    {
      path: '/flowchart',
      name: 'Flowchart',
      component: () => import('@/views/FlowchartView.vue')
    },
    {
      path: '/ending',
      name: 'Ending',
      component: () => import('@/views/EndingView.vue')
    }
  ]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router