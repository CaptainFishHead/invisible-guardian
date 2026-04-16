<template>
  <span class="typewriter-text">
    <span
      v-for="(char, index) in displayText"
      :key="index"
      :class="{ cursor: index === displayText.length - 1 && !isComplete }"
    >
      {{ char }}
    </span>
    <span v-if="isComplete && showCursor" class="cursor blink">|</span>
  </span>
</template>

<script setup lang="ts">
  import { ref, watch, onUnmounted } from 'vue'

  const props = defineProps<{
    text: string
    speed?: number // 毫秒/字
    start?: boolean // 是否自动开始
    showCursor?: boolean // 是否显示光标
  }>()

  const emit = defineEmits(['complete', 'progress'])

  const displayText = ref('')
  const isComplete = ref(false)
  const isPaused = ref(false)
  let currentIndex = 0
  let timeoutId: number | null = null

  // 开始打字效果
  function startTyping() {
    if (timeoutId) clearTimeout(timeoutId)

    displayText.value = ''
    currentIndex = 0
    isComplete.value = false

    const typeNext = () => {
      if (isPaused.value) {
        timeoutId = window.setTimeout(typeNext, 100)
        return
      }

      if (currentIndex < props.text.length) {
        displayText.value += props.text[currentIndex]
        currentIndex++
        emit('progress', currentIndex / props.text.length)

        // 根据字符类型调整速度（标点停顿更久）
        let delay = props.speed || 50
        const char = props.text[currentIndex - 1]
        if ('，。！？；：'.includes(char)) delay *= 3
        if ('.!?;:\n'.includes(char)) delay *= 3

        timeoutId = window.setTimeout(typeNext, delay)
      } else {
        isComplete.value = true
        emit('complete')
      }
    }

    typeNext()
  }

  // 跳过动画
  function skip() {
    if (timeoutId) clearTimeout(timeoutId)
    displayText.value = props.text
    currentIndex = props.text.length
    isComplete.value = true
    emit('complete')
  }

  // 暂停/继续
  function pause() {
    isPaused.value = true
  }

  function resume() {
    isPaused.value = false
  }

  // 暴露方法
  defineExpose({
    start: startTyping,
    skip,
    pause,
    resume,
    isComplete: () => isComplete.value
  })

  // 监听文本变化
  watch(
    () => props.text,
    () => {
      if (props.start !== false) {
        startTyping()
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
</script>

<style scoped>
  .typewriter-text {
    display: inline;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .cursor {
    display: inline-block;
    width: 2px;
    background: currentColor;
    margin-left: 2px;
    animation: blink 1s infinite;
  }

  .cursor.blink {
    width: auto;
    background: transparent;
  }

  @keyframes blink {
    0%,
    50% {
      opacity: 1;
    }
    51%,
    100% {
      opacity: 0;
    }
  }
</style>
