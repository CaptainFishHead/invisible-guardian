<template>
  <Teleport to="body">
    <div class="choice-overlay" @click.self="onCancel">
      <div class="choices-container">
        <div class="question-mark">?</div>
        <h3 class="choice-title">{{ title }}</h3>

        <div class="choices-list">
          <button
            v-for="(choice, index) in processedChoices"
            :key="choice.id"
            class="choice-btn"
            :class="[choice.style, { timed: hasTimer, disabled: choice.disabled }]"
            :disabled="choice.disabled"
            @click="select(choice, index)"
            :style="choice.timerStyle"
          >
            <span class="choice-icon" v-if="choice.icon">{{ choice.icon }}</span>
            <span class="choice-text">{{ choice.text }}</span>

            <!-- 隐藏提示 -->
            <span v-if="choice.showHiddenInfo" class="hidden-tip">💡 {{ choice.hiddenInfo }}</span>

            <!-- 倒计时条 -->
            <div v-if="hasTimer && !choice.disabled" class="countdown-bar" :style="{ width: `${timerPercent}%` }" />
          </button>
        </div>

        <!-- 全局倒计时 -->
        <div v-if="hasTimer" class="global-timer">
          <div class="timer-bar" :style="{ width: `${timerPercent}%` }" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import type { Choice } from '@/core/types/story'

  type ChoiceWithUi = Choice & {
    showHiddenInfo?: boolean
    disabled?: boolean
    timerStyle?: Record<string, string | undefined>
  }

  const props = defineProps<{
    choices: ChoiceWithUi[]
    title?: string
    globalTimer?: number // 全局倒计时（秒）
    defaultTimer?: number // 默认每个选项的倒计时
  }>()

  const emit = defineEmits(['select', 'cancel', 'timeout'])

  const selectedIndex = ref<number>(-1)
  const timeLeft = ref(0)
  const maxTime = ref(0)
  let timerInterval: number | null = null

  // 处理后的选项
  const processedChoices = computed(() => {
    return props.choices.map((choice, index) => {
      const timer = choice.deadline || props.defaultTimer || 0
      const isTimedOut = hasTimer.value && timeLeft.value <= 0
      const isThisTimedOut = timer > 0 && timeLeft.value < maxTime.value - timer

      return {
        ...choice,
        disabled: selectedIndex.value !== -1 || (hasTimer.value && isThisTimedOut),
        showHiddenInfo: !!choice.hiddenInfo && !!choice.showHiddenInfo,
        timerStyle:
          timer > 0
            ? {
                '--timer-duration': `${timer}s`
              }
            : {}
      }
    })
  })

  const hasTimer = computed(() => props.globalTimer !== undefined && props.globalTimer > 0)

  const timerPercent = computed(() => {
    if (!hasTimer.value || maxTime.value === 0) return 100
    return Math.max(0, (timeLeft.value / maxTime.value) * 100)
  })

  // 选择
  function select(choice: ChoiceWithUi, index: number) {
    if (selectedIndex.value !== -1) return

    selectedIndex.value = index
    stopTimer()

    // 延迟执行，显示选中动画
    setTimeout(() => {
      emit('select', choice, index)
    }, 300)
  }

  function onCancel() {
    if (props.choices.some(c => c.deadline && c.deadline > 0)) {
      // 有倒计时不允许取消
      return
    }
    emit('cancel')
  }

  // 计时器
  function startTimer() {
    if (!hasTimer.value) return

    maxTime.value = props.globalTimer!
    timeLeft.value = maxTime.value

    timerInterval = window.setInterval(() => {
      timeLeft.value -= 0.1

      if (timeLeft.value <= 0) {
        stopTimer()
        // 自动选择第一个可用选项，或触发超时
        const available = props.choices.find((c, i) => !processedChoices.value[i].disabled)

        if (available) {
          select(available, props.choices.indexOf(available))
        } else {
          emit('timeout')
        }
      }
    }, 100)
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  // 生命周期
  onMounted(() => {
    startTimer()
  })

  onUnmounted(() => {
    stopTimer()
  })
</script>

<style scoped>
  .choice-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(10px);
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .choices-container {
    text-align: center;
    max-width: 700px;
    width: 90%;
    animation: slideUp 0.4s ease;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .question-mark {
    font-size: 80px;
    color: rgba(231, 76, 60, 0.6);
    margin-bottom: 10px;
    animation: pulse 2s infinite;
    text-shadow: 0 0 30px rgba(231, 76, 60, 0.5);
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.6;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  .choice-title {
    color: #fff;
    font-size: 28px;
    margin-bottom: 40px;
    font-weight: 300;
    letter-spacing: 8px;
    text-transform: uppercase;
  }

  .choices-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .choice-btn {
    position: relative;
    padding: 24px 32px;
    background: transparent;
    border: 2px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    overflow: hidden;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .choice-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateX(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .choice-btn.danger {
    border-color: rgba(231, 76, 60, 0.5);
  }

  .choice-btn.danger:hover:not(:disabled) {
    background: rgba(231, 76, 60, 0.1);
    border-color: #e74c3c;
    box-shadow: 0 0 30px rgba(231, 76, 60, 0.3);
  }

  .choice-btn.important {
    border-color: rgba(241, 196, 15, 0.5);
  }

  .choice-btn.important:hover:not(:disabled) {
    background: rgba(241, 196, 15, 0.1);
    border-color: #f1c40f;
  }

  .choice-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none !important;
  }

  .choice-icon {
    font-size: 24px;
  }

  .choice-text {
    flex: 1;
    line-height: 1.5;
  }

  .hidden-tip {
    display: block;
    font-size: 13px;
    color: #f39c12;
    margin-top: 8px;
    font-style: italic;
    opacity: 0.9;
  }

  .countdown-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #e74c3c, #c0392b);
    transition: width 0.1s linear;
  }

  .global-timer {
    margin-top: 30px;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .timer-bar {
    height: 100%;
    background: linear-gradient(90deg, #3498db, #2980b9);
    transition: width 0.1s linear;
    box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
  }
</style>
