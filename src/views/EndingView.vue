<template>
  <div class="ending-view" :class="endingType">
    <div class="ending-content">
      <h1 class="ending-title">{{ endingTitle }}</h1>
      <p class="ending-subtitle">{{ endingSubtitle }}</p>

      <div class="ending-stats" v-if="showStats">
        <div class="stat">
          <span class="stat-value">{{ stats.deathCount }}</span>
          <span class="stat-label">死亡次数</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ stats.playTime }}</span>
          <span class="stat-label">游戏时间</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ stats.completion }}%</span>
          <span class="stat-label">完成度</span>
        </div>
      </div>

      <div class="ending-actions">
        <button @click="continueGame" v-if="canContinue">继续游戏</button>
        <button @click="returnToMenu">返回主菜单</button>
        <button @click="viewFlowchart">查看流程图</button>
      </div>
    </div>

    <div class="ending-bg" :style="{ backgroundImage: `url(${endingCG})` }" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/gameStore';

const router = useRouter();
const gameStore = useGameStore();

const endingType = ref<'good' | 'bad' | 'hidden' | 'true'>('good');
const endingTitle = ref('新的起点');
const endingSubtitle = ref('这只是开始，更大的挑战还在前方...');
const endingCG = ref('/images/cg/ch1_clear.jpg');
const showStats = ref(true);

const canContinue = computed(() => endingType.value !== 'bad');

const stats = computed(() => {
  const s = gameStore.getStats();
  return {
    deathCount: s.deathCount,
    playTime: formatTime(s.totalPlayTime),
    completion: s.completionRate
  };
});

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  return hours > 0 ? `${hours}小时` : `${Math.floor(seconds / 60)}分钟`;
}

function continueGame() {
  router.push('/chapters');
}

function returnToMenu() {
  router.push('/');
}

function viewFlowchart() {
  // 打开流程图
}
</script>

<style scoped>
.ending-view {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-align: center;
}

.ending-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(5px) brightness(0.4);
  z-index: 0;
}

.ending-content {
  position: relative;
  z-index: 1;
  max-width: 600px;
  padding: 40px;
}

.ending-title {
  font-size: 48px;
  font-weight: 300;
  letter-spacing: 8px;
  margin-bottom: 16px;
  text-shadow: 0 4px 20px rgba(0,0,0,0.5);
}

.ending-view.good .ending-title { color: #27ae60; }
.ending-view.bad .ending-title { color: #e74c3c; }
.ending-view.hidden .ending-title { color: #9b59b6; }
.ending-view.true .ending-title { color: #f1c40f; }

.ending-subtitle {
  font-size: 18px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 40px;
  line-height: 1.6;
}

.ending-stats {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-bottom: 40px;
  padding: 30px;
  background: rgba(0,0,0,0.5);
  border-radius: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-value {
  font-size: 36px;
  font-weight: 300;
  color: #fff;
}

.stat-label {
  font-size: 14px;
  color: rgba(255,255,255,0.6);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.ending-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.ending-actions button {
  min-width: 200px;
  padding: 16px 32px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.ending-actions button:hover {
  background: rgba(255,255,255,0.1);
  border-color: #fff;
  transform: translateY(-2px);
}

.ending-actions button:first-child {
  background: rgba(231, 76, 60, 0.2);
  border-color: #e74c3c;
}

.ending-actions button:first-child:hover {
  background: rgba(231, 76, 60, 0.4);
}
</style>