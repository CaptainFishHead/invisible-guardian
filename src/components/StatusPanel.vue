<template>
  <Teleport to="body">
    <Transition name="slide">
      <div v-if="modelValue" class="status-panel-overlay" @click.self="close">
        <div class="status-panel">
          <header class="panel-header">
            <h2>角色状态</h2>
            <button class="close-btn" @click="close">×</button>
          </header>

          <div class="panel-content">
            <!-- 属性列表 -->
            <section class="attributes-section">
              <h3>核心属性</h3>
              <div class="attribute-list">
                <div
                  v-for="(value, key) in displayAttributes"
                  :key="key"
                  class="attribute-item"
                  :class="{ 'critical': isCritical(key as string, value) }"
                >
                  <span class="attr-name">{{ key }}</span>
                  <div class="attr-bar">
                    <div
                      class="attr-fill"
                      :style="{
                        width: `${value}%`,
                        background: getAttributeColor(key as string, value)
                      }"
                    />
                  </div>
                  <span class="attr-value">{{ value }}</span>
                </div>
              </div>
            </section>

            <!-- 收集品 -->
            <section class="items-section" v-if="gameStore.items.length > 0">
              <h3>收集品</h3>
              <div class="item-list">
                <span v-for="item in gameStore.items" :key="item" class="item-tag">
                  {{ item }}
                </span>
              </div>
            </section>

            <!-- 剧情标记 -->
            <section class="flags-section" v-if="showFlags">
              <h3>关键事件</h3>
              <div class="flag-list">
                <span v-for="flag in importantFlags" :key="flag" class="flag-tag">
                  ✓ {{ flag }}
                </span>
              </div>
            </section>

            <!-- 统计 -->
            <section class="stats-section">
              <h3>本章统计</h3>
              <div class="stat-grid">
                <div class="stat-item">
                  <span class="stat-value">{{ gameStore.history.length }}</span>
                  <span class="stat-label">已进行</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ formatTime(playTime) }}</span>
                  <span class="stat-label">游戏时间</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ gameStore.deathCount }}</span>
                  <span class="stat-label">死亡次数</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';

const props = defineProps<{
  modelValue: boolean;
  showFlags?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const gameStore = useGameStore();

// 显示的属性（排除隐藏属性）
const displayAttributes = computed(() => {
  const attrs = gameStore.attributes;
  return {
    '肖途好感': attrs.肖途好感,
    '庄晓曼好感': attrs.庄晓曼好感,
    '方敏好感': attrs.方敏好感,
    '情报值': attrs.情报值,
    '警觉度': attrs.警觉度,
    '生命值': attrs.生命值
  };
});

// 关键标记（过滤掉系统标记）
const importantFlags = computed(() => {
  return Array.from(gameStore.flags).filter(f => !f.startsWith('sys.'));
});

// 游戏时间
const playTime = computed(() => {
  return gameStore.gameState.totalPlayTime;
});

// 是否临界值
function isCritical(key: string, value: number): boolean {
  if (key === '生命值') return value <= 30;
  if (key === '警觉度') return value >= 70;
  return false;
}

// 属性颜色
function getAttributeColor(key: string, value: number): string {
  const colors: Record<string, [string, string, string]> = {
    '生命值': ['#e74c3c', '#f39c12', '#27ae60'],
    '警觉度': ['#27ae60', '#f39c12', '#e74c3c'],
    'default': ['#e74c3c', '#3498db', '#27ae60']
  };

  const palette = colors[key] || colors['default'];
  if (value <= 30) return palette[0];
  if (value <= 70) return palette[1];
  return palette[2];
}

// 格式化时间
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h${mins}m`;
  return `${mins}m`;
}

function close() {
  emit('update:modelValue', false);
}
</script>

<style scoped lang="scss">
.status-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  z-index: 900;
}

.status-panel {
  width: 400px;
  height: 100%;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-left: 1px solid rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 30px rgba(0,0,0,0.5);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.panel-header h2 {
  color: #fff;
  font-size: 20px;
  font-weight: 400;
  letter-spacing: 2px;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.6);
  font-size: 28px;
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1;
}

.close-btn:hover {
  color: #fff;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.panel-content section {
  margin-bottom: 28px;
}

.panel-content h3 {
  color: rgba(255,255,255,0.5);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 16px;
}

.attribute-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.attribute-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.attr-name {
  width: 80px;
  color: rgba(255,255,255,0.8);
  font-size: 14px;
}

.attr-bar {
  flex: 1;
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  overflow: hidden;
}

.attr-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease, background 0.3s ease;
}

.attr-value {
  width: 40px;
  text-align: right;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.attribute-item.critical .attr-value {
  color: #e74c3c;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.item-list, .flag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.item-tag, .flag-tag {
  padding: 6px 12px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  color: rgba(255,255,255,0.9);
  font-size: 13px;
}

.flag-tag {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
}

.stat-value {
  display: block;
  color: #fff;
  font-size: 24px;
  font-weight: 300;
  margin-bottom: 4px;
}

.stat-label {
  color: rgba(255,255,255,0.5);
  font-size: 12px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}

.slide-enter-from .status-panel,
.slide-leave-to .status-panel {
  transform: translateX(100%);
}
</style>