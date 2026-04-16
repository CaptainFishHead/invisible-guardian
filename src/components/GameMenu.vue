<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="game-menu-overlay" @click.self="close">
        <div class="menu-panel">
          <h2>游戏菜单</h2>

          <nav class="menu-nav">
            <button @click="save">💾 快速存档</button>
            <button @click="load">📂 快速读档</button>
            <button @click="showSaveList = true">📋 存档管理</button>
            <button @click="showSettings = true">⚙️ 设置</button>
            <button @click="returnToTitle">🏠 返回标题</button>
            <button @click="close">▶ 继续游戏</button>
          </nav>

          <div class="menu-footer">
            <span>当前章节: {{ gameStore.currentChapter }}</span>
            <span>游戏时间: {{ formatTime(gameStore.gameState.totalPlayTime) }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 存档列表弹窗 -->
    <div v-if="showSaveList" class="sub-modal" @click.self="showSaveList = false">
      <div class="sub-panel">
        <h3>存档列表</h3>
        <div class="save-list">
          <div
            v-for="save in progressStore.saves.slice(0, 10)"
            :key="save.id"
            class="save-item"
            @click="loadSave(save.id)"
          >
            <img v-if="save.screenshot" :src="save.screenshot" class="save-thumb" />
            <div class="save-info">
              <div class="save-name">{{ save.name }}</div>
              <div class="save-meta">{{ save.chapterId }} | {{ formatDate(save.updatedAt) }}</div>
            </div>
          </div>
        </div>
        <button @click="showSaveList = false">关闭</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/gameStore';
import { useProgressStore } from '@/stores/progressStore';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(['update:visible']);

const router = useRouter();
const gameStore = useGameStore();
const progressStore = useProgressStore();

const showSaveList = ref(false);
const showSettings = ref(false);

function close() {
  emit('update:visible', false);
}

async function save() {
  await progressStore.quickSave();
  alert('已保存');
}

async function load() {
  await progressStore.quickLoad();
  close();
}

async function loadSave(saveId: string) {
  await progressStore.loadSave(saveId);
  showSaveList.value = false;
  close();
}

function returnToTitle() {
  if (confirm('返回标题画面？未保存的进度将丢失。')) {
    router.push('/');
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  return hours > 0 ? `${hours}h${mins % 60}m` : `${mins}m`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN');
}
</script>

<style scoped>
.game-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.menu-panel {
  width: 400px;
  background: #1a1a2e;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.1);
}

.menu-panel h2 {
  color: #fff;
  margin-bottom: 32px;
  font-weight: 300;
  letter-spacing: 4px;
}

.menu-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.menu-nav button {
  padding: 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.menu-nav button:hover {
  background: rgba(231, 76, 60, 0.2);
  border-color: rgba(231, 76, 60, 0.5);
}

.menu-footer {
  display: flex;
  justify-content: space-between;
  color: rgba(255,255,255,0.4);
  font-size: 12px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.sub-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2001;
}

.sub-panel {
  width: 600px;
  max-height: 80vh;
  background: #1a1a2e;
  border-radius: 12px;
  padding: 24px;
  overflow-y: auto;
}

.save-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

.save-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.save-item:hover {
  background: rgba(255,255,255,0.1);
}

.save-thumb {
  width: 120px;
  height: 68px;
  object-fit: cover;
  border-radius: 4px;
}

.save-info {
  flex: 1;
}

.save-name {
  color: #fff;
  margin-bottom: 4px;
}

.save-meta {
  color: rgba(255,255,255,0.5);
  font-size: 12px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>