<template>
  <div class="settings-view">
    <header>
      <button class="back-btn" @click="router.back()">← 返回</button>
      <h1>设置</h1>
    </header>

    <div class="settings-container">
      <!-- 显示设置 -->
      <section class="setting-group">
        <h2>显示</h2>
        <div class="setting-item">
          <label>分辨率</label>
          <select v-model="settings.resolution">
            <option>1920x1080</option>
            <option>1600x900</option>
            <option>1280x720</option>
          </select>
        </div>
        <div class="setting-item">
          <label>全屏模式</label>
          <input type="checkbox" v-model="settings.fullscreen" />
        </div>
        <div class="setting-item">
          <label>文字速度</label>
          <input type="range" min="1" max="10" v-model.number="settings.textSpeed" />
          <span>{{ settings.textSpeed }}</span>
        </div>
      </section>

      <!-- 音频设置 -->
      <section class="setting-group">
        <h2>音频</h2>
        <div class="setting-item">
          <label>主音量</label>
          <input type="range" min="0" max="100" v-model.number="settings.masterVolume" />
          <span>{{ settings.masterVolume }}%</span>
        </div>
        <div class="setting-item">
          <label>背景音乐</label>
          <input type="range" min="0" max="100" v-model.number="settings.bgmVolume" />
          <span>{{ settings.bgmVolume }}%</span>
        </div>
        <div class="setting-item">
          <label>音效</label>
          <input type="range" min="0" max="100" v-model.number="settings.sfxVolume" />
          <span>{{ settings.sfxVolume }}%</span>
        </div>
      </section>

      <!-- 游戏设置 -->
      <section class="setting-group">
        <h2>游戏</h2>
        <div class="setting-item">
          <label>自动存档</label>
          <input type="checkbox" v-model="settings.autoSave" />
        </div>
        <div class="setting-item" v-if="settings.autoSave">
          <label>自动存档间隔（分钟）</label>
          <select v-model.number="settings.autoSaveInterval">
            <option :value="3">3</option>
            <option :value="5">5</option>
            <option :value="10">10</option>
          </select>
        </div>
        <div class="setting-item">
          <label>跳过已读文本</label>
          <input type="checkbox" v-model="settings.skipReadText" />
        </div>
        <div class="setting-item" v-if="gameStore.isNewGamePlus">
          <label>显示隐藏提示（二周目）</label>
          <input type="checkbox" v-model="settings.showHiddenHints" />
        </div>
      </section>

      <!-- 辅助功能 -->
      <section class="setting-group">
        <h2>辅助功能</h2>
        <div class="setting-item">
          <label>色盲模式</label>
          <input type="checkbox" v-model="settings.colorBlindMode" />
        </div>
        <div class="setting-item">
          <label>高对比度</label>
          <input type="checkbox" v-model="settings.highContrast" />
        </div>
      </section>
    </div>

    <div class="actions">
      <button class="save-btn" @click="saveSettings">保存设置</button>
      <button class="reset-btn" @click="resetSettings">恢复默认</button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import { useGameStore } from '@/stores/gameStore'

  const router = useRouter()
  const gameStore = useGameStore()

  const settings = reactive({ ...gameStore.settings })

  function saveSettings() {
    gameStore.updateSettings({ ...settings })
    // 保存到本地存储
    localStorage.setItem('game-settings', JSON.stringify(settings))
    alert('设置已保存')
  }

  function resetSettings() {
    Object.assign(settings, {
      resolution: '1920x1080',
      fullscreen: false,
      textSpeed: 5,
      masterVolume: 100,
      bgmVolume: 80,
      sfxVolume: 100,
      voiceVolume: 100,
      autoSave: true,
      autoSaveInterval: 5,
      skipReadText: false,
      showHiddenHints: false,
      colorBlindMode: false,
      highContrast: false
    })
  }
</script>

<style scoped lang="scss">
  .settings-view {
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

  .back-btn:hover {
    color: #fff;
  }

  header h1 {
    font-weight: 300;
    letter-spacing: 4px;
  }

  .settings-container {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  .setting-group {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    padding: 24px;
  }

  .setting-group h2 {
    font-size: 18px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .setting-item:last-child {
    border-bottom: none;
  }

  .setting-item label {
    color: rgba(255, 255, 255, 0.8);
  }

  .setting-item input[type='range'] {
    width: 200px;
  }

  .setting-item select {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: #fff;
  }

  .actions {
    margin-top: 40px;
    display: flex;
    justify-content: center;
    gap: 16px;
  }

  .actions button {
    padding: 16px 40px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-btn {
    background: #e74c3c;
    color: #fff;
  }

  .save-btn:hover {
    background: #c0392b;
  }

  .reset-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.8);
  }

  .reset-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
