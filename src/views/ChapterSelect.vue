<template>
  <div class="chapter-select">
    <header class="page-header">
      <button class="back-btn" @click="router.back()">← 返回</button>
      <h1>章节选择</h1>
      <div class="completion-rate">完成度 {{ completionRate }}%</div>
    </header>

    <div class="chapters-container">
      <div
        v-for="chapter in chapters"
        :key="chapter.id"
        class="chapter-card"
        :class="{
          locked: !isUnlocked(chapter.id),
          completed: isCompleted(chapter.id),
          current: isCurrent(chapter.id)
        }"
        @click="selectChapter(chapter)"
      >
        <div class="chapter-image">
          <img :src="chapter.cover" :alt="chapter.title" />
          <div v-if="!isUnlocked(chapter.id)" class="lock-overlay">
            <span class="lock-icon">🔒</span>
          </div>
          <div v-if="isCompleted(chapter.id)" class="complete-badge">✓</div>
        </div>

        <div class="chapter-info">
          <span class="chapter-number">第 {{ chapter.number }} 章</span>
          <h3 class="chapter-title">{{ chapter.title }}</h3>
          <p class="chapter-desc">{{ chapter.description }}</p>

          <div class="chapter-stats" v-if="isUnlocked(chapter.id)">
            <span>进度 {{ getProgress(chapter.id) }}%</span>
            <span>{{ getEndingCount(chapter.id) }}/{{ chapter.totalEndings }} 结局</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 章节详情弹窗 -->
    <Teleport to="body">
      <div v-if="selectedChapter" class="chapter-modal" @click.self="selectedChapter = null">
        <div class="modal-content">
          <img :src="selectedChapter.cover" class="modal-image" />
          <div class="modal-info">
            <h2>{{ selectedChapter.title }}</h2>
            <p>{{ selectedChapter.description }}</p>

            <div class="endings-preview">
              <h4>本章结局</h4>
              <div class="ending-list">
                <div
                  v-for="ending in selectedChapter.endings"
                  :key="ending.id"
                  class="ending-item"
                  :class="{ unlocked: isEndingUnlocked(ending.id) }"
                >
                  <span v-if="!isEndingUnlocked(ending.id)" class="ending-lock">?</span>
                  <span v-else class="ending-title">{{ ending.title }}</span>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button
                v-if="canContinue(selectedChapter.id)"
                class="btn-continue"
                @click="continueChapter(selectedChapter)"
              >
                继续游戏
              </button>
              <button class="btn-start" @click="startChapter(selectedChapter)">
                {{ isCompleted(selectedChapter.id) ? '重新开始' : '开始章节' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useGameStore } from '@/stores/gameStore'
  import { chapter1 } from '@/data/chapters/chapter1'
  import { chapter2 } from '@/data/chapters/chapter2'

  const router = useRouter()
  const gameStore = useGameStore()

  // 章节数据（实际应从API或文件加载）
  const chapters = ref([
    {
      number: 1,
      ...chapter1,
      totalEndings: chapter1.endings.length
    },
    {
      number: 2,
      ...chapter2,
      totalEndings: chapter2.endings.length
    }

    // 更多章节...
  ])

  const selectedChapter = ref<any>(null)

  const completionRate = computed(() => {
    const stats = gameStore.getStats()
    return stats.completionRate
  })

  function isUnlocked(chapterId: string): boolean {
    return gameStore.gameState.unlockedChapters.includes(chapterId)
  }

  function isCompleted(chapterId: string): boolean {
    // 检查是否完成了该章节的所有主要结局
    return false // 简化处理
  }

  function isCurrent(chapterId: string): boolean {
    return gameStore.currentChapter === chapterId
  }

  function getProgress(chapterId: string): number {
    // 返回章节探索进度
    return 0
  }

  function getEndingCount(chapterId: string): number {
    // 返回已解锁结局数
    return 0
  }

  function isEndingUnlocked(endingId: string): boolean {
    return gameStore.gameState.unlockedEndings.includes(endingId)
  }

  function canContinue(chapterId: string): boolean {
    return gameStore.currentChapter === chapterId && gameStore.gameState.currentNode !== ''
  }

  function selectChapter(chapter: any) {
    if (!isUnlocked(chapter.id)) return
    selectedChapter.value = chapter
  }

  function startChapter(chapter: any) {
    gameStore.startChapter(chapter.id, chapter.startNodeId)
    router.push('/game')
  }

  function continueChapter(chapter: any) {
    router.push('/game')
  }

  onMounted(() => {
    // 加载章节数据
  })
</script>

<style scoped lang="scss">
  .chapter-select {
    min-height: 100vh;
    background: #0a0a0f;
    color: #fff;
    padding: 40px 60px;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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
    transition: color 0.2s;
  }

  .back-btn:hover {
    color: #fff;
  }

  .page-header h1 {
    font-weight: 300;
    letter-spacing: 4px;
  }

  .completion-rate {
    padding: 8px 16px;
    background: rgba(231, 76, 60, 0.2);
    border-radius: 20px;
    color: #e74c3c;
    font-size: 14px;
  }

  .chapters-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 30px;
  }

  .chapter-card {
    background: #1a1a2e;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;
  }

  .chapter-card:hover:not(.locked) {
    transform: translateY(-5px);
    border-color: rgba(231, 76, 60, 0.5);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }

  .chapter-card.locked {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .chapter-card.current {
    border-color: #3498db;
  }

  .chapter-image {
    position: relative;
    height: 180px;
    overflow: hidden;
  }

  .chapter-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }

  .chapter-card:hover:not(.locked) .chapter-image img {
    transform: scale(1.05);
  }

  .lock-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
  }

  .lock-icon {
    font-size: 48px;
    opacity: 0.5;
  }

  .complete-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    background: #27ae60;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .chapter-info {
    padding: 20px;
  }

  .chapter-number {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .chapter-title {
    margin: 8px 0;
    font-size: 20px;
    font-weight: 500;
  }

  .chapter-desc {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .chapter-stats {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
  }

  .chapter-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 40px;
  }

  .modal-content {
    display: flex;
    max-width: 900px;
    width: 100%;
    background: #1a1a2e;
    border-radius: 12px;
    overflow: hidden;
  }

  .modal-image {
    width: 50%;
    object-fit: cover;
  }

  .modal-info {
    flex: 1;
    padding: 40px;
  }

  .modal-info h2 {
    margin-bottom: 16px;
    font-size: 28px;
  }

  .modal-info > p {
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .endings-preview h4 {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 12px;
  }

  .ending-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }

  .ending-item {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    font-size: 14px;
  }

  .ending-item:not(.unlocked) {
    color: rgba(255, 255, 255, 0.3);
  }

  .ending-lock {
    font-size: 18px;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
  }

  .modal-actions button {
    flex: 1;
    padding: 16px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-continue {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
  }

  .btn-start {
    background: #e74c3c;
    color: #fff;
  }

  .modal-actions button:hover {
    transform: scale(1.02);
  }
</style>
