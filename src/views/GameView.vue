<template>
  <div class="game-view" :class="[gameStore.phase, { 'hide-ui': hideUI }]" @mousemove="onMouseMove">
    <div class="layer-background">
      <VideoPlayer
        v-if="currentNode?.type === 'video' && currentNode.video"
        :src="currentNode.video.src"
        :start-time="currentNode.video.startTime"
        :end-time="currentNode.video.endTime"
        :can-skip="currentNode.video.canSkip"
        :skip-after="currentNode.video.skipAfter"
        :pause-at="currentNode.video.pauseAt"
        @ended="onVideoEnd"
        @pause-point="onVideoPause"
        @skip="skipVideo"
      />
      <img v-else-if="currentNode?.background" :src="currentNode.background" class="bg-image" />
    </div>

    <div class="layer-characters">
      <TransitionGroup name="character">
        <div
          v-for="(dialogue, index) in visibleDialogues"
          :key="`${dialogue.speaker}_${index}`"
          class="character"
          :class="[dialogue.position, dialogue.emotion]"
          :style="getCharacterStyle(dialogue)"
        >
          <img
            v-if="getCharacterImage(dialogue.speaker, dialogue.emotion)"
            :src="getCharacterImage(dialogue.speaker, dialogue.emotion)"
            :alt="dialogue.speaker"
          />
        </div>
      </TransitionGroup>
    </div>

    <div class="layer-effects"></div>

    <div v-show="!hideUI" class="layer-ui">
      <header class="top-bar">
        <div class="left-group">
          <button class="icon-btn" @click="showMenu = true">Menu</button>
          <button class="icon-btn" @click="gameStore.isSkipping = !gameStore.isSkipping">
            {{ gameStore.isSkipping ? 'Skip On' : 'Skip Off' }}
          </button>
        </div>

        <div class="chapter-info">
          <span class="chapter-name">{{ currentChapter?.title || gameStore.currentChapter }}</span>
        </div>

        <div class="right-group">
          <button class="icon-btn" @click="showStatus = true">State</button>
          <button class="icon-btn" @click="showHistory = true">History</button>
        </div>
      </header>

      <div v-if="currentNode?.dialogue" class="dialogue-container" @click="onDialogueClick">
        <div class="dialogue-box">
          <div class="speaker-name" :style="{ color: getSpeakerColor(currentSpeaker) }">
            {{ currentSpeaker }}
          </div>

          <div class="dialogue-text">
            <TypewriterText
              ref="typewriter"
              :text="currentText"
              :speed="gameStore.textDisplaySpeed"
              :start="true"
              @complete="onTextComplete"
            />
          </div>

          <div v-if="textComplete" class="continue-indicator">Continue</div>
        </div>
      </div>

      <ChoiceOverlay
        v-if="showChoices"
        :choices="availableChoices"
        :title="choiceTitle"
        :global-timer="choiceTimer"
        @select="onChoiceSelect"
        @timeout="onChoiceTimeout"
      />

      <div v-if="currentNode?.type === 'investigation'" class="investigation-mode">
        <div
          v-for="point in currentNode.investigation?.points"
          :key="point.id"
          class="investigation-point"
          :style="{ left: `${point.x}%`, top: `${point.y}%` }"
          @click="onInvestigate(point)"
        >
          <div class="point-marker" />
          <div class="point-tooltip">{{ point.title }}</div>
        </div>
      </div>

      <div v-if="showQTE" class="qte-overlay">
        <div class="qte-prompt">
          <span class="qte-key">{{ currentNode?.qte?.key }}</span>
          <div class="qte-bar">
            <div class="qte-progress" :style="{ width: `${qteProgress}%` }" />
          </div>
        </div>
      </div>
    </div>

    <GameMenu v-model:visible="showMenu" />
    <StatusPanel v-model="showStatus" />
    <HistoryTimeline v-model="showHistory" @jump="onHistoryJump" />
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useMagicKeys } from '@vueuse/core'
  import type { Choice, InvestigationPoint, StoryNode } from '@/core/types/story'
  import { GamePhase } from '@/core/engine/StateMachine'
  import { StoryEngine } from '@/core/engine/StoryEngine'
  import { getCharacterConfig } from '@/data/configs/characters'
  import { getChapterById } from '@/data/chapters'
  import { useGameStore } from '@/stores/gameStore'
  import { useProgressStore } from '@/stores/progressStore'
  import VideoPlayer from '@/components/VideoPlayer.vue'
  import TypewriterText from '@/components/TypewriterText.vue'
  import ChoiceOverlay from '@/components/ChoiceOverlay.vue'
  import StatusPanel from '@/components/StatusPanel.vue'
  import HistoryTimeline from '@/components/HistoryTimeline.vue'
  import GameMenu from '@/components/GameMenu.vue'

  type DisplayChoice = Choice & { showHiddenInfo?: boolean }

  const router = useRouter()
  const gameStore = useGameStore()
  const progressStore = useProgressStore()
  const engine = new StoryEngine()

  const currentNode = computed(() => engine.currentNode.value)
  const typewriter = ref<InstanceType<typeof TypewriterText>>()
  const hideUiTimer = ref<number | null>(null)

  const showMenu = ref(false)
  const showStatus = ref(false)
  const showHistory = ref(false)
  const hideUI = ref(false)
  const textComplete = ref(false)
  const showChoices = ref(false)
  const choiceTimer = ref(0)
  const showQTE = ref(false)
  const qteProgress = ref(100)

  const currentChapter = computed(() => {
    const chapterId = gameStore.currentChapter
    return chapterId ? getChapterById(chapterId) : null
  })

  const visibleDialogues = computed(() => {
    if (!currentNode.value?.dialogue) return []
    return currentNode.value.dialogue.slice(0, gameStore.currentDialogueIndex + 1)
  })

  const currentSpeaker = computed(() => {
    const dialogue = currentNode.value?.dialogue?.[gameStore.currentDialogueIndex]
    return dialogue?.speaker ?? ''
  })

  const currentText = computed(() => {
    const dialogue = currentNode.value?.dialogue?.[gameStore.currentDialogueIndex]
    return dialogue?.text ?? ''
  })

  const availableChoices = computed<DisplayChoice[]>(() => {
    if (!currentNode.value?.choices) return []

    return currentNode.value.choices
      .filter(choice => !choice.conditions || gameStore.checkConditions(choice.conditions))
      .map(choice => ({
        ...choice,
        showHiddenInfo: gameStore.canSeeHiddenInfo && !!choice.hiddenInfo
      }))
  })

  const choiceTitle = computed(() => '你的选择')

  function syncCurrentNode(node: StoryNode) {
    if (!gameStore.currentChapter) return

    gameStore.updateCurrentProgress(gameStore.currentChapter, node.id)
  }

  function loadCurrentChapter() {
    const chapterId = gameStore.currentChapter
    if (!chapterId) {
      router.replace('/chapters')
      return
    }

    const chapter = getChapterById(chapterId)
    if (!chapter) {
      router.replace('/chapters')
      return
    }

    const startNodeId = gameStore.currentNode || chapter.startNodeId
    const loaded = engine.loadChapter(chapter, startNodeId)
    if (!loaded) {
      router.replace('/chapters')
    }
  }

  function getCharacterImage(speaker: string, emotion?: string): string {
    const config = getCharacterConfig(speaker)
    const emotionKey = emotion || config?.defaultEmotion || 'normal'
    return config?.emotions[emotionKey]?.image ?? ''
  }

  function getCharacterStyle(dialogue: { position?: string }) {
    return {
      zIndex: dialogue.position === 'center' ? 10 : 5
    }
  }

  function getSpeakerColor(speaker: string): string {
    const config = getCharacterConfig(speaker)
    return config?.color || '#fff'
  }

  function onDialogueClick() {
    if (!textComplete.value) {
      typewriter.value?.skip()
      return
    }

    nextDialogue()
  }

  function onTextComplete() {
    textComplete.value = true
    if (gameStore.isSkipping) {
      window.setTimeout(nextDialogue, 200)
    }
  }

  function nextDialogue() {
    const node = currentNode.value
    const dialogues = node?.dialogue
    if (!node || !dialogues?.length) return

    if (gameStore.currentDialogueIndex < dialogues.length - 1) {
      gameStore.nextDialogue()
      textComplete.value = false
      return
    }

    if (node.choices?.length) {
      showChoices.value = true
      choiceTimer.value = Math.max(...node.choices.map(choice => choice.deadline || 0), 0)
      return
    }

    if (node.autoNext) {
      engine.jumpTo(node.autoNext.nodeId)
      gameStore.resetDialogue()
    }
  }

  function onChoiceSelect(choice: DisplayChoice) {
    const currentNodeId = currentNode.value?.id

    showChoices.value = false
    gameStore.applyEffects(choice.effects)
    engine.makeChoice(choice)
    gameStore.resetDialogue()

    if (!currentNodeId || !gameStore.currentChapter) return

    gameStore.addHistory({
      nodeId: currentNodeId,
      chapterId: gameStore.currentChapter,
      choiceId: choice.id,
      attributesSnapshot: { ...gameStore.attributes },
      flagsSnapshot: Array.from(gameStore.flags)
    })
  }

  function onChoiceTimeout() {
    const defaultChoice = availableChoices.value[0]
    if (defaultChoice) {
      onChoiceSelect(defaultChoice)
    }
  }

  function onVideoEnd() {
    if (currentNode.value?.autoNext) {
      engine.jumpTo(currentNode.value.autoNext.nodeId)
      gameStore.resetDialogue()
    }
  }

  function onVideoPause() {
    showChoices.value = availableChoices.value.length > 0
  }

  function skipVideo() {
    if (currentNode.value?.autoNext) {
      engine.jumpTo(currentNode.value.autoNext.nodeId)
      gameStore.resetDialogue()
    }
  }

  function onInvestigate(point: InvestigationPoint) {
    gameStore.applyEffects(point.effects)
    if (point.nextNodeId) {
      engine.jumpTo(point.nextNodeId)
    }
  }

  function onHistoryJump(index: number) {
    engine.jumpToHistory(index)
    gameStore.resetDialogue()
  }

  function onMouseMove() {
    hideUI.value = false

    if (hideUiTimer.value) {
      clearTimeout(hideUiTimer.value)
    }

    hideUiTimer.value = window.setTimeout(() => {
      if (!showMenu.value && !showStatus.value && !showHistory.value) {
        hideUI.value = true
      }
    }, 3000)
  }

  const { space, escape, arrowleft, KeyS } = useMagicKeys()

  watch(space, pressed => {
    if (pressed && currentNode.value?.dialogue) {
      onDialogueClick()
    }
  })

  watch(escape, pressed => {
    if (pressed) showMenu.value = true
  })

  watch(arrowleft, pressed => {
    if (pressed && engine.goBack()) {
      gameStore.resetDialogue()
    }
  })

  watch(KeyS, pressed => {
    if (pressed && gameStore.phase === GamePhase.PLAYING) {
      quickSave()
    }
  })

  watch(
    () => currentNode.value?.id,
    () => {
      textComplete.value = false
      showChoices.value = false
      showQTE.value = currentNode.value?.type === 'qte'
    }
  )

  async function quickSave() {
    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1080
    const screenshot = canvas.toDataURL('image/jpeg', 0.7)
    await progressStore.quickSave(screenshot)
  }

  onMounted(() => {
    engine.onNodeChange(node => {
      syncCurrentNode(node)
      gameStore.setPhase(node.choices?.length ? GamePhase.CHOICE : GamePhase.DIALOGUE)
    })

    engine.onEffect(effect => {
      gameStore.applyEffect(effect)
    })

    engine.onEnding(ending => {
      if (ending?.id) {
        gameStore.unlockEnding(ending.id)
      }
      router.push('/ending')
    })

    loadCurrentChapter()
    progressStore.startAutoSave()
  })

  onUnmounted(() => {
    if (hideUiTimer.value) {
      clearTimeout(hideUiTimer.value)
    }

    engine.dispose()
    progressStore.stopAutoSave()
  })
