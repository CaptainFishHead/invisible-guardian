<template>
  <div class="flowchart-view">
    <!-- 头部 -->
    <header class="flowchart-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span>←</span>
          <span>返回</span>
        </button>
        <h1>{{ chapterTitle }}</h1>
      </div>
      <div class="header-right">
        <div class="progress-bar">
          <span>探索度 {{ explorationRate }}%</span>
          <div class="bar"><div class="fill" :style="{ width: explorationRate + '%' }" /></div>
        </div>
      </div>
    </header>

    <!-- 画布 -->
    <div
      class="flowchart-canvas"
      ref="canvasRef"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
      @wheel.prevent="onWheel"
    >
      <div class="canvas-content" :style="canvasStyle">
        <!-- SVG 连线 -->
        <svg class="connections-layer" :width="canvasWidth" :height="canvasHeight">
          <defs>
            <marker id="arrow-default" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <polygon points="0 0, 8 4, 0 8" fill="#4a5568" />
            </marker>
            <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <polygon points="0 0, 8 4, 0 8" fill="#e53e3e" />
            </marker>
            <marker id="arrow-current" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <polygon points="0 0, 10 5, 0 10" fill="#38a169" />
            </marker>
          </defs>

          <path
            v-for="(conn, idx) in connections"
            :key="idx"
            :d="conn.path"
            :class="['connection', conn.type]"
            :marker-end="`url(#arrow-${conn.type})`"
            fill="none"
          />
        </svg>

        <!-- 节点 -->
        <div
          v-for="node in nodes"
          :key="node.id"
          class="node"
          :class="[
            node.type,
            {
              unlocked: isUnlocked(node.id),
              current: isCurrentPath(node.id),
              locked: !isUnlocked(node.id)
            }
          ]"
          :style="{ left: node.x + 'px', top: node.y + 'px' }"
          @click="onNodeClick(node)"
        >
          <div class="node-card">
            <img v-if="node.image" :src="node.image" />
            <div class="node-info">
              <div class="tags" v-if="node.tags">
                <span v-for="tag in node.tags" :key="tag.text" :class="tag.type">{{ tag.text }}</span>
              </div>
              <h4>{{ node.title }}</h4>
              <p v-if="node.subtitle">{{ node.subtitle }}</p>
            </div>
          </div>
          <span class="status">{{ isUnlocked(node.id) ? '✓' : '🔒' }}</span>
        </div>
      </div>
    </div>

    <!-- 底部 -->
    <footer class="flowchart-footer">
      <div class="legend">
        <span>
          <i class="dot scene"></i>
          剧情
        </span>
        <span>
          <i class="dot choice"></i>
          选择
        </span>
        <span>
          <i class="dot ending"></i>
          结局
        </span>
      </div>
      <div class="controls">
        <button @click="resetView">⟲</button>
        <button @click="zoomOut">−</button>
        <span>{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomIn">+</button>
      </div>
      <button class="continue-btn" @click="continueGame">继续游戏</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useGameStore } from '@/stores/gameStore'
  import { useProgressStore } from '@/stores/progressStore'
  import type { FlowchartNode, NodeConnection } from '@/core/types/story'

  const router = useRouter()
  const route = useRoute()
  const gameStore = useGameStore()
  const progressStore = useProgressStore()

  // 画布
  const canvasRef = ref<HTMLElement>()
  const canvasWidth = 2000
  const canvasHeight = 1200
  const scale = ref(0.8)
  const translateX = ref(0)
  const translateY = ref(0)
  const isDragging = ref(false)
  const dragStart = ref({ x: 0, y: 0 })

  // 路由参数
  const chapterId = computed(() => (route.query.chapter as string) || 'chapter1')
  const currentNodeId = computed(() => (route.query.node as string) || '')
  const endingType = computed(() => (route.query.ending as string) || 'normal')

  const chapterTitle = computed(() => {
    const titles: Record<string, string> = {
      chapter1: '第一章·太阳之影',
      chapter2: '第二章·狩猎者'
    }
    return titles[chapterId.value] || '未知章节'
  })

  const explorationRate = computed(() => {
    // 从 progressStore 获取探索度，如果没有则返回模拟值
    return 75
  })

  // 模拟节点数据（实际应从 gameStore 获取）
  const nodes = ref<FlowchartNode[]>([
    {
      id: 'scene_1',
      type: 'scene',
      title: '举手的犹豫',
      subtitle: '第一章·太阳之影',
      image: '/images/scenes/scene1.jpg',
      x: 200,
      y: 400
    },
    {
      id: 'choice_1',
      type: 'choice',
      title: '和平谈判',
      x: 500,
      y: 300,
      tags: [{ text: '和平谈判', type: 'good' }]
    },
    {
      id: 'choice_2',
      type: 'choice',
      title: '继续战争',
      x: 500,
      y: 500,
      tags: [{ text: '继续战争', type: 'bad' }]
    },
    {
      id: 'scene_2',
      type: 'scene',
      title: '肖记者怎么看',
      image: '/images/scenes/scene2.jpg',
      x: 800,
      y: 300
    },
    {
      id: 'scene_3',
      type: 'scene',
      title: '名单的考验',
      image: '/images/scenes/scene3.jpg',
      x: 800,
      y: 500
    },
    {
      id: 'ending_1',
      type: 'ending',
      title: '机遇钩子',
      image: '/images/endings/ending1.jpg',
      x: 1100,
      y: 300
    }
  ])

  // 模拟连接数据
  const nodeConnections = ref<NodeConnection[]>([
    { from: 'scene_1', to: 'choice_1', type: 'default' },
    { from: 'scene_1', to: 'choice_2', type: 'default' },
    { from: 'choice_1', to: 'scene_2', type: 'active' },
    { from: 'choice_2', to: 'scene_3', type: 'current' },
    { from: 'scene_2', to: 'ending_1', type: 'active' }
  ])

  // 计算连接线
  const connections = computed(() => {
    return nodeConnections.value
      .map(conn => {
        const from = nodes.value.find(n => n.id === conn.from)
        const to = nodes.value.find(n => n.id === conn.to)
        if (!from || !to) return null

        const startX = from.x + 140
        const startY = from.y + 50
        const endX = to.x
        const endY = to.y + 50
        const midX = (startX + endX) / 2

        return {
          ...conn,
          path: `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`
        }
      })
      .filter(Boolean) as (NodeConnection & { path: string })[]
  })

  const canvasStyle = computed(() => ({
    transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
    width: canvasWidth + 'px',
    height: canvasHeight + 'px'
  }))

  // 检查节点状态
  function isUnlocked(nodeId: string): boolean {
    // 实际应从 progressStore 检查
    return ['scene_1', 'choice_1', 'scene_2', 'ending_1'].includes(nodeId)
  }

  function isCurrentPath(nodeId: string): boolean {
    return nodeId === currentNodeId.value || (endingType.value !== 'bad' && nodeId === 'ending_1')
  }

  // 交互
  function onNodeClick(node: FlowchartNode) {
    if (!isUnlocked(node.id)) return
    // 可扩展为显示详情或跳转
    console.log('Clicked node:', node)
  }

  function startDrag(e: MouseEvent) {
    isDragging.value = true
    dragStart.value = {
      x: e.clientX - translateX.value,
      y: e.clientY - translateY.value
    }
  }

  function onDrag(e: MouseEvent) {
    if (!isDragging.value) return
    translateX.value = e.clientX - dragStart.value.x
    translateY.value = e.clientY - dragStart.value.y
  }

  function stopDrag() {
    isDragging.value = false
  }

  function onWheel(e: WheelEvent) {
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    scale.value = Math.max(0.3, Math.min(2, scale.value * delta))
  }

  function zoomIn() {
    scale.value = Math.min(2, scale.value * 1.2)
  }

  function zoomOut() {
    scale.value = Math.max(0.3, scale.value / 1.2)
  }

  function resetView() {
    scale.value = 0.8
    translateX.value = 0
    translateY.value = 0
  }

  function goBack() {
    router.back()
  }

  function continueGame() {
    router.push({
      name: 'Game',
      params: { chapterId: chapterId.value }
    })
  }

  onMounted(() => {
    // 居中显示
    const containerWidth = canvasRef.value?.clientWidth || 1200
    const containerHeight = canvasRef.value?.clientHeight || 800
    translateX.value = (containerWidth - canvasWidth * scale.value) / 2
    translateY.value = (containerHeight - canvasHeight * scale.value) / 2
  })
