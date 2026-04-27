<template>
  <div class="main-menu">
    <!-- 背景视频/图片 -->
    <div class="menu-background">
      <video autoplay muted loop playsinline>
        <source src="../assets/videos/menu_bg.mp4" type="video/mp4" />
      </video>
      <div class="bg-overlay" />
    </div>

    <!-- 标题 -->
    <div class="title-section">
      <div class="game-title">空降管理者</div>
      <div class="game-title">90天存活模拟器</div>
      <p class="subtitle">PARACHUTE EXECUTIVE SURVIVAL SIMULATOR</p>
    </div>

    <!-- 菜单按钮 -->
    <nav class="menu-nav">
      <button
        v-for="item in menuItems"
        :key="item.id"
        class="menu-btn"
        :class="{ highlight: item.highlight, disabled: item.disabled }"
        :disabled="item.disabled"
        @click="item.action"
        @mouseenter="playHoverSound"
      >
        <span class="btn-text">{{ item.label }}</span>
        <span class="btn-line" />
      </button>
    </nav>

    <!-- 版本信息 -->
    <footer class="menu-footer">
      <span>Version 1.0.0</span>
      <span>|</span>
      <span>© 2026 汇贤学堂</span>
    </footer>

    <!-- 确认弹窗 -->
    <Teleport to="body">
      <div v-if="showConfirm" class="confirm-dialog">
        <div class="dialog-content">
          <p>开始新游戏将覆盖当前进度，是否继续？</p>
          <div class="dialog-buttons">
            <button @click="startNewGame">确定</button>
            <button @click="showConfirm = false">取消</button>
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
  import { useProgressStore } from '@/stores/progressStore'

  const router = useRouter()
  const gameStore = useGameStore()
  const progressStore = useProgressStore()

  const showConfirm = ref(false)
  const hasSave = computed(() => progressStore.saves.length > 0)

  const menuItems = computed(() => [
    {
      id: 'continue',
      label: '继续游戏',
      highlight: true,
      disabled: !hasSave.value,
      action: continueGame
    },
    {
      id: 'new',
      label: '开始游戏',
      highlight: !hasSave.value,
      action: confirmNewGame
    },
    {
      id: 'chapter',
      label: '章节选择',
      disabled: !gameStore.gameState.unlockedChapters.length,
      action: () => router.push('/chapters')
    },
    {
      id: 'settings',
      label: '设置',
      action: () => router.push('/settings')
    },
    // {
    //   id: 'gallery',
    //   label: '鉴赏模式',
    //   disabled: gameStore.gameState.unlockedCGs.length === 0,
    //   action: () => router.push('/gallery')
    // },
    {
      id: 'credits',
      label: '制作人员',
      action: () => router.push('/credits')
    }
  ])

  function playHoverSound() {
    // 播放悬停音效
    // audioManager.playSFX('hover');
  }

  function continueGame() {
    const latest = progressStore.saves[0]
    if (latest) {
      progressStore.loadSave(latest.id).then(() => {
        router.push('/game')
      })
    }
  }

  function confirmNewGame() {
    if (hasSave.value) {
      showConfirm.value = true
    } else {
      startNewGame()
    }
  }

  function startNewGame() {
    showConfirm.value = false
    gameStore.startNewGame()
    router.push('/chapters')
  }

  onMounted(() => {
    progressStore.loadSaveList()
  })
</script>

<style scoped lang="scss">
  .main-menu {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fff;
    overflow: hidden;
  }

  .menu-background {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .menu-background video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .bg-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.8) 100%);
  }

  .title-section {
    position: relative;
    z-index: 1;
    text-align: center;
    margin-bottom: 60px;

    .game-title {
      font-size: 72px;
      font-weight: 900;
      text-align: center;
      margin-bottom: 1rem;
      letter-spacing: 0.15em;
      background: linear-gradient(135deg, #e5e5e5 0%, #d4a574 50%, #8b0000 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: titlePulse 3s ease-in-out infinite;
    }
    .subtitle {
      font-size: 16px;
      letter-spacing: 8px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 16px;
      text-transform: uppercase;
    }
  }

  .menu-nav {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 280px;
  }

  .menu-btn {
    position: relative;
    padding: 16px 32px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    font-size: 18px;
    letter-spacing: 4px;
    cursor: pointer;
    transition: all 0.3s;
    text-align: left;
  }

  .menu-btn:hover:not(:disabled) {
    color: #fff;
    transform: translateX(10px);
  }

  .menu-btn.highlight {
    color: #e74c3c;
  }

  .menu-btn.highlight:hover {
    text-shadow: 0 0 20px rgba(231, 76, 60, 0.5);
  }

  .menu-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .btn-line {
    position: absolute;
    bottom: 12px;
    left: 32px;
    width: 0;
    height: 1px;
    background: #e74c3c;
    transition: width 0.3s;
  }

  .menu-btn:hover:not(:disabled) .btn-line {
    width: 40px;
  }

  .menu-footer {
    position: absolute;
    bottom: 40px;
    z-index: 1;
    display: flex;
    gap: 16px;
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
    letter-spacing: 2px;
  }

  .confirm-dialog {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .dialog-content {
    background: #1a1a2e;
    padding: 40px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .dialog-content p {
    color: #fff;
    font-size: 16px;
    margin-bottom: 24px;
  }

  .dialog-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
  }

  .dialog-buttons button {
    padding: 12px 32px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
  }

  .dialog-buttons button:first-child {
    background: #e74c3c;
    border-color: #e74c3c;
  }

  .dialog-buttons button:hover {
    transform: scale(1.05);
  }
</style>
