<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="timeline-overlay" @click.self="close">
        <div class="timeline-panel">
          <header>
            <h2>历史回溯</h2>
            <button @click="close">×</button>
          </header>

          <div class="timeline-content">
            <div class="timeline-scale">
              <div v-for="(group, index) in groupedHistory" :key="index" class="timeline-group">
                <div class="time-marker">{{ group.time }}</div>

                <div class="events">
                  <div
                    v-for="event in group.events"
                    :key="event.id"
                    class="event-node"
                    :class="{
                      current: isCurrent(event.nodeId),
                      choice: event.isChoice,
                      'can-jump': canJumpTo(event)
                    }"
                    @click="jumpTo(event)"
                  >
                    <div class="event-dot" />
                    <div class="event-card">
                      <div class="event-title">{{ event.title }}</div>
                      <div v-if="event.choiceText" class="event-choice">选择: {{ event.choiceText }}</div>
                      <div class="event-attrs" v-if="event.snapshot">
                        <span
                          v-for="(val, key) in event.snapshot"
                          :key="key"
                          :class="{ changed: val !== getPrevValue(event, key) }"
                        >
                          {{ key }}: {{ val }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer>
            <p>点击节点可回溯到该位置（将丢失后续进度）</p>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useGameStore } from '@/stores/gameStore'

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits(['update:modelValue', 'jump'])

  const gameStore = useGameStore()

  // 按时间分组的历史记录
  const groupedHistory = computed(() => {
    const groups: { time: string; events: any[] }[] = []
    let currentGroup: (typeof groups)[0] | null = null

    gameStore.history.forEach((entry, index) => {
      const date = new Date(entry.timestamp)
      const timeStr = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`

      if (!currentGroup || currentGroup.time !== timeStr) {
        currentGroup = { time: timeStr, events: [] }
        groups.push(currentGroup)
      }

      currentGroup.events.push({
        id: `${entry.nodeId}_${index}`,
        nodeId: entry.nodeId,
        title: getNodeTitle(entry.nodeId),
        isChoice: !!entry.choiceId,
        choiceText: entry.choiceId,
        snapshot: entry.attributesSnapshot,
        index
      })
    })

    return groups
  })

  function getNodeTitle(nodeId: string): string {
    // 简化显示，实际应从章节数据获取
    return `场景 ${nodeId}`
  }

  function isCurrent(nodeId: string): boolean {
    return gameStore.gameState.currentNode === nodeId
  }

  function canJumpTo(event: any): boolean {
    // 不能跳转到当前节点之后
    const currentIndex = gameStore.history.findIndex(h => h.nodeId === gameStore.gameState.currentNode)
    return event.index < currentIndex
  }

  function getPrevValue(event: any, key: string): number {
    const prevEvent = gameStore.history[event.index - 1]
    return prevEvent?.attributesSnapshot?.[key] || 50
  }

  function jumpTo(event: any) {
    if (!canJumpTo(event)) return
    emit('jump', event.index)
    close()
  }

  function close() {
    emit('update:modelValue', false)
  }
</script>

<style scoped>
  .timeline-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .timeline-panel {
    width: 800px;
    max-width: 90vw;
    height: 80vh;
    background: #1a1a2e;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  header h2 {
    color: #fff;
    font-weight: 400;
    letter-spacing: 2px;
  }

  header button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 24px;
    cursor: pointer;
  }

  .timeline-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .timeline-scale {
    position: relative;
    padding-left: 60px;
  }

  .timeline-scale::before {
    content: '';
    position: absolute;
    left: 30px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(
      to bottom,
      transparent,
      rgba(255, 255, 255, 0.2) 10%,
      rgba(255, 255, 255, 0.2) 90%,
      transparent
    );
  }

  .timeline-group {
    position: relative;
    margin-bottom: 24px;
  }

  .time-marker {
    position: absolute;
    left: -60px;
    top: 0;
    width: 50px;
    text-align: right;
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
    font-family: monospace;
  }

  .events {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .event-node {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 12px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .event-node.can-jump {
    cursor: pointer;
  }

  .event-node.can-jump:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .event-node.current {
    background: rgba(52, 152, 219, 0.2);
  }

  .event-dot {
    position: absolute;
    left: -39px;
    top: 16px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    border: 2px solid #1a1a2e;
  }

  .event-node.choice .event-dot {
    background: #f39c12;
    box-shadow: 0 0 10px rgba(243, 156, 18, 0.5);
  }

  .event-node.current .event-dot {
    background: #3498db;
    box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
  }

  .event-card {
    flex: 1;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    border-left: 3px solid transparent;
  }

  .event-node.choice .event-card {
    border-left-color: #f39c12;
  }

  .event-title {
    color: #fff;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .event-choice {
    color: #f39c12;
    font-size: 13px;
    font-style: italic;
    margin-bottom: 8px;
  }

  .event-attrs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }

  .event-attrs span {
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .event-attrs span.changed {
    color: #e74c3c;
    background: rgba(231, 76, 60, 0.2);
  }

  footer {
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
  }

  footer p {
    color: rgba(255, 255, 255, 0.4);
    font-size: 13px;
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
