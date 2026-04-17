<template>
  <div class="gallery-view">
    <header>
      <button class="back-btn" @click="router.back()">← 返回</button>
      <h1>鉴赏模式</h1>
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </div>
    </header>

    <!-- CG画廊 -->
    <div v-if="currentTab === 'cg'" class="gallery-grid">
      <div
        v-for="cg in cgList"
        :key="cg.id"
        class="gallery-item"
        :class="{ locked: !cg.unlocked }"
        @click="cg.unlocked && viewCG(cg)"
      >
        <img :src="cg.unlocked ? cg.image : '/images/locked.png'" />
        <div class="item-info">
          <span class="item-title">{{ cg.unlocked ? cg.title : '???' }}</span>
          <span v-if="cg.unlocked" class="item-desc">{{ cg.description }}</span>
        </div>
      </div>
    </div>

    <!-- 音乐鉴赏 -->
    <div v-if="currentTab === 'music'" class="music-list">
      <div v-for="track in musicList" :key="track.id" class="music-item" @click="playMusic(track)">
        <span class="track-number">{{ track.number }}</span>
        <div class="track-info">
          <span class="track-title">{{ track.title }}</span>
          <span class="track-duration">{{ track.duration }}</span>
        </div>
        <button class="play-btn">{{ currentTrack === track.id ? '⏸' : '▶' }}</button>
      </div>
    </div>

    <!-- 结局回顾 -->
    <div v-if="currentTab === 'endings'" class="endings-list">
      <div
        v-for="ending in endingsList"
        :key="ending.id"
        class="ending-card"
        :class="[ending.type, { locked: !ending.unlocked }]"
      >
        <div class="ending-header">
          <span class="ending-type">{{ getEndingTypeLabel(ending.type) }}</span>
          <span v-if="ending.unlocked" class="ending-date">{{ ending.unlockedAt }}</span>
        </div>
        <h3>{{ ending.unlocked ? ending.title : '???' }}</h3>
        <p v-if="ending.unlocked">{{ ending.description }}</p>
        <p v-else class="hint">提示: {{ ending.unlockHint }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useGameStore } from '@/stores/gameStore'

  const router = useRouter()
  const gameStore = useGameStore()

  const currentTab = ref('cg')
  const currentTrack = ref<string | null>(null)

  const tabs = [
    { id: 'cg', name: 'CG画廊' },
    { id: 'music', name: '音乐鉴赏' },
    { id: 'endings', name: '结局回顾' }
  ]

  // CG数据（实际应从配置加载）
  const cgList = computed(() => [
    { id: 'cg_01', title: '重逢', description: '街角的偶遇', image: '/images/cg/cg_01.jpg', unlocked: true },
    {
      id: 'cg_02',
      title: '秘密会谈',
      description: '地下党的会面',
      image: '/images/cg/cg_02.jpg',
      unlocked: gameStore.hasFlag('ch1_truth_to_fangmin')
    },
    {
      id: 'cg_03',
      title: '牺牲',
      description: '为了信仰',
      image: '/images/cg/cg_03.jpg',
      unlocked: gameStore.deathCount > 0
    }
    // 更多CG...
  ])

  const musicList = [
    { id: 'bgm_01', number: '01', title: '主题歌 - 隐形守护者', duration: '4:32' },
    { id: 'bgm_02', number: '02', title: '暗流涌动', duration: '3:15' },
    { id: 'bgm_03', number: '03', title: '危机四伏', duration: '2:48' }
  ]

  const endingsList = computed(() => {
    // 从成就系统加载结局数据
    return [
      {
        id: 'end_01',
        type: 'bad',
        title: '出师未捷',
        description: '第一次任务就失败了',
        unlocked: gameStore.deathCount > 0,
        unlockedAt: '2024-01-01',
        unlockHint: '在第一章中死亡'
      },
      {
        id: 'end_02',
        type: 'good',
        title: '新的起点',
        description: '成功完成第一章',
        unlocked: gameStore.hasFlag('ch1_complete'),
        unlockedAt: '2024-01-02',
        unlockHint: '完成第一章'
      }
    ]
  })

  function getEndingTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      good: '好结局',
      bad: '坏结局',
      hidden: '隐藏结局',
      true: '真结局'
    }
    return labels[type] || type
  }

  function viewCG(cg: any) {
    // 全屏查看CG
  }

  function playMusic(track: any) {
    currentTrack.value = currentTrack.value === track.id ? null : track.id
  }
</script>

<style scoped lang="scss">
  .gallery-view {
    min-height: 100vh;
    background: #0a0a0f;
    color: #fff;
    padding: 40px 60px;
  }

  header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .back-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 16px;
    cursor: pointer;
  }

  .tabs {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }

  .tabs button {
    padding: 8px 20px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.2s;
  }

  .tabs button.active,
  .tabs button:hover {
    background: rgba(231, 76, 60, 0.2);
    border-color: #e74c3c;
    color: #fff;
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }

  .gallery-item {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.3s;
    aspect-ratio: 16/9;
    background: #1a1a2e;
  }

  .gallery-item:hover:not(.locked) {
    transform: scale(1.02);
  }

  .gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .gallery-item.locked img {
    filter: blur(10px) grayscale(100%);
  }

  .item-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  }

  .item-title {
    display: block;
    font-size: 16px;
    margin-bottom: 4px;
  }

  .item-desc {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }

  .music-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .music-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .music-item:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .track-number {
    width: 40px;
    color: rgba(255, 255, 255, 0.4);
    font-size: 14px;
  }

  .track-info {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .track-title {
    font-size: 16px;
  }

  .track-duration {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
  }

  .play-btn {
    width: 40px;
    height: 40px;
    background: rgba(231, 76, 60, 0.2);
    border: none;
    border-radius: 50%;
    color: #e74c3c;
    cursor: pointer;
  }

  .endings-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .ending-card {
    padding: 24px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    border-left: 4px solid;
  }

  .ending-card.good {
    border-color: #27ae60;
  }
  .ending-card.bad {
    border-color: #e74c3c;
  }
  .ending-card.hidden {
    border-color: #9b59b6;
  }
  .ending-card.true {
    border-color: #f1c40f;
  }
  .ending-card.locked {
    opacity: 0.5;
    border-color: rgba(255, 255, 255, 0.2);
  }

  .ending-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .ending-type {
    color: rgba(255, 255, 255, 0.5);
  }

  .ending-date {
    color: rgba(255, 255, 255, 0.4);
  }

  .ending-card h3 {
    margin-bottom: 8px;
    font-size: 20px;
  }

  .ending-card p {
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.5;
  }

  .hint {
    color: #f39c12;
    font-style: italic;
  }
</style>
