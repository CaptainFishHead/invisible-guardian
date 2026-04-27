import { createRouter, createWebHistory } from 'vue-router'
import MainMenu from '@/views/MainMenu.vue'
import ChapterSelect from '@/views/ChapterSelect.vue'
import GameView from '@/views/GameView.vue'
import SettingsView from '@/views/SettingsView.vue'
import GalleryView from '@/views/GalleryView.vue'
import CreditsView from '@/views/CreditsView.vue'
import FlowchartView from '@/views/FlowchartView.vue'
import EndingView from '@/views/EndingView.vue'


const routes =
  [
    {
      path: '/',
      name: 'MainMenu',
      component: MainMenu
    },
    {
      path: '/chapters',
      name: 'ChapterSelect',
      component: ChapterSelect
    },
    {
      path: '/game',
      name: 'Game',
      component: GameView
    },
    {
      path: '/settings',
      name: 'Settings',
      component: SettingsView
    },
    {
      path: '/gallery',
      name: 'Gallery',
      component: GalleryView
    },
    {
      path: '/credits',
      name: 'Credits',
      component: CreditsView
    },
    {
      path: '/flowchart',
      name: 'Flowchart',
      component: FlowchartView
    },
    {
      path: '/ending',
      name: 'Ending',
      component: EndingView
    }
  ]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router