</script>

<style scoped lang="scss">
  .game-view {
    position: fixed;
    inset: 0;
    background: #000;
    overflow: hidden;
  }

  .layer-background {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .layer-characters {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }

  .character {
    position: absolute;
    bottom: 0;
    transition: all 0.5s ease;
    opacity: 0;
    transform: translateY(20px);
  }

  .character.left {
    left: 5%;
  }

  .character.right {
    right: 5%;
  }

  .character.center {
    left: 50%;
    transform: translateX(-50%) translateY(20px);
  }

  .character-enter-active,
  .character-leave-active {
    transition: all 0.5s ease;
  }

  .character-enter-from,
  .character-leave-to {
    opacity: 0;
    transform: translateY(20px);
  }

  .character-enter-from.center,
  .character-leave-to.center {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }

  .character-enter-to,
  .character-leave-from {
    opacity: 1;
    transform: translateY(0);
  }

  .character-enter-to.center,
  .character-leave-from.center {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  .layer-effects {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
  }

  .layer-ui {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    transition: opacity 0.3s;
  }

  .hide-ui .layer-ui {
    opacity: 0;
    pointer-events: none;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 40px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent);
  }

  .left-group,
  .right-group {
    display: flex;
    gap: 16px;
  }

  .icon-btn {
    min-width: 72px;
    height: 40px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .chapter-info {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    letter-spacing: 2px;
  }

  .dialogue-container {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 40px;
    cursor: pointer;
  }

  .dialogue-box {
    width: 100%;
    max-width: 1000px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9));
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 30px;
    backdrop-filter: blur(10px);
    position: relative;
  }

  .speaker-name {
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 12px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .dialogue-text {
    color: rgba(255, 255, 255, 0.95);
    font-size: 20px;
    line-height: 1.8;
    min-height: 60px;
  }

  .continue-indicator {
    position: absolute;
    bottom: 20px;
    right: 30px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    animation: bounce 1s infinite;
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }

  .investigation-mode {
    position: absolute;
    inset: 0;
    cursor: crosshair;
  }

  .investigation-point {
    position: absolute;
    cursor: pointer;
  }

  .point-marker {
    width: 40px;
    height: 40px;
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    animation: pulse-ring 2s infinite;
  }

  @keyframes pulse-ring {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  .point-tooltip {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    font-size: 14px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .investigation-point:hover .point-tooltip {
    opacity: 1;
  }

  .qte-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .qte-prompt {
    text-align: center;
  }

  .qte-key {
    display: block;
    width: 100px;
    height: 100px;
    line-height: 100px;
    background: rgba(231, 76, 60, 0.9);
    border-radius: 12px;
    color: #fff;
    font-size: 48px;
    font-weight: bold;
    margin-bottom: 20px;
    box-shadow: 0 0 40px rgba(231, 76, 60, 0.5);
    animation: qte-pulse 0.5s infinite;
  }

  @keyframes qte-pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .qte-bar {
    width: 200px;
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    overflow: hidden;
  }

  .qte-progress {
    height: 100%;
    background: #e74c3c;
    transition: width 0.1s linear;
  }
</style>
