<template>
  <div class="video-player" :class="{ loading: isLoading }">
    <video
      ref="videoRef"
      :src="src"
      @loadedmetadata="onLoaded"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @waiting="isLoading = true"
      @playing="isLoading = false"
      @click="onClick"
      :style="videoStyle"
    />

    <!-- 加载指示 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <!-- 控制栏（鼠标移动显示） -->
    <Transition name="fade">
      <div v-show="showControls" class="controls-overlay" @click.stop>
        <!-- 进度条 -->
        <div class="progress-bar" @click="seek">
          <div class="progress-fill" :style="{ width: `${progress}%` }" />
          <div class="progress-handle" :style="{ left: `${progress}%` }" />
        </div>

        <!-- 控制按钮 -->
        <div class="control-buttons">
          <button @click="togglePlay">{{ isPlaying ? '⏸' : '▶' }}</button>
          <button @click="skipBack">⏮ 10s</button>

          <span class="time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>

          <button @click="toggleMute">{{ isMuted ? '🔇' : '🔊' }}</button>
          <input type="range" min="0" max="1" step="0.1" v-model="volume" @input="setVolume" />

          <button v-if="canSkip" @click="skip">跳过</button>
          <button @click="toggleFullscreen">⛶</button>
        </div>

        <!-- 倍速选择 -->
        <select v-model="playbackRate" @change="setPlaybackRate" class="speed-select">
          <option :value="0.5">0.5x</option>
          <option :value="1">1x</option>
          <option :value="1.25">1.25x</option>
          <option :value="1.5">1.5x</option>
          <option :value="2">2x</option>
        </select>
      </div>
    </Transition>

    <!-- 点击继续提示 -->
    <div v-if="showClickHint" class="click-hint" @click="onClick">点击继续</div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

  const props = defineProps<{
    src: string
    startTime?: number
    endTime?: number
    canSkip?: boolean
    skipAfter?: number
    pauseAt?: number[]
    autoplay?: boolean
  }>()

  const emit = defineEmits(['ended', 'timeupdate', 'pausePoint', 'skip'])

  const videoRef = ref<HTMLVideoElement>()
  const isLoading = ref(true)
  const isPlaying = ref(false)
  const duration = ref(0)
  const currentTime = ref(0)
  const volume = ref(1)
  const isMuted = ref(false)
  const playbackRate = ref(1)
  const showControls = ref(false)
  const showClickHint = ref(false)
  const controlsTimeout = ref<number | null>(null)

  // 计算属性
  const progress = computed(() => {
    if (!duration.value) return 0
    return (currentTime.value / duration.value) * 100
  })

  const videoStyle = computed(() => ({
    objectFit: 'cover' as const
  }))

  const canSkipNow = computed(() => {
    if (!props.canSkip) return false
    if (!props.skipAfter) return true
    return currentTime.value >= props.skipAfter
  })

  // 方法
  function onLoaded() {
    isLoading.value = false
    if (videoRef.value) {
      duration.value = videoRef.value.duration
      if (props.startTime) {
        videoRef.value.currentTime = props.startTime
      }
      if (props.autoplay !== false) {
        play()
      }
    }
  }

  function onTimeUpdate() {
    if (!videoRef.value) return

    currentTime.value = videoRef.value.currentTime
    emit('timeupdate', currentTime.value)

    // 检查暂停点
    if (props.pauseAt?.includes(Math.floor(currentTime.value))) {
      pause()
      emit('pausePoint', Math.floor(currentTime.value))
    }

    // 检查结束时间
    if (props.endTime && currentTime.value >= props.endTime) {
      onEnded()
    }
  }

  function onEnded() {
    isPlaying.value = false
    emit('ended')
  }

  function onClick() {
    if (props.pauseAt?.length) {
      emit('pausePoint', currentTime.value)
    } else {
      togglePlay()
    }
  }

  function play() {
    videoRef.value?.play()
    isPlaying.value = true
  }

  function pause() {
    videoRef.value?.pause()
    isPlaying.value = false
  }

  function togglePlay() {
    isPlaying.value ? pause() : play()
  }

  function skipBack() {
    if (videoRef.value) {
      videoRef.value.currentTime = Math.max(0, videoRef.value.currentTime - 10)
    }
  }

  function seek(e: MouseEvent) {
    const bar = e.currentTarget as HTMLElement
    const rect = bar.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    if (videoRef.value) {
      videoRef.value.currentTime = percent * duration.value
    }
  }

  function toggleMute() {
    if (videoRef.value) {
      videoRef.value.muted = !videoRef.value.muted
      isMuted.value = videoRef.value.muted
    }
  }

  function setVolume() {
    if (videoRef.value) {
      videoRef.value.volume = volume.value
      isMuted.value = volume.value === 0
    }
  }

  function setPlaybackRate() {
    if (videoRef.value) {
      videoRef.value.playbackRate = playbackRate.value
    }
  }

  function skip() {
    emit('skip')
  }

  function toggleFullscreen() {
    if (!videoRef.value) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.value.requestFullscreen()
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 显示控制栏
  function showControlsTemporarily() {
    showControls.value = true
    if (controlsTimeout.value) clearTimeout(controlsTimeout.value)
    controlsTimeout.value = window.setTimeout(() => {
      showControls.value = false
    }, 3000)
  }

  // 暴露方法
  defineExpose({
    play,
    pause,
    skip,
    seek: (time: number) => {
      if (videoRef.value) videoRef.value.currentTime = time
    },
    getCurrentTime: () => currentTime.value
  })

  // 监听
  watch(
    () => props.src,
    () => {
      isLoading.value = true
      currentTime.value = 0
    }
  )

  // 生命周期
  onMounted(() => {
    document.addEventListener('mousemove', showControlsTemporarily)
  })

  onUnmounted(() => {
    document.removeEventListener('mousemove', showControlsTemporarily)
    if (controlsTimeout.value) clearTimeout(controlsTimeout.value)
  })
</script>

<style scoped>
  .video-player {
    position: relative;
    width: 100%;
    height: 100%;
    background: #000;
    cursor: pointer;
  }

  video {
    width: 100%;
    height: 100%;
    display: block;
  }

  .loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .controls-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
    transition: opacity 0.3s;
  }

  .progress-bar {
    position: relative;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    margin-bottom: 10px;
    cursor: pointer;
  }

  .progress-fill {
    height: 100%;
    background: #e74c3c;
    transition: width 0.1s;
  }

  .progress-handle {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    background: #fff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .progress-bar:hover .progress-handle {
    opacity: 1;
  }

  .control-buttons {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .control-buttons button {
    background: none;
    border: none;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    padding: 5px 10px;
    transition: opacity 0.2s;
  }

  .control-buttons button:hover {
    opacity: 0.8;
  }

  .time {
    color: #fff;
    font-size: 14px;
    font-family: monospace;
  }

  .speed-select {
    position: absolute;
    right: 20px;
    bottom: 20px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 5px 10px;
    border-radius: 4px;
  }

  .click-hint {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    animation: pulse 2s infinite;
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