</script>

<style scoped lang="scss">
  .flowchart-view {
    width: 100vw;
    height: 100vh;
    background: #0a0a0f;
    display: flex;
    flex-direction: column;
    color: #fff;
  }

  .flowchart-header {
    height: 60px;
    background: rgba(20, 20, 25, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;

      .back-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: #fff;
        cursor: pointer;

        &:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      }

      h1 {
        font-size: 18px;
        font-weight: 600;
      }
    }

    .progress-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;

      .bar {
        width: 100px;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;

        .fill {
          height: 100%;
          background: #38a169;
          transition: width 0.3s;
        }
      }
    }
  }

  .flowchart-canvas {
    flex: 1;
    overflow: hidden;
    position: relative;
    background: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.03) 1px, transparent 0);
    background-size: 24px 24px;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  .canvas-content {
    position: absolute;
    transform-origin: center center;
    transition: transform 0.1s ease-out;
  }

  .connections-layer {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    overflow: visible;
  }

  .connection {
    stroke-width: 2;

    &.default {
      stroke: #4a5568;
      opacity: 0.4;
    }

    &.active {
      stroke: #e53e3e;
      stroke-width: 3;
      opacity: 0.8;
    }

    &.current {
      stroke: #38a169;
      stroke-width: 3;
      animation: dash 20s linear infinite;
      stroke-dasharray: 10, 5;
    }
  }

  @keyframes dash {
    to {
      stroke-dashoffset: -100;
    }
  }

  .node {
    position: absolute;
    width: 140px;
    cursor: pointer;

    &.locked {
      opacity: 0.4;
      filter: grayscale(0.8);
      cursor: not-allowed;
    }

    &:not(.locked):hover {
      transform: translateY(-4px);
    }
  }

  .node-card {
    background: rgba(20, 20, 25, 0.95);
    border: 2px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);

    img {
      width: 100%;
      height: 80px;
      object-fit: cover;
    }

    .node-info {
      padding: 10px;

      .tags {
        display: flex;
        gap: 4px;
        margin-bottom: 6px;

        span {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;

          &.good {
            background: rgba(56, 161, 105, 0.2);
            color: #48bb78;
          }

          &.bad {
            background: rgba(229, 62, 62, 0.2);
            color: #f56565;
          }
        }
      }

      h4 {
        font-size: 13px;
        font-weight: 600;
        margin: 0;
        line-height: 1.3;
      }

      p {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        margin: 4px 0 0 0;
      }
    }
  }

  .status {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    background: #38a169;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
  }

  .flowchart-footer {
    height: 50px;
    background: rgba(10, 10, 15, 0.95);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;

    .legend {
      display: flex;
      gap: 20px;
      font-size: 12px;

      .dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 6px;

        &.scene {
          background: #4299e1;
        }
        &.choice {
          background: #ed8936;
        }
        &.ending {
          background: #9f7aea;
        }
      }
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 8px;

      button {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
        cursor: pointer;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      }

      span {
        font-size: 13px;
        min-width: 50px;
        text-align: center;
      }
    }

    .continue-btn {
      padding: 10px 24px;
      background: #e53e3e;
      border: none;
      border-radius: 6px;
      color: #fff;
      font-size: 14px;
      cursor: pointer;

      &:hover {
        background: #c53030;
      }
    }
  }
</style>
